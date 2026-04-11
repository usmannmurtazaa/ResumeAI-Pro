# 🚀 ResumeAi Pro

<div align="center">
  <img src="public/logo.svg" alt="ResumeAi Pro Logo" width="200" />
  
  <h3>AI-Powered ATS Resume Builder for Modern Job Seekers</h3>
  
  <p>
    <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Firebase-10.7.0-FFCA28?logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/Tailwind-3.4.0-06B6D4?logo=tailwindcss" alt="Tailwind" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" />
  </p>
  
  <p>
    <a href="#-features">Features</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-license">License</a>
  </p>
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [✨ Features](#-features)
- [🎨 Screenshots](#-screenshots)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [🔥 Firebase Setup](#-firebase-setup)
- [🚀 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## 🌟 Overview

**ResumeAi Pro** is a premium, production-ready SaaS application that helps job seekers create professional, ATS-optimized resumes. With AI-powered suggestions, real-time preview, and comprehensive analytics, ResumeAi Pro ensures your resume stands out to both algorithms and hiring managers.

<div align="center">
  <table>
    <tr>
      <td align="center">🎯</td>
      <td align="center">📊</td>
      <td align="center">🤖</td>
      <td align="center">📱</td>
    </tr>
    <tr>
      <td><b>ATS Optimized</b></td>
      <td><b>Real-time Analytics</b></td>
      <td><b>AI Suggestions</b></td>
      <td><b>Fully Responsive</b></td>
    </tr>
  </table>
</div>

---

## ✨ Features

### 🔐 Authentication & Security
| Feature | Description |
|---------|-------------|
| 🔑 Email/Password | Secure email and password authentication |
| 🌐 Google Sign-In | One-click Google authentication |
| 📱 Phone OTP | Phone number verification with OTP |
| 🛡️ Role-Based Access | User and Admin role management |
| 🔒 Firebase Security | Production-ready security rules |

### 📝 Resume Builder
| Feature | Description |
|---------|-------------|
| 📋 Multi-Step Form | 6 comprehensive sections (Personal, Education, Experience, Skills, Projects, Certifications) |
| 🎨 5+ Premium Templates | Modern, Professional, Executive, Creative, Minimal |
| 👁️ Real-time Preview | Live preview as you build |
| 💾 Auto-Save | Automatic saving to Firestore |
| 🔄 Drag & Drop | Reorder sections effortlessly |
| 📤 Multi-Format Export | PDF, DOCX, TXT formats |

### 🤖 ATS Intelligence
| Feature | Description |
|---------|-------------|
| 📊 ATS Score | Real-time compatibility scoring |
| 🔍 Resume Scanner | Upload and analyze existing resumes |
| 💡 Keyword Suggestions | Industry-specific keyword recommendations |
| 📈 Improvement Tips | Actionable suggestions for optimization |
| 📑 Detailed Reports | Comprehensive ATS analysis reports |

### 👤 User Dashboard
| Feature | Description |
|---------|-------------|
| 📁 Resume Management | Create, edit, duplicate, delete resumes |
| 📊 Analytics Overview | Track resume performance |
| 🎯 Quick Actions | Fast access to common tasks |
| 🔔 Notifications | Stay updated on activity |

### 👑 Admin Dashboard
| Feature | Description |
|---------|-------------|
| 👥 User Management | View and manage all users |
| 📈 Platform Analytics | Comprehensive usage statistics |
| 🎨 Template Management | Manage resume templates |
| ⚙️ System Controls | Platform configuration |

### 🎨 UI/UX Excellence
| Feature | Description |
|---------|-------------|
| 🌓 Dark/Light Mode | Theme switching with persistence |
| 🎨 Custom Themes | 6 preset color schemes + custom colors |
| 📱 Fully Responsive | Mobile, tablet, desktop optimized |
| ✨ Smooth Animations | Framer Motion powered transitions |
| 🔲 Glassmorphism | Modern glass-morphism design |
| ⚡ Fast Performance | Optimized loading and rendering |

---

## 🎨 Screenshots

<div align="center">
  <table>
    <tr>
      <td><b>🏠 Landing Page</b></td>
      <td><b>📝 Resume Builder</b></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/400x250/6366f1/ffffff?text=Landing+Page" alt="Landing" /></td>
      <td><img src="https://via.placeholder.com/400x250/8b5cf6/ffffff?text=Resume+Builder" alt="Builder" /></td>
    </tr>
    <tr>
      <td><b>📊 Dashboard</b></td>
      <td><b>🤖 ATS Scanner</b></td>
    </tr>
    <tr>
      <td><img src="https://via.placeholder.com/400x250/ec4899/ffffff?text=Dashboard" alt="Dashboard" /></td>
      <td><img src="https://via.placeholder.com/400x250/10b981/ffffff?text=ATS+Scanner" alt="ATS Scanner" /></td>
    </tr>
  </table>
</div>

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | ![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react) ![React Router](https://img.shields.io/badge/React_Router-6.21-CA4245?logo=reactrouter) |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.17-0055FF?logo=framer) |
| **Backend** | ![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28?logo=firebase) ![Firestore](https://img.shields.io/badge/Firestore-NoSQL-FFCA28?logo=firebase) |
| **Auth** | ![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-Email_|_Google_|_Phone-FFCA28?logo=firebase) |
| **Forms** | ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7.49-EC5990?logo=reacthookform) |
| **Charts** | ![Recharts](https://img.shields.io/badge/Recharts-2.10-22B5BF) |
| **PDF** | ![jsPDF](https://img.shields.io/badge/jsPDF-2.5-FF0000) ![html2canvas](https://img.shields.io/badge/html2canvas-1.4-FF7F50) |
| **Drag & Drop** | ![React DnD](https://img.shields.io/badge/React_DnD-16.0-007AFF) |
| **Icons** | ![React Icons](https://img.shields.io/badge/React_Icons-4.12-E91E63) |
| **Deployment** | ![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?logo=netlify) ![Vercel](https://img.shields.io/badge/Vercel-Ready-000000?logo=vercel) |

</div>

---

## 📦 Installation

### 📋 Prerequisites

- **Node.js** `16.x` or higher
- **npm** or **yarn**
- **Firebase** account
- **Git**

### 🔧 Step-by-Step Setup

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/resumeai-pro.git
cd resumeai-pro
```

#### 2️⃣ Install Dependencies

```bash
npm install
```

#### 3️⃣ Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### 4️⃣ Run Development Server

```bash
npm start
```

Visit `http://localhost:3000` 🎉

---

## 🔥 Firebase Setup

### 1️⃣ Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Enter project name: `resumeai-pro`
4. Follow setup wizard

### 2️⃣ Enable Authentication

```
Authentication → Sign-in methods
├── ✅ Email/Password
├── ✅ Google
└── ✅ Phone
```

### 3️⃣ Create Firestore Database

```
Firestore Database → Create database
├── Start in test mode
└── Choose location
```

### 4️⃣ Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 🚀 Deployment

### 📦 Build for Production

```bash
npm run build
```

### ▲ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 🌐 Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### 🔥 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

---

## 📁 Project Structure

```
resumeai-pro/
├── 📂 public/                 # Static assets
│   ├── 🖼️ favicon.svg
│   ├── 🖼️ logo.svg
│   └── 📄 index.html
│
├── 📂 src/
│   ├── 📂 components/         # React components
│   │   ├── 📂 auth/          # Authentication components
│   │   ├── 📂 dashboard/     # Dashboard components
│   │   ├── 📂 resume/        # Resume builder
│   │   ├── 📂 common/        # Shared components
│   │   └── 📂 ui/            # UI primitives
│   │
│   ├── 📂 contexts/          # React contexts
│   ├── 📂 services/          # Firebase services
│   ├── 📂 utils/             # Utility functions
│   ├── 📂 hooks/             # Custom hooks
│   ├── 📂 pages/             # Page components
│   ├── 📂 layouts/           # Layout components
│   ├── 📂 styles/            # Global styles
│   └── 📄 App.jsx            # Root component
│
├── 📂 functions/             # Firebase Cloud Functions
├── 📄 .env.example           # Environment template
├── 📄 tailwind.config.js     # Tailwind configuration
├── 📄 firebase.json          # Firebase configuration
├── 📄 firestore.rules        # Firestore security rules
├── 📄 storage.rules          # Storage security rules
└── 📄 package.json           # Dependencies
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 📋 Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### ✅ Code Style

- Use **functional components** and **hooks**
- Follow **ESLint** and **Prettier** configuration
- Write **meaningful commit messages**
- Add **comments** for complex logic

### 🐛 Reporting Issues

Use [GitHub Issues](https://github.com/yourusername/resumeai-pro/issues) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Usman Murtaza

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👨‍💻 Author

<div align="center">
  <img src="https://via.placeholder.com/100/6366f1/ffffff?text=UM" alt="Usman Murtaza" width="100" style="border-radius: 50%;" />
  
  <h3>Usman Murtaza</h3>
  <p>Full Stack Developer & UI/UX Enthusiast</p>
  
  <p>
    <a href="https://github.com/usmanmurtaza">
      <img src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" alt="GitHub" />
    </a>
    <a href="https://linkedin.com/in/usmanmurtaza">
      <img src="https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white" alt="LinkedIn" />
    </a>
    <a href="https://usmanmurtaza.dev">
      <img src="https://img.shields.io/badge/Portfolio-6366f1?logo=vercel&logoColor=white" alt="Portfolio" />
    </a>
    <a href="https://twitter.com/usmanmurtaza">
      <img src="https://img.shields.io/badge/Twitter-1DA1F2?logo=twitter&logoColor=white" alt="Twitter" />
    </a>
  </p>
</div>

---

## ⭐ Support

If you find this project helpful, please consider:

- ⭐ **Starring** the repository
- 🐦 **Sharing** on social media
- 💬 **Providing feedback**
- 🐛 **Reporting issues**

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Library
- [Firebase](https://firebase.google.com/) - Backend Platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling Framework
- [Framer Motion](https://www.framer.com/motion/) - Animation Library
- [React Icons](https://react-icons.github.io/react-icons/) - Icon Library
- [Vercel](https://vercel.com/) - Deployment Platform

---

<div align="center">
  <p>Made with ❤️ by <a href="https://usmanmurtaza.netlify.app">Usman Murtaza</a></p>
  
  <p>
    <a href="#-resumeai-pro">Back to Top ↑</a>
  </p>
  
  <br />
  
  <img src="public/logo.svg" alt="ResumeAi Pro" width="150" />
  
  <p>© 2026 ResumeAi Pro. All rights reserved.</p>
</div>