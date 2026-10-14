# FoodLoop — Complete Production Deployment on Render

This guide provides beginner-friendly, click-by-click instructions for deploying **FoodLoop: A Smart Surplus Food Donation and Community Pickup Management System** entirely on **Render** (Frontend Static Site + Backend Web Service + Persistent MySQL Database).

---

## 1. Production Architecture Overview

```
                      +-----------------------------+
                      |       User's Browser        |
                      +--------------+--------------+
                                     |
               HTTPS (Static Assets) | HTTPS (REST API & JWT)
                                     v
        +--------------------+                 +--------------------+
        |  React + Vite App  |                 |  Spring Boot 4 /   |
        | Render Static Site | --------------> |      Java 21       |
        |                    |  Bearer <JWT>   | Render Web Service |
        +--------------------+                 +---------+----------+
                                                         |
                                                         | JDBC (TCP / TLS)
                                                         v
                                               +--------------------+
                                               |    MySQL 8.0+      |
                                               |  (Render Docker /  |
                                               |  Persistent Disk)  |
                                               +--------------------+
```

- **Frontend**: React 19 + Vite deployed as a **Render Static Site**.
- **Backend**: Java 21 + Spring Boot 4 + Spring Security + JWT deployed as a **Render Web Service** (Docker).
- **Database**: MySQL 8.0 instance with persistent disk storage (`/var/lib/mysql`) or a free managed MySQL service.

---

## 2. Important Notice Regarding MySQL on Render & Costs

Render provides **Managed PostgreSQL** by default, but **does NOT** provide a 1-click free managed MySQL database.

To host MySQL on Render while preserving your existing MySQL schema:
1. **Option A: Render Custom MySQL Docker Service with Persistent Disk (Official Render approach)**:
   - Run the official `mysql:8.0` image as a Render **Private Service** (or Web Service).
   - Attach a Render **Persistent Disk** mounted at `/var/lib/mysql`.
   - **Cost Requirement**: Render requires a paid instance type (**Starter plan at $7/month**) to attach persistent disks. Disks cost **$0.25/GB/month** (e.g., a 1 GB disk is $0.25/month). 
   - *Warning*: If you run MySQL on Render's Free tier without a persistent disk, all database data will be erased whenever the container restarts or spins down.
2. **Option B: Free External Managed MySQL (e.g., Aiven or TiDB Cloud)**:
   - If you want a **100% free deployment** without paying $7/month, you can create a free MySQL instance on Aiven or TiDB Cloud.
   - Spring Boot connects using standard MySQL JDBC drivers and environment variables either way.

Both options are detailed below. Choose whichever suits your budget!

---

## 3. Pre-Deployment Verification (Completed Locally)

Antigravity has already verified and prepared your workspace:
- **Frontend build**: `npm run build` succeeds cleanly in `< 1s` (`foodloop-frontend/dist/`).
- **Backend build**: `mvnw.cmd package -DskipTests` succeeds cleanly (`target/demo-0.0.1-SNAPSHOT.jar`).
- **Context & Database integration test**: `mvnw.cmd test` passes 100%.
- **SPA Routing rewrite**: `foodloop-frontend/public/_redirects` contains `/*  /index.html  200` to prevent 404s on page refresh.
- **Port handling**: Backend `Dockerfile` and `application.properties` listen dynamically on `${PORT:8080}` as required by Render.
- **Flexible Database Configuration**: Backend supports both discrete environment variables (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`) and unified `SPRING_DATASOURCE_URL`.
- **Health check**: `/api/health`, `/health`, and `/` are publicly accessible for Render health checks without requiring JWT.

---

## 4. Step 1: Push Code to GitHub

Your repository is connected to `https://github.com/24eg107e55-byte/Foodloop.git` on branch `main`.

Open your PowerShell terminal and push the prepared deployment configurations:

```powershell
cd C:\Users\harin\OneDrive\Desktop\Foodloop
git add .
git commit -m "Configure production environment variables and Render deployment files"
git push origin main
```

*(Verify your latest commit appears on GitHub).*

---

## 5. Step 2: Set Up MySQL Database

### Option A: MySQL 8 on Render (Docker + Persistent Disk)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **Private Service** (or Web Service).
3. Select **Deploy an existing image from a registry**.
4. In the **Image URL** field, enter:
   ```
   mysql:8.0
   ```
5. Click **Next** and configure the service:
   - **Name**: `foodloop-mysql`
   - **Region**: Choose a region (e.g., *Oregon* or *Frankfurt*). Make sure your backend Web Service is created in the **exact same region**!
   - **Instance Type**: **Starter** ($7/mo — required for persistent disks).
6. Scroll down to **Advanced** and expand **Disks**:
   - Click **Add Disk**.
   - **Name**: `mysql-data`
   - **Mount Path**: `/var/lib/mysql`
   - **Size**: `1 GB` (or more as desired).
7. Under **Environment Variables**, add:
   - `MYSQL_ROOT_PASSWORD`: `<create-a-strong-root-password>`
   - `MYSQL_DATABASE`: `foodloop`
   - `MYSQL_USER`: `foodloop_user`
   - `MYSQL_PASSWORD`: `<create-a-strong-user-password>`
8. Click **Create Private Service**.
9. Once running, Render displays an internal service address:
   `foodloop-mysql:3306`

---

### Option B: Free Cloud-Hosted MySQL (e.g., Aiven Free Tier)

If you prefer 100% free hosting:
1. Go to [https://aiven.io/](https://aiven.io/) and create a free account.
2. Click **Create Service** > select **MySQL** > select the free tier/trial.
3. Service name: `foodloop-mysql`. Click **Create Service**.
4. From the Service Overview, copy:
   - **Host**: e.g., `mysql-xxxxxx.aivencloud.com`
   - **Port**: e.g., `12345`
   - **User**: `avnadmin`
   - **Password**: `<your-aiven-password>`
   - **Database**: `defaultdb` (or create `foodloop` in the Databases tab)
5. Connection URL format:
   ```
   jdbc:mysql://<HOST>:<PORT>/<DATABASE>?sslMode=REQUIRED&allowPublicKeyRetrieval=true
   ```

---

## 6. Step 3: Deploy Spring Boot Backend on Render

1. Go to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > select **Web Service**.
3. Select **Build and deploy from a Git repository**, click **Next**, and choose `24eg107e55-byte/Foodloop`.
4. Configure service parameters:
   - **Name**: `foodloop-backend`
   - **Region**: Select the **same region** where your database resides!
   - **Branch**: `main`
   - **Root Directory**: `foodloop-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: `Free` (or `Starter`)
5. Under **Environment Variables**, click **Add Environment Variable** and enter:

| Key | Example / Explanation |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | *If using Render Private Service*: `jdbc:mysql://foodloop-mysql:3306/foodloop?createDatabaseIfNotExist=true&allowPublicKeyRetrieval=true&useSSL=false`<br>*If using Aiven*: `jdbc:mysql://mysql-xxxx.aivencloud.com:12345/defaultdb?sslMode=REQUIRED&allowPublicKeyRetrieval=true` |
| `SPRING_DATASOURCE_USERNAME` | `foodloop_user` (or `avnadmin`) |
| `SPRING_DATASOURCE_PASSWORD` | `<your-database-password>` |
| `JWT_SECRET` | A secure random 32+ character string (e.g., `FoodLoopSuperSecureProductionSecretKey2026!`) |
| `CORS_ALLOWED_ORIGINS` | Leave empty or enter `http://localhost:5173` for now. *(You will update this with your frontend URL in Step 5)* |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` |

> [!NOTE]
> Alternatively, you can supply discrete database variables instead of `SPRING_DATASOURCE_URL`:
> `DB_HOST`: `foodloop-mysql`
> `DB_PORT`: `3306`
> `DB_NAME`: `foodloop`
> `DB_USERNAME`: `foodloop_user`
> `DB_PASSWORD`: `<your-database-password>`

6. Click **Create Web Service**.
7. Render will build the Docker container and start your Spring Boot application.
8. Once the log displays `Started DemoApplication in ... seconds`, copy your backend URL:
   `https://foodloop-backend.onrender.com`
9. Test the health endpoint in your browser:
   `https://foodloop-backend.onrender.com/api/health`
   **Expected Response:** `{"status":"UP","service":"FoodLoop Backend","timestamp":...}`

---

## 7. Step 4: Deploy React Frontend on Render

1. Go to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > select **Static Site**.
3. Select your repository `24eg107e55-byte/Foodloop`.
4. Configure the settings:
   - **Name**: `foodloop-frontend`
   - **Branch**: `main`
   - **Root Directory**: `foodloop-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://foodloop-backend.onrender.com` *(use your actual backend URL from Step 3, without trailing slash)*
6. Under **Redirects / Rewrites** (or let `_redirects` handle it):
   - Render automatically picks up `public/_redirects` which contains `/* /index.html 200`.
   - Optionally, you can also add a rule in the Render UI:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`
7. Click **Create Static Site**.
8. Render will run `npm run build` and publish your site at a URL like:
   `https://foodloop-frontend.onrender.com`

---

## 8. Step 5: Update Backend CORS with Frontend URL

Now that your frontend URL is live:
1. Copy your frontend URL (e.g., `https://foodloop-frontend.onrender.com`).
2. Go to your Render Dashboard > select `foodloop-backend` > **Environment**.
3. Edit `CORS_ALLOWED_ORIGINS` to include your frontend URL:
   ```
   https://foodloop-frontend.onrender.com,http://localhost:5173
   ```
4. Click **Save Changes**. Render will automatically redeploy the backend in 10–20 seconds with the updated CORS policy.

---

## 9. Step 6: End-to-End Testing & Verification

Open your live frontend URL (`https://foodloop-frontend.onrender.com`) in an Incognito window:

1. **User Registration**:
   - Register a donor: `donor@foodloop.org` (Role: `DONOR`).
   - Register a receiver: `receiver@foodloop.org` (Role: `RECEIVER`).
2. **User Login & JWT Verification**:
   - Log in with `donor@foodloop.org`.
   - Open Developer Tools > **Application** > **Local Storage** > Verify `user` contains a valid JWT `token`.
3. **Donor Action (Create Food Listing)**:
   - Navigate to `/donate`.
   - Submit a surplus food item (e.g., *Rice & Curry*, *15 packets*, *Community Center*).
   - Check `/my-donations` to confirm the listing appears with status `AVAILABLE`.
4. **Receiver Action (Request Food)**:
   - Log out and log in as `receiver@foodloop.org`.
   - Navigate to `/available-food`.
   - Confirm the donor listing is visible.
   - Click **Request Food**.
   - Check `/my-requests` to verify the request is recorded with status `PENDING`.
5. **Donor Action (Approve Request)**:
   - Log back in as `donor@foodloop.org`.
   - Navigate to `/donor-requests`.
   - Locate the pending request and click **Approve**.
   - Verify the request status updates to `APPROVED` and the food item status changes to `UNAVAILABLE`.
6. **Data Persistence Check**:
   - In Render, click **Manual Deploy** > **Restart Service** on both backend and database.
   - Reload your frontend and log back in.
   - Confirm that users, donations, and requests remain persisted in the database.

---

## 10. Database Schema & Data Migration (Export / Import)

If you have existing test data in your local MySQL instance that you wish to export to production:

### Export from Local MySQL:
```powershell
mysqldump -u root -p foodloop > foodloop_backup.sql
```

### Import into Hosted MySQL:
```powershell
# For Render private service (via port-forward or direct connection):
mysql -h <HOST> -P <PORT> -u <USER> -p <DATABASE> < foodloop_backup.sql
```

*(Note: Hibernate with `spring.jpa.hibernate.ddl-auto=update` automatically generates tables on startup if starting fresh, so manual import is only needed if migrating existing rows).*

---

## 11. Troubleshooting Common Issues

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **CORS error in browser console** | Frontend origin missing from `CORS_ALLOWED_ORIGINS` | Verify `CORS_ALLOWED_ORIGINS` in Render matches your exact frontend URL (including `https://`, no trailing slash). |
| **Backend fails on startup (`Communications link failure`)** | Database host/port unreachable or SSL mismatch | 1. Ensure backend and database are in the same Render region.<br>2. For internal Render networking, use `foodloop-mysql:3306`.<br>3. For external providers like Aiven, add `?sslMode=REQUIRED` to the JDBC URL. |
| **Frontend calls `http://localhost:8080` in production** | `VITE_API_BASE_URL` was unset during build | Ensure `VITE_API_BASE_URL` is set in the Render Static Site environment variables, then click **Manual Deploy** > **Clear build cache & deploy**. |
| **Page refresh returns 404** | Missing client-side route rewrite | Render Static Sites reads `public/_redirects` (`/* /index.html 200`). Alternatively, add a Rewrite rule in Render's **Redirects/Rewrites** tab (`/*` -> `/index.html`). |
| **Render Web Service slow on first load** | Free tier spin-down | Render free tier web services spin down after 15 minutes of inactivity. The first wake-up takes ~30–50 seconds. This is normal on the free tier. |
