/**
 * Animación procedural: de masa a pan, dirigida por el scroll.
 *
 * Todo se dibuja por código en un <canvas>; no hay imágenes ni vídeo.
 * El progreso `p` va de 0 (masa recién amasada) a 1 (pan dorado con sésamo)
 * y controla volumen, color de corteza, brillo, sésamo, vapor y calor.
 */

/* --- utilidades ------------------------------------------------------- */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/** Interpolación suave con arranque y frenada (curva S). */
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Generador pseudoaleatorio determinista: la escena es idéntica en cada carga. */
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const mix = (c1, c2, t) => [
  lerp(c1[0], c2[0], t),
  lerp(c1[1], c2[1], t),
  lerp(c1[2], c2[2], t),
];

const rgba = (c, a = 1) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/* --- paleta ----------------------------------------------------------- */

const DOUGH = [238, 224, 198]; // masa cruda, pálida
const PROOFED = [235, 214, 176]; // fermentada, ligeramente más cálida
const GOLD = [214, 138, 48]; // dorado de horno
const CRUST = [143, 66, 18]; // corteza profunda
const SESAME = [238, 224, 194];

/* --- geometría del pan ------------------------------------------------- */

/**
 * Contorno orgánico del pan. La mitad superior es una cúpula y la inferior
 * casi plana (la base que apoya en la bandeja). `wobble` añade la
 * irregularidad artesanal, que se suaviza a medida que la masa fermenta.
 */
function bunPath(ctx, cx, cy, rx, ryTop, ryBot, wobble) {
  const N = 220;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const s = Math.sin(a);
    const ry = s >= 0 ? ryTop : ryBot;
    const w =
      1 +
      wobble *
        (Math.sin(a * 3 + 0.8) * 0.5 +
          Math.sin(a * 5 + 2.1) * 0.28 +
          Math.sin(a * 2 - 1.4) * 0.22);
    const x = cx + Math.cos(a) * rx * w;
    const y = cy - s * ry * w;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* --- escena ------------------------------------------------------------ */

export function createBreadScene(canvas, { onStage } = {}) {
  const ctx = canvas.getContext('2d');
  const rand = makeRandom(20240607);

  // Posiciones fijas del sésamo sobre la cúpula (coordenadas esféricas).
  const seeds = Array.from({ length: 240 }, () => {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(1 - rand() * 0.95); // 0 = polo superior
    return {
      nx: Math.sin(phi) * Math.cos(theta),
      ny: Math.cos(phi),
      nz: Math.sin(phi) * Math.sin(theta),
      rot: rand() * Math.PI,
      size: 0.85 + rand() * 0.5,
      tint: rand(),
    };
  });

  // Partículas de harina en suspensión durante el amasado.
  const dust = Array.from({ length: 46 }, () => ({
    x: rand(),
    y: rand(),
    r: 0.4 + rand() * 1.6,
    sp: 0.15 + rand() * 0.5,
    ph: rand() * Math.PI * 2,
  }));

  let W = 0;
  let H = 0;
  let dpr = 1;
  let progress = 0; // objetivo, fijado por el scroll
  let eased = 0; // valor suavizado que se dibuja
  let time = 0;
  let lastStage = -1;
  let running = false;
  let rafId = 0;
  let centered = false; // true cuando el pan se muestra solo, sin texto al lado

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* --- capas de dibujo -------------------------------------------- */

  function drawBackground(p, heat, cx, cy) {
    ctx.fillStyle = '#16100b';
    ctx.fillRect(0, 0, W, H);

    // Resplandor del horno: crece al entrar y se atempera al final.
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
    g.addColorStop(0, `rgba(255,146,44,${0.32 * heat + 0.05})`);
    g.addColorStop(0.45, `rgba(190,86,20,${0.14 * heat + 0.02})`);
    g.addColorStop(1, 'rgba(22,16,11,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Luz fría y difusa del obrador al principio.
    const cool = 1 - smoothstep(0.2, 0.5, p);
    if (cool > 0.01) {
      const lx = cx - W * 0.18;
      const ly = H * 0.24;
      const g2 = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.6);
      g2.addColorStop(0, `rgba(214,206,190,${0.1 * cool})`);
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawDust(p) {
    const a = 1 - smoothstep(0.08, 0.34, p);
    if (a <= 0.01) return;
    ctx.save();
    for (const d of dust) {
      const y = (d.y + time * 0.012 * d.sp) % 1;
      const x = d.x + Math.sin(time * 0.5 * d.sp + d.ph) * 0.012;
      ctx.beginPath();
      ctx.arc(x * W, (1 - y) * H, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,235,215,${0.22 * a})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShadow(cx, cy, rx, ryBot, heat) {
    ctx.save();
    const sy = cy + ryBot * 0.92;
    const g = ctx.createRadialGradient(cx, sy, 0, cx, sy, rx * 1.5);
    g.addColorStop(0, `rgba(8,4,2,${0.55 + heat * 0.12})`);
    g.addColorStop(0.6, 'rgba(8,4,2,0.18)');
    g.addColorStop(1, 'rgba(8,4,2,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, sy, rx * 1.45, ryBot * 0.5 + rx * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBody(cx, cy, rx, ryTop, ryBot, wobble, p) {
    // El dorado avanza de fuera hacia dentro y la base queda más pálida.
    const bake = smoothstep(0.5, 0.93, p);
    const proof = smoothstep(0.08, 0.46, p);

    const base = mix(DOUGH, PROOFED, proof);
    const topCol = mix(base, GOLD, clamp(bake * 1.18));
    const edgeCol = mix(topCol, CRUST, clamp(bake * 0.95));
    const heelCol = mix(base, GOLD, clamp(bake * 0.55));

    ctx.save();
    bunPath(ctx, cx, cy, rx, ryTop, ryBot, wobble);
    ctx.clip();

    // Base vertical: corona dorada arriba, base pálida abajo.
    const gv = ctx.createLinearGradient(0, cy - ryTop, 0, cy + ryBot);
    gv.addColorStop(0, rgba(mix(topCol, CRUST, bake * 0.25)));
    gv.addColorStop(0.42, rgba(topCol));
    gv.addColorStop(0.62, rgba(mix(topCol, heelCol, 0.55)));
    gv.addColorStop(1, rgba(mix(heelCol, [90, 52, 24], 0.35 + bake * 0.2)));
    ctx.fillStyle = gv;
    ctx.fillRect(cx - rx * 1.3, cy - ryTop * 1.3, rx * 2.6, (ryTop + ryBot) * 1.6);

    // Volumen: luz principal arriba a la izquierda. Al hornear se atenúa
    // para que el dorado no se lave.
    const gl = ctx.createRadialGradient(
      cx - rx * 0.34,
      cy - ryTop * 0.62,
      rx * 0.05,
      cx - rx * 0.1,
      cy - ryTop * 0.2,
      rx * 1.35
    );
    gl.addColorStop(0, `rgba(255,244,220,${0.3 - bake * 0.22})`);
    gl.addColorStop(0.5, `rgba(255,214,158,${0.06 - bake * 0.04})`);
    gl.addColorStop(1, `rgba(72,32,8,${0.34 + bake * 0.16})`);
    ctx.fillStyle = gl;
    ctx.fillRect(cx - rx * 1.3, cy - ryTop * 1.3, rx * 2.6, (ryTop + ryBot) * 1.6);

    // Manchas suaves: el horno nunca tuesta de forma perfectamente uniforme.
    if (bake > 0.05) {
      const blotch = makeRandom(9137);
      for (let i = 0; i < 9; i++) {
        const bx = cx + (blotch() - 0.5) * rx * 1.7;
        const by = cy - ryTop * (0.15 + blotch() * 0.75);
        const br = rx * (0.16 + blotch() * 0.26);
        const gb = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        gb.addColorStop(0, rgba(CRUST, 0.12 * bake * (0.4 + blotch() * 0.6)));
        gb.addColorStop(1, rgba(CRUST, 0));
        ctx.fillStyle = gb;
        ctx.fillRect(bx - br, by - br, br * 2, br * 2);
      }
    }

    // Oscurecimiento del borde: la corteza siempre tuesta más en el perímetro.
    const ge = ctx.createRadialGradient(cx, cy - ryTop * 0.1, rx * 0.35, cx, cy, rx * 1.08);
    ge.addColorStop(0, 'rgba(0,0,0,0)');
    ge.addColorStop(1, rgba(edgeCol, 0.5 * bake + 0.12));
    ctx.fillStyle = ge;
    ctx.fillRect(cx - rx * 1.3, cy - ryTop * 1.3, rx * 2.6, (ryTop + ryBot) * 1.6);

    ctx.restore();
    return { bake, topCol };
  }

  /** Pliegue característico donde la corona se separa de la base. */
  function drawWaist(cx, cy, rx, ryTop, ryBot, p, bake) {
    const a = smoothstep(0.46, 0.72, p);
    if (a <= 0.01) return;
    const wy = cy + ryBot * 0.06;
    const half = rx * 0.86;

    // Se difumina en los extremos para que no parezca una raya pegada.
    const fade = (color, alpha) => {
      const g = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.28, rgba(color, alpha));
      g.addColorStop(0.72, rgba(color, alpha));
      g.addColorStop(1, rgba(color, 0));
      return g;
    };

    ctx.save();
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - half, wy);
    ctx.quadraticCurveTo(cx, wy + ryBot * 0.34, cx + half, wy);
    ctx.lineWidth = Math.max(1, rx * 0.016);
    ctx.strokeStyle = fade([104, 50, 16], 0.34 * a * (0.4 + bake));
    ctx.stroke();

    // Reborde claro justo encima: la miga que asoma al crecer en el horno.
    ctx.beginPath();
    ctx.moveTo(cx - half * 0.94, wy - rx * 0.024);
    ctx.quadraticCurveTo(cx, wy + ryBot * 0.28, cx + half * 0.94, wy - rx * 0.024);
    ctx.lineWidth = Math.max(1, rx * 0.022);
    ctx.strokeStyle = fade([252, 232, 198], 0.18 * a);
    ctx.stroke();
    ctx.restore();
  }

  function drawSesame(cx, cy, rx, ryTop, p, bake) {
    const a = smoothstep(0.4, 0.56, p);
    if (a <= 0.01) return;

    // Cámara ligeramente elevada: define qué semillas quedan a la vista.
    const camY = 0.62;
    const camZ = 0.78;
    const seedR = rx * 0.019;

    ctx.save();
    for (const s of seeds) {
      const facing = s.ny * camY + s.nz * camZ;
      if (facing <= 0.1) continue;

      const x = cx + s.nx * rx * 0.93;
      const y = cy - s.ny * ryTop * 0.95 + s.nz * ryTop * 0.12;
      const scale = (0.55 + facing * 0.7) * s.size;
      const col = mix(SESAME, [206, 150, 84], bake * (0.35 + s.tint * 0.5));

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.rot + s.nx * 0.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, seedR * scale, seedR * 0.62 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = rgba(col, a * clamp(facing * 1.5));
      ctx.fill();
      // Chispa de brillo en la semilla.
      ctx.beginPath();
      ctx.ellipse(
        -seedR * scale * 0.22,
        -seedR * scale * 0.18,
        seedR * scale * 0.34,
        seedR * scale * 0.2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255,250,236,${a * 0.5 * facing})`;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /** Brillo del huevo batido, ya al final del horneado. */
  function drawSheen(cx, cy, rx, ryTop, p) {
    const a = smoothstep(0.66, 0.94, p);
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const gx = cx - rx * 0.3;
    const gy = cy - ryTop * 0.52;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rx * 0.36);
    g.addColorStop(0, `rgba(255,236,196,${0.24 * a})`);
    g.addColorStop(1, 'rgba(255,236,196,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx * 0.33, ryTop * 0.26, -0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Vapor: cadenas de manchas radiales que se ensanchan y se desvanecen al
   * subir. Con trazos daría cuerdas; así queda vaporoso.
   */
  function drawSteam(cx, cy, rx, ryTop, heat) {
    if (heat <= 0.02) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const PUFFS = 16;
    for (let k = 0; k < 4; k++) {
      const ph = k * 2.1 + 0.4;
      const ox = (k - 1.5) * rx * 0.36;
      const pulse = 0.6 + 0.4 * Math.sin(time * 1.1 + ph);

      for (let i = 0; i < PUFFS; i++) {
        const t = i / (PUFFS - 1); // 0 junto al pan, 1 arriba del todo
        const x = cx + ox + Math.sin(t * 3.4 + time * 0.75 + ph) * rx * 0.2 * t;
        const y = cy - ryTop * 0.78 - t * rx * 1.6;
        const r = rx * (0.07 + t * 0.26);

        // Entra desde abajo, se disipa arriba.
        const alpha = heat * 0.075 * pulse * Math.sin(Math.PI * Math.min(1, t * 1.2));
        if (alpha <= 0.002) continue;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,230,198,${alpha})`);
        g.addColorStop(1, 'rgba(255,230,198,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    ctx.restore();
  }

  function drawVignette(cx, cy) {
    const g = ctx.createRadialGradient(
      cx,
      cy,
      Math.min(W, H) * 0.28,
      cx,
      cy,
      Math.max(W, H) * 0.82
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(8,5,3,0.62)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* --- composición ------------------------------------------------- */

  function render(p) {
    if (!W || !H) return;

    const heat = smoothstep(0.44, 0.62, p) * (1 - smoothstep(0.86, 1, p) * 0.62);
    const proof = smoothstep(0.08, 0.46, p);
    const spring = smoothstep(0.5, 0.74, p); // subida en el horno

    // En pantallas anchas el pan se aparta a la derecha para dejar la columna
    // izquierda al texto; en móvil se centra y se agranda.
    const narrow = W < 860;
    const solo = centered || narrow;

    // La masa arranca como una bola boleada (casi redonda) y acaba como un
    // bollo ancho y bajo: el ancho crece más que el alto.
    const unit = narrow
      ? Math.min(W * 0.78, H * 0.45)
      : Math.min(W * 0.5, H * (centered ? 0.86 : 0.72));
    const rx = unit * 0.34 * lerp(0.74, 0.98, proof) * lerp(1, 1.09, spring);
    const ryTop = unit * 0.34 * lerp(0.54, 0.6, proof) * lerp(1, 1.12, spring);
    const ryBot = ryTop * lerp(0.55, 0.32, proof);
    const wobble = lerp(0.045, 0.012, smoothstep(0.05, 0.55, p));

    const cx = solo ? W * 0.5 : W * 0.68;
    const cy = (solo ? H * 0.47 : H * 0.54) + ryTop * 0.25;

    drawBackground(p, heat, cx, cy);
    drawDust(p);
    drawShadow(cx, cy, rx, ryBot, heat);

    const { bake } = drawBody(cx, cy, rx, ryTop, ryBot, wobble, p);
    drawWaist(cx, cy, rx, ryTop, ryBot, p, bake);
    drawSesame(cx, cy, rx, ryTop, p, bake);
    drawSheen(cx, cy, rx, ryTop, p);
    drawSteam(cx, cy, rx, ryTop, heat);
    drawVignette(cx, cy);
  }

  function reportStage(p) {
    const stage = p < 0.24 ? 0 : p < 0.48 ? 1 : p < 0.76 ? 2 : 3;
    if (stage !== lastStage) {
      lastStage = stage;
      onStage?.(stage);
    }
  }

  function frame() {
    if (!running) return;
    time += 1 / 60;
    // El scroll se persigue con retardo para que el movimiento sea sedoso.
    eased += (progress - eased) * 0.12;
    render(eased);
    rafId = requestAnimationFrame(frame);
  }

  return {
    /** Centra el pan cuando no comparte pantalla con la columna de texto. */
    setCentered(v) {
      centered = !!v;
    },
    resize() {
      resize();
      render(eased);
    },
    setProgress(p) {
      progress = clamp(p);
      reportStage(progress);
    },
    /** Salta al valor exacto sin transición (primer pintado). */
    snap(p) {
      progress = eased = clamp(p);
      reportStage(progress);
      render(eased);
    },
    start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
