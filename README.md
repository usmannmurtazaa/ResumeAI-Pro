# 🚀 Maniesta CareerOS

<div align="center">
  <img src="public/logo.png" alt="Maniesta Career OS Logo" width="200" />

> An AI-powered resume builder that generates ATS-optimised resumes with customisable templates, AI-driven content suggestions, and one-click export.

**Built by [Usman Murtaza](https://usmanmurtaza.netlify.app)** - Full Stack Developer

[![Live Demo](https://img.shields.io/badge/Live_Demo-maniestacareeros.netlify.app-8b5cf6?style=for-the-badge)](https://maniestacareeros.netlify.app)
[![Portfolio](https://img.shields.io/badge/Portfolio-usmanmurtaza.netlify.app-6366f1?style=for-the-badge)](https://usmanmurtaza.netlify.app)

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=white" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

</div>

---

## 📖 Overview

**Maniesta CareerOS** is a full-stack SaaS application that helps job seekers build professional, ATS-friendly resumes with AI assistance. It combines a multi-step resume editor, AI-driven content suggestions, and a clean preview experience so users can move from a blank page to a ready-to-send resume quickly.

The project was designed and built end-to-end by **[Usman Murtaza](https://usmanmurtaza.netlify.app)** as part of the broader portfolio of products he develops.

---

## ✨ Features

### Resume Builder
- Multi-step editor covering personal details, experience, education, skills, projects, and certifications
- Live preview that updates as you type
- Auto-save to Firestore
- Multiple resume templates with distinct visual styles
- Export to PDF (client-side generation)
- Drag-and-drop reordering of resume sections

### AI Assistance
- AI-driven content suggestions for summaries, bullet points, and skill descriptions
- ATS-focused phrasing prompts
- Suggestions served through a server-side proxy so API keys stay private

### Authentication & Data
- Email/password authentication via Firebase
- Google sign-in via Firebase Auth
- Per-user resume storage in Cloud Firestore
- User dashboard for managing multiple resumes
- Persistent offline cache via Firestore (persistentLocalCache)

### UI/UX
- Responsive layout across mobile, tablet, and desktop
- Dark theme with glassmorphism styling
- Smooth transitions and micro-interactions (Framer Motion)
- Accessible markup and keyboard navigation
- Command palette (⌘K) for quick navigation

---

## 🎬 Live Demo

**[maniestacareeros.netlify.app](https://maniestacareeros.netlify.app)**

The live demo is connected to a Firebase project and supports real sign-up. You can create a free account to explore the resume builder end to end.

---

## 🛠 Tech Stack

### Frontend
| Category | Technology |
|---|---|
| Framework | React 18 |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React + React Icons |
| State Management | Context API + Redux (for complex flows) |
| Drag & Drop | React DnD |
| Notifications | React Hot Toast |
| PDF export | Client-side generation (see `src/utils/pdfGenerator.js`) |

### Backend & Services
| Category | Technology |
|---|---|
| Platform | Firebase (Spark plan) |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| Analytics | Firebase Analytics (GA4) |
| Performance | Firebase Performance Monitoring |
| Remote Config | Firebase Remote Config |
| Messaging | Firebase Cloud Messaging |
| Serverless Functions | Netlify Functions (Stripe, AI proxy, resume helpers) |
| AI | OpenAI API (called through Netlify Functions, not from the browser) |
| Hosting | Netlify |

> **Note on the Spark plan:** this project runs on Firebase's free Spark plan, which does not include Cloud Storage or Cloud Functions. File uploads and server-side logic are handled via Netlify Functions instead. Cloud Firestore is used for all persistent data.

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Firebase project (Spark plan is sufficient)
- A Netlify account (for functions and hosting, if deploying)
- An OpenAI API key, if you enable AI features - keep this key server-side only (in Netlify environment variables), never in the browser

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Usmannmurtazaa/ResumeAI-Pro.git
cd ResumeAI-Pro

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# 4. Start the development server
npm start
```

The app runs at `http://localhost:3000`.

### Environment Variables

Create a `.env` file at the project root with:

```
# Firebase (client-side, safe to expose - these are public identifiers)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Optional Firebase services
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key

# Site URL (for canonical URLs and analytics)
REACT_APP_SITE_URL=https://maniestacareeros.netlify.app
```

> **Server-side secrets (OpenAI API key, Stripe keys, etc.) go in Netlify's environment variables**, not in this file. See `netlify/functions/` for how those are consumed. Refer to `.env.example` for the full list.

---

## 🚀 Deployment

The project is deployed on Netlify.

```bash
# Production build
npm run build

# Deploy to Netlify (with Netlify CLI installed)
netlify deploy --prod
```

---

## 📁 Project Structure

```
ResumeAI-Pro/
├── public/               # Static assets and index.html
├── netlify/
│   └── functions/        # Serverless functions (Stripe, AI proxy, resume helpers)
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/           # siteConfig and route metadata
│   ├── contexts/         # React contexts (auth, theme, settings, notifications, resume)
│   ├── data/             # Static data (blog posts, constants)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route-level pages
│   ├── services/         # Firebase, analytics, storage, export services
│   ├── styles/           # Global CSS and animations
│   ├── utils/            # Helpers (pdfGenerator, atsScoring, validators, formatters)
│   └── App.jsx           # Root component with routes
├── .env.example
├── netlify.toml          # Netlify build, redirects, headers, CSP
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

For larger changes, please open an issue first to discuss the proposal.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright © 2026 Usman Murtaza

---

## 👨‍💻 Author

**Usman Murtaza**  
Full Stack Developer · Creator of the Maniesta ecosystem

- 🌐 Portfolio: [usmanmurtaza.netlify.app](https://usmanmurtaza.netlify.app)
- 💻 GitHub: [github.com/Usmannmurtazaa](https://github.com/Usmannmurtazaa)
- 💼 LinkedIn: [linkedin.com/in/Usmannmurtazaa](https://www.linkedin.com/in/Usmannmurtazaa/)
- 🐦 Twitter/X: [@usman_murtazaa](https://twitter.com/usman_murtazaa)
- ✍️ Dev.to: [dev.to/usmanmurtaza](https://dev.to/usmanmurtaza)

---

<div align="center">

If you find this project useful, please consider starring the repository ⭐

Made with ❤️ by [Usman Murtaza](https://usmanmurtaza.netlify.app)

</div>
