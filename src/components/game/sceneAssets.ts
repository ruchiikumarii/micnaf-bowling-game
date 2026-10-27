import * as THREE from "three";
import { SCENE } from "@/lib/brand";
import { PIN_HEIGHT, PIN_MAX_RADIUS, PIN_PROFILE } from "@/lib/laneLayout";

/** Deterministic PRNG so the lane looks identical on every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { c, ctx };
}

/** Maple lane boards with grain, running along the lane (canvas y axis). */
export function createWoodTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 2048;
  const { c, ctx } = canvas(W, H);
  const rand = mulberry32(39);
  const boards = 26;
  const bw = W / boards;

  for (let b = 0; b < boards; b++) {
    const x0 = b * bw;
    const hue = 29 + rand() * 6;
    const light = 60 + rand() * 9;
    const sat = 58 + rand() * 14;
    ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
    ctx.fillRect(x0, 0, bw + 1, H);

    // Long grain streaks.
    for (let g = 0; g < 14; g++) {
      const gx = x0 + rand() * bw;
      const amp = 0.6 + rand() * 1.6;
      const freq = 0.002 + rand() * 0.006;
      const phase = rand() * Math.PI * 2;
      ctx.strokeStyle = `hsla(${hue - 4} ${sat + 8}% ${light - 18 - rand() * 12}% / ${0.12 + rand() * 0.2})`;
      ctx.lineWidth = 0.6 + rand() * 1.4;
      ctx.beginPath();
      for (let y = 0; y <= H; y += 16) {
        const px = gx + Math.sin(y * freq + phase) * amp;
        if (y === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }

    // Occasional board joints along the length.
    const joints = 1 + Math.floor(rand() * 2);
    for (let j = 0; j < joints; j++) {
      const jy = rand() * H;
      ctx.fillStyle = "rgba(90, 55, 25, 0.35)";
      ctx.fillRect(x0, jy, bw, 1.5);
    }

    // Seam between boards.
    ctx.fillStyle = "rgba(95, 60, 28, 0.45)";
    ctx.fillRect(x0, 0, 1.2, H);
  }

  // Fine speckle so the surface does not look flat under the clearcoat.
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 10;
    img.data[i] = Math.min(255, Math.max(0, img.data[i]! + n));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1]! + n));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2]! + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** Pin skin: white with two red neck stripes (v = height fraction). */
export function createPinTexture(): THREE.CanvasTexture {
  const H = 512;
  const { c, ctx } = canvas(16, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 16, H);
  ctx.fillStyle = SCENE.pinStripe;
  const band = (from: number, to: number) => ctx.fillRect(0, (1 - to) * H, 16, (to - from) * H);
  band(0.655, 0.675);
  band(0.69, 0.71);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Subtle marbling, multiplied with the ball's brand colour. */
export function createBallTexture(seed: number): THREE.CanvasTexture {
  const S = 512;
  const { c, ctx } = canvas(S, S / 2);
  const rand = mulberry32(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S / 2);
  ctx.filter = "blur(6px)";
  for (let i = 0; i < 40; i++) {
    const shade = 200 + Math.floor(rand() * 55);
    ctx.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.25 + rand() * 0.35})`;
    ctx.lineWidth = 6 + rand() * 18;
    ctx.beginPath();
    let x = rand() * S;
    let y = rand() * (S / 2);
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rand() - 0.5) * 160;
      y += (rand() - 0.5) * 90;
      ctx.quadraticCurveTo(x + (rand() - 0.5) * 80, y + (rand() - 0.5) * 80, x, y);
    }
    ctx.stroke();
  }
  ctx.filter = "none";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createPinGeometry(): THREE.LatheGeometry {
  const curve = new THREE.SplineCurve(PIN_PROFILE.map(([h, r]) => new THREE.Vector2(h, r)));
  const dense = curve.getPoints(400);
  const radiusAt = (h: number) => {
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1]!;
      const b = dense[i]!;
      if (h <= b.x) {
        const t = b.x === a.x ? 0 : (h - a.x) / (b.x - a.x);
        return Math.max(0, a.y + (b.y - a.y) * t);
      }
    }
    return 0;
  };

  const N = 90;
  const points: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= N; i++) {
    const h = i / N;
    points.push(new THREE.Vector2(radiusAt(h) * PIN_MAX_RADIUS, h * PIN_HEIGHT));
  }
  return new THREE.LatheGeometry(points, 40);
}

/** Soft falloff across the width (u), for additive neon glow strips. */
export function createGlowTexture(): THREE.CanvasTexture {
  const { c, ctx } = canvas(128, 4);
  const g = ctx.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(0.65, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 4);
  return new THREE.CanvasTexture(c);
}

/** The arena's back wall: deep navy with faint faceted panels. */
export function createArenaWallTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  const rand = mulberry32(11);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#04071a");
  bg.addColorStop(0.6, "#0b1240");
  bg.addColorStop(1, "#141d58");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Faceted triangles, a little lighter or darker than the wall.
  const step = 64;
  for (let y = 0; y < H; y += step) {
    for (let x = -step; x < W; x += step) {
      for (const flip of [0, 1]) {
        const a = rand() * 0.07;
        ctx.fillStyle = rand() < 0.5 ? `rgba(120,140,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
        ctx.beginPath();
        const ox = x + ((y / step) % 2) * (step / 2);
        if (flip) {
          ctx.moveTo(ox, y);
          ctx.lineTo(ox + step, y);
          ctx.lineTo(ox + step / 2, y + step);
        } else {
          ctx.moveTo(ox + step / 2, y + step);
          ctx.lineTo(ox + step * 1.5, y + step);
          ctx.lineTo(ox + step, y);
        }
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Lit sign over a pin deck: a title framed by a ring of LED dots. */
export function createSignTexture(title: string, accent: string, sub?: string): THREE.CanvasTexture {
  const W = 1024;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1a2462");
  bg.addColorStop(1, "#070b26");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // LED dots round the edge.
  ctx.fillStyle = accent;
  for (let x = 18; x < W; x += 28) {
    for (const y of [14, H - 14]) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const done = () => {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  if (!title) {
    // A plain panel: a soft glow band through the middle.
    const glow = ctx.createLinearGradient(0, 0, W, 0);
    glow.addColorStop(0, "rgba(255,255,255,0)");
    glow.addColorStop(0.5, accent);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = glow;
    ctx.fillRect(0, H / 2 - 6, W, 12);
    ctx.globalAlpha = 1;
    return done();
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${sub ? 96 : 112}px "Arial Black", Arial, sans-serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#05081c";
  const y = sub ? H / 2 - 22 : H / 2 + 4;
  ctx.strokeText(title, W / 2, y);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 28;
  ctx.fillStyle = accent;
  ctx.fillText(title, W / 2, y);
  if (sub) {
    ctx.shadowBlur = 0;
    ctx.font = `700 40px Arial, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(sub, W / 2, H / 2 + 62);
  }
  return done();
}
