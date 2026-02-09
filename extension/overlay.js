let overlayEl = null;
let currentTraceId = null;

function showOverlay(rect, loading = true) {
  removeOverlay();

  overlayEl = document.createElement("div");
  overlayEl.className = "fin-overlay";
  currentTraceId = null;

  overlayEl.innerHTML = loading
    ? `<div class="fin-overlay-loading">Explaining…</div>`
    : "";

  document.body.appendChild(overlayEl);
  positionOverlay(rect);
  attachDismissHandlers();
}

function sendOverlayFeedback(vote) {
  if (!currentTraceId) return;

  fetch("http://localhost:3000/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      traceId: currentTraceId,
      vote,
      source: "overlay",
    }),
  }).catch(() => {
    // Feedback is best-effort; ignore errors on client
  });
}

function updateOverlay(text, traceId) {
  if (!overlayEl) return;

  currentTraceId = traceId || null;

  overlayEl.innerHTML = `
    <div class="fin-overlay-body">${text}</div>
    <div class="fin-overlay-footer">
      <span>Educational only · Not financial advice</span>
      <div class="fin-overlay-feedback">
        <button class="fin-feedback-btn fin-feedback-up" data-vote="up" title="This was helpful">
          👍
        </button>
        <button class="fin-feedback-btn fin-feedback-down" data-vote="down" title="This wasn't helpful">
          👎
        </button>
      </div>
    </div>
  `;

  const feedbackButtons = overlayEl.querySelectorAll(".fin-feedback-btn");
  feedbackButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vote = btn.getAttribute("data-vote");
      if (!vote) return;
      sendOverlayFeedback(vote);

      const footer = overlayEl.querySelector(".fin-overlay-footer");
      if (footer) {
        footer.innerHTML = `
          <span>Thanks for your feedback. Educational only · Not financial advice</span>
        `;
      }
    });
  });
}

function removeOverlay() {
  if (overlayEl) overlayEl.remove();
  overlayEl = null;
  currentTraceId = null;
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
