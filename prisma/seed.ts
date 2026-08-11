/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Seed script — creates:
 *   1. the admin user (from ADMIN_USERNAME / ADMIN_PASSWORD env),
 *   2. the v1 product config (24 pages / 4:3 / Rs. 1,500),
 *   3. three sample books, processed through the REAL upload pipeline
 *      (one via PDF, two via canvas-generated JPG pages).
 *
 * Idempotent — safe to run repeatedly.
 *
 * Usage: npm run db:seed
 */
import "dotenv/config";
import { createRequire } from "node:module";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { processBook, type UploadedFile } from "../src/lib/process-book";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import { DEFAULT_PRODUCT_SLUG } from "../src/lib/site";

const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit");

const COLORS = {
  ink: "#2d2a3d",
  white: "#ffffff",
  cream: "#fff6e8",
  sky: "#bfe6ff",
  skyDeep: "#7fc4f0",
  night: "#24324f",
  nightDeep: "#1a2238",
  sun: "#ffd166",
  coral: "#ff7a59",
  coralDark: "#e85d3d",
  teal: "#2aa8a0",
  tealDark: "#1d7f78",
  lilac: "#8b7ec8",
  violet: "#6a5cb0",
  pink: "#ff9eb5",
  pinkDeep: "#e86a8c",
  grass: "#7cc46b",
  grassDark: "#4f9e46",
  yellow: "#ffdf6b",
  brown: "#8a5a2b",
  gold: "#f5b84a",
  star: "#ffe9a3",
};

let fontReady = false;
function setupFonts() {
  if (fontReady) return;
  const candidates: { path: string; name: string }[] = [
    { path: "C:/Windows/Fonts/comicbd.ttf", name: "ComicSansBold" },
    { path: "C:/Windows/Fonts/comic.ttf", name: "ComicSans" },
    { path: "C:/Windows/Fonts/arialbd.ttf", name: "ArialBold" },
    { path: "C:/Windows/Fonts/arial.ttf", name: "Arial" },
    { path: "C:/Windows/Fonts/segoeuib.ttf", name: "SegoeBold" },
    { path: "C:/Windows/Fonts/segoeui.ttf", name: "Segoe" },
  ];
  for (const c of candidates) {
    try {
      GlobalFonts.registerFromPath(c.path, c.name);
    } catch {
      /* font missing — skip */
    }
  }
  fontReady = true;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function wrapText(ctx: any, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sky(ctx: any, W: number, H: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function sun(ctx: any, x: number, y: number, r: number) {
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,214,102,0.35)";
  ctx.beginPath();
  ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx: any, x: number, y: number, s = 1) {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, 34 * s, 0, Math.PI * 2);
  ctx.arc(x + 36 * s, y - 14 * s, 28 * s, 0, Math.PI * 2);
  ctx.arc(x + 74 * s, y, 32 * s, 0, Math.PI * 2);
  ctx.arc(x + 37 * s, y + 12 * s, 30 * s, 0, Math.PI * 2);
  ctx.fill();
}

function hills(ctx: any, W: number, H: number) {
  ctx.fillStyle = COLORS.grass;
  ctx.beginPath();
  ctx.ellipse(W * 0.22, H * 1.02, W * 0.55, H * 0.34, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = COLORS.grassDark;
  ctx.beginPath();
  ctx.ellipse(W * 0.82, H * 1.05, W * 0.6, H * 0.4, 0, Math.PI, 0);
  ctx.fill();
}

function tree(ctx: any, x: number, y: number, s = 1) {
  ctx.fillStyle = COLORS.brown;
  ctx.fillRect(x - 9 * s, y, 18 * s, 70 * s);
  ctx.fillStyle = "#57a84b";
  ctx.beginPath();
  ctx.arc(x, y - 20 * s, 48 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6cbf5e";
  ctx.beginPath();
  ctx.arc(x - 18 * s, y - 6 * s, 30 * s, 0, Math.PI * 2);
  ctx.arc(x + 20 * s, y - 8 * s, 26 * s, 0, Math.PI * 2);
  ctx.fill();
}

function flower(ctx: any, x: number, y: number, color: string, s = 1) {
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 8 * s, y + Math.sin(a) * 8 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.yellow;
  ctx.beginPath();
  ctx.arc(x, y, 7 * s, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: any, x: number, y: number, r: number, color = COLORS.star) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function moon(ctx: any, x: number, y: number, r: number) {
  ctx.fillStyle = "#fff3c9";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.night;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.3, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
}

function dino(ctx: any, x: number, y: number, s = 1) {
  ctx.fillStyle = "#58b368";
  ctx.beginPath();
  ctx.ellipse(x, y, 66 * s, 40 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 52 * s, y - 8 * s);
  ctx.quadraticCurveTo(x + 88 * s, y - 26 * s, x + 84 * s, y + 4 * s);
  ctx.quadraticCurveTo(x + 92 * s, y + 12 * s, x + 80 * s, y + 22 * s);
  ctx.quadraticCurveTo(x + 58 * s, y + 14 * s, x + 52 * s, y - 2 * s);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 46 * s, y - 16 * s, 16 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - 42 * s, y - 18 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#58b368";
  ctx.beginPath();
  ctx.arc(x - 32 * s, y - 26 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x - 32 * s, y - 26 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3c7a47";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 28 * s + i * 16 * s, y - 36 * s);
    ctx.quadraticCurveTo(x - 22 * s + i * 16 * s, y - 52 * s, x - 16 * s + i * 16 * s, y - 36 * s);
    ctx.fill();
  }
}

function kid(ctx: any, x: number, y: number, s = 1, shirt = COLORS.coral) {
  ctx.fillStyle = "#ffd9b8";
  ctx.beginPath();
  ctx.arc(x, y - 34 * s, 15 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a4a21";
  ctx.beginPath();
  ctx.arc(x, y - 40 * s, 17 * s, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * s, 20 * s, 24 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0a35c";
  ctx.strokeStyle = "#f0a35c";
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.moveTo(x - 16 * s, y + 2 * s);
  ctx.lineTo(x - 30 * s, y - 6 * s);
  ctx.moveTo(x + 16 * s, y + 2 * s);
  ctx.lineTo(x + 30 * s, y - 6 * s);
  ctx.stroke();
  ctx.strokeStyle = "#7a4a21";
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(x - 10 * s, y + 26 * s);
  ctx.lineTo(x - 14 * s, y + 52 * s);
  ctx.moveTo(x + 10 * s, y + 26 * s);
  ctx.lineTo(x + 14 * s, y + 52 * s);
  ctx.stroke();
}

function rainbow(ctx: any, x: number, y: number, r: number) {
  const colors = [COLORS.coral, COLORS.gold, "#7cc46b", "#5ec8c0", COLORS.lilac];
  colors.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(x, y, r + i * 18, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  });
}

function rain(ctx: any, W: number, y: number, n = 18) {
  ctx.strokeStyle = "rgba(120,170,220,0.85)";
  ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    const x = ((i * 997) % W) + 20;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x - 5, y + 14);
    ctx.stroke();
  }
}

function kite(ctx: any, x: number, y: number, s = 1) {
  ctx.fillStyle = COLORS.coral;
  ctx.beginPath();
  ctx.moveTo(x, y - 44 * s);
  ctx.lineTo(x + 30 * s, y);
  ctx.lineTo(x, y + 44 * s);
  ctx.lineTo(x - 30 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 44 * s);
  ctx.lineTo(x, y + 44 * s);
  ctx.stroke();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y + 44 * s);
  ctx.quadraticCurveTo(x + 20 * s, y + 90 * s, x - 30 * s, y + 110 * s);
  ctx.stroke();
}

function cat(ctx: any, x: number, y: number, s = 1) {
  ctx.fillStyle = "#5c4a72";
  ctx.beginPath();
  ctx.ellipse(x, y, 40 * s, 30 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 26 * s, y - 12 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 38 * s, y - 16 * s);
  ctx.lineTo(x - 30 * s, y - 34 * s);
  ctx.lineTo(x - 22 * s, y - 18 * s);
  ctx.fill();
  ctx.fillStyle = "#ffe9a3";
  ctx.beginPath();
  ctx.arc(x - 30 * s, y - 14 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c4a72";
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 30 * s);
  ctx.quadraticCurveTo(x + 30 * s, y + 70 * s, x + 40 * s, y + 30 * s);
  ctx.fill();
}

function windowScene(ctx: any, W: number, H: number) {
  ctx.fillStyle = "#f7ede0";
  ctx.fillRect(0, 0, W, H);
  roundedRect(ctx, W * 0.18, H * 0.1, W * 0.64, H * 0.8, 24);
  ctx.fillStyle = COLORS.night;
  ctx.fill();
  ctx.strokeStyle = "#c9a06b";
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.1 + 7);
  ctx.lineTo(W * 0.5, H * 0.9 - 7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.18 + 7, H * 0.48);
  ctx.lineTo(W * 0.82 - 7, H * 0.48);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

interface PageSpec {
  W: number;
  H: number;
  draw: (ctx: any) => void;
  text?: string[];
}

function renderPage(spec: PageSpec, label: string) {
  const canvas = createCanvas(spec.W, spec.H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, spec.W, spec.H);
  spec.draw(ctx);
  if (spec.text?.length) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 40px ComicSansBold, ArialBold, sans-serif`;
    ctx.textAlign = "center";
    const lineHeight = 52;
    const lines = spec.text.flatMap((t) => wrapText(ctx, t, spec.W * 0.78));
    const y0 = spec.H - (lines.length + 1) * lineHeight - 24;
    lines.forEach((line, i) => ctx.fillText(line, spec.W / 2, y0 + i * lineHeight + lineHeight));
  }
  return canvas.toBuffer("image/jpeg", 92);
}

function pageImage(page: Buffer, name: string) {
  const f: UploadedFile = { buffer: page, name, mime: "image/jpeg" };
  return f;
}

function drawTitlePage(W: number, H: number, title: string, subtitle: string, decorate: (ctx: any) => void) {
  return renderPage(
    {
      W,
      H,
      draw: (ctx) => {
        decorate(ctx);
        ctx.fillStyle = COLORS.white;
        ctx.font = "700 84px ComicSansBold, ArialBold, sans-serif";
        ctx.textAlign = "center";
        const lines = wrapText(ctx, title, W * 0.82);
        const y0 = H * 0.36;
        lines.forEach((line, i) => {
          ctx.fillText(line, W / 2, y0 + i * 96);
        });
        ctx.font = "600 34px ComicSans, Arial, sans-serif";
        ctx.fillStyle = "#7a6a5a";
        ctx.fillText(subtitle, W / 2, H * 0.62);
      },
    },
    "title.jpg"
  );
}

// ---------------------------------------------------------------------------
// Book 1 — generated PDF (exercises the real PDF pipeline end-to-end)
// ---------------------------------------------------------------------------

async function venaPdf(): Promise<Buffer> {
  const doc = new PDFDocument({ size: [1200, 900], margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((res) => doc.on("end", () => res()));

  const page = (bg: string, art: (d: any) => void, title: string | null, body: string) => {
    doc.addPage();
    doc.rect(0, 0, 1200, 900).fill(bg);
    art(doc);
    if (title) {
      doc.fillColor("#ffffff").fontSize(60).font("Helvetica-Bold").text(title, 80, 120, { width: 1040, align: "center" });
    }
    if (body) {
      doc.fillColor("#5c4033").fontSize(32).font("Helvetica").text(body, 120, 660, { width: 960, align: "center" });
    }
  };

  // Cover
  doc.rect(0, 0, 1200, 900).fill("#ffd98a");
  doc.circle(180, 170, 70).fill("#ff7a59");
  doc.circle(240, 155, 90).fillOpacity(0.25).fill("#ff7a59").fillOpacity(1);
  doc.rect(0, 640, 1200, 260).fill("#7cc46b");
  doc.ellipse(600, 620, 320, 140).fill("#4f9e46");
  doc.fillColor("#7a4a21").circle(900, 700, 34).fill("#ffd9b8");
  doc.fillColor("#ffffff").fontSize(76).font("Helvetica-Bold").text("Vena and His Friend T-Rex", 100, 260, { width: 1000, align: "center" });
  doc.fillColor("#8a5a2b").fontSize(34).font("Helvetica").text("A stomping adventure", 100, 420, { width: 1000, align: "center" });

  page("#bfe6ff", (d) => {
    d.circle(1050, 140, 80).fill("#ffd166");
    d.circle(250, 220, 55).fillOpacity(0.9).fill("#ffffff").fillOpacity(1);
    d.rect(0, 720, 1200, 180).fill("#7cc46b");
    d.ellipse(700, 700, 300, 120).fill("#4f9e46");
    d.fillColor("#8a5a2b").rect(120, 560, 30, 180).fill();
    d.circle(135, 520, 80).fill("#57a84b");
  }, null, "Vena loved stomping through the tall green grass. STOMP! STOMP! STOMP!");

  page("#bfe6ff", (d) => {
    d.circle(120, 150, 70).fill("#ffd166");
    d.fillColor("#8a5a2b").rect(150, 560, 30, 180).fill();
    d.circle(165, 520, 85).fill("#57a84b");
    d.rect(0, 720, 1200, 180).fill("#7cc46b");
  }, null, "One day, she heard a loud RUMBLE. The ground shook and shook!");

  page("#bfe6ff", (d) => {
    d.rect(0, 720, 1200, 180).fill("#7cc46b");
    d.fillColor("#58b368").ellipse(700, 640, 130, 90).fill();
    d.fillColor("#3c7a47").moveTo(620, 600).lineTo(700, 480).lineTo(780, 600).closePath().fill();
    d.fillColor("#58b368").circle(590, 560, 40).fill();
    d.fillColor("#ffffff").circle(602, 552, 10).fill();
  }, "\"Don't be scared!\"", "\"I'm just a friendly T-Rex, and I'm very hungry!\"");

  page("#dff3d8", (d) => {
    d.fillColor("#8a5a2b").rect(150, 480, 40, 240).fill();
    d.circle(170, 440, 110).fill("#57a84b");
    d.fillColor("#ffffff").rect(80, 640, 320, 60).fill();
    d.fillColor("#ff7a59").rect(80, 640, 320, 60).fillOpacity(1).fill();
    d.fillColor("#e8f5e9").rect(100, 655, 120, 30).fill();
    d.fillColor("#ffb74d").rect(240, 655, 120, 30).fill();
  }, null, "They shared a picnic under the big oak tree. Yum!");

  page("#bfe6ff", (d) => {
    d.circle(150, 150, 70).fill("#ffd166");
    d.fillColor("#58b368").ellipse(750, 700, 160, 110).fill();
    d.fillColor("#3c7a47");
    for (let i = 0; i < 4; i++) d.moveTo(640 + i * 70, 610).lineTo(700 + i * 70, 500).lineTo(760 + i * 70, 610).closePath().fill();
    d.fillColor("#ffffff").fontSize(44).font("Helvetica").text("RAWR!", 620, 440, { width: 300, align: "center" });
  }, null, "Rex taught Vena his best dinosaur roar. RAWR!");

  page("#fff3d8", (d) => {
    d.circle(150, 140, 70).fill("#ffd166");
    d.fillColor("#58b368").ellipse(400, 720, 200, 110).fill();
    d.fillColor("#ff9eb5").circle(900, 660, 60).fillOpacity(0.85).fill();
    d.fillColor("#e86a8c").circle(900, 660, 40).fill();
    d.fillColor("#ffffff").ellipse(880, 620, 26, 20).fill();
  }, null, "Vena taught Rex how to do a happy dance!");

  page("#24324f", (d) => {
    d.circle(600, 250, 120).fillOpacity(0.9).fill("#fff3c9");
    d.circle(480, 210, 90).fill("#24324f");
    d.fillColor("#ffe9a3");
    for (let i = 0; i < 40; i++) {
      const x = ((i * 617) % 1150) + 30;
      const y = ((i * 389) % 500) + 60;
      d.circle(x, y, 4).fill();
    }
  }, null, "The stars came out, and they counted them together. 1... 2... 3...");

  page("#bfe6ff", (d) => {
    d.circle(1050, 150, 70).fill("#ffd166");
    d.fillColor("#8a5a2b").rect(900, 560, 34, 180).fill();
    d.circle(915, 520, 90).fill("#57a84b");
    d.rect(0, 720, 1200, 180).fill("#7cc46b");
  }, null, "\"See you tomorrow, friend!\" called Rex, waving his tiny arms.");

  doc.end();
  await done;
  return Buffer.concat(chunks as any[]);
}

// ---------------------------------------------------------------------------
// Book 2 — "The Little Cloud Who Couldn't Rain" (canvas JPG pages)
// ---------------------------------------------------------------------------

function littleCloudPages(): UploadedFile[] {
  const W = 1000;
  const H = 1000;
  const pages: Buffer[] = [];

  pages.push(
    drawTitlePage(W, H, "The Little Cloud", "Who Couldn't Rain", (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      sun(ctx, 850, 160, 70);
      cloud(ctx, 380, 330, 2.2);
      hills(ctx, W, H);
      flower(ctx, 180, 860, COLORS.coral);
      flower(ctx, 260, 890, COLORS.pink);
      flower(ctx, 760, 870, COLORS.lilac);
    })
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      sun(ctx, 860, 150, 60);
      cloud(ctx, 460, 320, 2.4);
      cloud(ctx, 700, 200, 1.2);
      hills(ctx, W, H);
      flower(ctx, 150, 880, COLORS.coral);
      flower(ctx, 840, 870, COLORS.pink);
    }, text: ["Claude was a little cloud who lived in the sky.", "But poor Claude could never, ever rain."] }, "p1.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      sun(ctx, 150, 160, 60);
      cloud(ctx, 520, 300, 2.2);
      rainbow(ctx, 720, 560, 130);
      hills(ctx, W, H);
      flower(ctx, 200, 880, COLORS.yellow);
    }, text: ["The sun winked at him.", "\"Don't worry, little one.\"", "\"You'll find your way.\""] }, "p2.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      cloud(ctx, 350, 250, 2);
      cloud(ctx, 650, 380, 1.4);
      hills(ctx, W, H);
      rain(ctx, W, 760, 22);
      flower(ctx, 250, 880, COLORS.coral);
      flower(ctx, 750, 870, COLORS.teal);
    }, text: ["The wind pushed a big grey cloud along.", "\"Borrow my raindrops,\" she boomed. \"Try! Try!\""] }, "p3.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, "#cfe8ff", "#eaf7ff");
      cloud(ctx, 480, 280, 2.3);
      sun(ctx, 150, 150, 65);
      hills(ctx, W, H);
      flower(ctx, 180, 880, COLORS.pink);
      flower(ctx, 300, 900, COLORS.lilac);
      flower(ctx, 800, 875, COLORS.coral);
    }, text: ["Claude squeezed and puffed and pushed.", "And then...", "PLIP! PLOP! PLIPITY-PLOP!"] }, "p4.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      cloud(ctx, 300, 240, 2);
      sun(ctx, 850, 150, 60);
      rainbow(ctx, 500, 560, 150);
      hills(ctx, W, H);
      flower(ctx, 150, 880, COLORS.coral);
      flower(ctx, 840, 870, COLORS.yellow);
      flower(ctx, 700, 900, COLORS.pink);
    }, text: ["And there it was — a beautiful rainbow!", "Claude had made it all by himself."] }, "p5.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.sky, "#eaf7ff");
      sun(ctx, 850, 150, 60);
      cloud(ctx, 480, 300, 2.3);
      hills(ctx, W, H);
      flower(ctx, 150, 880, COLORS.coral);
      flower(ctx, 250, 860, COLORS.teal);
      flower(ctx, 330, 890, COLORS.lilac);
      flower(ctx, 780, 870, COLORS.pink);
      flower(ctx, 860, 890, COLORS.yellow);
    }, text: ["From that day on, every drop of rain", "Claude sent down grew a happy flower.", "He was the happiest cloud in the sky."] }, "p6.jpg")
  );

  return pages.map((p, i) => pageImage(p, `little-cloud-p${i + 1}.jpg`));
}

// ---------------------------------------------------------------------------
// Book 3 — "Luna's Night Adventure" (canvas JPG pages)
// ---------------------------------------------------------------------------

function lunaPages(): UploadedFile[] {
  const W = 1000;
  const H = 1000;
  const pages: Buffer[] = [];

  pages.push(
    drawTitlePage(W, H, "Luna's Night", "Adventure", (ctx) => {
      sky(ctx, W, H, COLORS.night, COLORS.nightDeep);
      moon(ctx, 780, 200, 90);
      star(ctx, 200, 180, 26);
      star(ctx, 320, 320, 18);
      star(ctx, 550, 140, 22);
      star(ctx, 140, 430, 14);
      star(ctx, 880, 480, 16);
      hills(ctx, W, H);
    })
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      windowScene(ctx, W, H);
      moon(ctx, 620, 330, 70);
      star(ctx, 760, 250, 16);
      star(ctx, 830, 380, 12);
      star(ctx, 700, 460, 10);
    }, text: ["Luna lay in bed, watching the moon", "shine through her window.", "\"I wish I could play up there,\" she sighed."] }, "p1.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.night, COLORS.nightDeep);
      moon(ctx, 750, 180, 95);
      star(ctx, 150, 160, 24);
      star(ctx, 300, 300, 16);
      star(ctx, 520, 120, 18);
      star(ctx, 880, 260, 14);
      star(ctx, 120, 500, 12);
      cat(ctx, 500, 700, 1.3);
    }, text: ["Outside, her cat Miso was waiting.", "\"Mew!\" he said. \"Let's go play!\""] }, "p2.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.night, COLORS.nightDeep);
      moon(ctx, 700, 200, 80);
      kite(ctx, 420, 380, 1.4);
      star(ctx, 150, 150, 22);
      star(ctx, 330, 260, 14);
      star(ctx, 900, 160, 18);
      star(ctx, 800, 420, 12);
      star(ctx, 200, 520, 10);
    }, text: ["A silver kite danced down from the moon.", "\"Hop on!\" it whispered. \"We're going to the stars!\""] }, "p3.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.night, COLORS.nightDeep);
      moon(ctx, 520, 300, 130);
      star(ctx, 150, 160, 26);
      star(ctx, 280, 380, 16);
      star(ctx, 760, 150, 20);
      star(ctx, 880, 380, 14);
      star(ctx, 620, 700, 12);
      star(ctx, 850, 620, 10);
      kid(ctx, 260, 760, 1.1, COLORS.teal);
      cat(ctx, 400, 830, 0.9);
    }, text: ["They twirled past the moon's silver face", "and scattered stardust across the sky."] }, "p4.jpg")
  );

  pages.push(
    renderPage({ W, H, draw: (ctx) => {
      sky(ctx, W, H, COLORS.night, COLORS.nightDeep);
      moon(ctx, 180, 170, 70);
      star(ctx, 650, 150, 20);
      star(ctx, 800, 280, 14);
      star(ctx, 880, 160, 12);
      kid(ctx, 620, 760, 1.1, COLORS.coral);
      cat(ctx, 780, 820, 0.9);
    }, text: ["When the kite brought them home,", "Luna tucked Miso into bed.", "\"That was the best adventure ever,\" she whispered."] }, "p5.jpg")
  );

  return pages.map((p, i) => pageImage(p, `luna-p${i + 1}.jpg`));
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  setupFonts();

  console.log("🌱 Seeding Tiny Tales Studio…");

  // 1. Admin user -----------------------------------------------------------
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (!existing) {
    await prisma.adminUser.create({
      data: { username, passwordHash: bcrypt.hashSync(password, 12) },
    });
    console.log(`   ✓ Admin user created — username: ${username}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`   ⚠ Using default password "${password}". Change ADMIN_PASSWORD in .env!`);
    }
  } else {
    console.log("   • Admin user already exists");
  }

  // 2. Product config -------------------------------------------------------
  const product = await prisma.product.upsert({
    where: { slug: DEFAULT_PRODUCT_SLUG },
    update: {},
    create: {
      name: "Custom Children's Book",
      slug: DEFAULT_PRODUCT_SLUG,
      pageCount: 24,
      aspectRatio: "4:3",
      price: 1500,
      currency: "Rs.",
      active: true,
    },
  });
  console.log(`   ✓ Product: ${product.name} (${product.pageCount} pages / ${product.aspectRatio} / Rs. ${product.price})`);

  // 3. Sample books ---------------------------------------------------------
  const vena = await prisma.book.findUnique({ where: { slug: "vena-and-his-friend-trex" } });
  if (!vena) {
    console.log("   • Creating 'Vena and His Friend T-Rex' (PDF pipeline)…");
    const pdf = await venaPdf();
    const result = await processBook({
      title: "Vena and His Friend T-Rex",
      description:
        "Vena loves stomping through the tall grass — until a rumble shakes the meadow and she meets the friendliest T-Rex in the world. A warm story about friendship, roaring, and happy dances.",
      author: "Tiny Tales Studio",
      illustrator: "Tiny Tales Studio",
      year: "2026",
      tags: "dinosaurs, friendship, adventure",
      publish: true,
      topFeature: false,
      files: [{ buffer: pdf, name: "vena-and-his-friend-trex.pdf", mime: "application/pdf" }],
    });
    console.log(`   ✓ ${result.title} (${result.pageCount} pages) at /book/${result.slug}`);
  } else {
    console.log("   • 'Vena and His Friend T-Rex' already exists");
  }

  const cloud = await prisma.book.findUnique({ where: { slug: "the-little-cloud-who-couldnt-rain" } });
  if (!cloud) {
    console.log("   • Creating 'The Little Cloud Who Couldn't Rain' (JPG pages)…");
    const result = await processBook({
      title: "The Little Cloud Who Couldn't Rain",
      description:
        "Every cloud in the sky can rain — except little Claude. With a nudge from the sun and a push from the wind, he discovers that a small cloud can make the most beautiful rain of all.",
      author: "Tiny Tales Studio",
      illustrator: "Tiny Tales Studio",
      year: "2026",
      tags: "weather, perseverance, nature",
      publish: true,
      topFeature: true,
      files: littleCloudPages(),
    });
    console.log(`   ✓ ${result.title} (${result.pageCount} pages) at /book/${result.slug}`);
  } else {
    console.log("   • 'The Little Cloud Who Couldn't Rain' already exists");
  }

  const luna = await prisma.book.findUnique({ where: { slug: "lunas-night-adventure" } });
  if (!luna) {
    console.log("   • Creating 'Luna's Night Adventure' (JPG pages)…");
    const result = await processBook({
      title: "Luna's Night Adventure",
      description:
        "When Luna can't sleep, her cat Miso leads her on a silver kite ride to the moon — a dreamy bedtime tale full of stars and stardust.",
      author: "Tiny Tales Studio",
      illustrator: "Tiny Tales Studio",
      year: "2026",
      tags: "bedtime, moon, dreams",
      publish: true,
      topFeature: true,
      files: lunaPages(),
    });
    console.log(`   ✓ ${result.title} (${result.pageCount} pages) at /book/${result.slug}`);
  } else {
    console.log("   • 'Luna's Night Adventure' already exists");
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
