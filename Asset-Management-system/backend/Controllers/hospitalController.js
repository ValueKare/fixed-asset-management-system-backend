import Hospital from "../Models/Hospital.js";

export const createHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ success: true, hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getHospitals = async (req, res) => {
  const hospitals = await Hospital.find();
  res.json(hospitals);
};


