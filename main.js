// Cloud configs & rotation (same as before)
const cloudConfigs = [
  { cloudName: "dpmqdvjd4", uploadPreset: "preset1" },
  { cloudName: "dhjkphmcc", uploadPreset: "preset2" },
];

function getSelectedConfig() {
  let index = localStorage.getItem("cloudIndex") || 0;
  index = parseInt(index);
  localStorage.setItem("cloudIndex", index + 1);
  return cloudConfigs[index % cloudConfigs.length];
}

// Update file inputs to accept multiple files
document.getElementById('cameraInput').setAttribute('multiple', '');
document.getElementById('galleryInput').setAttribute('multiple', '');

function openUploadOptions() {
  const choice = confirm("📸 Want to open your camera?\nPress OK for Camera or Cancel for Gallery.");
  if (choice) {
    document.getElementById('cameraInput').click();
  } else {
    document.getElementById('galleryInput').click();
  }
}

document.getElementById('cameraInput').addEventListener('change', handleFileSelect);
document.getElementById('galleryInput').addEventListener('change', handleFileSelect);

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const previewContainer = document.getElementById("previewContainer");
  if (!previewContainer) {
    // Create container if it doesn't exist
    const container = document.createElement('div');
    container.id = 'previewContainer';
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.marginTop = '20px';

    const parent = document.querySelector('.hero') || document.body;
    parent.appendChild(container);
  }

  const previewDiv = document.getElementById('previewContainer');
  previewDiv.innerHTML = ''; // Clear previous previews

  const uploads = JSON.parse(localStorage.getItem('uploads') || "[]");
  const selectedConfig = getSelectedConfig();

  // Upload files one by one
  for (const file of files) {
    // Show preview with rotating animation
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '100px';
    img.style.borderRadius = '10px';
    img.classList.add('rotating');
    previewDiv.appendChild(img);

    // Prepare form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", selectedConfig.uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedConfig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Update preview to the uploaded image URL and remove rotation
      img.src = data.secure_url;
      img.classList.remove('rotating');

      uploads.push(data.secure_url);
      localStorage.setItem('uploads', JSON.stringify(uploads));
      console.log("Uploaded to:", data.secure_url);
    } catch (err) {
      console.error("Upload failed for", file.name, err);
      alert(`Failed to upload ${file.name}`);
      img.classList.remove('rotating');
    }
  }

  // Redirect after all uploads complete (give a small delay to show previews)
  setTimeout(() => {
    window.location.href = 'gallery.html';
  }, 1500);
}
