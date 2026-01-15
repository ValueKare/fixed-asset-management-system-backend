import Admin from "../Models/Admin.js";
import Employee from "../Models/Employee.js";
import LoginActivity from "../Models/LoginActivity.js";
import { generateToken } from "../Utils/jwt.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Hospital from "../Models/Hospital.js";
import Role from "../Models/Role.js";
export const adminSignup = async (req, res) => {
  try {
    const { username, email, password, panel, organizationId } = req.body;

    if (!username || !password || !panel || !organizationId) {
      return res.status(400).json({ message: "Username, password, panel, and organizationId are required" });
    }

    // Check if admin already exists
    const existing = await Admin.findOne({
      $or: [{ username }, { email }],
      organizationId
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
      role: panel === 'superadmin' ? 'superadmin' : 'admin',
      panel,
      organizationId,
      isOnline: false,
      lastLogin: null,
      lastLogout: null
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        panel: admin.panel,
        organizationId: admin.organizationId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


// User login: authenticate by organizationId/email/password, fetch role permissions, return required structure


export const userLogin = async (req, res) => {
  try {
    const { organizationId, email, password, rememberMe } = req.body;

    // 1️⃣ Basic validation
    if (!organizationId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "organizationId, email, and password are required",
          details: null
        }
      });
    }

    // 2️⃣ Find employee FIRST (important)
    // organizationId is stored in Employee, not Hospital
    const employee = await Employee.findOne({
      email,
      organizationId,
      status: "Active"
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          details: null
        }
      });
    }

    // 3️⃣ Verify password
    const passwordMatch = await bcrypt.compare(password, employee.password || employee.temporaryPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          details: null
        }
      });
    }

    // 4️⃣ Fetch hospital USING employee.hospital
    // Do NOT use organizationId here
    const hospital = await Hospital.findById(employee.hospital);

    if (!hospital) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_ORGANIZATION",
          message: "Hospital not found for this user",
          details: null
        }
      });
    }

    // 5️⃣ Fetch role / panel permissions
    // panel = doctor / nurse / technician
    const roleDoc = await Role.findOne({ name: employee.panel });
    const permissions = roleDoc ? roleDoc.permissions : employee.permissions || {};

    // 6️⃣ Update login status
    await Employee.updateOne(
      { _id: employee._id },
      { isOnline: true, lastLogin: new Date() }
    );

    // 7️⃣ Token expiry logic
    const expiresInSeconds = rememberMe
      ? 60 * 60 * 24 * 30   // 30 days
      : 60 * 60;           // 1 hour

    // 8️⃣ Generate tokens
    const accessToken = generateToken(
      {
        id: employee._id,
        email: employee.email,
        role: employee.role,
        panel: employee.panel,
        hospitalId: hospital._id
      },
      `${expiresInSeconds}s`
    );

    const refreshToken = generateToken(
      {
        id: employee._id,
        type: "refresh"
      },
      `${expiresInSeconds * 2}s`
    );

    // 9️⃣ Final response
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        user: {
          id: employee._id,
          empId: employee.empId,
          name: employee.name,
          email: employee.email,
          role: employee.role,      // authority (hod, cfo)
          panel: employee.panel,    // profession (doctor, nurse)
          department: employee.department || null,
          ward: employee.ward || null,
          permissions
        },
        hospital: {
          id: hospital._id,
          name: hospital.name,
          location: hospital.location,
          contactEmail: hospital.contactEmail
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
        details: null
      }
    });
  }
};
export const login = async (req, res) => {
  try {
    const { organizationId, email, password, rememberMe } = req.body;
    console.log("LOGIN REQUEST BODY:", req.body);
    if (!organizationId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_FIELDS", message: "Required fields missing" }
      });
    }

    let user = null;
    let userType = null;

    // 1️⃣ Try SuperAdmin
    user = await Admin.findOne({
      email,
      organizationId,
      role: "superadmin"
    }).populate("roleId");

    if (user) {
      userType = "admin";
    }
    console.log(user)

    // 2️⃣ Try Hospital Admin
    if (!user) {
      user = await Admin.findOne({
        email,
        organizationId,
        role: "admin",
        hospitalId: { $exists: true }
      }).populate("roleId");
      
      if (user) {
        userType = "admin";
      }
    }
    console.log(user)
    // 3️⃣ Try Employee
    if (!user) {
      user = await Employee.findOne({
        email,
        organizationId,
        status: "Active"
      }).populate("roleId");

      if (user) {
        userType = "employee";
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }
      });
    }

    // 4️⃣ Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }
      });
    }
    // console.log(user);
    const expiresInSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60;

    // 5️⃣ Generate token (same for everyone)
    const accessToken = generateToken(
      {
        sub: user._id.toString(),
        roleId: user.roleId,
        userType,
        organizationId: user.organizationId,
        hospitalId: user.hospitalId || null
      },
      `${expiresInSeconds}s`
    );
    // 5️⃣ Generate token

// 🔒 ENFORCE SINGLE SESSION (NEW)
    user.currentSessionToken = accessToken;
    user.sessionIssuedAt = new Date();
    user.isOnline = true;
    user.lastLogin = new Date();

    await user.save();

    // 6️⃣ Response (frontend needs)
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        expiresIn: expiresInSeconds,
        user: {
          id: user._id,
          email: user.email,
          role: user.roleId.name,     // UI label
          panel: user.panel || null,
          organizationId: user.organizationId,
          hospitalId: user.hospitalId || null
        }
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};


// Superadmin login: lookup by username or email, validate password, set isOnline, create token
// export const superadminLogin = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     if (!password) {
//       return res.status(400).json({ message: "Password is required" });
//     }

//     // Allow login by username OR email
//     const admin = await Admin.findOne({
//       $or: [{ username }, { email }],
//       role: 'superadmin'
//     });

//     if (!admin) {
//       return res.status(401).json({ message: "Superadmin not found" });
//     }

//     // Verify password (Admin may not be hashed; check both ways)
//     const passwordMatch = password === admin.password ||
//       await bcrypt.compare(password, admin.password).catch(() => false);

//     if (!passwordMatch) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     // Generate JWT token with superadmin role
//     const token = generateToken(
//       { id: admin._id, username: admin.username, role: 'superadmin' },
//       '7d'
//     );

//     // Set HTTP-only cookie and return response
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'Lax',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     return res.status(200).json({
//       message: "Superadmin login successful",
//       token,
//       user: {
//         id: admin._id,
//         username: admin.username,
//         email: admin.email,
//         role: 'superadmin',
//         panel: admin.panel,
//         organizationId: admin.organizationId
//       }
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const superadminLogin = async (req, res) => {
  try {
    const { organizationId, email, password, rememberMe } = req.body;

    // 1️⃣ Validate request (same contract as others)
    if (!organizationId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "organizationId, email, and password are required"
        }
      });
    }

    // 2️⃣ Enforce SuperAdmin organization
    if (organizationId !== process.env.AUDIT_COMPANY_ORG_ID) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID_ORGANIZATION",
          message: "SuperAdmin must log in under platform organization"
        }
      });
    }

    // 3️⃣ Find superadmin
    const admin = await Admin.findOne({
      email,
      organizationId,
      role: "superadmin"
    }).populate("roleId");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }
      });
    }

    // 4️⃣ Verify password (bcrypt only)
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }
      });
    }

    // 5️⃣ Token expiry
    const expiresInSeconds = rememberMe
      ? 60 * 60 * 24 * 30
      : 60 * 60;

    // 6️⃣ Generate RBAC-safe JWT
    const accessToken = generateToken(
      {
        sub: admin._id.toString(),
        roleId: admin.roleId,
        userType: "admin",
        organizationId: admin.organizationId,
        hospitalId: null
      },
      `${expiresInSeconds}s`
    );

    const refreshToken = generateToken(
      { sub: admin._id.toString(), type: "refresh" },
      `${expiresInSeconds * 2}s`
    );

    // 7️⃣ Optional cookie
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: expiresInSeconds * 1000
    });

    // 8️⃣ Frontend response (UI needs)
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: "superadmin",          // UI label
          panel: admin.panel,          // UI routing
          organizationId: admin.organizationId
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: error.message }
    });
  }
};

// Admin login: lookup by username or email, validate password, set isOnline, create token
// We have seperate login for superadmins and admins
export const adminLogin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Allow login by username OR email, but only for admin role
    const admin = await Admin.findOne({
      $or: [{ username }, { email }],
      role: 'admin'
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

    // Generate JWT token with admin role
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
        role: 'admin',
        panel: admin.panel,
        organizationId: admin.organizationId
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create Hospital Admin: Superadmin can create hospital admins with permissions
export const createHospitalAdmin = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      panel,
      organizationId,
      hospitalId,
      permissions,
      name
    } = req.body;

    // 1️⃣ Basic validation
    if (!username || !email || !password || !organizationId || !hospitalId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "username, email, password, organizationId, and hospitalId are required",
          details: null
        }
      });
    }

    // 2️⃣ Check if admin already exists
    const existing = await Admin.findOne({
      $or: [{ username }, { email }],
      organizationId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ADMIN_EXISTS",
          message: "Admin with this username or email already exists",
          details: null
        }
      });
    }

    // 3️⃣ Verify hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(400).json({
        success: false,
        error: {
          code: "HOSPITAL_NOT_FOUND",
          message: "Hospital not found",
          details: null
        }
      });
    }

    // 4️⃣ Hash password
    const bcrypt = (await import("bcrypt")).default;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Create hospital admin
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      panel: panel || 'admin',
      organizationId,
      hospitalId,
      permissions: permissions || {},
      name: name || username,
      isOnline: false,
      lastLogin: null,
      lastLogout: null
    });

    // 6️⃣ Return success response
    return res.status(201).json({
      success: true,
      message: "Hospital admin created successfully",
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          panel: admin.panel,
          organizationId: admin.organizationId,
          hospitalId: admin.hospitalId,
          permissions: admin.permissions,
          name: admin.name
        },
        hospital: {
          id: hospital._id,
          name: hospital.name,
          location: hospital.location,
          contactEmail: hospital.contactEmail
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
        details: null
      }
    });
  }
};

// Hospital Admin login: authenticate by organizationId/email/password
export const hospitalAdminLogin = async (req, res) => {
  try {
    const { organizationId, email, password, rememberMe } = req.body;

    // 1️⃣ Basic validation
    if (!organizationId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "organizationId, email, and password are required",
          details: null
        }
      });
    }

    // 2️⃣ Find hospital admin
    const admin = await Admin.findOne({
      email,
      organizationId,
      role: 'admin',
      hospitalId: { $exists: true } // Hospital admin must have hospitalId
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          details: null
        }
      });
    }

    // 3️⃣ Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);


    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          details: null
        }
      });
    }

    // 4️⃣ Get hospital details
    const hospital = await Hospital.findById(admin.hospitalId);
    if (!hospital) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_HOSPITAL",
          message: "Hospital not found",
          details: null
        }
      });
    }

    // 5️⃣ Update login status
    await Admin.updateOne(
      { _id: admin._id },
      { isOnline: true, lastLogin: new Date() }
    );

    // 6️⃣ Token expiry logic
    const expiresInSeconds = rememberMe
      ? 60 * 60 * 24 * 30   // 30 days
      : 60 * 60;           // 1 hour

    // 7️⃣ Generate tokens
    const accessToken = generateToken(
      {
        sub: admin._id.toString(),      // subject (standard JWT claim)
        roleId: admin.roleId,           // 🔑 RBAC anchor
        userType: "admin",              // admin | employee | auditor
        organizationId: admin.organizationId,
        hospitalId: admin.hospitalId || null
      },
      `${expiresInSeconds}s`
    );


    const refreshToken = generateToken(
      {
        id: admin._id,
        type: "refresh"
      },
      `${expiresInSeconds * 2}s`
    );

    // 8️⃣ Final response
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          panel: admin.panel,
          organizationId: admin.organizationId,
          hospitalId: admin.hospitalId
        },
        hospital: {
          id: hospital._id,
          name: hospital.name,
          location: hospital.location,
          contactEmail: hospital.contactEmail
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error.message,
        details: null
      }
    });
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

// Session Validation Endpoint
export const validateSession = async (req, res) => {
  try {
    const { verifyToken } = await import("../Utils/jwt.js");
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "NO_TOKEN", message: "No token provided" }
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Find user and check if current session token matches
    let user = null;
    
    // Check Admin collection
    user = await Admin.findOne({ 
      _id: decoded.sub,
      currentSessionToken: token,
      isOnline: true 
    });
    
    // Check Employee collection if not found in Admin
    if (!user) {
      user = await Employee.findOne({ 
        _id: decoded.sub,
        currentSessionToken: token,
        isOnline: true 
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "SESSION_INVALIDATED", message: "Session invalidated by new login" }
      });
    }

    // Session is valid
    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        isOnline: user.isOnline,
        sessionIssuedAt: user.sessionIssuedAt
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid token" }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: "TOKEN_EXPIRED", message: "Token expired" }
      });
    }

    console.error("Session validation error:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" }
    });
  }
};
