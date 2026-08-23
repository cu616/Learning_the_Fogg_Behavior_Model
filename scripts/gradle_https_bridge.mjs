import { createServer } from "node:http";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  createReadStream,
  statSync,
  existsSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const port = Number(process.env.GRADLE_BRIDGE_PORT || 18765);
const cacheRoot =
  process.env.GRADLE_BRIDGE_CACHE ||
  join(process.env.LOCALAPPDATA || process.cwd(), "FoggBehaviorLab", "GradleBridgeCache");

const repositories = {
  google: "https://dl.google.com/dl/android/maven2/",
  maven: "https://repo.maven.apache.org/maven2/",
  plugins: "https://plugins.gradle.org/m2/",
};

mkdirSync(cacheRoot, { recursive: true });
const pending = new Map();
let fetchQueue = Promise.resolve();

function fetchToCache(url, destination) {
  if (existsSync(destination)) return Promise.resolve();
  if (pending.has(destination)) return pending.get(destination);

  const download = async () => {
    const partial = `${destination}.partial`;
    rmSync(partial, { force: true });
    let lastError;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      try {
        const upstream = await fetch(url, { redirect: "follow" });
        if (!upstream.ok) {
          const error = new Error(`HTTP ${upstream.status}: ${url}`);
          if (upstream.status === 404) throw error;
          lastError = error;
        } else {
          const bytes = Buffer.from(await upstream.arrayBuffer());
          writeFileSync(partial, bytes);
          rmSync(destination, { force: true });
          renameSync(partial, destination);
          return;
        }
      } catch (error) {
        lastError = error;
        if (String(error).includes("HTTP 404")) break;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
    rmSync(partial, { force: true });
    throw lastError || new Error(`Download failed: ${url}`);
  };
  const task = fetchQueue
    .then(download)
    .finally(() => pending.delete(destination));
  fetchQueue = task.catch(() => undefined);

  pending.set(destination, task);
  return task;
}

const server = createServer(async (request, response) => {
  try {
    const parsed = new URL(request.url || "/", `http://${request.headers.host}`);
    const [, repositoryName, ...pathParts] = parsed.pathname.split("/");
    const repository = repositories[repositoryName];
    if (!repository || pathParts.length === 0) {
      response.writeHead(404).end();
      return;
    }

    const relativePath = pathParts.map(decodeURIComponent).join("/");
    if (relativePath.includes("..")) {
      response.writeHead(400).end();
      return;
    }

    const upstream = new URL(relativePath, repository).toString();
    const suffix = relativePath.split("/").at(-1) || "artifact";
    const key = createHash("sha256").update(upstream).digest("hex");
    const destination = join(cacheRoot, `${key}-${suffix}`);
    await fetchToCache(upstream, destination);

    const { size } = statSync(destination);
    response.setHeader("Content-Length", size);
    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (request.method === "HEAD") {
      response.writeHead(200).end();
      return;
    }
    createReadStream(destination).pipe(response);
  } catch (error) {
    // Maven clients must be able to continue to the next repository when an
    // artifact does not exist in the current one. curl already retries actual
    // transport failures before this branch is reached.
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(message);
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Gradle HTTPS bridge listening on http://127.0.0.1:${port}\n`);
});
