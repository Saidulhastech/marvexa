# Deployment Guide — Marvexa Storefront

Marvexa is built with Astro and is fully **platform-agnostic**. You can deploy it to any popular hosting provider (Cloudflare, Vercel, Netlify, or your own Node.js VPS) without needing to configure complex database services or platform-specific key-value bindings.

---

## 📋 Prerequisites: Shopify API Credentials

Before deploying, you need to gather your Shopify credentials. Log into your Shopify Admin panel:

1. **Shop Domain:** Your shop identifier (e.g. `your-shop.myshopify.com`).
2. **Storefront API Private Token:** 
   - Go to **Settings** → **Apps and sales channels** → **Develop apps**.
   - Create a new custom app and enable the **Storefront API** scopes.
   - Go to **API credentials** and copy the **Storefront API private access token** (Header name: `Shopify-Storefront-Private-Token`).
   - *Ensure you publish your products/collections to the Headless sales channel/App or they will not show up on your website.*
3. **Customer Account API Credentials** *(Optional — only if using customer logins)*:
   - Go to **Settings** → **Customer Accounts** → click **Manage** in the Customer Accounts API section to locate your **Client ID** and **Shop ID**.

---

## ⚡ Hosting Options

Choose one of the popular services below to deploy your storefront.

### Option 1: Cloudflare Pages (Recommended)
Cloudflare is highly recommended for e-commerce because of its global edge network, zero cold starts, and generous free tier.

1. **Push your code to GitHub** (or GitLab/Bitbucket).
2. Log into the **[Cloudflare Dashboard](https://dash.cloudflare.com/)** and navigate to **Workers & Pages** → **Pages** → **Connect to Git**.
3. Select your repository.
4. Under **Build settings**:
   - **Framework preset:** Select `Astro`.
   - **Build command:** `npm run build:cloudflare` (or simply `npm run build`).
   - **Build output directory:** `dist`
5. Go to the **Environment variables** tab and add the variables listed in the [Environment Variables](#-environment-variables) section below.
6. Click **Save and Deploy**. Cloudflare will automatically build and publish your site.

---

### Option 2: Vercel (1-Click Deployment)
Vercel is the easiest option for deploying templates and supports 1-click deployments.

#### Create a Deploy Button
You can place a Vercel deploy button on your repository README for your users:
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmarvexa&env=SHOPIFY_SHOP_DOMAIN,SHOPIFY_STOREFRONT_PRIVATE_TOKEN)
```

#### Manual Deployment:
1. Connect your GitHub repository to your **[Vercel Dashboard](https://vercel.com/)**.
2. Vercel automatically detects the Astro framework.
3. Add your Shopify environment variables (see table below). *(The Vercel environment is auto-detected, so you do not need to set `ASTRO_ADAPTER` manually).*
4. Click **Deploy**.

---

### Option 3: Netlify
Netlify offers excellent serverless deployment and static asset delivery.

#### Create a Deploy Button
Place a Netlify deploy button on your repository README:
```markdown
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/marvexa)
```

#### Manual Deployment:
1. Import your project repository into **[Netlify](https://www.netlify.com/)**.
2. Netlify will auto-detect Astro.
3. Under **Site configuration** → **Environment variables**, add your Shopify environment variables (see table below). *(Netlify is auto-detected, so you do not need to set `ASTRO_ADAPTER` manually).*
4. Click **Deploy Site**.

---

### Option 4: Self-Hosted / Node.js VPS / Docker
If you want to deploy on a VPS (like DigitalOcean, Hetzner, AWS, etc.) using Node.js directly or inside a Docker container:

1. **Clone your repository** onto your server.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**: Create a `.env` file in the root directory and ensure you set:
   ```bash
   ASTRO_ADAPTER=node
   SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
   SHOPIFY_STOREFRONT_PRIVATE_TOKEN=shpat_...
   ```
4. **Build the application**:
   ```bash
   npm run build:node
   ```
5. **Start the standalone Node server**:
   - For basic testing:
     ```bash
     npm run start:node
     ```
   - **Using PM2** (Process Manager, recommended for production to keep the app running in the background and restart on reboot):
     ```bash
     # Install PM2 globally
     npm install -g pm2

     # Start the application
     pm2 start dist/server/entry.mjs --name "marvexa-storefront"

     # Save the PM2 list and configure to run on startup
     pm2 save
     pm2 startup
     ```
6. **Reverse Proxy (Nginx / Caddy)**:
   By default, the server listens on port `4321` (you can change this by setting the `PORT` environment variable). You should reverse-proxy it behind Nginx or Caddy.

   **Example Nginx configuration block:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:4321;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 🔑 Environment Variables

Configure these variables in your hosting dashboard:

| Name | Required | Description |
| :--- | :--- | :--- |
| `ASTRO_ADAPTER` | Optional | Target platform (`cloudflare`, `vercel`, `netlify`, `node`). Auto-detected on Cloudflare Pages, Vercel, and Netlify. Only set manually (e.g. `node`) for self-hosted VPS/Docker. |
| `SHOPIFY_SHOP_DOMAIN` | **Yes** | Your Shopify store domain (e.g. `my-store.myshopify.com`). |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | **Yes** | Your private Storefront API token. |
| `SHOPIFY_API_VERSION` | Optional | Pinned API version (defaults to `2026-04`). |
| `CUSTOMER_ACCOUNT_API_CLIENT_ID` | Optional | Client ID for customer accounts login. |
| `SHOPIFY_SHOP_ID` | Optional | Numeric Shop ID for customer accounts login. |
| `CUSTOMER_ACCOUNT_API_VERSION` | Optional | Customer API version (defaults to `2025-01`). |

---

## 🔧 Local Development & Testing

To run the project locally:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Shopify credentials.
3. Start the dev server:
   ```bash
   npm run dev
   ```
