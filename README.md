# ChiliCache
Inventory control and batch sauce production management system for light manufacturing


### Table of contents
- [Description of the technology](#description-of-the-technology)
- [Local setup](#local-setup)
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
<img width="752" height="691" alt="schema_sql" src="https://github.com/user-attachments/assets/760bd713-09eb-4ea0-8bd3-230a386ee266" />

## Local setup

1. Copy env file: `cp .env.example .env`
2. Install dependencies: `npm install`
3. Start Redis: `docker compose up -d`
4. Dev server: `npm run dev`
5. Production-like local run: `npm run build && npm start`

Default admin (created only if no admin exists): username `jesusnoel`, password from `ADMIN_PASSWORD` or `admin123`.

## Deploy on Render

ChiliCache needs **one Web Service**, **one Redis (Key Value)**, and a **Persistent Disk** for SQLite + uploaded logos. Persistent disks require a paid Render plan.

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** and select the repo.
3. Set the prompted env vars:
   - `API_URL` → your public HTTPS URL, e.g. `https://chilicache-web.onrender.com` (no port)
   - `ADMIN_PASSWORD` → strong password for the first admin seed
4. Confirm the disk mount path is `/var/data` and `DATA_DIR=/var/data`.
5. Deploy. After first login, change the admin password in the app if you used a temporary seed value.

### Option B — Manual dashboard

| Service | Settings |
|---------|----------|
| **Web Service** | Runtime Node; Build: `npm run build`; Start: `npm start` |
| **Persistent Disk** | Mount path `/var/data`, size ≥ 1 GB |
| **Redis / Key Value** | Create instance; copy connection string into `REDIS_URL` |

**Environment variables (Web Service):**

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `MODE` | `production` |
| `API_URL` | `https://YOUR-SERVICE.onrender.com` |
| `DATA_DIR` | `/var/data` |
| `REDIS_URL` | Internal Redis URL from Render (`rediss://...` is OK) |
| `ADMIN_PASSWORD` | Initial admin password (only used when DB has no admin) |
| `PORT` | Set automatically by Render |

SQLite file: `$DATA_DIR/database.db`. Uploads: `$DATA_DIR/uploads`.

### Free alternative with a volume

Render’s free tier has **no** persistent disk. For $0 with SQLite + volume, **Fly.io** (`fly volumes create` + same `DATA_DIR`) is the closest option; this app’s `DATA_DIR` env works the same way.

## Credits
* **Developed by:** jesusnoelrg
