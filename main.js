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
  localStorage.setItem("cloudIndex", (index + 1) % cloudConfigs.length);
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
  if (!isMobile()) {
    alert("Camera access is only supported on mobile devices.");
    return;
  }
  setTimeout(() => {
    document.getElementById("cameraInput").click();
  }, 50);
  closeUploadModal();
}

function triggerGallery() {
  closeUploadModal();
  document.getElementById("galleryInput").click();
}

// ==========================
// File Upload & Preview
// ==========================
let selectedFiles = []; // Store selected files temporarily

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return alert("No files selected!");
  if (files.length > 30) return alert("Please select up to 30 files at a time.");

  selectedFiles = files.map(file => ({ file, selected: true })); // store selection state

  const modal = document.getElementById("previewModal");
  const container = document.getElementById("mediaPreviewContainer");

  if (!modal || !container) return;

  container.innerHTML = '';
  modal.style.display = "flex"; // Show modal

  selectedFiles.forEach((item, index) => {
    const file = item.file;
    const type = file.type.startsWith("video/") ? "video" : "image";
    const el = document.createElement(type === "video" ? "video" : "img");
    el.src = URL.createObjectURL(file);
    if (type === "video") el.controls = true;

    Object.assign(el.style, {
      width: "120px",
      borderRadius: "10px",
      border: "3px solid #28a745",  // show selected border initially
      objectFit: "cover",
      cursor: "pointer",
      opacity: "1"
    });

    // Click to toggle selection
    el.addEventListener("click", () => {
      item.selected = !item.selected;  // toggle state
      el.style.border = item.selected ? "3px solid #28a745" : "3px solid transparent";
      el.style.opacity = item.selected ? "1" : "0.5";
    });

    container.appendChild(el);
  });

  showConfirmUploadButton(); // ensure upload button is visible
}


function closePreviewModal() {
  const modal = document.getElementById("previewModal");
  if (modal) modal.style.display = "none";
}



function showConfirmUploadButton() {
  const btn = document.getElementById("confirmUploadBtn");
  if (btn) {
    btn.style.display = "block";
    btn.onclick = uploadSelectedFiles;
  }
}

async function uploadSelectedFiles() {
  if (!selectedFiles.length) return alert("No files to upload!");

  const selectedConfig = getSelectedConfig();
  const uploads = JSON.parse(localStorage.getItem('uploads') || "[]");

  const previewContainer = document.getElementById("mediaPreviewContainer");
  previewContainer.innerHTML = '';

  for (const item of selectedFiles) {
    if (!item.selected) continue;  // skip unselected files

    const file = item.file;
    const fileType = file.type.startsWith("video/") ? "video" : "image";
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
    } catch (err) {
      console.error("Upload failed for", file.name, err);
      alert(`Failed to upload ${file.name}`);
    }
  }

  // Clean up
  selectedFiles = [];
  previewContainer.innerHTML = '';
  document.getElementById("confirmUploadBtn").style.display = "none";

  closePreviewModal();
  window.location.href = "gallery.html";
}




// ==========================
// Save Media to LocalStorage
// ==========================
async function saveToLocalStorage(mediaUrl, mediaType = "image") {
  try {
    const response = await fetch(mediaUrl);
    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);

    const ext = mediaType === "video" ? "mp4" : "jpg";
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = `gallery-${currentIndex}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const key = "savedMedia";
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    saved.push({ url: mediaUrl, type: mediaType });
    localStorage.setItem(key, JSON.stringify(saved));
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download the media. Try again.");
  }
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
    return console.error("Missing lightbox elements");
  }

  if (images.length === 0) return console.error("No media found");

  currentIndex = index;
  const selected = images[currentIndex];
  const isVideo = selected.tagName.toLowerCase() === "video";
  const type = isVideo ? "video" : "image";

  lightbox.classList.add("active");

  lightboxImg.style.display = isVideo ? "none" : "block";
  lightboxVideo.style.display = isVideo ? "block" : "none";
  lightboxImg.src = isVideo ? "" : selected.src;
  lightboxVideo.src = isVideo ? selected.src : "";

  downloadBtn.href = selected.src;
  downloadBtn.download = `gallery-${currentIndex}.${isVideo ? "mp4" : "jpg"}`;
  downloadBtn.style.display = "block";

  downloadBtn.onclick = (e) => {
    e.preventDefault();
    saveToLocalStorage(selected.src, type);
  };
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
// Utility & Setup
// ==========================
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

document.addEventListener("DOMContentLoaded", () => {
  const cameraInput = document.getElementById("cameraInput");
  const galleryInput = document.getElementById("galleryInput");
  const previewModal = document.getElementById('previewModal');
  const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');

  if (cameraInput) {
    cameraInput.setAttribute("multiple", "");
    cameraInput.addEventListener("change", handleFileSelect);
  }

  if (galleryInput) {
    galleryInput.setAttribute("multiple", "");
    galleryInput.addEventListener("change", handleFileSelect);
  }

  images = Array.from(document.querySelectorAll(".row img, .row video"));
  images.forEach((el, i) => {
    el.dataset.index = i;
    el.addEventListener("click", () => openLightbox(i));
  });

  const lightbox = document.getElementById("lightbox");
  let startX = 0;

  if (lightbox) {
    lightbox.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    lightbox.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) nextImage();
      else if (endX - startX > 50) prevImage();
    });
  }
});
