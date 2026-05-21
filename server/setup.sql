-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "fullName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "matricNumber" VARCHAR(50),
    department VARCHAR(100),
    faculty VARCHAR(100),
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user" UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    units INTEGER NOT NULL,
    grade VARCHAR(2) NOT NULL,
    session VARCHAR(50),
    semester VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user" UUID REFERENCES users(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    gpa DECIMAL(3, 2) DEFAULT 0,
    "totalUnits" INTEGER DEFAULT 0,
    "totalPoints" DECIMAL(10, 2) DEFAULT 0,
    "academicStanding" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("user", session, semester)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses("user");
CREATE INDEX IF NOT EXISTS idx_results_user ON results("user");
