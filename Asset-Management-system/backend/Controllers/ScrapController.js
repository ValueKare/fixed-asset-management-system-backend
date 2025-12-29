// controllers/scrapController.js
import ScrapRequest from "../models/ScrapRequest.js";
import Asset from "../models/Asset.js";

/**
 * 1. Create Scrap Request
 */
export const createScrapRequest = async (req, res) => {
  try {
    const { assetId, reason } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.scrapStatus) {
      return res.status(400).json({ message: "Asset already scrapped" });
    }

    const request = await ScrapRequest.create({
      assetId,
      requestedBy: req.user._id,
      reason
    });

    res.status(201).json({
      message: "Scrap request created successfully",
      request
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 2. Get All Scrap Requests (Admin)
 */
export const getAllScrapRequests = async (req, res) => {
  try {
    const requests = await ScrapRequest.find()
      .populate("assetId")
      .populate("requestedBy", "username email")
      .populate("approvedBy", "username email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. Approve Scrap Request
 */
export const approveScrapRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ScrapRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "approved";
    request.approvedBy = req.user._id;
    request.decisionDate = new Date();
    await request.save();

    // Mark asset as scrapped
    await Asset.findByIdAndUpdate(request.assetId, {
      scrapStatus: true,
      scrapDate: new Date()
    });

    res.json({ message: "Scrap request approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. Reject Scrap Request
 */
export const rejectScrapRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ScrapRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "rejected";
    request.approvedBy = req.user._id;
    request.decisionDate = new Date();
    await request.save();

    res.json({ message: "Scrap request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
