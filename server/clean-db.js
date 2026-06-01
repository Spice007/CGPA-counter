const mongoose = require('mongoose');

async function cleanDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/cgpa_calculator');
        console.log('Connected to MongoDB');
        
        // Define schemas
        const UserSchema = new mongoose.Schema({}, { strict: false });
        const CourseSchema = new mongoose.Schema({}, { strict: false });
        const ResultSchema = new mongoose.Schema({}, { strict: false });
        
        const User = mongoose.model('User', UserSchema, 'users');
        const Course = mongoose.model('Course', CourseSchema, 'courses');
        const Result = mongoose.model('Result', ResultSchema, 'results');
        
        // Find users to delete
        const usersToDelete = await User.find({ 
            $or: [
                { fullName: /Test/i },
                { email: /test/i }
            ]
        });
        
        const userIds = usersToDelete.map(u => u._id);
        console.log('Deleting users:', usersToDelete.map(u => ({ id: u._id, name: u.fullName, email: u.email })));
        
        if (userIds.length > 0) {
            const userDel = await User.deleteMany({ _id: { $in: userIds } });
            const courseDel = await Course.deleteMany({ user: { $in: userIds } });
            const resultDel = await Result.deleteMany({ user: { $in: userIds } });
            console.log(`Deleted ${userDel.deletedCount} users, ${courseDel.deletedCount} courses, ${resultDel.deletedCount} results.`);
        } else {
            console.log('No test users found.');
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

cleanDB();
