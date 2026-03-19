# Blinky ●

**No mess. No friction.**

Blinky is a minimal, monochromatic bookmark manager designed for speed and focus. Stop losing links in bloated browser folders—organize them into clean, draggable sections and save them with a single click via the Chrome extension.

## ✨ Features

- **Monochromatic Design**: A focused, distraction-free UI that puts your content first.
- **Section-based Organization**: Group your bookmarks into custom categories (e.g., "AI Tools", "Research", "Project Alpha").
- **Drag & Drop**: Effortlessly reorder bookmarks or move them between sections.
- **Instant Save**: Use the Chrome Extension to save the current tab to your "General" section (or any other) in one click.
- **Google Authentication**: Frictionless sign-on—no passwords to remember.
- **Interactive Demo**: New users can explore a guided walkthrough of the core features.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, vanilla CSS, `@dnd-kit` for drag and drop.
- **Backend**: Python (FastAPI), SQLite, JWT Authentication.
- **Extension**: Chrome Extension Manifest V3.

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
