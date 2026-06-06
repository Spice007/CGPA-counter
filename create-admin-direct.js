const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
    console.log('Connecting directly using MongoClient to 127.0.0.1:27017...');
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    try {
        await client.connect();
        console.log('✅ Connected!');
        
        const db = client.db('cgpa_calculator');
        const admins = db.collection('admins');
        
        // Delete old admin if exists
        await admins.deleteMany({ username: 'admin' });
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Create admin doc matching Admin schema
        const adminDoc = {
            username: 'admin',
            email: 'admin@school.edu',
            password: hashedPassword,
            role: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await admins.insertOne(adminDoc);
        console.log('🎉 Admin user successfully created/reset in database!');
        console.log('Username: admin');
        console.log('Password: password123');
    } catch (err) {
        console.error('❌ Error creating admin user:', err.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

run();
