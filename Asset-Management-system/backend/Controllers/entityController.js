import Entity from "../Models/Entity.js";

/**
 * Create a new entity
 */
export const createEntity = async (req, res, next) => {
  try {
    const { name, code, state, city, address, meta } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "name and code are required" });
    }

    // Check for duplicate entity code
    const existing = await Entity.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Entity with this code already exists" });
    }

    const entity = await Entity.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      state,
      city,
      address,
      meta,
    });

    res.status(201).json({ message: "Entity created", entity });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all entities (optional filter ?active=true/false)
 */
export const getAllEntities = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;

    const entities = await Entity.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ total: entities.length, entities });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single entity by ID
 */
export const getEntityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entity = await Entity.findById(id);
    if (!entity) {
      return res.status(404).json({ message: "Entity not found" });
    }

    res.status(200).json({ entity });
  } catch (err) {
    next(err);
  }
};

/**
 * Update entity
 */
export const updateEntity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If updating code → ensure uniqueness
    if (updates.code) {
      updates.code = updates.code.toUpperCase().trim();

      const existing = await Entity.findOne({
        code: updates.code,
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(409).json({
          message: "Entity with this code already exists",
        });
      }
    }

    const updatedEntity = await Entity.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedEntity) {
      return res.status(404).json({ message: "Entity not found" });
    }

    res.status(200).json({
      message: "Entity updated successfully",
      entity: updatedEntity,
    });
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Entity code must be unique" });
    }
    next(err);
  }
};

/**
 * Soft delete (deactivate) entity
 */
export const deleteEntity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await Entity.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Entity not found" });
    }

    res.status(200).json({
      message: "Entity deactivated",
      entity: updated,
    });
  } catch (err) {
    next(err);
  }
};
