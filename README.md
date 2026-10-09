# SpiceCGPA Pro — Nigerian Academic Calculator

A comprehensive full-stack CGPA Calculator application specifically designed for Nigerian universities, polytechnics, and colleges of education.

🔗 **Live App**: [https://cgpa-counter-itkv.vercel.app](https://cgpa-counter-itkv.vercel.app)
📖 **Help Guide**: [https://cgpa-counter-itkv.vercel.app/help.html](https://cgpa-counter-itkv.vercel.app/help.html)

---

## ✨ Features

- **Nigerian 5-Point Grading System** — Accurate logic for A=5, B=4, C=3, D=2, E=1, F=0
- **Secure Authentication** — JWT-based login/register with bcrypt password hashing
- **Google OAuth** — Sign in with Google in one click
- **Dynamic GPA Calculator** — Add courses, units, and grades with real-time CGPA calculation
- **Session & Semester Management** — Track academic progress across multiple years and semesters
- **Visual Analytics** — Interactive performance charts for progress tracking
- **Academic Planner** — Built-in task manager for assignments and deadlines
- **Course Resources** — Save and organise study links and materials per course
- **Semester Archives** — Full historical view of past semester performance
- **Professional Transcripts** — Generate and download printable academic summaries as PDF
- **Premium UI/UX** — Modern dark mode design with glassmorphism and smooth animations
- **Fully Responsive** — Works seamlessly on desktop, tablet, and mobile

---

## 📚 How to Use

### 1. Getting Started
1. Visit [the signup page](https://cgpa-counter-itkv.vercel.app/signup.html) and create your account — or use **"Continue with Google"** for instant access.
2. Fill in your **Full Name**, **Email**, **Matric Number**, **Faculty**, **Department**, and **Password**.
3. Log in and you'll land on your **Dashboard**.

### 2. Adding Courses
1. Click **"Courses"** in the sidebar.
2. Click **"+ Add Course"**.
3. Enter your **Course Title**, **Course Code**, **Credit Units**, **Grade**, and which **Semester** it belongs to.
4. Click **Save** — your CGPA updates automatically.

### 3. Grading Scale (Nigerian 5-Point System)

| Grade | Points | Score Range | Remark |
|-------|--------|-------------|--------|
| A | 5 | 70 – 100 | Excellent |
| B | 4 | 60 – 69 | Very Good |
| C | 3 | 50 – 59 | Good |
| D | 2 | 45 – 49 | Fair |
| E | 1 | 40 – 44 | Pass |
| F | 0 | 0 – 39 | Fail |

### 4. Academic Standing (5-Point Scale)

| CGPA Range | Classification |
|------------|----------------|
| 4.50 – 5.00 | First Class |
| 3.50 – 4.49 | Second Class Upper |
| 2.40 – 3.49 | Second Class Lower |
| 1.50 – 2.39 | Third Class |
| 1.00 – 1.49 | Pass |
| 0.00 – 0.99 | Fail / Probation |

### 5. Exporting Results
- Click **"Save PDF"** on the Dashboard to download a full academic transcript.

> 📖 **Full User Guide** available at [/help.html](https://cgpa-counter-itkv.vercel.app/help.html)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES6+), Chart.js, html2pdf.js |
| **Admin Client** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose / Atlas) |
| **Auth** | JWT, bcryptjs, Passport.js, Google OAuth 2.0 |
| **Email** | Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB (Local or Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/Spice007/CGPA-counter.git
cd CGPA-counter
```

### 2. Backend Setup
```bash
cd server
npm install
# Create a .env file (see Environment Variables below)
npm run dev
```

### 3. Frontend (Admin Client) Setup
```bash
cd client
npm install
npm run dev
```

### 4. Environment Variables

**`server/.env`:**
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
ADMIN_EMAIL=your_admin_email@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
```

**`client/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Production Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [cgpa-counter-itkv.vercel.app](https://cgpa-counter-itkv.vercel.app) |
| Backend | Render | [cgpa-calculator-backend-a9kj.onrender.com](https://cgpa-calculator-backend-a9kj.onrender.com) |
| Database | MongoDB Atlas | cluster0.38jtmep.mongodb.net |

---

## 📄 License
MIT License — feel free to use and build on this project.

---

*Built with ❤️ for Nigerian students.*
