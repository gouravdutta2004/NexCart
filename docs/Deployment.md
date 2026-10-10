# NexCart — Production Deployment Guide
**Intelligent Supermarket Automation System**

This guide provides end-to-end instructions for deploying the **NexCart** full-stack platform (React 18 + Node.js/Express + MongoDB + WebSockets).

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              CLIENT BROWSER                  │
                      │   (Desktop POS / Mobile Self-Checkout PWA)   │
                      └───────────────┬──────────────────────────────┘
                                      │
               HTTPS API Calls (Axios)│   WSS (Socket.io)
                                      ▼
                      ┌──────────────────────────────────────────────┐
                      │             NEXCART BACKEND                  │
                      │     (Render.com / Railway / Node 20)         │
                      │        Port 5001 • REST API & WS             │
                      └───────────────┬──────────────────────────────┘
                                      │
                   Mongoose Connection│ (Replica Set / Transactions)
                                      ▼
                      ┌──────────────────────────────────────────────┐
                      │            MONGODB ATLAS (M0)                │
                      │  Multi-Document ACID Replica Set Cluster     │
                      └──────────────────────────────────────────────┘
```

---

## Option 1: Recommended Cloud Deployment (100% Free Tier)
**Frontend on Vercel + Backend on Render + Database on MongoDB Atlas**

### Step 1: Set Up MongoDB Atlas (Database)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared Cluster (M0 Free Tier)**.
3. Choose an AWS region closest to your target users (e.g., `ap-south-1` Mumbai).
4. Under **Database Access**:
   - Create a database user (e.g., `nexcart_admin`).
   - Generate and save a secure password.
5. Under **Network Access**:
   - Click **Add IP Address** -> Choose **Allow Access from Anywhere (`0.0.0.0/0`)** to allow cloud hosts to connect.
6. Click **Connect** -> **Drivers (Node.js)**:
   - Copy your connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/nexcart_db?retryWrites=true&w=majority
     ```

---

### Step 2: Deploy Backend to Render.com
1. Sign in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/gouravdutta2004/NexCart`.
4. Configure the Web Service settings:
   - **Name:** `nexcart-backend`
   - **Region:** Singapore / Oregon / Frankfurt (pick closest to your DB)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Add **Environment Variables**:
   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `5001` | Server port |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas connection string |
   | `JWT_SECRET` | *(64-char random string)* | E.g., `openssl rand -hex 32` |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry |
   | `CLIENT_URL` | `https://nexcart-frontend.vercel.app` | Updated after Step 3 |
6. Click **Create Web Service**.
7. Once deployed, note down your Render URL:  
   `https://nexcart-backend.onrender.com`
8. Verify health endpoint in your browser:  
   `https://nexcart-backend.onrender.com/api/health`

#### Seed Initial Data on Render
Open the **Shell** tab on your Render dashboard and run:
```bash
npm run seed
```
This populates sample products, categories, suppliers, discounts, and default role accounts.

---

### Step 3: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Import `gouravdutta2004/NexCart`.
4. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add **Environment Variable**:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://nexcart-backend.onrender.com/api/v1` |
6. Click **Deploy**.
7. Once deployment finishes, copy your frontend domain (e.g., `https://nexcart.vercel.app`).
8. Return to Render -> `nexcart-backend` -> **Environment**:
   - Set `CLIENT_URL` = `https://nexcart.vercel.app` (your Vercel URL).
   - Save changes to restart the backend with the new CORS origin.

---

## Option 2: Render Blueprint (One-Click Deployment)

The repository includes a ready-to-use [`render.yaml`](../render.yaml) specification:

1. In Render, click **Blueprints** -> **New Blueprint Instance**.
2. Select repository `gouravdutta2004/NexCart`.
3. Provide your `MONGODB_URI` when prompted.
4. Render automatically provisions:
   - `nexcart-backend` Web Service
   - `nexcart-frontend` Static Site
   - Connects health checks and routes automatically.

---

## Option 3: Unified Single-Service Deployment
If you want to run the frontend and backend under a **single domain** on a single cloud service:

1. Create a Web Service on Render / Railway pointing to repository root `.`.
2. **Build Command:**
   ```bash
   npm run build
   ```
3. **Start Command:**
   ```bash
   npm start
   ```
4. The Express backend will automatically detect `frontend/dist` and serve the production React SPA along with the API under one unified URL without CORS setup!

---

## Option 4: Docker & Docker Compose (VPS / On-Premise)

For deploying on AWS EC2, DigitalOcean, or an Ubuntu VPS:

1. Clone repository on your server:
   ```bash
   git clone https://github.com/gouravdutta2004/NexCart.git
   cd NexCart
   ```
2. Build and launch all containers:
   ```bash
   docker compose up -d --build
   ```
3. Seed the database inside the container:
   ```bash
   docker compose exec backend npm run seed
   ```
4. Access endpoints:
   - Frontend: `http://<server-ip>:3000`
   - Backend API: `http://<server-ip>:5001/api/v1`
   - System Health: `http://<server-ip>:5001/api/health`

---

## Default Seed Credentials

After running `npm run seed`:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@nexcart.local` | `Password@123` |
| **Inventory Manager** | `manager@nexcart.local` | `Password@123` |
| **Cashier** | `cashier@nexcart.local` | `Password@123` |
| **Customer** | `customer@nexcart.local` | `Password@123` |

---

## Post-Deployment Verification Checklist

- [ ] `GET /api/health` returns `{"status": "UP", "database": "CONNECTED"}`.
- [ ] User login works and returns a valid JWT token.
- [ ] Direct page refresh on any SPA route (e.g. `/pos`, `/inventory`) loads without 404.
- [ ] Checkout completes with correct INR (₹) and GST breakdown.
- [ ] Real-time stock notifications show WebSocket connected indicator.
