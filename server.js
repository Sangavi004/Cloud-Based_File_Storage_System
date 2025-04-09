// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const mongoose = require('mongoose');
const File = require('./models/File');
const path = require('path');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Cloudinary setup with dynamic resource_type
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isRaw = ['.pdf', '.txt'].includes(ext);

    return {
      folder: 'file_uploads',
      resource_type: isRaw ? 'raw' : 'auto',
      public_id: file.originalname.split('.')[0]
    };
  },
});
const parser = multer({ storage });

// ✅ Upload File
app.post('/upload', parser.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const isRaw = ['.pdf', '.txt'].includes(ext);

    const newFile = new File({
      public_id: file.filename,
      url: file.path,
      original_filename: file.originalname,
      original_filename_lower: file.originalname.toLowerCase(),
      uploadedAt: new Date(),
      extension: ext,
      resource_type: isRaw ? 'raw' : 'auto'
    });

    await newFile.save();
    res.json(newFile);
  } catch (err) {
    console.error('❌ Upload save error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ✅ Get Files (Search + Sort)
app.get('/files', async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const sort = req.query.sort || 'newest';

    let query = {};
    if (search) {
      const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.original_filename_lower = { $regex: new RegExp(escapeRegex(search), 'i') };
    }

    let sortOption = {};
    switch (sort) {
      case 'name_asc':
        sortOption.original_filename = 1;
        break;
      case 'name_desc':
        sortOption.original_filename = -1;
        break;
      case 'oldest':
        sortOption.uploadedAt = 1;
        break;
      default:
        sortOption.uploadedAt = -1;
    }

    const files = await File.find(query).sort(sortOption);
    res.json(files);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch files', details: err });
  }
});

// ✅ Delete File
app.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    console.log('🗑️ Deleting:', publicId);

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    await cloudinary.uploader.destroy(publicId); // fallback for images

    await File.findOneAndDelete({ public_id: publicId });

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Deletion failed', details: err });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running at http://localhost:${PORT}");
});       