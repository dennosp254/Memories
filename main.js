// ==========================
// Cloudinary Config Rotation
// ==========================
const cloudConfigs = [
  { cloudName: "dpmqdvjd4", uploadPreset: "preset1" },
  { cloudName: "dhjkphmcc", uploadPreset: "preset2" },
  { cloudName: "daopbbecd", uploadPreset: "preset3" },
  { cloudName: "doapknktp", uploadPreset: "preset4" },
];

function getSelectedConfig() {
  let index = parseInt(localStorage.getItem("cloudIndex")) || 0;
  localStorage.setItem("cloudIndex", index + 1);
  return cloudConfigs[index % cloudConfigs.length];
}

// ==========================
// Upload Modal Controls
// ==========================
function openUploadOptions() {
  document.getElementById("uploadModal").style.display = "flex";
}

function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
}

function triggerCamera() {
  console.log("Camera triggered...");
  closeUploadModal();
  document.getElementById("cameraInput").click();
}

function triggerGallery() {
  console.log("Gallery triggered...");
  closeUploadModal();
  document.getElementById("galleryInput").click();
}

// ==========================
// File Upload & Preview
// ==========================
async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  console.log("Selected Files:", files);

  if (files.length === 0) {
    alert("No files selected!");
    return;
  }

  let previewContainer = document.getElementById("previewContainer");
  if (!previewContainer) {
    previewContainer = document.createElement("div");
    previewContainer.id = "previewContainer";
    Object.assign(previewContainer.style, {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
      flexWrap: "wrap"
    });
    const parent = document.querySelector(".hero") || document.body;
    parent.appendChild(previewContainer);
  }

  previewContainer.innerHTML = '';

  const selectedConfig = getSelectedConfig();
  const uploads = JSON.parse(localStorage.getItem('uploads') || "[]");

  for (const file of files) {
    const fileType = file.type.startsWith("video/") ? "video" : "image";
    let previewEl = document.createElement(fileType === "image" ? "img" : "video");

    previewEl.src = URL.createObjectURL(file);
    if (fileType === "video") previewEl.controls = true;

    Object.assign(previewEl.style, {
      width: "120px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      objectFit: "cover"
    });

    previewEl.classList.add("rotating");
    previewContainer.appendChild(previewEl);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", selectedConfig.uploadPreset);

    try {
      const resourceType = fileType === "video" ? "video" : "image";
      const uploadUrl = `https://api.cloudinary.com/v1_1/${selectedConfig.cloudName}/${resourceType}/upload`;

      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();

      uploads.push(data.secure_url);
      localStorage.setItem("uploads", JSON.stringify(uploads));

      previewEl.src = data.secure_url;
    } catch (err) {
      console.error("Upload failed for", file.name, err);
      alert(`Failed to upload ${file.name}`);
    } finally {
      previewEl.classList.remove("rotating");
    }
  }

  // Redirect after upload
  setTimeout(() => {
    window.location.href = "gallery.html";
  }, 2000);
}

// ==========================
// Lightbox Functionality
// ==========================
let currentIndex = 0;
let images = [];

function openLightbox(index) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-image");
  const lightboxVideo = document.getElementById("lightbox-video");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!lightbox || !lightboxImg || !lightboxVideo || !downloadBtn) {
    console.error("Lightbox elements missing!");
    return;
  }

  if (images.length === 0) {
    console.error("No images found for Lightbox!");
    return;
  }

  currentIndex = index;
  const selectedMedia = images[currentIndex];
  lightbox.classList.add("active");

  if (selectedMedia.dataset.type === "video") {
    lightboxVideo.src = selectedMedia.src;
    lightboxVideo.style.display = "block";
    lightboxImg.style.display = "none";
  } else {
    lightboxImg.src = selectedMedia.src;
    lightboxImg.style.display = "block";
    lightboxVideo.style.display = "none";
  }

  downloadBtn.href = selectedMedia.src;
  downloadBtn.download = `gallery-${currentIndex}.jpg`;
  downloadBtn.style.display = "block";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("active");
  document.getElementById("downloadBtn").style.display = "none";
}

function prevImage() {
  if (images.length === 0) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  openLightbox(currentIndex);
}

function nextImage() {
  if (images.length === 0) return;
  currentIndex = (currentIndex + 1) % images.length;
  openLightbox(currentIndex);
}

// ==========================
// DOMContentLoaded Setup
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Set upload inputs to accept multiple files
  const cameraInput = document.getElementById('cameraInput');
  const galleryInput = document.getElementById('galleryInput');

  if (cameraInput) {
    cameraInput.setAttribute('multiple', '');
    cameraInput.addEventListener('change', handleFileSelect);
  }

  if (galleryInput) {
    galleryInput.setAttribute('multiple', '');
    galleryInput.addEventListener('change', handleFileSelect);
  }

  // Lightbox setup
  images = Array.from(document.querySelectorAll(".row img, .row video"));
  images.forEach((media, index) => {
    media.addEventListener("click", () => openLightbox(index));
  });

  // Swipe Support
  const lightbox = document.getElementById("lightbox");
  let startX = 0;

  if (lightbox) {
    lightbox.addEventListener("touchstart", (event) => {
      startX = event.touches[0].clientX;
    });

    lightbox.addEventListener("touchend", (event) => {
      let endX = event.changedTouches[0].clientX;
      if (startX - endX > 50) nextImage();
      else if (endX - startX > 50) prevImage();
    });
  }
});
