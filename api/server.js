import express from 'express';
import cors from 'cors'; // Import CORS middleware
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins

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
            const response = await axios.get(apiUrl, { auth: { username: account.apiKey, password: account.apiSecret } });
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
