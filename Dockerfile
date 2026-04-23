
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set registry https://registry.npmmirror.com \
    && npm ci

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

RUN printf '%s\n' \
  'server {' \
  '  listen 3456;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '' \
  '  location / {' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '' \
  '  location /static/ {' \
  '    expires 7d;' \
  '    add_header Cache-Control "public, max-age=604800, immutable";' \
  '  }' \
  '}' \
  > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3456

CMD ["nginx", "-g", "daemon off;"]
