import mongoose from 'mongoose';
import Admin from './Models/Admin.js';
import Employee from './Models/Employee.js';
import Role from './Models/Role.js';
import bcrypt from 'bcrypt';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/asset-management';

async function seedTestUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Create test roles first
    const adminRole = await Role.findOne({ name: 'admin' });
    let adminRoleId;
    if (!adminRole) {
      const newAdminRole = new Role({
        name: 'admin',
        description: 'Hospital Administrator',
        roleType: 'organization',
        permissions: {
          asset: { view: true, create: true, update: true, transfer: true, scrap_request: true, scrap_approve: true },
          audit: { initiate: true, assign: true, verify: false, submit: false, close: true, view_reports: true },
          maintenance: { log: true, view: true, approve: true },
          user: { create: true, update: true, suspend: true, assign_role: true },
          approval: { asset_transfer: true, procurement: true, scrap: true },
          reports: { asset_utilization: true, maintenance: true, audit: true },
          system: { manage_organizations: false, manage_hospitals: false, view_all_data: false }
        },
        isSystemRole: false
      });
      await newAdminRole.save();
      adminRoleId = newAdminRole._id;
      console.log('Admin role created:', adminRoleId);
    } else {
      adminRoleId = adminRole._id;
      console.log('Admin role already exists:', adminRoleId);
    }

    const employeeRole = await Role.findOne({ name: 'doctor' });
    let employeeRoleId;
    if (!employeeRole) {
      const newEmployeeRole = new Role({
        name: 'doctor',
        description: 'Doctor Employee',
        roleType: 'employee',
        permissions: {
          asset: { view: true, create: false, update: false, transfer: false, scrap_request: true, scrap_approve: false },
          audit: { initiate: false, assign: false, verify: false, submit: false, close: false, view_reports: true },
          maintenance: { log: true, view: true, approve: false },
          user: { create: false, update: false, suspend: false, assign_role: false },
          approval: { asset_transfer: false, procurement: false, scrap: false },
          reports: { asset_utilization: true, maintenance: true, audit: false },
          system: { manage_organizations: false, manage_hospitals: false, view_all_data: false }
        },
        isSystemRole: false
      });
      await newEmployeeRole.save();
      employeeRoleId = newEmployeeRole._id;
      console.log('Employee role created:', employeeRoleId);
    } else {
      employeeRoleId = employeeRole._id;
      console.log('Employee role already exists:', employeeRoleId);
    }

    // Create test admin
    const adminExists = await Admin.findOne({ email: 'testadmin@test.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testAdmin = new Admin({
        username: 'testadmin',
        email: 'testadmin@test.com',
        password: hashedPassword,
        name: 'Test Admin',
        organizationId: 'ORG_001',
        panel: 'admin',
        roleId: adminRoleId,
        isOnline: false
      });
      await testAdmin.save();
      console.log('Test admin created:', testAdmin._id);
    } else {
      console.log('Test admin already exists:', adminExists._id);
    }

    // Create test employee
    const empExists = await Employee.findOne({ email: 'testemp@test.com' });
    if (!empExists) {
      const hashedEmpPassword = await bcrypt.hash('emppass123', 10);
      const testEmployee = new Employee({
        empId: 'EMP001',
        email: 'testemp@test.com',
        password: hashedEmpPassword,
        name: 'Test Employee',
        organizationId: 'ORG_001',
        hospital: new mongoose.Types.ObjectId(), // dummy hospital ID
        department: new mongoose.Types.ObjectId(), // dummy department ID
        role: 'doctor',
        panel: 'doctor',
        roleId: employeeRoleId,
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
