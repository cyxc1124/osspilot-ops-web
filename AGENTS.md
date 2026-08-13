# osspilot-ops-web

运营控制台。独立 Vite SPA，只吃 [osspilot-ops-api](https://github.com/cyxc1124/osspilot-ops-api)，不从其它仓 import 源码。

## 提交

Conventional Commits：`<type>: <中文说明>`。必须保留 type 前缀，包括 `ci:`、`chore:`。

```
feat: 登录后强制跳转修改密码
ci: 拆分检查并推镜像到 GHCR
chore: 从 monorepo 拆出本仓
```

不要只写中文、丢掉前缀。

## 实现

- 对照 OssPilot `legacy/`（v0.6.0），不跟 API 每一片齐发。切流包：O1–O5。
- 本地 `VITE_OPS_API_URL`；容器用 `OSSPILOT_API_URL` 写 `/config.json`，不必为换 API 地址重新 build。
- CI：Lint / Typecheck / Test / Build。镜像独立发布，不打进 API 镜像。
