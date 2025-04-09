// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  public_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  original_filename: {
    type: String,
    required: true,
  },
  original_filename_lower: {
    type: String,
    required: true, // for case-insensitive search
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  extension: {
    type: String,
  },
  resource_type: {
    type: String,
  },
});

module.exports = mongoose.model('File', fileSchema); 