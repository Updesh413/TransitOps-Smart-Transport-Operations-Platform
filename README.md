# 🚛 TransitOps - Smart Transport Operations Platform

TransitOps is a premium, end-to-end transport operations dashboard designed to digitize vehicle fleets, driver management, trip dispatches, maintenance schedules, and operating expenses. Powered by a live Supabase backend and guided by Role-Based Access Control (RBAC), TransitOps streamlines logistics workflows, monitors compliance limits, and evaluates financial ROI in real time.

---

## 🚀 Key Features

*   **Split-Screen Auth Gateway**: High-tech visual showcase with interactive, animated vector branding and secure Supabase-backed RBAC signup.
*   **Supabase Database Sync**: Real-time CRUD capabilities mapping vehicles, drivers, active dispatches, maintenance logs, and financial records.
*   **Role-Based Access Control (RBAC)**:
    *   **Fleet Managers** hold full administrative read/write access to resources, forms, and certificate files.
    *   **Drivers** see their personal assigned dispatches, update active odometer metrics, toggle duty states, and monitor safety ratings.
    *   **Safety Officers** access safety scores, license validation statuses, and live vehicle compliance alert notifications.
    *   **Financial Analysts** evaluate operating costs, invoiced profit charts, and CSV report export parameters.
*   **Certificate & File Management**: Real file selector (`.pdf`, `.doc`, `.docx`) that uploads certificates directly to Supabase Storage with dynamic fallback to Base64 DB storage (secured behind RBAC).
*   **Compliance Alerts Engine**: Automatic notification system warning of expired driver licenses, active maintenance delays, and vehicles with critical odometer thresholds.
*   **Responsive Drawer Layout**: Seamless navigation switching from a permanent sidebar on desktops to a toggleable sliding menu on mobile and tablet devices.
*   **Custom Theme Toggle**: Fluid dark/light theme switching with custom HSL property overrides.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js (App Router)
*   **Logic & State**: React 19 (Client-Side State Management)
*   **Styling**: Premium Vanilla CSS (custom glassmorphism, glowing micro-animations, responsive media queries)
*   **Backend**: Supabase (Database, Auth authentication, Storage Buckets)
*   **Icons**: Custom animated inline SVGs

---

## 📂 Folder Structure

```text
TransitOps-Smart-Transport-Operations-Platform/
├── public/
│   └── login_visual.jpg           # Generated 3D visual for split-screen auth
├── src/
│   └── app/
│       ├── favicon.ico            # Default fallback favicon
│       ├── globals.css            # Premium CSS tokens, animations & media queries
│       ├── icon.png               # High-resolution transport favicon
│       ├── layout.js              # Next.js root layout wrapper
│       ├── page.js                # Core Single-Page Application (SPA) dashboard
│       ├── seed.js                # Helper script to populate demo database data
│       └── supabaseClient.js      # Supabase connection init client
├── .env.local.example             # Example environment variables setup template
├── next.config.mjs                # Next.js compiler preferences
├── package.json                   # Project packages & script commands
└── supabase_schema.sql            # Database schema setup definitions
```

---

## ⚙️ Step-by-Step Setup Guide

### 1. Configure Local Environment Variables
Create a file named `.env.local` in the project root and enter your Supabase connection parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Set Up the Supabase Database
1.  Log in to your [Supabase Console](https://supabase.com/).
2.  Open the **SQL Editor** tab of your project.
3.  Copy all SQL queries from the local **`supabase_schema.sql`** file and execute them. This establishes:
    *   `vehicles` table with CamelCase fields and JSONB document columns.
    *   `drivers`, `trips`, `maintenance`, and `expenses` tables.
    *   Initial lookup constraints.

### 3. Initialize Supabase Storage (Optional)
If you want to store vehicle certificates in Supabase Storage instead of as local Base64 strings in the DB:
1.  Go to the **Storage** tab in your Supabase project.
2.  Create a new bucket named **`certificates`**.
3.  Set the bucket visibility to **Public**.

### 4. Build and Run Locally
Install dependencies and run the Next.js development server:
```bash
# Install dependencies
npm install

# Start the dev server with Webpack compiler overrides
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deployment to Vercel

### Option A: Using the Vercel Dashboard (Recommended)
1.  Push your code to a Git repository (GitHub / GitLab). The local `.gitignore` is already set up to secure your `.env.local` credentials.
2.  Import your repository into the [Vercel Dashboard](https://vercel.com/).
3.  Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the project settings.
4.  Click **Deploy**.

### Option B: Using Vercel CLI
```bash
# Install CLI
npm install -g vercel

# Authenticate & Link workspace
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```
