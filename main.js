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
  setTimeout(() => {
    document.getElementById("cameraInput").click();
  }, 50); // ✅ Short delay ensures click is recognized instantly
  closeUploadModal();
}


function triggerGallery() {
  closeUploadModal();
  document.getElementById("galleryInput").click();
}

// ==========================
// File Upload & Preview
// ==========================
async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return alert("No files selected!");

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

  setTimeout(() => {
    window.location.href = "gallery.html";
  }, 2000);
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
// DOMContentLoaded Setup
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const cameraInput = document.getElementById("cameraInput");
  const galleryInput = document.getElementById("galleryInput");

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
