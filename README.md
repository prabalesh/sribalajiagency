# Sri Balaji Agency - E-Commerce Platform

A modern e-commerce application built with a separate frontend and backend architecture, designed for scalability and performance.

## 🏗 Tech Stack

### Frontend
- **Framework**: Angular 19 (Standalone Components)
- **Styling**: SCSS
- **State Management**: Angular Signals (Custom Store)
- **HTTP Client**: Axios

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT & Passport

## 📂 Project Structure

This project is organized as a monorepo with the following structure:

- `frontend/`: Source code for the Angular application.
- `backend/`: Source code for the NestJS API.
- `package.json`: Root configuration with workspace scripts.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sribalajiagency
   ```

2. **Install dependencies:**
   Since this is a workspace, installing dependencies at the root installs them for both apps.
   ```bash
   npm install
   ```

3. **Environment Setup:**
   
   #### Backend Configuration
   Create a `.env` file in the `backend/` directory with the following variables:
   
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASS=your_db_password
   DB_NAME=store
   
   # JWT Configuration
   JWT_ACCESS_SECRET=your-secret-access-key
   JWT_REFRESH_SECRET=your-secret-refresh-key
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # CORS Configuration (comma-separated list of allowed origins)
   CORS_ORIGINS=http://localhost:4200,http://localhost:3000
   ```
   
   **Note**: A `.env.example` file is provided in the `backend/` directory as a template.
   
   #### Frontend Configuration
   The frontend uses Angular environment files located in `frontend/src/environments/`:
   
   - **Development** (`environment.development.ts`): Used when running `ng serve`
     ```typescript
     export const environment = {
       production: false,
       apiUrl: 'http://localhost:3000'
     };
     ```
   
   - **Production** (`environment.ts`): Used when building for production
     ```typescript
     export const environment = {
       production: true,
       apiUrl: 'https://api.yourdomain.com'
     };
     ```
   
   > [!WARNING]
   > **Security Note**: These frontend environment files are **tracked in git**.
   > - Do **NOT** put any secrets (keys, passwords) in these files.
   > - Only include public configuration like API URLs.
   > - If you need local overrides that shouldn't be committed, create `environment.local.ts` and add it to `.gitignore`.

## 🛠 Development Scripts

You can run both applications from the root directory using the following scripts:

| Command | Description |
| :--- | :--- |
| `npm run start:frontend` | Starts the Angular frontend in development mode (`ng serve`). |
| `npm run start:backend` | Starts the NestJS backend in watch mode (`nest start --watch`). |
| `npm run build:frontend` | Builds the frontend for production. |
| `npm run build:backend` | Builds the backend for production. |

## 🌍 Deployment Guide

Since the frontend and backend are completely separate projects within this repo, they should ideally be deployed to different environments optimized for their specific needs.

### 1. Frontend Deployment (Static Hosting)
The frontend is a Single Page Application (SPA).
- **Build**: Run `npm run build:frontend`. This generates static files in `dist/sribalajiagency/browser`.
- **Hosting**: You can host these files on any static site provider:
    - **Vercel / Netlify**: Connect your repo and set the build command to `npm run build:frontend` and output dir to `dist/sribalajiagency/browser`.
    - **AWS S3 + CloudFront**: Upload the `dist` folder to S3.
    - **Nginx/Apache**: Serve the `dist` folder as static files.
- **Configuration**: Ensure the frontend knows the backend API URL. Update `environment.ts` or inject the API URL at build time.

### 2. Backend Deployment (Node.js Server)
The backend is a Node.js application.
- **Build**: Run `npm run build:backend`.
- **Hosting**: You need a server that runs Node.js:
    - **Platform as a Service (PaaS)**: Heroku, Railway, Render, DigitalOcean App Platform.
    - **Cloud VM**: AWS EC2, Google Compute Engine (use PM2 to keep the process running).
    - **Docker**: Create a `Dockerfile` to containerize the app and deploy to AWS ECS, Kubernetes, etc.
- **Configuration**: Set environment variables (DB credentials, JWT secret, CORS allowed origins) on the server.

### 📜 CORS Configuration

The backend now uses environment variables for CORS configuration, making it easy to add multiple allowed origins without code changes.

**To add more CORS origins:**

1. Update the `CORS_ORIGINS` variable in your `backend/.env` file:
   ```env
   CORS_ORIGINS=http://localhost:4200,https://frontend.com,https://www.frontend.com
   ```

2. Restart the backend server for changes to take effect.

**For production deployment:**
- Add all your frontend domains to `CORS_ORIGINS` (comma-separated)
- Ensure `credentials: true` is maintained for cookie-based authentication
- The backend will automatically parse and apply all origins from the environment variable
