import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
const APP_URL = process.env.EXPO_WEB_URL || "http://127.0.0.1:8081";
const IDENTITY = process.env.WAYFINDER_IDENTITY || "test@wayfinder.dev";
const PASSWORD = process.env.WAYFINDER_PASSWORD || "wayfinder1";
const OUTPUT = path.join(__dirname, "..", "assets", "images", "dashboard-authenticated.png");

async function loginViaApi() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: IDENTITY, password: PASSWORD }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Login failed (${response.status}): ${detail}`);
  }

  return response.json();
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

try {
  const auth = await loginViaApi();

  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ token, key }) => {
      window.localStorage.setItem(key, token);
    },
    { token: auth.access_token, key: "wayfinder_access_token" }
  );

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  const dashboardHeading = page.locator("text=/Where should we go next/i").first();
  await dashboardHeading.waitFor({ timeout: 20000 });

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await page.screenshot({ path: OUTPUT, fullPage: true });
  console.log(`Saved screenshot to ${OUTPUT}`);
} finally {
  await browser.close();
}
