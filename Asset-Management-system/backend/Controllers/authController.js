import Admin from "../Models/Admin.js";
import Employee from "../Models/Employee.js";
import LoginActivity from "../Models/LoginActivity.js";
import { generateToken } from "../Utils/jwt.js";
import bcrypt from "bcrypt";

export const adminSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if admin already exists
    const existing = await Admin.findOne({
      $or: [{ username }, { email }]
    });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
      isOnline: false,
      lastLogin: null,
      lastLogout: null
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Admin login: lookup by username or email, validate password, set isOnline, create token
export const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Allow login by username OR email
    const admin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    // Verify password (Admin may not be hashed; check both ways)
    const passwordMatch = password === admin.password || 
      await bcrypt.compare(password, admin.password).catch(() => false);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Mark user as online
    admin.isOnline = true;
    admin.lastLogin = new Date();
    await admin.save();

    // Log login activity
    await LoginActivity.create({
      userId: admin._id,
      action: 'login',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.get?.('user-agent') || ''
    });

    // Generate JWT token
    const token = generateToken(
      { id: admin._id, username: admin.username, role: 'admin' },
      '7d'
    );

    // Set HTTP-only cookie and return response
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Employee login: same pattern as admin login
export const employeeLogin = async (req, res) => {
  try {
    const { empId, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Allow login by empId OR email
    const employee = await Employee.findOne({
      $or: [{ empId }, { email }]
    });

    if (!employee) {
      return res.status(401).json({ message: "Employee not found" });
    }

    // Verify password (should be hashed via bcrypt)
    const passwordMatch = await employee.matchPassword(password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Mark user as online
    employee.isOnline = true;
    employee.lastLogin = new Date();
    await employee.save();

    // Log login activity
    await LoginActivity.create({
      userId: employee._id,
      action: 'login',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.get?.('user-agent') || ''
    });

    // Generate JWT token
    const token = generateToken(
      { id: employee._id, empId: employee.empId, role: 'employee' },
      '7d'
    );

    // Set HTTP-only cookie and return response
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Employee login successful",
      token,
      user: {
        id: employee._id,
        empId: employee.empId,
        name: employee.name,
        email: employee.email,
        role: 'employee'
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuthStatus = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  return res.status(200).json({ user: req.user, role: req.user.role });
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      const UserModel = req.user.role === "admin" ? Admin : Employee;
      const user = await UserModel.findById(req.user.id || req.user._id);
      if (user) {
        user.isOnline = false;
        user.lastLogout = new Date();
        await user.save();

        await LoginActivity.create({
          userId: user._id,
          action: 'logout',
          ipAddress: req.ip || req.connection?.remoteAddress || '',
          userAgent: req.get?.('user-agent') || ''
        });
      }
    }

    res.clearCookie('token');
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const activities = await LoginActivity.find({ userId: req.user.id || req.user._id })
      .sort({ timestamp: -1 })
      .limit(50);
    return res.status(200).json({ activities });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOnlineStatus = async (req, res) => {
  try {
    const userId = req.params?.id || (req.user && (req.user.id || req.user._id));
    if (!userId) return res.status(400).json({ message: "Missing user id" });

    let user = await Admin.findById(userId).select("name email username isOnline lastLogin lastLogout");
    let role = "admin";
    if (!user) {
      user = await Employee.findById(userId).select("name email empId isOnline lastLogin lastLogout");
      role = "employee";
    }
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      name: user.name || user.username || user.empId,
      email: user.email,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin,
      lastLogout: user.lastLogout,
      role
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOnlineUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const [onlineAdmins, onlineEmployees] = await Promise.all([
      Admin.find({ isOnline: true }).select("name email username lastLogin"),
      Employee.find({ isOnline: true }).select("name email empId lastLogin")
    ]);

    const allOnlineUsers = [
      ...onlineAdmins.map(u => ({ ...u.toObject(), role: "admin" })),
      ...onlineEmployees.map(u => ({ ...u.toObject(), role: "employee" }))
    ];

    return res.status(200).json({
      count: allOnlineUsers.length,
      users: allOnlineUsers
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
