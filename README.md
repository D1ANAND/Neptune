# Neptune 🌊

**Neptune** is an AI-powered financial literacy assistant that helps users understand complex financial terms in simple, beginner-friendly language. It consists of a browser extension that provides instant explanations of selected text and an interactive chat assistant, powered by a Node.js backend using Google's Gemini AI with comprehensive observability through Opik.

## ✨ Features

### 🔍 **Instant Term Explanations**
- Select any financial term on any webpage
- Get AI-powered explanations in simple language (max 80 words)
- Context-aware explanations based on surrounding text
- Real-world examples included

### 💬 **Interactive Chat Assistant**
- Sidebar chat interface accessible from any webpage
- Conversational AI for deeper financial questions
- Maintains chat history for contextual responses
- Powered by Gemini 2.5 Flash

### 📊 **Built-in Observability**
- Full request tracing with Opik integration
- Automated clarity scoring for explanations
- LLM-as-a-Judge evaluation metrics
- Hierarchical trace visualization

## 🏗️ Architecture

```
Neptune/
├── backend/              # Express.js API server
│   ├── src/
│   │   └── index.ts     # Main server with Gemini & Opik integration
│   ├── package.json
│   └── tsconfig.json
│
└── extension/           # Chrome/Edge browser extension
    ├── manifest.json    # Extension configuration
    ├── content.js       # Text selection handler
    ├── sidebar.js       # Chat interface
    ├── overlay.js       # Explanation popup
    ├── overlay.css      # Styling
    └── background.js    # Service worker
```

### Technology Stack

**Backend:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **AI Model:** Google Gemini 2.5 Flash (`@google/genai`)
- **Observability:** Opik with `opik-gemini` integration
- **Environment:** dotenv for configuration

**Extension:**
- **Platform:** Chrome/Edge (Manifest V3)
- **Languages:** Vanilla JavaScript, CSS
- **Permissions:** `activeTab`, `contextMenus`

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **Opik Account** (optional, for observability)
- **Chrome** or **Edge** browser

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Neptune
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
OPIK_API_KEY=your_opik_api_key_here  # Optional
```

#### 3. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

The server will start at `http://localhost:3000`

#### 4. Load the Browser Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `Neptune/extension/` directory
5. The extension icon should appear in your toolbar

## 📖 Usage

### Text Selection Explanation

1. Navigate to any webpage with financial content
2. Select any financial term or phrase (minimum 3 characters)
3. Wait ~300ms for the explanation overlay to appear
4. Read the AI-generated, beginner-friendly explanation

### Chat Assistant

1. Click the **✦** floating button (bottom-right of any webpage)
2. Type your financial question in the chat input
3. Press **Enter** to send (Shift+Enter for new line)
4. Receive conversational AI responses
5. Click **×** to close the sidebar

## 🔌 API Reference

### `POST /explain`

Explains a selected financial term.

**Request Body:**
```json
{
  "text": "compound interest",
  "context": "When you invest money, compound interest helps...",
  "user_id": "optional_user_identifier"
}
```

**Response:**
```json
{
  "explanation": "Compound interest is when your money earns interest, and then that interest also earns interest...",
  "traceId": "opik_trace_id_12345"
}
```

### `POST /chat`

Handles conversational queries.

**Request Body:**
```json
{
  "message": "What's the difference between stocks and bonds?",
  "history": [
    { "role": "user", "parts": [{ "text": "Previous question" }] },
    { "role": "model", "parts": [{ "text": "Previous answer" }] }
  ]
}
```

**Response:**
```json
{
  "reply": "Stocks represent ownership in a company, while bonds are loans..."
}
```

## 🛠️ Development

### Project Scripts

**Backend:**
```bash
npm run dev          # Run with ts-node (development)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm test             # Run tests (not yet implemented)
```

### Code Structure

**Backend (`backend/src/index.ts`):**
- **Express Routes:** `/explain`, `/chat`
- **Opik Tracing:** Manual trace creation with hierarchical spans
- **Evaluation:** `evaluateClarity()` function for automated quality scoring
- **Error Handling:** Comprehensive try-catch with trace updates

**Extension:**
- **`content.js`:** Listens for text selection, triggers API calls
- **`sidebar.js`:** Manages chat UI state and history
- **`overlay.js`:** Creates and positions explanation tooltips
- **`overlay.css`:** Styling for overlay and sidebar components

### Customization

**Change AI Model:**
Edit `backend/src/index.ts`:
```typescript
const MODEL_NAME = "gemini-1.5-flash"; // or "gemini-2.0-flash"
```

**Adjust Explanation Length:**
Modify the prompt in the `/explain` route:
```typescript
Rules: Beginner friendly, Max 120 words, ...
```

**Styling:**
Edit `extension/overlay.css` to customize colors, animations, and layout.

## 🔍 Observability & Monitoring

Neptune uses **Opik** for comprehensive LLM observability:

- **Trace Hierarchy:** HTTP requests → LLM generations → Evaluations
- **Automatic Logging:** Input/output, latency, token usage
- **Custom Metrics:** Clarity scores via LLM-as-a-Judge
- **Tags & Metadata:** Organized by feature (explain, chat, evaluation)

View traces in your Opik dashboard to:
- Debug failed explanations
- Monitor response quality
- Analyze user interaction patterns
- Optimize prompt engineering

## 🐛 Troubleshooting

### Extension not working
- Verify backend is running on `http://localhost:3000`
- Check browser console for errors (F12 → Console)
- Ensure extension has `activeTab` permission
- Reload the extension from `chrome://extensions/`

### "GEMINI_API_KEY is missing" error
- Create `.env` file in `backend/` directory
- Add your API key: `GEMINI_API_KEY=your_key_here`
- Restart the backend server

### CORS errors
- Backend includes CORS middleware by default
- If issues persist, check browser console for specific origin errors

### Overlay not appearing
- Ensure you're selecting at least 3 characters
- Wait 300ms after selection
- Check if `overlay.js` is loaded in the page (Console → Sources)

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 🙏 Acknowledgments

- **Google Gemini** for powerful AI capabilities
- **Opik** for LLM observability infrastructure
- Built with ❤️ for financial literacy

---

**Made with Neptune 🌊 - Making finance simple for everyone**
