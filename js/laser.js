(function () {
  "use strict";

  function makeLaser(x, y) {
    const numRays = 8; // número de rayos en patrón radial

    for (let i = 0; i < numRays; i++) {
      const angle = (360 / numRays) * i; // distribuir ángulos uniformemente

      const beam = document.createElement("div");
      beam.className = "laser-ray";
      beam.style.left = x + "px";
      beam.style.top = y + "px";
      beam.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-18px) scaleY(0.05) scaleX(1)`;
      beam.setAttribute("aria-hidden", "true");
      document.body.appendChild(beam);

      // animación de expansión del rayo
      beam.animate(
        [
          {
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-18px) scaleY(0.05) scaleX(1)`,
            opacity: 1,
          },
          {
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-18px) scaleY(1) scaleX(1)`,
            opacity: 0.98,
          },
        ],
        {
          duration: 220,
          easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
          fill: "forwards",
        }
      );

      // fade out después
      setTimeout(() => {
        beam.animate(
          [
            {
              opacity: 0.98,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-18px) scaleY(1) scaleX(1)`,
            },
            {
              opacity: 0,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-18px) scaleY(1.1) scaleX(1.1)`,
            },
          ],
          {
            duration: 250,
            fill: "forwards",
          }
        );
      }, 220);

      // remover elemento tras animación
      setTimeout(() => {
        if (beam.parentNode) beam.parentNode.removeChild(beam);
      }, 500);
    }
  }

  // click handler on whole document body
  document.addEventListener(
    "click",
    function (e) {
      // ignore clicks on controls (if any)
      const tag = (e.target && e.target.tagName) || "";
      if (["INPUT", "BUTTON", "A", "TEXTAREA", "SELECT"].includes(tag)) return;

      makeLaser(e.clientX, e.clientY);
    },
    { passive: true }
  );
})();
