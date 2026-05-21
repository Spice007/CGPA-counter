const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Result = require('./models/Result');
require('dotenv').config({ path: './.env' });

async function migrateData() {
    try {
        console.log('Starting migration from db.json to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cgpa_calculator');
        console.log('✅ Connected to MongoDB');

        const dbPath = path.join(__dirname, 'db.json');
        if (!fs.existsSync(dbPath)) {
            console.error('❌ db.json not found at ' + dbPath);
            process.exit(1);
        }

        const rawData = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(rawData);

        // Map for Old ID -> New Mongo ID
        const userMap = {};

        // Migrate Users
        if (data.users && data.users.length > 0) {
            console.log(`Migrating ${data.users.length} users...`);
            for (const u of data.users) {
                let mongoUser = await User.findOne({ email: u.email });
                if (!mongoUser) {
                    const { _id, id, ...userData } = u; 
                    mongoUser = await User.create(userData); 
                }
                userMap[u.id || u._id] = mongoUser._id;
            }
            console.log('✅ Users migrated');
        }

        // Migrate Courses
        if (data.courses && data.courses.length > 0) {
            console.log(`Migrating ${data.courses.length} courses...`);
            let courseCount = 0;
            for (const c of data.courses) {
                const mongoUserId = userMap[c.user];
                if (mongoUserId) {
                    const exists = await Course.findOne({ 
                        user: mongoUserId, 
                        title: c.title,
                        session: c.session,
                        semester: c.semester
                    });
                    if (!exists) {
                        const { _id, id, user, ...courseData } = c;
                        await Course.create({ ...courseData, user: mongoUserId });
                        courseCount++;
                    }
                }
            }
            console.log(`✅ ${courseCount} new courses migrated`);
        }

        // Migrate Results
        if (data.results && data.results.length > 0) {
            console.log(`Migrating ${data.results.length} results...`);
            let resCount = 0;
            for (const r of data.results) {
                const mongoUserId = userMap[r.user];
                if (mongoUserId) {
                    const exists = await Result.findOne({ user: mongoUserId, session: r.session, semester: r.semester });
                    if (!exists) {
                        const { _id, id, user, ...resData } = r;
                        await Result.create({ ...resData, user: mongoUserId });
                        resCount++;
                    }
                }
            }
            console.log(`✅ ${resCount} results migrated`);
        }

        console.log('\nMigration complete! All historical records are now in MongoDB.');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

migrateData();
