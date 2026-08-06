# ChiliCache
Inventory control and batch sauce production management system for light manufacturing


### Table of contents
- [Description of the technology](#description-of-the-technology)
- [Local setup](#local-setup)
- [Deploy on Fly.io (recommended)](#deploy-on-flyio-recommended)
- [Deploy on Render](#deploy-on-render)
- [Credits](#credits)


## Description of the technology
This system is built using **Express.js** as the backend framework as it is designed for **Node.js** and **Boostrap** as the frontend framework to minimize
development time in creating components. **SQLite** was used as a database since it is very light and does not need a server.

### Why did I choose this technology?
* **Express.js:** Allows you to receive HTTP requests from clients with minimal latency, in addition to being a minimalist framework where only the fundamentals are required in this project.
* **Boostrap:** Design faster and more efficiently to ensure time savings on the *Front-End* part using your already created components and reduce responsive design conflict.
* **SQLite:** Stores system data very quickly, in addition to not requiring a server or external configuration to function, making it perfect for ChiliCache, which is designed to be used in a local environment.
* **TypeScript:** Improve the security and maintainability of the project, as it allows us to identify bugs before compilation which JavaScript cannot fulfill that role.



### Schema SQL (https://dbdiagram.io/d/6a4de9074ac62e474c541e6e)
<img width="1079" height="710" alt="image" src="https://github.com/user-attachments/assets/b1892ce3-10a3-4a81-8cf5-70f2bf5925d9" />


## Local setup

1. Copy env file: `cp .env.example .env`
2. Install dependencies: `npm install`
3. Start Redis: `docker compose up -d`
4. Dev server: `npm run dev`
5. Production-like local run: `npm run build && npm start`

Default admin (created only if no admin exists): username `jesusnoel`, password from `ADMIN_PASSWORD` or `admin123`.

## Deploy on Fly.io (recommended)

Stack: **Fly.io** (app + persistent volume for SQLite) + **Upstash** (Redis, free tier).

Fly.io free tier includes a volume so your SQLite database and uploads **survive redeploys**. You can stop using Render for the web service.

### Prerequisites

1. [Install flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. Fly account + credit card (verification; free allowance may not charge)
3. Upstash Redis URL (`rediss://...`)

### First deploy

```bash
# 1. Login
fly auth login

# 2. Create app (pick a unique name if 'chilicache' is taken; same region as fly.toml)
fly launch --no-deploy

# 3. Create persistent volume (region must match primary_region in fly.toml, default: dfw)
fly volumes create chilicache_data --size 1 --region dfw

# 4. Secrets — obligatorio (Upstash). Solo la URL, sin REDIS_URL= ni comillas extra:
fly secrets set REDIS_URL="rediss://default:TOKEN@your-db.upstash.io:6379"
fly secrets set ADMIN_PASSWORD="your-strong-password"

# Verifica que el secret exista:
fly secrets list

# 5. Deploy
fly deploy
```

App URL: `https://<your-app-name>.fly.dev`

### What persists

| Path on volume | Content |
|----------------|---------|
| `/var/data/database.db` | SQLite |
| `/var/data/uploads/` | Company logos |

Configured via `DATA_DIR=/var/data` in `fly.toml`.

### Useful commands

```bash
fly status          # app state
fly logs            # live logs
fly ssh console     # shell inside machine
fly secrets list    # env secrets
```

### After migration from Render

1. Confirm login works on `*.fly.dev`
2. Delete or suspend the Render Web Service (keep Upstash)

---

## Deploy on Render

Requires a **paid Persistent Disk** for SQLite. Render free tier does not keep data between deploys.

See [`render.yaml`](render.yaml) and set `DATA_DIR=/var/data` with a disk mount. Use Upstash for `REDIS_URL`.

| Variable | Value |
|----------|--------|
| `MODE` | `production` |
| `DATA_DIR` | `/var/data` |
| `REDIS_URL` | Upstash URL only (no quotes) |
| `ADMIN_PASSWORD` | Initial admin password |

---

## Credits
* **Developed by:** jesusnoelrg
