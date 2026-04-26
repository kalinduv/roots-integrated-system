const {
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require('../models/staffModel');

exports.getAllStaff = async (req, res) => {
  try {
    const items = await getAllStaff();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const item = await createStaff(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const item = await getStaffById(req.params.id);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const item = await updateStaff(req.params.id, req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const result = await deleteStaff(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};