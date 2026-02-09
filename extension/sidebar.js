console.log("Comet Assistant Sidebar Loaded");
(function () {
  let sidebarEl = null;
  let chatHistoryEl = null;
  let inputEl = null;
  let isOpen = false;
  let chatHistory = []; // Local history state: [{ role: 'user'|'model', parts: [{ text: '' }] }]

  function initSidebar() {
    // 1. Create Floating Toggle Button
    const toggleBtn = document.createElement("div");
    toggleBtn.className = "fin-sidebar-toggle";
    toggleBtn.innerHTML = "✦"; // Or an SVG icon
    toggleBtn.title = "Open Assistant";
    toggleBtn.onclick = toggleSidebar;
    document.body.appendChild(toggleBtn);

    // 2. Create Sidebar Container
    sidebarEl = document.createElement("div");
    sidebarEl.className = "fin-sidebar";
    sidebarEl.innerHTML = `
      <div class="fin-sidebar-header">
        <span>Assistant</span>
        <div class="fin-sidebar-close">×</div>
      </div>
      <div class="fin-chat-history">
        <div class="fin-message model">Hello! How can I help you with your finance questions today?</div>
      </div>
      <div class="fin-chat-input-area">
        <textarea class="fin-chat-input" placeholder="Ask anything..."></textarea>
      </div>
    `;
    document.body.appendChild(sidebarEl);

    // 3. Cache Elements
    chatHistoryEl = sidebarEl.querySelector(".fin-chat-history");
    inputEl = sidebarEl.querySelector(".fin-chat-input");
    const closeBtn = sidebarEl.querySelector(".fin-sidebar-close");

    // 4. Event Listeners
    closeBtn.onclick = toggleSidebar;
    
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  function toggleSidebar() {
    isOpen = !isOpen;
    if (isOpen) {
      sidebarEl.classList.add("open");
      setTimeout(() => inputEl.focus(), 100);
    } else {
      sidebarEl.classList.remove("open");
    }
  }

  async function handleSendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Clear input
    inputEl.value = "";

    // Add User Message
    addMessageToUI("user", text);
    chatHistory.push({ role: "user", parts: [{ text: text }] });

    // Show Loading state (optional, or just wait)
    const loadingId = addMessageToUI("model", "Thinking...");

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory
        })
      });

      const data = await response.json();
      
      // Update loading message with real response and attach feedback controls
      updateMessageUI(loadingId, data.reply, data.traceId);
      
      // Add to history
      chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

    } catch (err) {
      updateMessageUI(loadingId, "Sorry, something went wrong.");
    }
  }

  async function sendSidebarFeedback(traceId, vote) {
    if (!traceId) return;

    try {
      await fetch("http://localhost:3000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traceId,
          vote,
          source: "sidebar",
        }),
      });
    } catch {
      // Best-effort; ignore client-side errors
    }
  }

  function addMessageToUI(role, text, traceId) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `fin-message ${role}`;
    msgDiv.id = "msg-" + Date.now();

    const contentDiv = document.createElement("div");
    contentDiv.className = "fin-message-content";
    contentDiv.innerText = text;
    msgDiv.appendChild(contentDiv);

    if (role === "model" && traceId) {
      const feedbackBar = document.createElement("div");
      feedbackBar.className = "fin-message-feedback";
      feedbackBar.innerHTML = `
        <span class="fin-message-feedback-label">Was this helpful?</span>
        <button class="fin-feedback-btn fin-feedback-up" data-vote="up" title="This was helpful">👍</button>
        <button class="fin-feedback-btn fin-feedback-down" data-vote="down" title="This wasn't helpful">👎</button>
      `;

      const buttons = feedbackBar.querySelectorAll(".fin-feedback-btn");
      buttons.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const vote = btn.getAttribute("data-vote");
          if (!vote) return;
          await sendSidebarFeedback(traceId, vote);
          feedbackBar.innerHTML = `<span class="fin-message-feedback-label">Thanks for your feedback.</span>`;
        });
      });

      msgDiv.appendChild(feedbackBar);
    }

    chatHistoryEl.appendChild(msgDiv);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return msgDiv.id;
  }

  function updateMessageUI(id, newText, traceId) {
    const el = document.getElementById(id);
    if (!el) return;

    // Reset contents so we can re-render with optional feedback
    el.innerHTML = "";
    const contentDiv = document.createElement("div");
    contentDiv.className = "fin-message-content";
    contentDiv.innerText = newText;
    el.appendChild(contentDiv);

    if (traceId) {
      const feedbackBar = document.createElement("div");
      feedbackBar.className = "fin-message-feedback";
      feedbackBar.innerHTML = `
        <span class="fin-message-feedback-label">Was this helpful?</span>
        <button class="fin-feedback-btn fin-feedback-up" data-vote="up" title="This was helpful">👍</button>
        <button class="fin-feedback-btn fin-feedback-down" data-vote="down" title="This wasn't helpful">👎</button>
      `;

      const buttons = feedbackBar.querySelectorAll(".fin-feedback-btn");
      buttons.forEach((btn) => {
        btn.addEventListener("click", async () => {
          const vote = btn.getAttribute("data-vote");
          if (!vote) return;
          await sendSidebarFeedback(traceId, vote);
          feedbackBar.innerHTML = `<span class="fin-message-feedback-label">Thanks for your feedback.</span>`;
        });
      });

      el.appendChild(feedbackBar);
    }
  }

  // Initialize on load
  initSidebar();
})();