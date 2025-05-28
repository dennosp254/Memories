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

  // Initialize or retrieve the preview container
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

  // Clear previous previews
  previewContainer.innerHTML = '';

  // Display up to two image previews
  files.slice(0, 2).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '100px';
    img.style.borderRadius = '10px';
    img.classList.add('rotating');
    previewContainer.appendChild(img);
  });

  // Retrieve existing uploads from localStorage
  const uploads = JSON.parse(localStorage.getItem('uploads') || "[]");
  const selectedConfig = getSelectedConfig();

  // Upload all selected files
  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", selectedConfig.uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedConfig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Update the preview image if it exists
      const previewImages = previewContainer.querySelectorAll('img');
      const index = files.indexOf(file);
      if (index < 2 && previewImages[index]) {
        previewImages[index].src = data.secure_url;
        previewImages[index].classList.remove('rotating');
      }

      uploads.push(data.secure_url);
      localStorage.setItem('uploads', JSON.stringify(uploads));
      console.log("Uploaded to:", data.secure_url);
    } catch (err) {
      console.error("Upload failed for", file.name, err);
      alert(`Failed to upload ${file.name}`);

      // Remove rotating class if preview exists
      const previewImages = previewContainer.querySelectorAll('img');
      const index = files.indexOf(file);
      if (index < 2 && previewImages[index]) {
        previewImages[index].classList.remove('rotating');
      }
    }
  }

  // Redirect to gallery after a short delay
  setTimeout(() => {
    window.location.href = 'gallery.html';
  }, 1500);
}


// Scroll-Based Aniamation
document.addEventListener("DOMContentLoaded", () => {
  const slideElements = document.querySelectorAll(".slide-in");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.1 }
  );

  slideElements.forEach((el) => observer.observe(el));
});


// Lightbox Functionality

let currentIndex = 0;
let images = [];

document.addEventListener("DOMContentLoaded", () => {
  images = Array.from(document.querySelectorAll(".row img"));

  images.forEach((img, index) => {
    img.addEventListener("click", () => {
      console.log("Clicked:", img.src); // ✅ Debugging step
      openLightbox(index);
    });
  });
});


function openLightbox(index) {
  currentIndex = index;
  document.getElementById("lightbox").classList.add("active");
  document.getElementById("lightbox-image").src = images[currentIndex].src;
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("active");
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  document.getElementById("lightbox-image").src = images[currentIndex].src;
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  document.getElementById("lightbox-image").src = images[currentIndex].src;
}

document.querySelectorAll(".row img").forEach(img => {
  img.addEventListener("click", () => {
    console.log("Clicked:", img.src);
  });
});

// Swipe functionality
let startX = 0;
document.addEventListener("DOMContentLoaded", () => {
  images = Array.from(document.querySelectorAll(".row img"));

  images.forEach((img, index) => {
    img.addEventListener("click", () => openLightbox(index));
  });

  const lightbox = document.getElementById("lightbox");
  
  // Detect touch start
  lightbox.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  });

  // Detect touch end & determine swipe direction
  lightbox.addEventListener("touchend", (event) => {
    let endX = event.changedTouches[0].clientX;
    if (startX - endX > 50) {
      nextImage(); // Swipe left → Next image
    } else if (endX - startX > 50) {
      prevImage(); // Swipe right → Previous image
    }
  });
});

async function saveToLocalStorage(imgUrl) {
  try {
    // Fetch the image and convert it to Blob
    const response = await fetch(imgUrl);
    const blob = await response.blob();

    // Create an object URL for the Blob
    const objectURL = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger download
    const link = document.createElement("a");
    link.href = objectURL;
    link.download = `gallery-image-${currentIndex}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save locally for offline access
    let savedImages = JSON.parse(localStorage.getItem("savedImages") || "[]");
    savedImages.push(imgUrl);
    localStorage.setItem("savedImages", JSON.stringify(savedImages));

  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download the image. Try again.");
  }
}




function openLightbox(index) {
  currentIndex = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-image");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!lightbox || !lightboxImg || !downloadBtn) {
    console.error("Lightbox elements missing!");
    return;
  }

  lightbox.classList.add("active");
  lightboxImg.src = images[currentIndex].src;

  // ✅ Set download attributes WITHOUT leaving lightbox
  downloadBtn.href = images[currentIndex].src;
  downloadBtn.download = `gallery-image-${currentIndex}.jpg`;

  // ✅ Attach click event to store in local storage
  downloadBtn.addEventListener("click", (event) => {
    event.preventDefault(); // Prevent immediate navigation away
    saveToLocalStorage(images[currentIndex].src); // Save image
  });

  downloadBtn.style.display = "block";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("active");
  document.getElementById("downloadBtn").style.display = "none"; // Hide button
}

function prevImage() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  document.getElementById("lightbox-image").src = images[currentIndex].src;
}

function nextImage() {
  currentIndex = (currentIndex + 1) % images.length;
  document.getElementById("lightbox-image").src = images[currentIndex].src;
}


async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const selectedConfig = getSelectedConfig();
  let uploads = JSON.parse(localStorage.getItem('uploads') || "[]");

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", selectedConfig.uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${selectedConfig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      uploads.push(data.secure_url);
      localStorage.setItem("uploads", JSON.stringify(uploads));

      console.log("Uploaded to:", data.secure_url);

      // ✅ Redirect to gallery with image URL
      window.location.href = `gallery.html?uploadedImage=${encodeURIComponent(data.secure_url)}`;

    } catch (err) {
      console.error("Upload failed for", file.name, err);
      alert(`Failed to upload ${file.name}`);
    }
  }
}
