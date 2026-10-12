# FoodLoop Full-Stack Deployment Guide

This guide describes how to deploy the **FoodLoop** application (Spring Boot backend, React frontend, and hosted MySQL database) to production using:
- **Render** for the Spring Boot backend (Docker runtime)
- **Netlify** for the React + Vite frontend
- **Managed MySQL Provider** (e.g., Aiven, Clever Cloud, Railway, PlanetScale, TiDB Cloud, etc.) for persistent storage
- **GitHub** repository: `https://github.com/24eg107e55-byte/Foodloop` (branch: `main`)

---

## 1. Architecture Overview

```
+-------------------------------------------------------------+
|                      Netlify (Frontend)                    |
|                React 19 + Vite (Single Page App)            |
|               Deployed at: https://<site>.netlify.app       |
+------------------------------+------------------------------+
                               |
                               | HTTPS REST API Calls
                               | (Bearer JWT in Authorization)
                               v
+-------------------------------------------------------------+
|                      Render (Backend)                       |
|           Spring Boot 4.x / Java 21 inside Docker           |
|         Deployed at: https://<service>.onrender.com        |
+------------------------------+------------------------------+
                               |
                               | JDBC / TLS Connection
                               v
+-------------------------------------------------------------+
|                    Hosted MySQL Database                    |
|           Tables: users, food_donations, food_requests      |
+-------------------------------------------------------------+
```

---

## 2. Step-by-Step Deployment Order

Deploy in this specific sequence to ensure each component has its required dependencies:
1. **Prepare and Push Code to GitHub**
2. **Provision Hosted MySQL Database**
3. **Deploy Backend on Render** (connects to MySQL)
4. **Deploy Frontend on Netlify** (points to Render URL)
5. **Update Backend CORS Configuration** (adds Netlify production URL)
6. **Perform End-to-End Functional Testing**

---

## 3. Section A: Managed MySQL Database Setup

Render does not offer a free native managed MySQL service. Use a cloud MySQL provider such as **Aiven**, **Clever Cloud**, **Railway**, **TiDB Cloud**, or **AWS RDS / DigitalOcean**.

### A.1 Provisioning the Database
1. Sign up for a MySQL cloud database provider (e.g., [Aiven for MySQL](https://aiven.io), [Clever Cloud](https://clever-cloud.com), or [Railway](https://railway.app)).
2. Create a new MySQL service (MySQL 8.0 or higher recommended).
3. Record the following connection parameters provided by your host:
   - **Host / Hostname** (e.g., `mysql-xxxx.aivencloud.com`)
   - **Port** (e.g., `3306` or assigned port like `15234`)
   - **Database Name** (e.g., `foodloop` or `defaultdb`)
   - **Username** (e.g., `avnadmin` or `root`)
   - **Password** (keep this secret)

### A.2 Assembling the JDBC URL
Construct the Spring Boot JDBC connection URL according to your provider's SSL requirements:

- **Standard SSL (Recommended for most cloud providers):**
  ```
  jdbc:mysql://<DB_HOST>:<DB_PORT>/<DB_NAME>?sslMode=REQUIRED
  ```
- **If SSL is optional/disabled by provider:**
  ```
  jdbc:mysql://<DB_HOST>:<DB_PORT>/<DB_NAME>
  ```

### A.3 Applying the Schema
You have two safe options for schema creation:

- **Option 1: Automatic Hibernate Generation (Default)**
  The backend is configured with `spring.jpa.hibernate.ddl-auto=update`. When the backend starts up connected to your cloud MySQL, Hibernate will automatically create all missing tables (`users`, `food_donations`, `food_requests`) safely without dropping data.
  
- **Option 2: Manual Script Execution**
  You can run the schema migration script manually using MySQL Workbench, DBeaver, or your provider's Web SQL console:
  Run the queries from [`foodloop-backend/src/main/resources/schema.sql`](file:///foodloop-backend/src/main/resources/schema.sql).

### A.4 Keeping Credentials Secure
- Never commit passwords or connection URLs to Git.
- Never place real credentials inside `.env.example` or frontend code.
- Store credentials only in the hosting provider's secure Environment Variables dashboard.

---

## 4. Section B: Render Backend Deployment (Docker)

### B.1 Create Render Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `https://github.com/24eg107e55-byte/Foodloop`.
4. Choose the following settings:
   - **Name**: `foodloop-backend` (or your choice)
   - **Region**: Choose the region closest to your MySQL database
   - **Branch**: `main`
   - **Root Directory**: `foodloop-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free` (or higher)

### B.2 Configure Environment Variables on Render
Under the **Environment Variables** section on Render, add:

| Key | Value / Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC connection string to your hosted MySQL | `jdbc:mysql://<DB_HOST>:<DB_PORT>/<DB_NAME>?sslMode=REQUIRED` |
| `SPRING_DATASOURCE_USERNAME` | Your cloud MySQL user | `<DB_USERNAME>` |
| `SPRING_DATASOURCE_PASSWORD` | Your cloud MySQL password | `<DB_PASSWORD>` |
| `JWT_SECRET` | Strong secret key (min 32 characters) | `<Generate strong 32+ char string>` |
| `CORS_ALLOWED_ORIGINS` | Netlify frontend URL (or leave blank until Netlify URL is ready) | `https://<your-site>.netlify.app` |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Safe schema management strategy | `update` |
| `SPRING_JPA_SHOW_SQL` | Log SQL queries (optional) | `false` |

> **Note on Port**: Render automatically injects the `PORT` environment variable (typically `10000`). The backend's `application.properties` and `Dockerfile` are configured to read `${PORT:8080}` and bind properly to this dynamic port.

### B.3 Deploy and Check Logs
1. Click **Create Web Service**.
2. Render will build the multi-stage Docker container (compiling with Maven and Java 21, then running the lightweight JRE 21 runtime).
3. Monitor the **Logs** tab in Render:
   - Look for `Started DemoApplication in X.XXX seconds (process running...)`
   - Look for successful Tomcat initialization on the assigned port.

### B.4 Verify Public Health Check Endpoint
Once deployed, Render provides a URL (e.g., `https://foodloop-backend.onrender.com`).
Visit or curl the public health check endpoint:
```bash
curl https://<your-render-backend-name>.onrender.com/api/health
```
Expected response:
```json
{
  "status": "UP",
  "service": "FoodLoop Backend",
  "timestamp": 1728738400000
}
```

---

## 5. Section C: Netlify Frontend Deployment

### C.1 Create Netlify Site
1. Log in to [Netlify](https://app.netlify.com).
2. Click **Add new site** -> **Import an existing project**.
3. Select **GitHub** and authorize access to `24eg107e55-byte/Foodloop`.
4. Configure the build settings:
   - **Branch to deploy**: `main`
   - **Base directory**: `foodloop-frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `foodloop-frontend/dist` (or `dist` if relative to base)

### C.2 Configure Environment Variables on Netlify
In **Site Configuration** -> **Environment Variables**, add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-backend-name>.onrender.com` | Base URL of your deployed Render backend (no trailing slash) |

### C.3 SPA Routing Redirects
The project includes both [`foodloop-frontend/public/_redirects`](file:///foodloop-frontend/public/_redirects) and [`foodloop-frontend/netlify.toml`](file:///foodloop-frontend/netlify.toml) configured with:
```
/*    /index.html   200
```
This ensures refreshing nested routes like `/dashboard`, `/available-food`, `/login`, or `/my-donations` will not result in a Netlify 404 error.

### C.4 Deploy Frontend
1. Click **Deploy Foodloop**.
2. Once the deployment finishes, Netlify provides your live site URL (e.g., `https://foodloop-smart.netlify.app`).

---

## 6. Section D: Final Integration & CORS Setup

### D.1 Authorize Netlify in Render CORS
1. Copy your live Netlify URL (e.g., `https://foodloop-smart.netlify.app`).
2. Go to your Render backend service -> **Environment**.
3. Set or update the `CORS_ALLOWED_ORIGINS` variable:
   ```
   CORS_ALLOWED_ORIGINS=https://<your-actual-netlify-subdomain>.netlify.app
   ```
   *(If you have custom domains or multiple preview URLs, separate them with commas: e.g. `https://foodloop.netlify.app,https://mycustomdomain.com`)*.
4. Render will trigger a quick redeployment with the new environment variable.

---

## 7. Section E: End-to-End Verification Checklist

Test the complete application online through your Netlify URL:

1. **User Registration**:
   - Register a new **Donor** account (`donor@example.com`).
   - Register a new **Receiver** account (`receiver@example.com`).
   - Verify success messages and database persistence.
2. **User Authentication**:
   - Log in as the donor; verify redirection to the Dashboard and JWT token stored in browser localStorage.
3. **Donor Flow**:
   - Click **Donate Food**. Fill in food type, quantity, pickup location, description, and pickup deadline.
   - Click **Submit**. Verify success message.
   - Go to **My Donations**; confirm the donation appears with status `AVAILABLE`.
4. **Receiver Flow**:
   - Log out and log in as the receiver.
   - Go to **Available Food**; verify the donated meal is visible.
   - Click **Request this food**. Verify success message and state update.
   - Go to **My Food Requests**; confirm request appears with status `PENDING`.
5. **Donor Approval Flow**:
   - Log out and log in back as the donor.
   - Go to **Manage Requests** (`/donor-requests`).
   - View the pending request from the receiver and click **✓ Approve**.
   - Confirm the request updates to `APPROVED` and the donation status changes to `UNAVAILABLE`.
6. **Data Persistence**:
   - In Render, restart the backend service.
   - Reload your Netlify frontend; verify that users, donations, and requests remain persisted in the hosted MySQL database.

---

## 8. Section F: Troubleshooting

| Issue | Likely Cause | Resolution |
|---|---|---|
| **CORS Error in Browser Console** | Backend does not recognize frontend origin | Ensure `CORS_ALLOWED_ORIGINS` in Render matches your exact Netlify URL (including `https://`, no trailing slash). |
| **Backend fails on startup (Database connection error)** | Incorrect JDBC URL, credentials, or cloud MySQL firewall | 1. Verify hostname, port, database name, and password.<br>2. Add `?sslMode=REQUIRED` to the JDBC URL for cloud providers like Aiven/Railway.<br>3. Check if your database provider requires whitelisting IP addresses (set allowed IPs to `0.0.0.0/0` if applicable). |
| **Frontend API calls go to localhost** | `VITE_API_BASE_URL` was not set before building on Netlify | Add `VITE_API_BASE_URL` in Netlify environment variables and trigger **Trigger deploy -> Clear cache and deploy site**. |
| **Page refresh on Netlify shows 404** | Missing SPA rewrite rule | Ensure `foodloop-frontend/public/_redirects` exists and contains `/* /index.html 200`. |
| **Render Docker build failure** | Maven build error | Verify Java 21 is used. Check the multi-stage Dockerfile and test locally with `.\mvnw.cmd package -DskipTests`. |
