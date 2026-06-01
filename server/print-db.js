const mongoose = require('mongoose');

async function printDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cgpa_calculator');
        console.log('Connected to MongoDB');
        
        // Define schemas
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const CourseSchema = new mongoose.Schema({}, { strict: false });
        
        const User = mongoose.model('User', UserSchema, 'users');
        const Course = mongoose.model('Course', CourseSchema, 'courses');
        
        const users = await User.find({});
        console.log('--- USERS ---');
        console.log(JSON.stringify(users.map(u => ({ id: u._id, name: u.fullName, email: u.email, matric: u.matricNumber })), null, 2));
        
        const courses = await Course.find({});
        console.log('--- COURSES ---');
        console.log(JSON.stringify(courses.map(c => ({ id: c._id, user: c.user, code: c.code, title: c.title, unit: c.unit, grade: c.grade })), null, 2));
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

printDB();
