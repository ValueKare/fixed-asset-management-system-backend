import Hospital from "../Models/Hospital.js";
import Entity from "../Models/Entity.js";
import Counter from "../Models/Counter.js";

export const createHospital = async (req, res) => {
  try {
    const {
      name,
      entityCode,
      location,
      contactEmail,
      phone
    } = req.body;

    // 1. Basic validation
    if (!name || !entityCode || !location || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // 2. Resolve entity by code
    const entity = await Entity.findOne({ code: entityCode.toUpperCase() });

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: "Invalid entity code"
      });
    }

    // 3. Prevent duplicate hospital under same entity
    const existingHospital = await Hospital.findOne({
      name,
      entityId: entity._id
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: "Hospital already exists under this entity"
      });
    }

    // 4. Generate hospitalId (atomic & safe)
    const counter = await Counter.findOneAndUpdate(
      { name: "hospital" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const hospitalId = `HOSP-${String(counter.seq).padStart(4, "0")}`;

    // 5. Create hospital
    const hospital = await Hospital.create({
      hospitalId,
      name,
      entityId: entity._id,
      location,
      contactEmail,
      phone
    });

    // 6. Success response
    return res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      data: hospital
    });

  } catch (err) {
    console.error("Create hospital error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.aggregate([
      // 1. Lookup Buildings (by hospitalId string)
      {
        $lookup: {
          from: "buildings",
          localField: "hospitalId",
          foreignField: "organizationId",
          as: "buildings"
        }
      },

      // 2. Lookup Assets (by hospital ObjectId)
      {
        $lookup: {
          from: "assets",
          localField: "_id",
          foreignField: "hospitalId",
          as: "assets"
        }
      },

      // 3. Add derived fields
      {
        $addFields: {
          buildingsCount: { $size: "$buildings" },
          totalAssets: { $size: "$assets" }
        }
      },

      // 4. Remove lookup arrays (optional but recommended)
      {
        $project: {
          buildings: 0,
          assets: 0
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: hospitals
    });

  } catch (error) {
    console.error("Get hospitals error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const updateHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { name, location, contactEmail, phone } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      {
        ...(name && { name }),
        ...(location && { location }),
        ...(contactEmail && { contactEmail }),
        ...(phone && { phone })
      },
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital updated successfully",
      data: hospital
    });

  } catch (error) {
    console.error("Update hospital error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

