// Example shots for capture-web.mjs. Copy, rename, and replace the URL and
// steps with the flow you are filming. One shot = one feature = one scene.
//
// Write each shot like a UI test that is being watched: do one thing, then
// pause so the edit has a settled state to hold on. Prefer role and text
// locators to CSS classes; they survive restyling.
const desktop = { width: 1440, height: 900, deviceScaleFactor: 2 };
const phone = { width: 402, height: 874, deviceScaleFactor: 3, isMobile: true };

export default [
  {
    name: "home",
    url: "http://localhost:3000/",
    viewport: desktop, // or `phone` for a mobile-web video in the phone frame
    async run(page, { pause, scroll, type }) {
      await pause(1.5);
      await scroll(700, 1.4);
      await pause(1.5);
      // await type(page.getByRole("searchbox"), "milk");
      // await page.getByRole("button", { name: "Add" }).first().click();
      // await pause(2);
    },
  },
];
