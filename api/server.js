// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary from 'cloudinary';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'messages.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Gallery media fetching from multiple Cloudinary accounts
app.get('/gallery-api', async (req, res) => {
  const cloudAccounts = [
    { cloudName: 'dpmqdvjd4', apiKey: process.env.API_KEY_1, apiSecret: process.env.API_SECRET_1 },
    { cloudName: 'dhjkphmcc', apiKey: process.env.API_KEY_2, apiSecret: process.env.API_SECRET_2 },
    { cloudName: 'daopbbecd', apiKey: process.env.API_KEY_3, apiSecret: process.env.API_SECRET_3 },
    { cloudName: 'doapknktp', apiKey: process.env.API_KEY_4, apiSecret: process.env.API_SECRET_4 },
  ];

  const params = new URLSearchParams({ max_results: 1000, type: 'upload' }).toString();
  let allMedia = [];

  for (const account of cloudAccounts) {
    const apiUrlImage = `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/image?${params}`;
    const apiUrlVideo = `https://api.cloudinary.com/v1_1/${account.cloudName}/resources/video?${params}`;

    try {
      const resImg = await axios.get(apiUrlImage, {
        auth: { username: account.apiKey, password: account.apiSecret },
      });

      if (resImg.data.resources) {
        resImg.data.resources.forEach(media => media.cloud_name = account.cloudName);
        allMedia = allMedia.concat(resImg.data.resources);
      }

      const resVid = await axios.get(apiUrlVideo, {
        auth: { username: account.apiKey, password: account.apiSecret },
      });

      if (resVid.data.resources) {
        resVid.data.resources.forEach(media => media.cloud_name = account.cloudName);
        allMedia = allMedia.concat(resVid.data.resources);
      }

    } catch (err) {
      console.error(`⚠️ Error fetching from ${account.cloudName}:`, err.message);
    }
  }

  res.json({ resources: allMedia });
});

// Admin: Delete media from correct Cloudinary account
app.delete('/api/gallery/:cloudName/:type/:publicId', (req, res) => {
  const { cloudName, type, publicId } = req.params;

  const credentialsMap = {
    dpmqdvjd4: { api_key: process.env.API_KEY_1, api_secret: process.env.API_SECRET_1 },
    dhjkphmcc: { api_key: process.env.API_KEY_2, api_secret: process.env.API_SECRET_2 },
    daopbbecd: { api_key: process.env.API_KEY_3, api_secret: process.env.API_SECRET_3 },
    doapknktp: { api_key: process.env.API_KEY_4, api_secret: process.env.API_SECRET_4 },
  };

  const creds = credentialsMap[cloudName];
  if (!creds) return res.status(400).json({ error: 'Invalid cloudName' });

  cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: creds.api_key,
    api_secret: creds.api_secret,
  });

  cloudinary.v2.uploader.destroy(publicId, { resource_type: type }, (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to delete media' });
    res.json({ message: 'Media deleted', result });
  });
});

// Cloudinary API usage stats endpoint
app.get('/api/cloudinary-usage', async (req, res) => {
  const cloudAccounts = [
    { cloudName: 'dpmqdvjd4', apiKey: process.env.API_KEY_1, apiSecret: process.env.API_SECRET_1 },
    { cloudName: 'dhjkphmcc', apiKey: process.env.API_KEY_2, apiSecret: process.env.API_SECRET_2 },
    { cloudName: 'daopbbecd', apiKey: process.env.API_KEY_3, apiSecret: process.env.API_SECRET_3 },
    { cloudName: 'doapknktp', apiKey: process.env.API_KEY_4, apiSecret: process.env.API_SECRET_4 },
    { cloudName: 'dw7dmvbeb', apiKey: process.env.API_KEY_5, apiSecret: process.env.API_SECRET_5 },

  ];

  const results = [];
  let totalUsage = {
    storage: 0,
    requests: 0,
    bandwidth: 0,
    transformations: 0,
  };

  for (const account of cloudAccounts) {
    cloudinary.v2.config({
      cloud_name: account.cloudName,
      api_key: account.apiKey,
      api_secret: account.apiSecret,
    });

    try {
      const usage = await cloudinary.v2.api.usage();
      const current = {
        cloudName: account.cloudName,
        storage: usage.storage.used / (1024 * 1024), // MB
        requests: usage.requests.usage,
        bandwidth: usage.bandwidth.usage / (1024 * 1024), // MB
        transformations: usage.transformations.usage,
      };

      totalUsage.storage += current.storage;
      totalUsage.requests += current.requests;
      totalUsage.bandwidth += current.bandwidth;
      totalUsage.transformations += current.transformations;

      results.push(current);
    } catch (err) {
      console.error(`Error fetching usage for ${account.cloudName}:`, err.message);
    }
  }

  res.json({ totalUsage, perAccount: results });
});

import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb+srv://nemlicmain22:elishafaith@wedding-memories.jbuq7zj.mongodb.net/?retryWrites=true&w=majority&appName=wedding-memories"

const client = new MongoClient(uri);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("memories");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

connectDB();

// Access messages collection:
app.post('/messages', async (req, res) => {
  const { name, message } = req.body;
  const timestamp = new Date();

  try {
    const collection = db.collection('messages');
    await collection.insertOne({ name, message, timestamp });
    res.status(201).json({ success: true, msg: "Message saved" });
  } catch (err) {
    res.status(500).json({ success: false, msg: "DB Error", error: err });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const collection = db.collection('messages');
    const allMessages = await collection.find().toArray();
    res.json(allMessages);
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error fetching messages" });
  }
});

app.delete('/messages/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidHexObjectId(id)) {
    return res.status(400).json({ success: false, msg: "Invalid message ID" });
  }
  try {
    const messagesCollection = db.collection("messages");
    const result = await messagesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.json({ success: true, msg: "Message deleted" });
    } else {
      res.status(404).json({ success: false, msg: "Message not found" });
    }
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});


// Assuming you have db connected as you do...

app.post('/images', async (req, res) => {
  const { url, name, description } = req.body; // image URL + optional metadata

  if (!url) return res.status(400).json({ success: false, msg: "Image URL required" });

  try {
    const collection = db.collection('images');
    await collection.insertOne({ url, name, description, timestamp: new Date() });
    res.status(201).json({ success: true, msg: "Image saved" });
  } catch (err) {
    res.status(500).json({ success: false, msg: "DB Error", error: err });
  }
});

app.get('/images', async (req, res) => {
  try {
    const collection = db.collection('images');
    const images = await collection.find().sort({ timestamp: -1 }).toArray();
    res.json(images);
  } catch (err) {
    res.status(500).json({ success: false, msg: "DB Error", error: err });
  }
});

app.post('/api/save-media', async (req, res) => {
  const { filename, cloudinaryUrl, imgurUrl, type, timestamp } = req.body;
  try {
    await db.collection("media").insertOne({
      filename,
      cloudinaryUrl,
      imgurUrl,
      type,
      timestamp
    });
    res.status(200).send({ message: "Saved to MongoDB" });
  } catch (err) {
    console.error("MongoDB insert error", err);
    res.status(500).send({ error: "Failed to save to DB" });
  }
});


// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
