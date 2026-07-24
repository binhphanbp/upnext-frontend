import { expect, test } from "@playwright/test";

test("provides an installable app shell and a useful offline fallback", async ({
  context,
  page,
}) => {
  await page.goto("/vi");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );

  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()["content-type"]).toContain("application/manifest+json");

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    name: "UpNext – Nền tảng tuyển dụng nhân sự IT",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0aa56f",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/pwa/icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/pwa/icon-512.png", sizes: "512x512" }),
      expect.objectContaining({
        src: "/pwa/icon-512-maskable.png",
        purpose: "maskable",
        sizes: "512x512",
      }),
    ]),
  );

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ""))
    .toContain("/sw.js");

  try {
    await context.setOffline(true);
    await page.goto("/vi/jobs?offline-check=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Bạn đang ngoại tuyến" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
