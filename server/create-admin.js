const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Admin = require('./models/Admin');

async function createAdmin() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cgpa_calculator';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        // Delete old admin if exists
        await Admin.deleteMany({ username: 'admin' });

        const admin = await Admin.create({
            username: 'admin',
            email: 'admin@school.edu',
            password: 'password123'
        });

        console.log('✅ Admin created successfully!');
        console.log('   Username: admin');
        console.log('   Password: password123');

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
