// js/astronaut.js
// Astronaut that tracks the mouse with its head and tries to grab when cursor is close
(function () {
  if (typeof window === "undefined") return;

  const astronaut = document.getElementById("astronaut");
  const head = document.getElementById("astronaut-head");
  const headContainer = head?.parentElement;
  const arm = document.getElementById("astronaut-arm");

  if (!astronaut || !headContainer || !arm) return;

  // Configuration
  const GRAB_DISTANCE = 180; // pixels: when to trigger grab animation
  const HEAD_OFFSET_X = 120; // x position of head relative to astronaut body center
  const HEAD_OFFSET_Y = 50; // y position of head relative to astronaut body center
  const MAX_ROTATION = 45; // degrees: max head rotation angle
  const GRAB_COOLDOWN = 800; // ms: cooldown between grabs

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastGrabTime = 0;
  let isReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  // previous mouse Y for detecting vertical movement
  let prevMouseY = mouseY;
  // dynamic offsets applied to head container (px)
  let headOffsetX = 0;
  let headOffsetY = 0;

  // Get astronaut position (center of body)
  function getAstronautCenter() {
    const rect = astronaut.getBoundingClientRect();
    // Astronaut is positioned at bottom-right, roughly centered
    return {
      x: rect.right - 120, // center of body
      y: rect.bottom - 140, // center of body
    };
  }

  // Track mouse position
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // compute vertical delta
    const deltaY = mouseY - prevMouseY;
    prevMouseY = mouseY;

    // Behavior requested:
    // - when mouse moves UP (deltaY < 0) -> head moves a bit LEFT
    // - when mouse moves DOWN (deltaY > 0) -> head moves slightly UP
    // We'll map deltaY to small offsets with smoothing and clamping.
    const factorX = 0.1; // pixels of lateral shift per vertical pixel
    const factorY = 0.1; // pixels of vertical shift per vertical pixel
    const maxX = 5; // max lateral shift
    const maxY = 10; // max vertical shift

    // target offsets based on deltaY
    let targetX = 0;
    let targetY = 0;
    if (deltaY < 0) {
      // moving up -> shift left (negative X)
      targetX = Math.max(-maxX, deltaY * factorX);
    } else if (deltaY > 0) {
      // moving down -> shift up (negative Y)
      targetY = Math.max(-maxY, -deltaY * factorY);
    }

    // smooth interpolation
    headOffsetX = headOffsetX * 0.6 + targetX * 0.4;
    headOffsetY = headOffsetY * 0.6 + targetY * 0.4;

    if (!isReducedMotion) {
      updateHeadRotation();
      checkForGrab();
    }
  });

  // Update head rotation to follow mouse
  function updateHeadRotation() {
    const astronautCenter = getAstronautCenter();

    // Vector from astronaut head to mouse
    const dx = mouseX - astronautCenter.x;
    const dy = mouseY - astronautCenter.y;

    // Angle in radians, then convert to degrees
    // Negate both dx and dy to correct the orientation
    let angle = Math.atan2(-dy, -dx) * (180 / Math.PI);

    // Clamp rotation to MAX_ROTATION in each direction
    angle = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, angle));

    // apply lateral and vertical micro-shifts based on recent vertical motion
    headContainer.style.transform = `translateX(-50%) translate(${headOffsetX.toFixed(
      1
    )}px, ${headOffsetY.toFixed(1)}px) rotate(${angle}deg)`;
  }

  // Check if mouse is close enough to grab
  function checkForGrab() {
    const now = Date.now();
    if (now - lastGrabTime < GRAB_COOLDOWN) return;

    const astronautCenter = getAstronautCenter();
    const distance = Math.hypot(
      mouseX - astronautCenter.x,
      mouseY - astronautCenter.y
    );

    if (distance < GRAB_DISTANCE) {
      triggerGrab();
      lastGrabTime = now;
    }
  }

  // Trigger grab animation
  function triggerGrab() {
    arm.classList.remove("grabbing");
    // Force reflow to restart animation
    void arm.offsetWidth;
    arm.classList.add("grabbing");

    // Remove the class after animation completes
    setTimeout(() => {
      arm.classList.remove("grabbing");
    }, 600);
  }

  // Initialize
  if (!isReducedMotion) {
    updateHeadRotation();
  }

  // Handle prefers-reduced-motion changes
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", (e) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        headContainer.style.transform = "translateX(-50%) rotate(0deg)";
      }
    });
})();
