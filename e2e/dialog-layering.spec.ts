import { expect, test } from "@playwright/test";

/**
 * The public site header is `position: sticky; z-index: 1000`, which is far above the
 * scale the app's own UI uses. Any modal that stays below it renders behind the header
 * and outside its own scrim, so its top is unreachable.
 */
test("keeps modals above the sticky public header", async ({ page }) => {
  await page.goto("/vi");

  const layers = await page.evaluate(() => {
    function zIndexOf(selector: string) {
      const element = document.querySelector(selector);
      if (!element) return null;
      return window.getComputedStyle(element).zIndex;
    }

    // Read the shared primitives straight off a probe element so the test does not
    // depend on a particular dialog being reachable from the home page.
    function zIndexOfClasses(classNames: string) {
      const probe = document.createElement("div");
      probe.className = classNames;
      document.body.append(probe);
      const value = window.getComputedStyle(probe).zIndex;
      probe.remove();
      return value;
    }

    return {
      header: zIndexOf(".marketing-home-header"),
      dialogOverlay: zIndexOfClasses("fixed z-[1020]"),
      dialogContent: zIndexOfClasses("fixed z-[1030]"),
      selectContent: zIndexOfClasses("fixed z-[1040]"),
    };
  });

  expect(layers.header).not.toBeNull();

  const header = Number(layers.header);
  const overlay = Number(layers.dialogOverlay);
  const content = Number(layers.dialogContent);
  const select = Number(layers.selectContent);

  expect(overlay).toBeGreaterThan(header);
  expect(content).toBeGreaterThan(overlay);
  // Dropdowns opened from inside a dialog have to clear the dialog itself.
  expect(select).toBeGreaterThan(content);
  // SweetAlert2 (1060) is fired from inside dialogs and must stay on top of them.
  expect(select).toBeLessThan(1060);
});
