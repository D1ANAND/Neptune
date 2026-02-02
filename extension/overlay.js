let overlayEl = null;

function showOverlay(rect, loading = true) {
  removeOverlay();

  overlayEl = document.createElement("div");
  overlayEl.className = "fin-overlay";

  overlayEl.innerHTML = loading
    ? `<div class="fin-overlay-loading">Explaining…</div>`
    : "";

  document.body.appendChild(overlayEl);
  positionOverlay(rect);
  attachDismissHandlers();
}

function updateOverlay(text) {
  if (!overlayEl) return;

  overlayEl.innerHTML = `
    <div>${text}</div>
    <div class="fin-overlay-footer">
      Educational only · Not financial advice
    </div>
  `;
}

function removeOverlay() {
  if (overlayEl) overlayEl.remove();
  overlayEl = null;
}

function positionOverlay(rect) {
  if (!overlayEl) return;

  const padding = 8;
  const overlayRect = overlayEl.getBoundingClientRect();

  let top = rect.top + window.scrollY - overlayRect.height - padding;
  let left =
    rect.left +
    window.scrollX +
    rect.width / 2 -
    overlayRect.width / 2;

  if (top < padding) {
    top = rect.bottom + window.scrollY + padding;
  }

  left = Math.max(
    padding,
    Math.min(left, window.innerWidth - overlayRect.width - padding)
  );

  overlayEl.style.top = `${top}px`;
  overlayEl.style.left = `${left}px`;
}

function attachDismissHandlers() {
  const dismiss = () => removeOverlay();

  setTimeout(() => {
    document.addEventListener("mousedown", dismiss, { once: true });
    document.addEventListener("scroll", dismiss, { once: true });
    document.addEventListener(
      "keydown",
      (e) => e.key === "Escape" && dismiss(),
      { once: true }
    );
  }, 0);
}

// Expose for content.js (same content script scope)
window.__finOverlay = { showOverlay, updateOverlay };
