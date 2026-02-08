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
      
      // Update loading message with real response
      updateMessageUI(loadingId, data.reply);
      
      // Add to history
      chatHistory.push({ role: "model", parts: [{ text: data.reply }] });

    } catch (err) {
      updateMessageUI(loadingId, "Sorry, something went wrong.");
    }
  }

  function addMessageToUI(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `fin-message ${role}`;
    msgDiv.innerText = text;
    msgDiv.id = "msg-" + Date.now();
    chatHistoryEl.appendChild(msgDiv);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    return msgDiv.id;
  }

  function updateMessageUI(id, newText) {
    const el = document.getElementById(id);
    if (el) el.innerText = newText;
  }

  // Initialize on load
  initSidebar();
})();