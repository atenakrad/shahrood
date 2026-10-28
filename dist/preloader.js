(() => {
  const overlay = document.querySelector('#site-preloader');
  const started = performance.now();
  let dismissed = false;
  // Keep keyboard navigation behind the loading screen until the site is ready.
  const pending = new Set();
  function lockContent() {
    for (const child of document.body.children) {
      if (child === overlay || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(child.tagName) || child.inert) continue;
      child.inert = true;
      pending.add(child);
    }
  }
  lockContent();
  const observer = new MutationObserver(lockContent);
  observer.observe(document.body, {childList: true});
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(watchdog);
    // A brief minimum prevents a flash on a warm cache.
    setTimeout(() => {
      observer.disconnect();
      for (const child of pending) child.inert = false;
      document.documentElement.classList.remove('site-loading');
      document.body.removeAttribute('aria-busy');
      overlay.classList.add('is-leaving');
      setTimeout(() => overlay.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500);
    }, Math.max(0, 700 - (performance.now() - started)));
  }
  // Broken module requests must never leave the page permanently locked.
  const watchdog = setTimeout(dismiss, 90000);
  addEventListener('shahrood:ready', dismiss, {once: true});
  if (window.__siteReady) dismiss();
})();
