/* scriptdef.js
   - Actualiza el HUD con coordenadas simuladas y estado de transmisión.
   - Respetar prefers-reduced-motion: si está activo, reducir actualizaciones.
*/
(function () {
  "use strict";

  function qs(id) {
    return document.getElementById(id);
  }

  function formatCoord(v) {
    // muestra con 3 decimales
    return (Math.round(v * 1000) / 1000).toFixed(3);
  }

  function generateCoords(t) {
    // coordenadas simuladas basadas en tiempo para tener un valor cambiante
    const seconds = t / 1000;
    const x = Math.sin(seconds * 0.13) * 180; // rango aprox -180..180
    const y = Math.cos(seconds * 0.07) * 90; // rango aprox -90..90
    const z = Math.sin(seconds * 0.19) * 1000; // altitud simulada
    return { x, y, z };
  }

  function updateCoordsNode(node, coords) {
    if (!node) return;
    node.textContent = `${formatCoord(coords.x)} , ${formatCoord(
      coords.y
    )} , ${formatCoord(coords.z)}`;
  }

  function cycleTransmissionState(prev) {
    const states = [
      { label: "ONLINE", hint: "Enlace estable" },
      { label: "WEAK", hint: "Señal débil" },
      { label: "OFFLINE", hint: "Sin enlace" },
    ];
    // rotar aleatoriamente pero no repetir mucho
    const idx = Math.floor(Math.random() * states.length);
    return states[idx];
  }

  function updateTransmissionNode(node, state) {
    if (!node) return;
    node.textContent = state.label + (state.hint ? ` · ${state.hint}` : "");
  }

  // === Gráfica Canvas ===
  function initChart() {
    const canvas = qs("chart-canvas");
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const data = [];
    let lastDrawTime = 0;
    const chartWidth = canvas.width;
    const chartHeight = canvas.height;

    // Generar datos de sensor (simulado: voltaje o temperatura)
    function generateSensorValue(t) {
      const seconds = t / 1000;
      // oscilación suave entre 0-100 (ej. porcentaje de batería o temp normalizada)
      const base = Math.sin(seconds * 0.3) * 30 + 50;
      const noise = (Math.random() - 0.5) * 10;
      return Math.max(0, Math.min(100, base + noise));
    }

    function drawChart(now, value) {
      // Limitar redibujado a cada 80ms para no saturar (prefers-reduced-motion respetado abajo)
      if (now - lastDrawTime < 80) return;
      lastDrawTime = now;

      // Agregar nuevo dato
      data.push(value);
      if (data.length > 70) data.shift(); // mantener últimos 70 puntos

      // Limpiar canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, chartWidth, chartHeight);

      // Dibujar línea de datos
      if (data.length > 1) {
        ctx.strokeStyle = "rgba(108, 211, 255, 0.8)"; // blanco
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();

        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * chartWidth;
          const y = chartHeight - (data[i] / 100) * chartHeight;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Dibujar línea de promedio
      if (data.length > 0) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const avgY = chartHeight - (avg / 100) * chartHeight;

        ctx.strokeStyle = "rgba(255, 230, 215, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, avgY);
        ctx.lineTo(chartWidth, avgY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dibujar punto actual
      if (data.length > 0) {
        const lastX = chartWidth - 2;
        const lastY = chartHeight - (data[data.length - 1] / 100) * chartHeight;
        ctx.fillStyle = "rgba(108, 233, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return { data, drawChart };
  }

  function init() {
    const coordsNode = qs("hud-coords");
    const txNode = qs("hud-tx");
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lastTxChange = 0;
    let txState = { label: "DESCONOCIDA", hint: "" };

    const chart = initChart();

    function tick(now) {
      // ahora en ms
      // actualización de coordenadas: si reduced-motion -> cada 1s, si no cada 200ms
      const coordsInterval = prefersReduced ? 1000 : 200;
      const txInterval = 3500; // cambiar estado de transmisión cada ~3.5s

      if (!tick._lastCoords || now - tick._lastCoords >= coordsInterval) {
        const coords = generateCoords(now);
        updateCoordsNode(coordsNode, coords);
        tick._lastCoords = now;
      }

      if (!lastTxChange || now - lastTxChange >= txInterval) {
        txState = cycleTransmissionState(txState);
        updateTransmissionNode(txNode, txState);
        lastTxChange = now;
      }

      // Actualizar gráfica
      if (chart) {
        const sensorValue =
          50 + Math.sin(now / 2000) * 30 + (Math.random() - 0.5) * 15;
        chart.drawChart(now, Math.max(0, Math.min(100, sensorValue)));
      }

      // request next frame (no heavy work inside)
      requestAnimationFrame(tick);
    }

    // arrancar loop
    requestAnimationFrame(tick);

    // exposición ligera para debugging desde consola
    window._hud = {
      setCoords: (x, y, z) => {
        updateCoordsNode(coordsNode, { x: x || 0, y: y || 0, z: z || 0 });
      },
      setTransmission: (label, hint) => {
        updateTransmissionNode(txNode, {
          label: label || "DESCONOCIDA",
          hint: hint || "",
        });
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

function launchRocket() {
  const rocket = document.getElementById("rocket");

  // Reiniciar animación si se vuelve a pulsar
  rocket.classList.remove("active");
  void rocket.offsetWidth;

  rocket.classList.add("active");
}

function launchSequence() {
  const btn = document.querySelector(".launch-btn");
  const rocket = document.getElementById("rocket");
  const flame = document.getElementById("rocketFlame");

  // Paso 1: Botón tiembla durante 1s
  btn.classList.add("shake");

  setTimeout(() => {
    btn.classList.remove("shake");

    // Paso 2: aparece la llama del cohete
    flame.classList.add("on");

    setTimeout(() => {
      // Paso 3: el cohete despega
      rocket.classList.remove("active");
      void rocket.offsetWidth; // reiniciar animación
      rocket.classList.add("active");

      // La llama desaparece al despegar
      setTimeout(() => {
        flame.classList.remove("on");
      }, 600);
    }, 700);
  }, 1000);
}
