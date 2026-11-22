import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const videoDir = "/Users/umang/Work/ViewProbe/.github/assets/videos";
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// Clean old test recordings
const oldFiles = fs.readdirSync(videoDir);
for (const file of oldFiles) {
  if (file.endsWith(".webm") || file.endsWith(".mp4")) {
    fs.unlinkSync(path.join(videoDir, file));
  }
}

async function record() {
  console.log("Launching headless browser for video recording...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // Retina high quality
  });

  const page = await context.newPage();
  const htmlPath = path.resolve("/Users/umang/Work/ViewProbe/scripts/demo_animation.html");
  console.log(`Loading demo animation from ${htmlPath}...`);
  await page.goto(`file://${htmlPath}`);

  // Wait for the full 16-second sequence to complete
  console.log("Recording 16 seconds of live layout healing animation...");
  await page.waitForTimeout(16000);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const finalDest = path.join(videoDir, "viewprobe-demo.webm");
    fs.renameSync(videoPath, finalDest);
    console.log(`Video recorded successfully to: ${finalDest}`);

    // Also copy to artifacts directory for inline playback
    const artifactDest = "/Users/umang/.gemini/antigravity/brain/2f544530-7ff6-40a0-b2e7-ecc10ea3b07d/viewprobe-demo.webm";
    fs.copyFileSync(finalDest, artifactDest);
    console.log(`Copied to artifact directory: ${artifactDest}`);
  }
}

record().catch(console.error);
