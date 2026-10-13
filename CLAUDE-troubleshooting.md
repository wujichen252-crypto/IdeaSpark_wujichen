# Troubleshooting

> 已知问题和解决方案。调试时读取，发现新问题时更新。

## Vite 构建 TDZ 错误

- **原因:** Terser 压缩时变量提升导致 Temporal Dead Zone 问题
- **解决:** 暂时禁用 minify（`build.minify: false`），稍后可尝试升级依赖或配置 terser `safari10: true`

## Django 数据库 managed = False

- **原因:** Django 从已有的 MySQL 表读取，不管理 schema
- **解决:** 所有模型设置 `managed = False`，不运行 `makemigrations` / `migrate`
