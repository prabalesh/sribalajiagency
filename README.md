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
   - **Backend**: Create a `.env` file in the `backend/` directory (see `.env.example` if available).
   - **Frontend**: Configure environment variables in `frontend/src/environments/` if necessary.

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
- **Configuration**: Ensure the frontend knows the backend API URL. Update `environment.prod.ts` or inject the API URL at build time.

### 2. Backend Deployment (Node.js Server)
The backend is a Node.js application.
- **Build**: Run `npm run build:backend`.
- **Hosting**: You need a server that runs Node.js:
    - **Platform as a Service (PaaS)**: Heroku, Railway, Render, DigitalOcean App Platform.
    - **Cloud VM**: AWS EC2, Google Compute Engine (use PM2 to keep the process running).
    - **Docker**: Create a `Dockerfile` to containerize the app and deploy to AWS ECS, Kubernetes, etc.
- **Configuration**: Set environment variables (DB credentials, JWT secret, CORS allowed origins) on the server.

### 📜 CORS Configuration
When hosting on different domains (e.g., `frontend.com` and `api.backend.com`), you **must** configure CORS in the backend to allow requests from the frontend domain.

Update `backend/src/main.ts`:
```typescript
app.enableCors({
  origin: 'https://your-frontend-domain.com',
  credentials: true,
});
```
