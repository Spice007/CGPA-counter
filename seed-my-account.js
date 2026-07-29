// Seeds YOUR personal account into the live Atlas database
// Also adds googleId field support for future OAuth
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

async function seedMyAccount() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Check if account already exists
        const existing = await users.findOne({ email: 'gideonlastgids@gmail.com' });
        if (existing) {
            console.log('✅ Account already exists for gideonlastgids@gmail.com');
            console.log('   No changes made.');
            return;
        }

        // Hash password once
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Gideon@2025', salt);

        await users.insertOne({
            fullName: 'Oluwanifise',
            email: 'gideonlastgids@gmail.com',
            password: hashedPassword,
            matricNumber: 'SPICE007',
            department: 'Computer Science',
            faculty: 'Science',
            university: '',
            googleId: null,       // reserved for Google OAuth
            authProvider: 'local',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('🎉 Your personal student account has been created on the live database!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Email    : gideonlastgids@gmail.com');
        console.log('  Password : Gideon@2025');
        console.log('  Name     : Oluwanifise');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedMyAccount();
