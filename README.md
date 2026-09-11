# 三角洲资料站

面向《三角洲行动》（Delta Force / 腾讯天美）玩家的**非官方**资料与工具站：DIY 卡战备、Orzice 公开行情转储、按难度拆开的地图门槛、攻略和匿名轻论坛。

仓库：[QIN8/-AI-](https://github.com/QIN8/-AI-)

> 买入价来自 [Orzice/DeltaForcePrice](https://github.com/orzice/DeltaForcePrice) 公开转储，**不是官方 API**。转储无独立战备字段，卡战备里的战备暂按行情合计。地图机密/绝密分开记录（巴克什绝密 = 58 万）。进图以游戏内提示为准。不依赖 Google Fonts。

## 功能

- **卡战备**：按地图+难度选门槛，槽位 DIY，最低买入凑档，本地 3 套 + 可选存服务器
- **装备物价**：Orzice 转储（枪/甲/头/包/挂/弹/配件/钥匙/收集品），卡片展示行情与买卖差
- **地图**：每张图的普通/机密/绝密/永夜分开；嵌入官方地图工具（物资点图层为占位）
- **攻略 / 论坛 / 首页**

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

物价同步：`GET /api/prices/sync`（TTL 内直接返回 SQLite；过期才拉公开源）。页面带 `PriceSyncBeacon`，使用站点时后台刷新，**不会在每次 HTML 渲染时直打 orzice**。

数据源顺序：

1. 可选 `ORZICE_TOKEN` → Orzice 工作台 `item_price_all`（需自行申请，本站不提供、不臆造 token）
2. `https://raw.githubusercontent.com/orzice/DeltaForcePrice/master/price.json`（公开转储，可能停更）
3. 仓库内 `prisma/data/orzice-price.json`（离线回退）

顶栏「数据更新于」取转储 `is_get_time` 最大值；「本站同步于」是上次成功写入 SQLite 的时间。属性为**社区公开数据源 / Orzice 风格公开数据**，非官方、无合作关系。

## 更新数据

种子在 `prisma/data/`：

| 文件 | 内容 |
| --- | --- |
| `orzice-price.json` | Orzice 公开行情转储（主物价） |
| `maps.json` | 按难度拆开的地图门槛 |
| `guides.json` | 攻略 Markdown |
| `forum.json` | 仅在论坛为空时写入示例帖 |

改完执行 `npm run db:seed`。物价与地图会重建；论坛种子不会覆盖已有帖子。推荐套按各难度自动「最低买入凑档」。更新转储：把新的 `price.json` 覆盖到 `orzice-price.json` 再种子。

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
