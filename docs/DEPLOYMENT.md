# Deployment Guide

This guide walks through deploying the Oregon Energy Burden Dashboard to GitHub Pages.

## Initial Setup (One-Time, From Personal Computer)

### Prerequisites

1. **GitHub Account** - Create one at github.com if needed
2. **Git** - Install from git-scm.com
3. **Node.js** - Install version 18+ from nodejs.org (optional, only for local testing)

### Step 1: Create GitHub Repository

1. Go to github.com and sign in
2. Click the **+** icon → **New repository**
3. Name it `oregon-energy-burden-dashboard`
4. Keep it **Public** (required for free GitHub Pages)
5. Do NOT initialize with README (we have one)
6. Click **Create repository**

### Step 2: Upload Project Files

```bash
# Navigate to the project folder
cd oregon-energy-burden-dashboard

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Oregon Energy Burden Dashboard"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/oregon-energy-burden-dashboard.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Click **Save**

### Step 4: Verify Deployment

1. Go to the **Actions** tab in your repository
2. You should see a workflow running
3. Once complete (green checkmark), your site is live at:

```
https://YOUR_USERNAME.github.io/oregon-energy-burden-dashboard/
```

---

## Updating the Dashboard (From Work, No Git Required)

### Option A: Edit Directly on GitHub

1. Go to your repository on GitHub
2. Navigate to `src/App.jsx`
3. Click the **pencil icon** (Edit this file)
4. Make your changes
5. Click **Commit changes**
6. GitHub Actions automatically rebuilds and deploys (takes 1-2 minutes)

### Option B: Upload Updated Files

1. Go to your repository on GitHub
2. Click **Add file** → **Upload files**
3. Drag your updated file(s)
4. Click **Commit changes**
5. GitHub Actions automatically rebuilds and deploys

### Option C: Download, Edit Locally, Re-upload

1. On GitHub, click **Code** → **Download ZIP**
2. Extract and edit files on your computer
3. Upload changed files via **Add file** → **Upload files**

---

## Local Testing (Optional)

If you have Node.js installed and want to test changes before publishing:

```bash
# Install dependencies (first time only)
npm install

# Start local server
npm run dev
```

Open http://localhost:5173 to preview.

---

## Troubleshooting

### "Page not found" after deploy

- Wait 2-5 minutes for GitHub Actions to complete
- Check **Actions** tab for errors
- Verify **Settings → Pages** shows "GitHub Actions" as source

### Workflow fails

- Click on the failed workflow in **Actions** tab
- Read the error message
- Common fix: ensure all files were uploaded correctly

---

For assistance, contact Bret.Farrell@puc.oregon.gov
