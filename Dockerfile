# osspilot-ops-web — 构建上下文为仓库根目录
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

ARG GIT_TAG=""
ARG GIT_COMMIT=""

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime

USER 0

ARG GIT_TAG=""
ARG GIT_COMMIT=""

LABEL org.opencontainers.image.source=https://github.com/cyxc1124/osspilot-ops-web
LABEL org.opencontainers.image.description="OssPilot 运营端 Web"
LABEL org.opencontainers.image.title="osspilot-ops-web"
LABEL org.opencontainers.image.vendor="cyxc1124"
LABEL org.opencontainers.image.version=${GIT_TAG}
LABEL org.opencontainers.image.revision=${GIT_COMMIT}

COPY deploy/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx --from=builder /build/dist /usr/share/nginx/html
COPY --chmod=755 deploy/docker-entrypoint.sh /docker-entrypoint.sh

RUN chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
