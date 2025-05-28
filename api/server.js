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
    { cloudName: 'dhjkphmcc', apiKey: process.env.API_KEY_2, apiSecret: process.env.API_SECRET_2 }
  ];

  const folder = 'gallery';
  const params = new URLSearchParams({ max_results: 100000, type: 'upload' }).toString();
  let allImages = [];

  for (const account of cloudAccounts) {
    const apiUrl = `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/image?${params}`;
    try {
      const response = await axios.get(apiUrl, {
        auth: {
          username: account.apiKey,
          password: account.apiSecret
        }
      });
      if (response.data.resources) {
        response.data.resources.forEach(img => img.cloud_name = account.cloudName);
        allImages = allImages.concat(response.data.resources);
      }
    } catch (error) {
      console.error(`Error fetching images from ${account.cloudName}:`, error.message);
    }
  }

  res.json({ resources: allImages });
});

// Fallback to index.html for any unknown routes (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
