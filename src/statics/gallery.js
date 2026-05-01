const gallery = document.getElementById("gallery");
const loader = document.getElementById("loader");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.getElementById("close");

/* Cache to avoid reloading */
const imageCache = new Set();

const preloaded = new Map();

let page = 0;
let loading = false;
let currentIndex = 0;

/* Local images list */
const TOTAL_IMAGES = 20; // number of images in folder
const IMAGES = Array.from(
  { length: TOTAL_IMAGES },
  (_, i) => `/images/gallery/img-${i + 1}.jpeg`,
);

/* Get next batch */
function getImages(batch = 10) {
  const start = page * batch;
  const end = start + batch;
  return IMAGES.slice(start, end);
}

/* Load images */
function loadImages() {
  if (loading) return;
  loading = true;
  loader.style.display = "block";

  setTimeout(() => {
    const images = getImages();

    images.forEach((src, index) => {
      if (imageCache.has(src)) return;

      const card = document.createElement("div");
      card.className = "image-card";

      const img = document.createElement("img");
      img.dataset.src = src;

      card.appendChild(img);
      gallery.appendChild(card);

      observer.observe(img);

      /* Lightbox click */
      card.addEventListener("click", () => {
        openLightbox(index);
      });

      imageCache.add(src);
    });

    page++;
    loading = false;
    loader.style.display = "none";
  }, 500);
}

function preloadImage(index) {
  const src = IMAGES[index];
  if (preloaded.has(src)) return;

  const img = new Image();
  img.src = src;

  preloaded.set(src, img);
}

/* Preload neighbors */
function preloadNeighbors(index) {
  const next = (index + 1) % IMAGES.length;
  const prev = (index - 1 + IMAGES.length) % IMAGES.length;

  preloadImage(next);
  preloadImage(prev);
}

/* Lazy loading */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;

      img.onload = () => {
        img.parentElement.classList.add("visible");
      };

      observer.unobserve(img);
    }
  });
});

/* Infinite scroll */
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadImages();
  }
});

/* Open lightbox with animation */
function openLightbox(index) {
  currentIndex = index;
  const src = IMAGES[index];

  lightbox.style.display = "flex";
  lightboxImg.src = src;

  preloadNeighbors(index);

  // GSAP animation
  gsap.fromTo(
    lightboxImg,
    { scale: 0.8, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" },
  );
}

/* Close */
function closeLightbox() {
  gsap.to(lightboxImg, {
    scale: 0.8,
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      lightbox.style.display = "none";
    },
  });
}

/* Next image */
function nextImage() {
  currentIndex = (currentIndex + 1) % IMAGES.length;
  updateImage();
}

/* Previous image */
function prevImage() {
  currentIndex = (currentIndex - 1 + IMAGES.length) % IMAGES.length;
  updateImage();
}

function updateImage() {
  const newSrc = IMAGES[currentIndex];

  preloadNeighbors(currentIndex);

  gsap.to(lightboxImg, {
    opacity: 0,
    scale: 0.92,
    duration: 0.2,
    onComplete: () => {
      // instant swap (already preloaded)
      lightboxImg.src = newSrc;

      gsap.fromTo(
        lightboxImg,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 0.4 },
      );
    },
  });
}

document.getElementById("close").onclick = closeLightbox;
document.getElementById("next").onclick = nextImage;
document.getElementById("prev").onclick = prevImage;

/* Keyboard navigation */
document.addEventListener("keydown", (e) => {
  if (lightbox.style.display === "flex") {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") closeLightbox();
  }
});

let touchStartX = 0;
let touchEndX = 0;

const SWIPE_THRESHOLD = 50; // minimum distance

lightbox.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const distance = touchEndX - touchStartX;

  if (Math.abs(distance) < SWIPE_THRESHOLD) return;

  if (distance > 0) {
    prevImage(); // swipe right → previous
  } else {
    nextImage(); // swipe left → next
  }
}

lightbox.addEventListener("touchmove", (e) => {
  const currentX = e.changedTouches[0].screenX;
  const diff = currentX - touchStartX;

  gsap.set(lightboxImg, {
    x: diff * 0.3,
  });
});

lightbox.addEventListener("touchend", () => {
  gsap.to(lightboxImg, { x: 0, duration: 0.3 });
});

/* Click outside to close */
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* Initial load */
loadImages();
