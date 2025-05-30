import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Necessary for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS
app.use(cors());

// Serve static files (HTML, CSS, JS, images) from the root folder
app.use(express.static(path.join(__dirname, '..')));

app.get('/gallery-api', async (req, res) => {
  const cloudAccounts = [
    { cloudName: 'dpmqdvjd4', apiKey: process.env.API_KEY_1, apiSecret: process.env.API_SECRET_1 },
    { cloudName: 'dhjkphmcc', apiKey: process.env.API_KEY_2, apiSecret: process.env.API_SECRET_2 },
    { cloudName: 'daopbbecd', apiKey: process.env.API_KEY_3, apiSecret: process.env.API_SECRET_3 },
    { cloudName: 'doapknktp', apiKey: process.env.API_KEY_4, apiSecret: process.env.API_SECRET_4 }
  ];

  const folder = 'gallery';
  const params = new URLSearchParams({ max_results: 100000, type: 'upload' }).toString();
  let allMedia = [];

  for (const account of cloudAccounts) {
    const apiUrlImage = `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/image?${params}`;
    const apiUrlVideo = `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/video?${params}`;

    try {
      // Fetch images
      const responseImage = await axios.get(apiUrlImage, {
        auth: { username: account.apiKey, password: account.apiSecret }
      });

      if (responseImage.data.resources) {
        responseImage.data.resources.forEach(media => media.cloud_name = account.cloudName);
        allMedia = allMedia.concat(responseImage.data.resources);
      }

      // Fetch videos
      const responseVideo = await axios.get(apiUrlVideo, {
        auth: { username: account.apiKey, password: account.apiSecret }
      });

      if (responseVideo.data.resources) {
        responseVideo.data.resources.forEach(media => media.cloud_name = account.cloudName);
        allMedia = allMedia.concat(responseVideo.data.resources);
      }

    } catch (error) {
      console.error(`Error fetching media from ${account.cloudName}:`, error.message);
    }
  }

  res.json({ resources: allMedia });
});

// Fallback to index.html for any unknown routes (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
