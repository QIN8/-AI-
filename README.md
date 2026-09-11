# 三角洲资料站

面向《三角洲行动》（Delta Force / 腾讯天美）玩家的**非官方**资料与工具站：卡战备凑装、装备示例物价、地图门槛、攻略和匿名轻论坛。

仓库：[QIN8/-AI-](https://github.com/QIN8/-AI-)

> 价格、战备、假账系数是**社区风格示例快照**，方便演示和二次填写，**不是官方 API，也不是实时交易行**。地图入场线整理自公开资料（如玩家百科与社区攻略），进图前以游戏内提示为准。

## 功能

- **卡战备**：11.25 / 18.75 / 55 / 60 / 78 万档，槽位凑装，买入 / 出售 / 战备 / 假账对比，本地 3 套方案，自动凑档，推荐套载入
- **装备物价**：枪甲头包挂药与配件，可搜索
- **地图**：大坝、长弓、巴克什、航天、潮汐监狱
- **攻略**：8 篇中文帮助
- **论坛**：匿名昵称 + IP 频率限制
- **首页**：推荐套、地图、攻略与新帖

## 技术栈

Next.js 15（App Router）+ TypeScript + Tailwind v4 + Prisma + SQLite。单仓库，API 走 `src/app/api`。

## 本地运行

需要 Node.js 20+。

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

一键重置库（会清空论坛）：

```bash
npm run db:reset
```

生产构建：

```bash
npm run build
npm start
```

健康检查：`GET /api/health`

## 更新数据

种子在 `prisma/data/`：

| 文件 | 内容 |
| --- | --- |
| `items.json` | 装备与示例价格 |
| `maps.json` | 地图与门槛笔记 |
| `guides.json` | 攻略 Markdown |
| `loadouts.json` | 推荐套（`items` 为 slug 列表） |
| `forum.json` | 仅在论坛为空时写入示例帖 |

改完执行 `npm run db:seed`。装备/地图/攻略/推荐套为 upsert；论坛种子不会覆盖已有帖子。

## 部署到阿里云 ECS

见 [deploy/README.md](deploy/README.md)。推荐：

```bash
cp .env.example .env
docker compose up -d --build
```

或 systemd + nginx 反代。有域名后再用 Certbot 开 HTTPS。

## 开发说明

- 不要提交 `.env`、`*.db`
- UI 为 `zh-Hans`
- 不要声称接入官方接口；若以后要接实时价，请自行合规采集并更新 JSON/数据库

## 许可与版权

代码以本仓库为准。游戏名称、设定与素材权利归腾讯 / 天美等权利方。本站仅做玩家工具与介绍。
