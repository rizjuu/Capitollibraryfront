# 🏛️ Capitol Library Frontend

Modern React + Vite frontend for the Misamis Oriental Capitol Public Library Management System, connected to the Supabase-powered backend.

---

## 🚀 1. Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=537410929054-hccges6c28en60dkgl43llrqd875tp7p.apps.googleusercontent.com
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## 🌐 2. How to Deploy to Vercel

1. Push `capitollibraryfront` to a new GitHub repository (e.g., `capitollibraryfront`).
2. Log in to [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
3. Import your `capitollibraryfront` repository.
4. Keep the Framework Preset as **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://capitollibraryback.onrender.com` (your deployed Render backend URL, without trailing slash)
   - `VITE_GOOGLE_CLIENT_ID`: `537410929054-hccges6c28en60dkgl43llrqd875tp7p.apps.googleusercontent.com`
6. Click **Deploy**.
7. Once deployed, copy your production frontend URL (e.g., `https://capitollibraryfront.vercel.app`) and make sure to update `FRONTEND_URL` in your Render backend settings so CORS and redirects match.
