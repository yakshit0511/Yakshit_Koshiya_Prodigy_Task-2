# Deployment Guide

## Backend on Render
1. Create an account on [render.com](https://render.com).
2. Create a new **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - Name: `employee-management-api`
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node index.js`
5. Add the backend environment variables from `server/.env.example`.
6. Set `NODE_ENV=production` and use a strong `JWT_SECRET` and `JWT_REFRESH_SECRET`.
7. Add your Vercel frontend URL to `CLIENT_URL`.
8. Deploy and copy the live backend URL.

## Cloudinary for Production File Storage
Render filesystem storage is ephemeral, so uploaded files should be moved to Cloudinary in production.

1. Create a free Cloudinary account.
2. Get `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Install `cloudinary` and `multer-storage-cloudinary` if you want hosted storage.
4. Replace local upload storage with Cloudinary storage in the server upload middleware.
5. Add the Cloudinary variables to Render.
6. Redeploy the backend.

## Frontend on Vercel
1. Create an account on [vercel.com](https://vercel.com).
2. Import the same GitHub repository as a new Vercel project.
3. Configure:
   - Root Directory: `client`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add frontend environment variables from `client/.env.production`.
5. Deploy and copy the Vercel URL.
6. Update `CLIENT_URL` on Render to the Vercel URL and redeploy the backend.

## MongoDB Atlas Production Setup
1. Go to the Atlas dashboard.
2. Open **Network Access** and add `0.0.0.0/0` so Render can connect.
3. Ensure the database user has `readWriteAnyDatabase` access.
4. Confirm the connection string includes the database name.
5. Enable Atlas monitoring for performance checks.

## Root Scripts
- `npm run dev` - runs client and server together
- `npm run server` - runs the backend only
- `npm run client` - runs the frontend only
- `npm run build` - builds the frontend for production
- `npm start` - starts the backend in production mode
- `npm run install-all` - installs dependencies for root and client
