// Check all users in the live Atlas database
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

async function checkUsers() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;
        
        // Check users collection
        const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
        console.log(`📋 Users in database (${users.length} total):`);
        if (users.length === 0) {
            console.log('  ⚠️  NO USERS FOUND - database is empty!');
        } else {
            users.forEach((u, i) => {
                console.log(`  ${i+1}. Email: ${u.email} | Name: ${u.name} | Created: ${u.createdAt}`);
            });
        }

        // Check admins collection
        const admins = await db.collection('admins').find({}, { projection: { password: 0 } }).toArray();
        console.log(`\n🔐 Admins in database (${admins.length} total):`);
        admins.forEach((a, i) => {
            console.log(`  ${i+1}. Username: ${a.username} | Email: ${a.email} | Role: ${a.role}`);
        });

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkUsers();
