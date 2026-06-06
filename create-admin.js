const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const Admin = require('./server/models/Admin');

async function createAdmin() {
    console.log('Connecting to MongoDB on 127.0.0.1:27017...');
    await mongoose.connect('mongodb://127.0.0.1:27017/cgpa_calculator', {
        serverSelectionTimeoutMS: 5000
    });
    
    // Delete old admin if exists
    await Admin.deleteMany({ username: 'admin' });
    
    const admin = await Admin.create({
        username: 'admin',
        email: 'admin@school.edu',
        password: 'password123'
    });
    
    console.log('✅ Admin created successfully!');
    console.log('Username: admin');
    console.log('Password: password123');
    
    mongoose.connection.close();
}

createAdmin().catch(console.error);
