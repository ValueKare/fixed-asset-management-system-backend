import Role from "../Models/Role.js";

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({}).select('name description roleType isSystemRole');
    
    res.status(200).json({
      success: true,
      data: roles
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      error: error.message
    });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: role
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch role",
      error: error.message
    });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, roleType, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists"
      });
    }

    // Create new role
    const newRole = new Role({
      name: name.toLowerCase(),
      description,
      roleType,
      permissions,
      isSystemRole: roleType === 'system'
    });

    await newRole.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: error.message
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, roleType, permissions } = req.body;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    // Prevent modification of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify system roles"
      });
    }

    // Check if new name conflicts with existing role
    if (name && name.toLowerCase() !== role.name) {
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: "Role with this name already exists"
        });
      }
    }

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        ...(name && { name: name.toLowerCase() }),
        ...(description !== undefined && { description }),
        ...(roleType && { roleType }),
        ...(permissions && { permissions })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found"
      });
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete system roles"
      });
    }

    await Role.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
      error: error.message
    });
  }
};
