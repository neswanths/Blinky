# Blinky ●

**Your Centralized Bookmark Manager & Chrome Extension Hub**

Blinky is a minimal, monochromatic bookmark manager designed for speed and focus. Stop losing links in bloated browser folders—treat Blinky as your **centralized hub** by organizing them into clean, draggable sections and saving them with a single click via the integrated Chrome extension.

## ✨ Core Highlights

- **Centralized Bookmark Hub**: A single, unified dashboard to manage all your web discoveries across different devices and contexts.
- **Instant Chrome Extension Integration**: Use the Blinky Chrome Extension to save your current tab to your "General" section (or any custom category) instantly, making curation totally frictionless.
- **Monochromatic & Minimalist Design**: A focused, distraction-free UI that puts your saved content first without the visual noise.
- **Section-based Organization**: Group your bookmarks into custom categories (e.g., "AI Tools", "Research", "Project Alpha") for structured accessibility.
- **Drag & Drop**: Effortlessly reorder bookmarks or move them between sections to keep your centralized hub perfectly organized.
- **Google Authentication**: Frictionless sign-on—securely access your centralized bookmarks anywhere without remembering another password.
- **Interactive Demo**: New users can explore a guided walkthrough of the core features right from the start.

## 🛠️ Tech Stack & Deployment

- **Frontend**: React (Vite), TypeScript, vanilla CSS, `@dnd-kit`. Hosted on **Vercel**.
- **Backend**: Python (FastAPI), Google OAuth & JWT Authentication. Hosted on **Render** (with automatic ping to prevent cold starts).
- **Database**: **PostgreSQL** hosted via **Neon DB**.
- **Extension**: Chrome Extension Manifest V3. Distributed via ZIP to bypass web store fees.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [Python 3.10+](https://www.python.org/)

### 2. Backend Setup
1. Navigate to the `backend/` directory.
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_secret
   JWT_SECRET=your_secret_key
   DATABASE_URL=postgresql://user:password@neon.hostname/dbname
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` folder from this project.
4. Ensure the frontend is running at `http://localhost:5173`.

---

## 🏗️ Project Structure

```text
Blinky/
├── backend/            # FastAPI server & database
├── frontend/           # React component-based web app
├── extension/          # Chrome extension source
└── blinky_favicon.png  # Project branded assets
```

## 📜 License
MIT
