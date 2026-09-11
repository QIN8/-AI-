# 阿里云 ECS 部署（Ubuntu）

本站是单进程 Next.js + SQLite，适合最便宜的突发性能 / 共享算力 ECS（1 核 1G 也能跑，建议 1 核 2G 更稳）。**不要把密钥写进仓库。**

两种方式任选其一：

1. **Docker Compose（推荐）**
2. **systemd + nginx 反代**（不想装 Docker 时）

## 安全组

ECS 控制台放行：

- `22`（SSH）
- `80`（HTTP，给 nginx）
- 若暂时不用 nginx、直接测应用，可临时放行 `3000`，上线后关掉

## 方式 A：Docker Compose

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# 重新登录 SSH 后再继续

git clone <你的仓库> /opt/delta-ziliao
cd /opt/delta-ziliao
cp .env.example .env
# 按需改 NEXT_PUBLIC_SITE_NAME；数据库路径由 compose 固定到容器内 /app/data

docker compose up -d --build
docker compose logs -f --tail=80
```

浏览器访问 `http://<ECS公网IP>:3000`。

更新：

```bash
cd /opt/delta-ziliao
git pull
docker compose up -d --build
```

SQLite 在 Docker volume `delta-data` 里，重建容器不会丢论坛帖（除非 `docker compose down -v`）。

种子是 upsert，重复执行会刷新装备/地图/攻略/推荐套，**不会清空已有论坛帖**。

## 方式 B：systemd + nginx

需要本机 Node.js 20+。

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo mkdir -p /opt/delta-ziliao
sudo chown $USER:$USER /opt/delta-ziliao
git clone <你的仓库> /opt/delta-ziliao
cd /opt/delta-ziliao
cp .env.example .env
# 把 DATABASE_URL 改成：
# DATABASE_URL="file:/opt/delta-ziliao/data/delta.db"
mkdir -p /opt/delta-ziliao/data

npm ci
npx prisma generate
npx prisma db push
npm run db:seed
npm run build

sudo cp deploy/delta-ziliao.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now delta-ziliao

sudo cp deploy/nginx.conf /etc/nginx/sites-available/delta-ziliao
sudo ln -sf /etc/nginx/sites-available/delta-ziliao /etc/nginx/sites-enabled/delta-ziliao
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

访问 `http://<ECS公网IP>/`。

## 绑定域名与 HTTPS

1. 域名解析 A 记录到 ECS 公网 IP。
2. 改 nginx `server_name` 为你的域名。
3. 安装证书：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

Certbot 会改 nginx 并续期。

## 备份

SQLite 单文件：

```bash
# Docker
docker compose exec web cat /app/data/delta.db > backup-$(date +%F).db

# systemd
cp /opt/delta-ziliao/data/delta.db ~/backup-$(date +%F).db
```

## 更新种子物价

编辑 `prisma/data/items.json`（或 maps/guides/loadouts）后：

```bash
# Docker
docker compose exec web npx tsx prisma/seed.ts

# systemd
cd /opt/delta-ziliao && npm run db:seed
```

价格字段是示例快照，请在页面声明中保持「非官方实时行情」。
