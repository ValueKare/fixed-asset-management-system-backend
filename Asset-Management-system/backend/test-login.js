import mongoose from 'mongoose';
import Admin from './Models/Admin.js';
import Employee from './Models/Employee.js';
import bcrypt from 'bcrypt';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/asset-management';

async function seedTestUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create test admin
    const adminExists = await Admin.findOne({ username: 'testadmin' });
    if (!adminExists) {
      const testAdmin = new Admin({
        username: 'testadmin',
        email: 'testadmin@test.com',
        password: 'password123',
        name: 'Test Admin',
        isOnline: false
      });
      await testAdmin.save();
      console.log('Test admin created:', testAdmin._id);
    } else {
      console.log('Test admin already exists:', adminExists._id);
    }

    // Create test employee
    const empExists = await Employee.findOne({ empId: 'EMP001' });
    if (!empExists) {
      const testEmployee = new Employee({
        empId: 'EMP001',
        email: 'testemp@test.com',
        password: 'emppass123',
        name: 'Test Employee',
        department: 'IT',
        isOnline: false
      });
      await testEmployee.save();
      console.log('Test employee created:', testEmployee._id);
    } else {
      console.log('Test employee already exists:', empExists._id);
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedTestUsers();
