# Naija CGPA Pro - Nigerian Academic Calculator

A comprehensive full-stack CGPA Calculator application specifically designed for Nigerian universities, polytechnics, and colleges.

## Features

- **Standard Nigerian 5-Point System**: Accurate logic for A=5, B=4, C=3, D=2, E=1, F=0.
- **Secure Authentication**: JWT-based login/register with password hashing.
- **Dynamic GPA Calculator**: Add courses, units, and grades with real-time GPA preview.
- **Session & Semester Management**: Track academic progress across multiple years.
- **Visual Analytics**: Interactive performance charts using Recharts.
- **Professional Transcripts**: Generate and download printable academic summaries.
- **Premium UI/UX**: Modern glassmorphism design with Dark Mode support and smooth animations.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, React Query, Recharts.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### 1. Backend Setup
```bash
cd server
npm install
# Create .env file based on the provided configuration
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Environment Variables
**Server (.env):**
- `PORT=5000`
- `MONGODB_URI=your_mongodb_uri`
- `JWT_SECRET=your_jwt_secret`

**Client (.env.local):**
- `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

## Academic Classes (5-Point Scale)
- **4.50 - 5.00**: First Class
- **3.50 - 4.49**: Second Class Upper
- **2.40 - 3.49**: Second Class Lower
- **1.50 - 2.39**: Third Class
- **1.00 - 1.49**: Pass
- **0.00 - 0.99**: Probation / Fail

## License
MIT License
