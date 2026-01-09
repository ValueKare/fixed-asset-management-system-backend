import Employee from "../Models/Employee.js"
import { verifyToken } from "../Utils/jwt.js"
import { sendEmail } from "../Utils/nodemailer.js"
import mongoose from "mongoose";
export const addEmployee = async (req, res, next) => {
    try {
        const {
            name,
            email,
            organizationId,
            hospital,
            department,
            ward,
            role,
            roleId,
            panel,
            parentUserId,
            permissions,
            joinedDate,
            contactNumber
        } = req.body;

        // Validations
        if (!name || !email || !organizationId || !hospital || !department || !roleId || !panel) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, email, organizationId, hospital, department, roleId, panel"
            });
        }

        // Validate hospital exists
        const Hospital = mongoose.model("Hospital");
        const hospitalExists = await Hospital.findById(hospital);
        if (!hospitalExists) {
            return res.status(404).json({
                success: false,
                message: "Hospital not found"
            });
        }

        // Validate department exists
        const Department = mongoose.model("Department");
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        // Validate role exists
        const Role = mongoose.model("Role");
        const roleExists = await Role.findById(roleId);
        if (!roleExists) {
            return res.status(404).json({
                success: false,
                message: "Role not found"
            });
        }

        // Generate userId (sequence)
        const lastEmployee = await Employee.findOne().sort({ userId: -1 });
        const lastUserId = lastEmployee ? parseInt(lastEmployee.userId) : 0;
        const userId = String(lastUserId + 1).padStart(4, '0'); // e.g., "0001", "0002"
        console.log(hospitalExists)
        // Generate empId (organization-hospitalid-department-unique)
        const hospitalCode = hospitalExists.hospitalId || hospitalExists._id.toString().slice(-6);
        const departmentCode = departmentExists.code || departmentExists._id.toString().slice(-4);
        const uniquePart = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        const empId = `${organizationId}-${hospitalCode}-${departmentCode}-${uniquePart}`;

        // Check for duplicate email
        const existingEmployee = await Employee.findOne({
            $or: [
                { email: email.toLowerCase() },
                { empId: empId },
                { userId: userId }
            ]
        });

        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: "Employee with this email, empId, or userId already exists"
            });
        }

        // Generate temporary password
        const temporaryPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
        
        // Create employee
        const employeeDetails = new Employee({
            userId,
            empId,
            name,
            email: email.toLowerCase(),
            password: temporaryPassword,
            organizationId,
            hospital,
            department,
            ward,
            role,
            roleId,
            panel,
            parentUserId,
            permissions: permissions || {},
            joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
            contactNumber,
            resetPasswordRequired: true,
            temporaryPassword: temporaryPassword
        });

        await employeeDetails.save();

        // Send welcome email (with temporary password)
        const emailResult = await sendEmail({
            to: employeeDetails.email,
            subject: "Your Employee Account Created Successfully",
            text: `Hi ${employeeDetails.name},

Welcome to our organization! 

Your employee account has been created successfully.

Login Details:
- Employee ID: ${employeeDetails.empId}
- Email: ${employeeDetails.email}
- Temporary Password: ${temporaryPassword}

IMPORTANT: This is a temporary password. You will be required to change your password upon first login for security reasons.

Please use these credentials to login and set your permanent password.

Best regards,
Admin Team`
        });

        // Check if email was sent successfully
        if (!emailResult.success) {
            console.error("Email failed to send:", emailResult.error);
            // Continue with employee creation even if email fails
        }

        res.status(201).json({
            success: true,
            message: "Employee added successfully",
            data: {
                _id: employeeDetails._id,
                userId: employeeDetails.userId,
                empId: employeeDetails.empId,
                name: employeeDetails.name,
                email: employeeDetails.email,
                organizationId: employeeDetails.organizationId,
                hospital: employeeDetails.hospital,
                role: employeeDetails.role,
                roleId: employeeDetails.roleId,
                panel: employeeDetails.panel,
                status: employeeDetails.status
            }
        });

    } catch (error) {
        console.error("Add Employee Error:", error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Employee with this ${field} already exists`
            });
        }

        next(error);
    }
}

export const getAllEmployees = async (req, res, next) => {
    try {
        const allEmployees = await Employee.find({},
            { password: 0, __v: 0, _id: 0, createdAt: 0, updatedAt: 0 })
        return res.status(200).send(allEmployees)
    } catch (error) {
        next(error)
    }
}

export const getEmployee = async (req, res, next) => {
    try {
        const { token } = req.cookies
        if (token) {
            const { id } = verifyToken(token)
            if (id) {
                const isEmployee = await Employee.findById(id, { password: 0, __v: 0, _id: 0 })
                if (isEmployee) {
                    return res.status(200).send(isEmployee)
                } else {
                    throw new Error("Invalid User Details")
                }
            } else {
                throw new Error("Unknown Token")
            }
        } else {
            throw new Error("Token Not Found")
        }
    } catch (error) {
        next(error)
    }
}

