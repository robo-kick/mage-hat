// Written by MageHat from [analytics] in site.toml (analytics.rs). A page
// served from localhost sends nothing: production only.
if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) {
  const analytics = createBeacon(__ENDPOINT__, __VERSION__);
  analytics("page_view");
  addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target.closest("[data-track]") : null;
    if (el) analytics("conversion", [el.getAttribute("data-track"), el.getAttribute("data-placement") ?? ""]);
  });

  // Engaged time: seconds the page was visible, sent each time it is hidden
  // (tab switch, app switch, leaving), so a view's rows sum to its total.
  // A tab left open is not reading: a view counts thirty minutes at most.
  const CAP = 1800;
  let counted = 0;
  let since = document.visibilityState === "visible" ? performance.now() : null;
  const visible = () => Math.min(CAP, counted + (since === null ? 0 : (performance.now() - since) / 1000));
  const flush = () => {
    if (since === null) return;
    const total = visible();
    const delta = Math.round(total - counted);
    counted = total;
    since = null;
    if (delta >= 1) analytics("engaged", [], [delta]);
  };
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else if (since === null) since = performance.now();
  });
  addEventListener("pagehide", flush);

  // Read-through: once per view, when the reader has scrolled past three
  // quarters of the reading body, with the visible seconds it took, which
  // tells a read from a fling to the bottom. The body is the element marked
  // data-read, else the page's main article (main > article); a page with
  // neither sends no read.
  const body = document.querySelector("[data-read]") ?? document.querySelector("main > article");
  if (body) {
    let pending = false;
    const check = () => {
      pending = false;
      const box = body.getBoundingClientRect();
      if (innerHeight - box.top < box.height * 0.75) return;
      removeEventListener("scroll", onScroll);
      analytics("read", [], [Math.round(visible())]);
    };
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(check);
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("load", check);
  }
}
