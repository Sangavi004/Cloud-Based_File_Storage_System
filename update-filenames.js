const mongoose = require('mongoose');
const dotenv = require('dotenv');
const File = require('./models/File');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const files = await File.find({ original_filename_lower: { $exists: false } });

    for (const file of files) {
      file.original_filename_lower = file.original_filename.toLowerCase();
      await file.save();
      console.log(`🛠️ Updated: ${file.original_filename}`);
    }

    console.log('✅ All old files updated!');
    process.exit();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
