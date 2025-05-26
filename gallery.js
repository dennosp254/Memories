export default async function handler(req, res) {
  const cloudAccounts = [
    {
      cloudName: 'dpmqdvjd4',
      apiKey: '293864622867266',
      apiSecret: 'dVpgW-o5cHW6CzGIoYtp6rPJguc',
    },
    {
      cloudName: 'dhjkphmcc',
      apiKey: '566412233268355',
      apiSecret: 'yF5YkkgdEGwvpQuI4u_GpyWtHHA',
    },
  ];

  const folder = 'gallery';
  const queryString = new URLSearchParams({
    max_results: '100000',
    type: 'upload',
    prefix: folder, // Only fetch from the folder
  }).toString();

  const allImages = [];

  for (const account of cloudAccounts) {
    const { cloudName, apiKey, apiSecret } = account;
    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${queryString}`;

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (!response.ok) {
        console.error(`Error from ${cloudName}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data.resources) {
        data.resources.forEach((img) => {
          img.cloud_name = cloudName;
        });

        allImages.push(...data.resources);
      }
    } catch (error) {
      console.error(`Fetch failed for ${cloudName}:`, error.message);
      continue;
    }
  }

  res.status(200).json({ resources: allImages });
}
