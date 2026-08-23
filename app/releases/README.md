# 本地发布产物

该目录只用于整理本机构建出的发行文件，二进制文件不提交到 Git。

```text
releases/
├─ windows/   Windows x64 便携 EXE 与离线 NSIS 安装包
└─ android/   Android ARM64 APK
```

正式发布时，把对应版本的文件作为 GitHub Release 附件上传，并在发布说明中记录平台、架构、签名边界与 SHA-256。仓库只跟踪本说明文件。
