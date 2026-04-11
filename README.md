# ATS Resume Builder - Premium Full Stack Application

A modern, professional resume builder with ATS optimization, real-time preview, and comprehensive dashboard features.

## Features

### Authentication & Authorization
- Email/Password signup and login
- Password reset functionality
- Role-based access (User/Admin)
- Secure session management

### User Dashboard
- Create, edit, and delete resumes
- Multiple ATS-friendly templates
- Real-time preview
- PDF export functionality
- Auto-save to Firestore
- Resume scoring system

### Resume Builder
- Multi-step form with 6 sections
- Dynamic field addition/removal
- Drag-and-drop section reordering
- ATS keyword suggestions
- Live preview panel
- Multiple professional templates

### Admin Dashboard
- User management interface
- Analytics and statistics
- Template management
- User suspension/deletion
- Resume count tracking
- Interactive charts

### Design Features
- Modern glassmorphism design
- Dark/Light mode toggle
- Responsive layout (Mobile, Tablet, Desktop)
- Smooth animations with Framer Motion
- Tailwind CSS for styling

## Tech Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **PDF Generation**: jsPDF, html2canvas
- **Charts**: Chart.js, Recharts
- **Drag & Drop**: React DnD
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Firebase account
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ats-resume-builder.git
cd ats-resume-builder