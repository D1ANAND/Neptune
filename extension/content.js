const finOverlay = window.__finOverlay;

let debounceTimer = null;

console.log("Finance Explain Extension Loaded");
document.addEventListener("mouseup", () => {
  console.log("Mouse up detected");
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = window.setTimeout(async () => {
    const selection = window.getSelection();
    console.log("Selection:", selection?.toString());
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    finOverlay.showOverlay(rect, true);

    const context =
      range.startContainer.parentElement?.innerText.slice(0, 400) ?? "";

    try {
      const response = await fetch("http://localhost:3000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
          context
        })
      });

      const data = await response.json();
      finOverlay.updateOverlay(data.explanation);
    } catch {
      finOverlay.updateOverlay("Unable to explain this term right now.");
    }
  }, 300);
});
