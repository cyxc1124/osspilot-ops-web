# osspilot-ops-web

OssPilot 运营控制台。从 [OssPilot](https://github.com/cyxc1124/OssPilot) 拆出，对接 [osspilot-ops-api](https://github.com/cyxc1124/osspilot-ops-api)。

旧 monorepo 冻在 `v0.6.0` 当对照。本仓只吃 API，不再从其它 git 仓 import 源码。

## 本地开发

```bash
cp .env.example .env
npm ci
npm run dev
```

默认 `http://localhost:5174`。API 地址见 `.env` 里的 `VITE_OPS_API_URL`。

容器运行时用 `OSSPILOT_API_URL` 在启动时写入 `/config.json`，不必重新 build。

## 脚本

- `npm run dev` — Vite
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## 镜像

```bash
docker build -t osspilot-ops-web .
```

CI 推送到 `ghcr.io/cyxc1124/osspilot-ops-web`：

- `v*` 发版；`latest` 只跟最后一次 `v*`
- `develop` / `main` 跟对应分支
- `sha-*` 钉 commit
- PR 只构建不推送

```bash
docker pull ghcr.io/cyxc1124/osspilot-ops-web:develop
```

## 许可

AGPL-3.0-only
