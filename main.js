const cloudConfigs = [
  { cloudName: "dpmqdvjd4", uploadPreset: "preset1" },
  { cloudName: "dhjkphmcc", uploadPreset: "preset2" },
];

function getSelectedConfig() {
  let index = parseInt(localStorage.getItem("cloudIndex")) || 0;
  localStorage.setItem("cloudIndex", index + 1);
  return cloudConfigs[index % cloudConfigs.length];
}

document.getElementById('cameraInput').setAttribute('multiple', '');
document.getElementById('galleryInput').setAttribute('multiple', '');

function openUploadOptions() {
  document.getElementById("uploadModal").style.display = "flex";
}

function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
}

function triggerCamera() {
  closeUploadModal();
  document.getElementById("cameraInput").click();
}

function triggerGallery() {
  closeUploadModal();
  document.getElementById("galleryInput").click();
}

document.getElementById('cameraInput').addEventListener('change', handleFileSelect);
document.getElementById('galleryInput').addEventListener('change', handleFileSelect);

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  let previewContainer = document.getElementById("previewContainer");
  if (!previewContainer) {
    previewContainer = document.createElement('div');
    previewContainer.id = 'previewContainer';
    previewContainer.style.display = 'flex';
    previewContainer.style.gap = '10px';
    previewContainer.style.marginTop = '20px';

    const parent = document.querySelector('.hero') || document.body;
    parent.appendChild(previewContainer);
  }

  previewContainer.innerHTML = '';
  const uploads = JSON.parse(localStorage.getItem('uploads') || "[]");
  const selectedConfig = getSelectedConfig();

  for (const file of files) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '100px';
    img.style.borderRadius = '10px';
    img.classList.add('rotating');
    previewContainer.appendChild(img);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", selectedConfig.uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedConfig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

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

  setTimeout(() => {
    window.location.href = 'gallery.html';
  }, 1500);
}
