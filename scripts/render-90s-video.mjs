#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = path.join(repoRoot, "public-assets", "video-90s");
const audioPath = path.join(assetDir, "organchor-90s-voice.en-US.wav");
const htmlPath = path.join(assetDir, "organchor-90s-renderer.html");
const outPath = path.join(assetDir, "organchor-90s-fireseed-alpha.webm");

if (!fs.existsSync(audioPath)) {
  throw new Error(`Missing voiceover WAV: ${audioPath}`);
}

const scenes = [
  {
    start: 0,
    end: 12,
    title: "The old signal was appearance.",
    subtitle: "A polished site or video used to imply real effort.",
    bullets: ["Website", "Video", "Product page", "Credibility look"],
    kind: "appearance",
  },
  {
    start: 12,
    end: 25,
    title: "Carriers are fragile.",
    subtitle: "Domains, platforms, and pages can disappear or change.",
    bullets: ["Domain expires", "Account disabled", "Website moves", "Old trail fades"],
    kind: "fragile",
  },
  {
    start: 25,
    end: 45,
    title: "OrgAnchor signs the record.",
    subtitle: "Identity, official presence, claims, evidence, and change history.",
    bullets: ["Signed identity", "Official presence", "Evidence records", "Change history"],
    kind: "core",
  },
  {
    start: 45,
    end: 62,
    title: "Verification becomes cheaper.",
    subtitle: "Humans read the summary. Agents inspect the package.",
    bullets: ["Verify page", "Signed package", "Hashes", "Gaps and next checks"],
    kind: "verify",
  },
  {
    start: 62,
    end: 78,
    title: "Not a trust badge.",
    subtitle: "Not a marketplace, not a certification authority, not a final score.",
    bullets: ["Not a badge", "Not a ranking", "Not final trust", "Checkable material"],
    kind: "boundary",
  },
  {
    start: 78,
    end: 90,
    title: "Fireseed Alpha",
    subtitle: "Review it. Reproduce it. Challenge it.",
    bullets: ["organchor.org/verify", "github.com/OrgAnchor/OrgAnchor", "npm run agent:demo"],
    kind: "ask",
  },
];

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OrgAnchor 90s Renderer</title>
  <style>
    html, body { margin: 0; background: #111820; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
    audio { display: none; }
  </style>
</head>
<body>
  <canvas id="c" width="1920" height="1080"></canvas>
  <audio id="voice" src="${path.basename(audioPath)}" preload="auto"></audio>
  <script>
    const scenes = ${JSON.stringify(scenes)};
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");
    const audio = document.getElementById("voice");
    const W = canvas.width;
    const H = canvas.height;
    const colors = {
      ink: "#111820",
      paper: "#F4F0E6",
      paper2: "#FBF8EE",
      green: "#1A9B72",
      blue: "#2D73C9",
      gold: "#C9972E",
      red: "#D85C45",
      quiet: "#C8D0C1",
      slate: "#465A66",
      muted: "#6E7B75"
    };

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function fillText(text, x, y, size, color, weight = 400, align = "left", font = "Segoe UI") {
      ctx.font = weight + " " + size + "px " + font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.fillText(text, x, y);
    }

    function wrapText(text, x, y, maxWidth, lineHeight, size, color, weight = 400) {
      ctx.font = weight + " " + size + "px Segoe UI";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const words = text.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, x, y);
          y += lineHeight;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, y);
    }

    function drawGrid() {
      ctx.fillStyle = colors.paper2;
      ctx.fillRect(0, 330, W, 760);
      ctx.strokeStyle = colors.quiet;
      ctx.lineWidth = 2;
      for (let x = 0; x <= W; x += 96) {
        ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 990); ctx.stroke();
      }
      for (let y = 330; y <= 990; y += 72) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 330); ctx.lineTo(W, 330); ctx.stroke();
    }

    function drawHeader(scene, t, duration) {
      ctx.fillStyle = colors.ink;
      ctx.fillRect(0, 0, W, 330);
      fillText("OrgAnchor Fireseed Alpha", 110, 72, 42, "#FFFFFF", 700);
      fillText("Signed organization identity, evidence, and AI-agent-readable verification", 110, 132, 27, "#D8D6CA", 400);
      fillText("not a badge / not a marketplace / not final trust", 110, 184, 25, "#B8C1B2", 400, "left", "Cascadia Mono");

      const p = Math.min(1, Math.max(0, t / duration));
      ctx.fillStyle = "#26343D";
      ctx.fillRect(110, 260, 560, 10);
      ctx.fillStyle = colors.gold;
      ctx.fillRect(110, 260, 560 * p, 10);
    }

    function drawMark(x, y, s) {
      ctx.fillStyle = colors.ink;
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = colors.paper;
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * .38, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = colors.gold; ctx.lineWidth = s * .012;
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * .32, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = colors.green; ctx.lineWidth = s * .018; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * .30, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
      ctx.strokeStyle = colors.blue;
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s * .30, Math.PI * .2, Math.PI * .8); ctx.stroke();
      roundRect(x + s * .30, y + s * .30, s * .40, s * .33, s * .04);
      ctx.fillStyle = colors.ink; ctx.fill();
      roundRect(x + s * .39, y + s * .41, s * .22, s * .10, s * .02);
      ctx.fillStyle = colors.paper2; ctx.fill();
      fillText("CX", x + s * .50, y + s * .41, s * .13, colors.ink, 700, "center");
      ctx.strokeStyle = colors.gold; ctx.lineWidth = s * .014;
      ctx.beginPath(); ctx.moveTo(x + s * .36, y + s * .36); ctx.lineTo(x + s * .64, y + s * .36); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * .36, y + s * .58); ctx.lineTo(x + s * .64, y + s * .58); ctx.stroke();
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      const fx = x + s * .50, fy = y + s * .64, fs = s * .075;
      ctx.moveTo(fx, fy + fs);
      ctx.bezierCurveTo(fx - fs * .38, fy + fs * .55, fx + fs * .02, fy + fs * .38, fx, fy);
      ctx.bezierCurveTo(fx + fs * .48, fy + fs * .42, fx + fs * .36, fy + fs * .78, fx, fy + fs);
      ctx.fill();
    }

    function drawCards(scene, local) {
      const x0 = 1020;
      const y0 = 432;
      const cols = 2;
      scene.bullets.forEach((b, i) => {
        const x = x0 + (i % cols) * 345;
        const y = y0 + Math.floor(i / cols) * 168;
        roundRect(x, y, 285, 112, 16);
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.strokeStyle = colors.quiet;
        ctx.lineWidth = 2;
        ctx.stroke();
        const dot = [colors.blue, colors.green, colors.gold, colors.red][i % 4];
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(x + 32, y + 56, 12, 0, Math.PI * 2);
        ctx.fill();
        wrapText(b, x + 56, y + 35, 210, 28, 24, colors.ink, 600);
      });
    }

    function drawSceneDiagram(scene, t, local) {
      const markX = 150;
      const markY = 620;
      const markSize = 260;
      drawMark(markX, markY, markSize);
      ctx.strokeStyle = "#9FA99D";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";

      if (scene.kind === "appearance") {
        ["site", "video", "page"].forEach((label, i) => {
          const x = 500 + i * 122;
          roundRect(x, 620 + i * 34, 92, 92, 10);
          ctx.fillStyle = "#FFFFFF"; ctx.fill();
          ctx.strokeStyle = colors.quiet; ctx.lineWidth = 2; ctx.stroke();
          fillText(label, x + 46, 655 + i * 34, 20, colors.slate, 600, "center");
        });
      } else if (scene.kind === "fragile") {
        ctx.strokeStyle = colors.red; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(520, 610); ctx.lineTo(760, 800); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(760, 610); ctx.lineTo(520, 800); ctx.stroke();
        fillText("carrier failed", 640, 830, 28, colors.red, 700, "center");
      } else if (scene.kind === "core") {
        const nodes = [[610,610,colors.blue],[750,690,colors.green],[610,790,colors.gold],[825,825,colors.red]];
        nodes.forEach(([x,y,c], i) => {
          ctx.strokeStyle = "#9FA99D"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(430, 750); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x,y,22,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = colors.paper2; ctx.beginPath(); ctx.arc(x,y,8,0,Math.PI*2); ctx.fill();
        });
      } else if (scene.kind === "verify") {
        ctx.strokeStyle = colors.green; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(545, 730); ctx.lineTo(635, 810); ctx.lineTo(835, 610); ctx.stroke();
        fillText("signature + hash checks pass", 710, 850, 26, colors.green, 700, "center");
      } else if (scene.kind === "boundary") {
        ["badge", "market", "score"].forEach((label, i) => {
          const x = 520 + i * 130;
          ctx.strokeStyle = colors.red; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(x, 730, 44, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 32, 762); ctx.lineTo(x + 32, 698); ctx.stroke();
          fillText(label, x, 798, 22, colors.red, 700, "center");
        });
      } else if (scene.kind === "ask") {
        ctx.strokeStyle = colors.gold; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(560, 820); ctx.lineTo(835, 610); ctx.stroke();
        ctx.fillStyle = colors.gold;
        ctx.beginPath(); ctx.arc(835,610,22,0,Math.PI*2); ctx.fill();
        fillText("review / reproduce / challenge", 700, 850, 26, colors.gold, 700, "center");
      }
    }

    function drawFrame() {
      const duration = audio.duration || 85.5;
      const t = audio.currentTime || 0;
      const scaled = t * 90 / duration;
      const scene = scenes.find(s => scaled >= s.start && scaled < s.end) || scenes[scenes.length - 1];
      const local = (scaled - scene.start) / Math.max(1, scene.end - scene.start);

      ctx.fillStyle = colors.paper;
      ctx.fillRect(0, 0, W, H);
      drawHeader(scene, t, duration);
      drawGrid();

      fillText(scene.title, 110, 410, 64, colors.ink, 800);
      wrapText(scene.subtitle, 114, 500, 760, 44, 34, colors.slate, 400);
      drawSceneDiagram(scene, t, local);
      drawCards(scene, local);

      ctx.fillStyle = "#E9EDE3";
      ctx.fillRect(0, 990, W, 90);
      fillText("organchor.org/verify", 110, 1018, 26, colors.slate, 600, "left", "Cascadia Mono");
      fillText("github.com/OrgAnchor/OrgAnchor", 640, 1018, 26, colors.slate, 600, "left", "Cascadia Mono");
      fillText("Fireseed Alpha", 1700, 1018, 26, colors.gold, 700, "right");
    }

    async function waitForMetadata() {
      if (Number.isFinite(audio.duration)) return;
      await new Promise(resolve => audio.addEventListener("loadedmetadata", resolve, { once: true }));
    }

    window.renderAndRecord = async () => {
      await waitForMetadata();
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);
      const canvasStream = canvas.captureStream(30);
      const stream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm;codecs=vp8,opus";
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000, audioBitsPerSecond: 128000 });
      const chunks = [];
      recorder.ondataavailable = event => {
        if (event.data && event.data.size) chunks.push(event.data);
      };
      const done = new Promise(resolve => {
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mime });
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i += 0x8000) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          }
          await window.saveWebm(btoa(binary));
          resolve({ bytes: blob.size, mime, duration: audio.duration });
        };
      });
      recorder.start(1000);
      await audioContext.resume();
      await audio.play();
      const tick = () => {
        drawFrame();
        if (!audio.ended) requestAnimationFrame(tick);
      };
      tick();
      await new Promise(resolve => audio.addEventListener("ended", resolve, { once: true }));
      drawFrame();
      await new Promise(resolve => setTimeout(resolve, 500));
      recorder.stop();
      return done;
    };

    drawFrame();
  </script>
</body>
</html>`;

fs.mkdirSync(assetDir, { recursive: true });
fs.writeFileSync(htmlPath, html, "utf8");

const chromeCandidates = [
  process.env.CHROME_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--use-fake-ui-for-media-stream",
  ],
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.exposeFunction("saveWebm", async (base64) => {
  fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
});
await page.goto(pathToFileURL(htmlPath).href);
const result = await page.evaluate(() => window.renderAndRecord());
await browser.close();

const stat = fs.statSync(outPath);
console.log(JSON.stringify({
  output: outPath,
  bytes: stat.size,
  durationSeconds: Number(result.duration.toFixed(2)),
  mime: result.mime,
}, null, 2));
