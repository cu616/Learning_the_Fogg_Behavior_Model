"""Verify a CRX3 package before extracting it for static inspection."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, padding, rsa


def read_varint(data: bytes, offset: int) -> tuple[int, int]:
    value = 0
    shift = 0
    while True:
        byte = data[offset]
        offset += 1
        value |= (byte & 0x7F) << shift
        if byte < 0x80:
            return value, offset
        shift += 7


def parse_message(data: bytes) -> dict[int, list[bytes | int]]:
    fields: dict[int, list[bytes | int]] = {}
    offset = 0
    while offset < len(data):
        key, offset = read_varint(data, offset)
        number, wire_type = key >> 3, key & 7
        if wire_type == 0:
            value, offset = read_varint(data, offset)
        elif wire_type == 2:
            length, offset = read_varint(data, offset)
            value = data[offset : offset + length]
            offset += length
        else:
            raise ValueError(f"Unsupported protobuf wire type: {wire_type}")
        fields.setdefault(number, []).append(value)
    return fields


def extension_id(public_key: bytes) -> str:
    digest = hashlib.sha256(public_key).digest()[:16]
    return "".join(chr(ord("a") + nibble) for byte in digest for nibble in (byte >> 4, byte & 15))


def verify_proof(proof_data: bytes, signed_payload: bytes, algorithm: str) -> tuple[str, bool]:
    proof = parse_message(proof_data)
    public_key = bytes(proof[1][0])
    signature = bytes(proof[2][0])
    key = serialization.load_der_public_key(public_key)
    if algorithm == "rsa" and isinstance(key, rsa.RSAPublicKey):
        key.verify(signature, signed_payload, padding.PKCS1v15(), hashes.SHA256())
    elif algorithm == "ecdsa" and isinstance(key, ec.EllipticCurvePublicKey):
        key.verify(signature, signed_payload, ec.ECDSA(hashes.SHA256()))
    else:
        raise ValueError(f"Unexpected public key for {algorithm}")
    return extension_id(public_key), True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("package", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--expected-id", required=True)
    args = parser.parse_args()

    raw = args.package.read_bytes()
    if raw[:4] != b"Cr24" or struct.unpack_from("<I", raw, 4)[0] != 3:
        raise ValueError("Not a CRX3 package")

    header_size = struct.unpack_from("<I", raw, 8)[0]
    header = parse_message(raw[12 : 12 + header_size])
    archive = raw[12 + header_size :]
    signed_header = bytes(header[10000][0])
    declared_id = bytes(parse_message(signed_header)[1][0])
    signed_payload = b"CRX3 SignedData\x00" + struct.pack("<I", len(signed_header)) + signed_header + archive

    verified_ids: list[str] = []
    for field_number, algorithm in ((2, "rsa"), (3, "ecdsa")):
        for proof in header.get(field_number, []):
            proof_id, verified = verify_proof(bytes(proof), signed_payload, algorithm)
            if verified and bytes.fromhex("".join(f"{ord(c) - ord('a'):x}" for c in proof_id)) == declared_id:
                verified_ids.append(proof_id)

    if args.expected_id not in verified_ids:
        raise ValueError(f"Signature did not verify expected extension id: {args.expected_id}")

    args.output.mkdir(parents=True, exist_ok=True)
    zip_path = args.output / "package.zip"
    zip_path.write_bytes(archive)
    with zipfile.ZipFile(zip_path) as bundle:
        bad_member = bundle.testzip()
        if bad_member:
            raise ValueError(f"Corrupt ZIP member: {bad_member}")
        bundle.extractall(args.output / "unpacked")

    manifest_path = args.output / "unpacked" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    print(json.dumps({
        "verified_extension_id": args.expected_id,
        "package_sha256": hashlib.sha256(raw).hexdigest(),
        "crx_version": 3,
        "manifest_version": manifest.get("manifest_version"),
        "extension_version": manifest.get("version"),
        "name": manifest.get("name"),
        "zip_entries": len(zipfile.ZipFile(zip_path).infolist()),
        "output": str(args.output / "unpacked"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
