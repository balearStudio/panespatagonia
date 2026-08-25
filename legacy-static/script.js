(() => {
  "use strict";

  const BREAD_COUNT = 3;
  const STEP = 26; // degrees between breads on the wheel
  const MOBILE_BREAKPOINT = 860;
  const AUTO_ROTATE_MS = 5200;

  const state = {
    turn: 0,
    auto: true,
    scrolled: false,
    navHover: false,
  };

  const navEl = document.getElementById("mainNav");
  const overlayEl = document.getElementById("navOverlay");
  const heroVideo = document.getElementById("heroVideo");

  const breadMedia = document.getElementById("breadMedia");
  const breadWheel = document.getElementById("breadWheel");
  const textRingInner = document.getElementById("textRingInner");
  const breadCounter = document.getElementById("breadCounter");
  const breadImgs = Array.from(document.querySelectorAll(".bread-img"));
  const breadCopies = Array.from(document.querySelectorAll(".bread-copy"));
  const prevBtn = document.getElementById("prevBread");
  const nextBtn = document.getElementById("nextBread");

  const contactForm = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");

  const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

  function updateNav() {
    const collapsed = isMobile() || (state.scrolled && !state.navHover);
    navEl.classList.toggle("collapsed", collapsed);
  }

  function updateCarousel() {
    const w = window.innerWidth;
    const mobile = isMobile();
    const mediaPx = mobile ? Math.max(240, w - 44) : Math.min(w * 0.42, 540);
    const radius = Math.round(mediaPx * 2.35);
    const textR = Math.round((mobile ? Math.max(240, w - 44) : Math.min(w * 0.5, 720)) * 2.35);

    const n = BREAD_COUNT;
    const turn = state.turn;
    const idx = ((turn % n) + n) % n;
    const wheelRot = -turn * STEP;

    breadWheel.style.transform = `translateZ(${-radius}px) rotateY(${wheelRot}deg)`;
    textRingInner.style.transform = `translateZ(${-textR}px) rotateY(${wheelRot}deg)`;

    for (let k = 0; k < n; k++) {
      const kk = k + n * Math.round((turn - k) / n);
      const front = kk === turn;

      const img = breadImgs[k];
      img.style.transform = `rotateY(${kk * STEP}deg) translateZ(${radius}px)`;
      img.style.opacity = front ? "1" : "0";
      img.style.pointerEvents = front ? "auto" : "none";

      const copy = breadCopies[k];
      copy.style.transform = `rotateY(${kk * STEP}deg) translateZ(${textR}px)`;
      copy.style.opacity = front ? "1" : "0";
      copy.style.pointerEvents = front ? "auto" : "none";
    }

    breadCounter.textContent = `0${idx + 1} / 0${n}`;
  }

  function go(direction) {
    state.turn += direction;
    state.auto = false;
    updateCarousel();
  }

  // -- nav --
  navEl.addEventListener("mouseenter", () => {
    if (!isMobile()) {
      state.navHover = true;
      updateNav();
    }
  });
  navEl.addEventListener("mouseleave", () => {
    state.navHover = false;
    updateNav();
  });
  navEl.addEventListener("click", () => {
    if (isMobile()) {
      overlayEl.classList.add("open");
    }
  });
  overlayEl.addEventListener("click", () => {
    overlayEl.classList.remove("open");
  });

  // -- scroll / resize --
  window.addEventListener("scroll", () => {
    const scrolled = window.scrollY > 40;
    if (scrolled !== state.scrolled) {
      state.scrolled = scrolled;
      updateNav();
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    updateNav();
    updateCarousel();
  });

  // -- carousel controls --
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));

  let touchStartX = null;
  breadMedia.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  breadMedia.addEventListener("touchend", (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    touchStartX = null;
  });

  setInterval(() => {
    if (state.auto) {
      state.turn += 1;
      updateCarousel();
    }
  }, AUTO_ROTATE_MS);

  // -- hero video --
  if (heroVideo) {
    heroVideo.muted = true;
    const playPromise = heroVideo.play();
    if (playPromise) playPromise.catch(() => {});
  }

  // -- contact form --
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitBtn.textContent = "Gracias, te escribimos";
  });

  updateNav();
  updateCarousel();
})();
