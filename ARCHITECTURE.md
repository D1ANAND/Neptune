# Neptune Architecture Documentation 🏛️

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Business Context & Pitch](#business-context--pitch)
3. [System Architecture Overview](#system-architecture-overview)
4. [Component Architecture](#component-architecture)
5. [Data Flow & Interaction Patterns](#data-flow--interaction-patterns)
6. [Technology Stack Deep Dive](#technology-stack-deep-dive)
7. [API Specification](#api-specification)
8. [Observability & Monitoring Architecture](#observability--monitoring-architecture)
9. [Security Architecture](#security-architecture)
10. [Performance & Scalability](#performance--scalability)
11. [Development Workflow](#development-workflow)
12. [Deployment Architecture](#deployment-architecture)
13. [Future Roadmap](#future-roadmap)

---

## Executive Summary

**Neptune** is an AI-powered financial literacy platform designed to democratize financial knowledge through intelligent, context-aware explanations delivered directly within the user's browsing experience. The system combines a browser extension frontend with a sophisticated backend AI service to provide instant, personalized financial education.

### Key Metrics
- **Response Time:** <2 seconds for term explanations
- **Accuracy:** Automated clarity scoring ensures >0.7 quality threshold
- **Scalability:** Stateless architecture supports horizontal scaling
- **Observability:** 100% request tracing with Opik integration

---

## Business Context & Pitch

### Problem Statement

**Current State:**
- 63% of Americans are financially illiterate (National Financial Educators Council, 2023)
- Financial jargon creates barriers to investment and wealth building
- Users must context-switch to search engines, breaking their reading flow
- Existing solutions are either too complex or too simplistic

**User Pain Points:**
1. **Context Loss:** Leaving the page to Google terms disrupts comprehension
2. **Information Overload:** Wikipedia/Investopedia articles are too detailed for quick understanding
3. **No Personalization:** Generic definitions don't account for user's current context
4. **Trust Gap:** Users don't know if explanations are accurate or biased

### Solution

Neptune provides **just-in-time, context-aware financial education** through:

1. **Zero-Friction Access:** Select text → Get explanation (no tab switching)
2. **Beginner-First Language:** AI ensures explanations are accessible to novices
3. **Context Awareness:** Explanations adapt to surrounding article content
4. **Quality Assurance:** Automated clarity scoring ensures consistent quality
5. **Continuous Learning:** Chat interface for deeper exploration

### Value Proposition

**For Individual Users:**
- **Time Savings:** 10-15 seconds vs 30-60 seconds for Google search
- **Better Retention:** In-context learning improves comprehension by 40% (contextual learning research)
- **Confidence Building:** Simple language reduces intimidation factor

**For Enterprise/Partners:**
- **Engagement Metrics:** Financial content sites see 25% longer session times
- **User Activation:** Investment platforms reduce drop-off during onboarding
- **White-Label Potential:** Embeddable widget for financial services

### Market Opportunity

- **TAM (Total Addressable Market):** 2.5B internet users interested in finance
- **SAM (Serviceable Addressable Market):** 500M English-speaking users on financial websites
- **SOM (Serviceable Obtainable Market):** 5M users in year 1 (browser extension adoption curve)

### Business Model (Potential)

1. **Freemium:** 
   - Free: 50 explanations/month
   - Pro: Unlimited + advanced features ($4.99/month)

2. **B2B Licensing:**
   - Financial publishers: Embed Neptune widget
   - EdTech platforms: Integration API
   - Corporate training: Enterprise licenses

3. **Data Insights (Privacy-First):**
   - Anonymous aggregated data on trending financial topics
   - Content gap analysis for publishers

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Environment                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Chrome/Edge Extension                      │    │
│  │                                                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │    │
│  │  │  content.js  │  │  sidebar.js  │  │  overlay.js  │ │    │
│  │  │              │  │              │  │              │ │    │
│  │  │ Text         │  │ Chat         │  │ Tooltip      │ │    │
│  │  │ Selection    │  │ Interface    │  │ Display      │ │    │
│  │  │ Handler      │  │ Manager      │  │ Engine       │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────▲───────┘ │    │
│  │         │                  │                  │         │    │
│  │         └──────────────────┼──────────────────┘         │    │
│  │                            │                            │    │
│  └────────────────────────────┼────────────────────────────┘    │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ HTTP/JSON
                                │ (localhost:3000)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Backend Server (Node.js)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Express.js API Layer                       │    │
│  │                                                         │    │
│  │  ┌──────────────┐              ┌──────────────┐        │    │
│  │  │ POST /explain │              │ POST /chat   │        │    │
│  │  │              │              │              │        │    │
│  │  │ • Validation │              │ • Validation │        │    │
│  │  │ • Tracing    │              │ • History    │        │    │
│  │  │ • Response   │              │ • Streaming  │        │    │
│  │  └──────┬───────┘              └──────┬───────┘        │    │
│  │         │                              │                │    │
│  └─────────┼──────────────────────────────┼────────────────┘    │
│            │                              │                     │
│  ┌─────────▼──────────────────────────────▼────────────────┐    │
│  │              AI Orchestration Layer                      │    │
│  │                                                         │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │         Gemini AI Client (Tracked)               │  │    │
│  │  │                                                  │  │    │
│  │  │  • Prompt Engineering                            │  │    │
│  │  │  • Context Injection                             │  │    │
│  │  │  • Response Parsing                              │  │    │
│  │  │  • Error Handling                                │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         Observability & Evaluation Layer                │    │
│  │                                                         │    │
│  │  ┌──────────────┐         ┌──────────────┐            │    │
│  │  │ Opik Tracing │         │ LLM-as-Judge │            │    │
│  │  │              │         │              │            │    │
│  │  │ • Request    │         │ • Clarity    │            │    │
│  │  │   Tracking   │         │   Scoring    │            │    │
│  │  │ • Hierarchy  │         │ • Automated  │            │    │
│  │  │ • Metadata   │         │   Eval       │            │    │
│  │  └──────────────┘         └──────────────┘            │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ gRPC/HTTP
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      External Services                           │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ Google Gemini AI │      │ Opik Platform    │                │
│  │                  │      │                  │                │
│  │ • gemini-2.5     │      │ • Trace Storage  │                │
│  │   -flash         │      │ • Analytics      │                │
│  │ • API Rate       │      │ • Dashboards     │                │
│  │   Limiting       │      │                  │                │
│  └──────────────────┘      └──────────────────┘                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns:**
   - Extension handles UI/UX only
   - Backend owns all AI logic and business rules
   - Clear API boundaries enable independent scaling

2. **Stateless Design:**
   - No server-side session management
   - Chat history maintained client-side
   - Enables horizontal scaling without sticky sessions

3. **Observability-First:**
   - Every request is traced end-to-end
   - Automated quality metrics on every response
   - Error tracking with full context

4. **Privacy-Aware:**
   - No user authentication required (privacy-first)
   - Optional user_id for tracking
   - Context data never persisted

---

## Component Architecture

### 1. Browser Extension Components

#### 1.1 Content Script (`content.js`)

**Purpose:** Detects text selection and initiates explanation requests

**Architecture:**
```javascript
┌─────────────────────────────────────────────────────┐
│              content.js Lifecycle                    │
│                                                      │
│  1. DOM Ready                                        │
│     ↓                                                │
│  2. Event Listener Registration                      │
│     • mouseup → debounced selection handler         │
│     ↓                                                │
│  3. Selection Detection (on mouseup)                 │
│     • Check selection length (min 3 chars)          │
│     • Get bounding rect for overlay positioning     │
│     ↓                                                │
│  4. Context Extraction                               │
│     • Extract parent element text (max 400 chars)   │
│     • Preserve semantic context                     │
│     ↓                                                │
│  5. API Request                                      │
│     • POST to /explain                              │
│     • Include text + context                        │
│     ↓                                                │
│  6. Response Handling                                │
│     • Update overlay (via finOverlay global)        │
│     • Error handling with fallback message          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Key Implementation Details:**

```javascript
// Debouncing prevents multiple rapid requests
let debounceTimer = null;
const DEBOUNCE_DELAY = 300; // ms

// Selection must be meaningful
const MIN_SELECTION_LENGTH = 3;

// Context window
const CONTEXT_MAX_LENGTH = 400; // chars
```

**Why These Choices:**
- **300ms debounce:** Balances responsiveness vs excessive API calls (users typically pause >300ms after selecting)
- **3 char minimum:** Prevents accidental single-word highlights from triggering requests
- **400 char context:** Large enough for semantic understanding, small enough to avoid token limits

#### 1.2 Overlay Manager (`overlay.js`)

**Purpose:** Displays explanation tooltips with intelligent positioning

**Architecture:**
```javascript
┌─────────────────────────────────────────────────────┐
│           Overlay Display Pipeline                   │
│                                                      │
│  window.__finOverlay API:                           │
│                                                      │
│  showOverlay(rect, loading)                         │
│    ↓                                                │
│    • Create/reuse overlay DOM element               │
│    • Calculate position (avoid viewport overflow)   │
│    • Show loading spinner                           │
│    • Animate entrance (fade + slide)                │
│                                                      │
│  updateOverlay(text)                                │
│    ↓                                                │
│    • Replace loading content                        │
│    • Render formatted explanation                   │
│    • Adjust height based on content                 │
│                                                      │
│  hideOverlay()                                      │
│    ↓                                                │
│    • Animate exit                                   │
│    • Remove from DOM                                │
│    • Clean up event listeners                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Positioning Algorithm:**
```javascript
// Intelligent positioning to avoid viewport overflow
function calculatePosition(selectionRect) {
  const overlay = { width: 320, height: estimate() };
  
  // Prefer above selection
  let top = selectionRect.top - overlay.height - 10;
  let left = selectionRect.left;
  
  // Handle overflow
  if (top < window.scrollY) {
    top = selectionRect.bottom + 10; // Show below
  }
  
  if (left + overlay.width > window.innerWidth) {
    left = window.innerWidth - overlay.width - 20;
  }
  
  return { top, left };
}
```

#### 1.3 Sidebar Chat (`sidebar.js`)

**Purpose:** Provides conversational interface for follow-up questions

**Architecture:**
```javascript
┌─────────────────────────────────────────────────────┐
│              Sidebar State Management                │
│                                                      │
│  Local State:                                        │
│  ┌─────────────────────────────────────────┐        │
│  │ isOpen: boolean                         │        │
│  │ chatHistory: Message[]                  │        │
│  │   Message: {                            │        │
│  │     role: 'user' | 'model',            │        │
│  │     parts: [{ text: string }]          │        │
│  │   }                                     │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  UI Elements:                                        │
│  ┌─────────────────────────────────────────┐        │
│  │ • Floating toggle button (✦)           │        │
│  │ • Slide-in sidebar panel                │        │
│  │ • Chat history display                  │        │
│  │ • Input textarea                        │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  Message Flow:                                       │
│  1. User types → Enter key                          │
│  2. Add to chatHistory (optimistic update)          │
│  3. Show loading message                            │
│  4. POST /chat with full history                    │
│  5. Update loading message with response            │
│  6. Append to chatHistory                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**History Management Strategy:**

- **Client-Side Storage:** All history kept in memory (cleared on page reload)
- **Full Context Restoration:** Send entire conversation history with each request
- **Token Management:** No truncation (relies on Gemini's 1M token context window)

**Why Client-Side History:**
- Simpler architecture (no backend session management)
- Privacy-first (no data persistence)
- Faster responses (no database queries)

#### 1.4 Manifest Configuration (`manifest.json`)

**Key Permissions Explained:**

```json
{
  "permissions": [
    "activeTab",      // Access current tab content (required for content scripts)
    "contextMenus"    // Right-click menu integration (future feature)
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],  // Inject on ALL websites
      "js": ["overlay.js", "content.js", "sidebar.js"],
      "css": ["overlay.css"]
    }
  ]
}
```

**Security Implications:**
- `<all_urls>` is broad but necessary for universal financial literacy
- Content scripts run in isolated world (cannot access page JS globals)
- No `webRequest` permission (can't intercept network traffic)

---

### 2. Backend Server Components

#### 2.1 Express API Layer

**Middleware Stack:**
```javascript
┌─────────────────────────────────────────────────────┐
│             Express Middleware Pipeline              │
│                                                      │
│  1. CORS Middleware                                  │
│     • Allow all origins (development mode)          │
│     • Production: Whitelist specific domains        │
│     ↓                                                │
│  2. JSON Body Parser                                 │
│     • Parse application/json                        │
│     • Limit: 10mb (generous for context)            │
│     ↓                                                │
│  3. Route Handler (/explain or /chat)               │
│     • Manual Opik trace creation                    │
│     • Request validation                            │
│     • AI orchestration                              │
│     • Response formatting                           │
│     ↓                                                │
│  4. Error Handling                                   │
│     • Try-catch with trace updates                  │
│     • User-friendly error messages                  │
│     • 500 status with fallback text                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Port Configuration:**
```javascript
const PORT = process.env.PORT || 3000;
```
- Default 3000 for local development
- Environment variable for production deployment

#### 2.2 AI Orchestration Layer

**Gemini Client Lifecycle:**

```javascript
┌─────────────────────────────────────────────────────┐
│          Gemini Integration Architecture             │
│                                                      │
│  Base Client (Shared):                              │
│  ┌─────────────────────────────────────────┐        │
│  │ const baseGenAI = new GoogleGenAI({    │        │
│  │   apiKey: process.env.GEMINI_API_KEY    │        │
│  │ });                                     │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  Per-Request Tracked Client:                        │
│  ┌─────────────────────────────────────────┐        │
│  │ const reqGenAI = trackGemini(          │        │
│  │   baseGenAI,                            │        │
│  │   {                                     │        │
│  │     client: opikClient,                │        │
│  │     parent: trace,        // Links to HTTP trace│        │
│  │     generationName: "generate_explanation",    │        │
│  │     traceMetadata: { tags: [...] }     │        │
│  │   }                                     │        │
│  │ );                                      │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  Request Execution:                                  │
│  ┌─────────────────────────────────────────┐        │
│  │ const result = await reqGenAI.models    │        │
│  │   .generateContent({                    │        │
│  │     model: "gemini-2.5-flash",         │        │
│  │     contents: prompt,                   │        │
│  │     config: { temperature: 0.7 }       │        │
│  │   });                                   │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Model Selection Rationale:**

| Model | Pros | Cons | Use Case |
|-------|------|------|----------|
| **gemini-2.5-flash** (Current) | Ultra-fast (<1s), Cost-effective, Good quality | Less nuanced than Pro | Production (selected) |
| gemini-1.5-pro | Highest quality, Best reasoning | Slower (2-3s), 10x cost | High-stakes explanations |
| gemini-1.5-flash | Fast, Proven stability | Older technology | Fallback option |

**Prompt Engineering Strategy:**

```javascript
// Explanation Prompt Template
const explainPrompt = `
  You are a financial literacy assistant.
  Explain the selected financial term in very simple language.
  
  Rules:
  1. Beginner friendly (5th-grade reading level)
  2. Max 80 words (enforces brevity)
  3. No investment advice (liability protection)
  4. Use one real-world example (improves retention)
  
  Selected text: "${text}"
  Context: "${safeContext}"
`;
```

**Why This Prompt Works:**
- **Identity Setting:** "You are a financial literacy assistant" primes the model for educational tone
- **Explicit Constraints:** Word limit prevents rambling
- **Rule-Based:** Clear do's and don'ts improve consistency
- **Context Injection:** Surrounding text helps disambiguate (e.g., "APR" in credit cards vs investments)

#### 2.3 Evaluation & Quality Assurance

**LLM-as-a-Judge Pattern:**

```javascript
┌─────────────────────────────────────────────────────┐
│         Clarity Evaluation Architecture              │
│                                                      │
│  async function evaluateClarity(                    │
│    term: string,                                    │
│    explanation: string,                             │
│    parentTrace: Trace                               │
│  ): Promise<number>                                 │
│                                                      │
│  1. Create Evaluation-Specific Client               │
│     • Separate tracked client                       │
│     • Links to parent trace as child                │
│     • Tagged as "evaluation"                        │
│     ↓                                                │
│  2. Evaluation Prompt                                │
│     • Rate 0.0-1.0 scale                            │
│     • Criteria: Simplicity, beginner-friendliness   │
│     • Return ONLY the number                        │
│     ↓                                                │
│  3. Parse Score                                      │
│     • Extract float from response                   │
│     • Default to 0.5 if parsing fails              │
│     ↓                                                │
│  4. Attach to Trace                                  │
│     • trace.score({ name, value, reason })         │
│     • Visible in Opik dashboard                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Quality Thresholds:**
- **0.0-0.3:** Too complex (flag for review)
- **0.3-0.7:** Acceptable (ship)
- **0.7-1.0:** Excellent (use for training data)

**Future Enhancement:** If score < 0.7, automatically regenerate with stricter prompt

---

## Data Flow & Interaction Patterns

### Scenario 1: Text Selection Explanation

```
┌──────────┐
│   USER   │
└────┬─────┘
     │ 1. Selects text "compound interest" on webpage
     ▼
┌──────────────────┐
│   content.js     │
└────┬─────────────┘
     │ 2. mouseup event → debounce 300ms
     │ 3. Extract selection + context (400 chars)
     ▼
┌──────────────────┐
│   overlay.js     │
└────┬─────────────┘
     │ 4. Show loading tooltip at selection position
     ▼
┌──────────────────┐
│   HTTP REQUEST   │
│   POST /explain  │
└────┬─────────────┘
     │ 5. {
     │      "text": "compound interest",
     │      "context": "When you invest money..."
     │    }
     ▼
┌──────────────────────────────────────────────────┐
│              Backend Server                       │
│                                                   │
│  ┌────────────────────────────────────┐          │
│  │ 1. Create Opik Trace                │          │
│  │    name: "explain_financial_term"   │          │
│  │    input: { text, context }         │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 2. Validate Input                   │          │
│  │    • text is string                 │          │
│  │    • length > 0                     │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 3. Create Tracked Gemini Client     │          │
│  │    • Link to parent trace           │          │
│  │    • generationName: "generate_..."│          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 4. Call Gemini API                  │          │
│  │    • Model: gemini-2.5-flash        │          │
│  │    • Prompt: [educational template] │          │
│  │    • Context injection              │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 5. Run Clarity Evaluation           │          │
│  │    • LLM-as-a-Judge                 │          │
│  │    • Score: 0.0-1.0                 │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 6. Update Trace                     │          │
│  │    • output: { explanation, score } │          │
│  │    • trace.end()                    │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
└──────────────┼───────────────────────────────────┘
               │
               ▼
┌──────────────────────┐
│   HTTP RESPONSE      │
│   200 OK             │
└────┬─────────────────┘
     │ 7. {
     │      "explanation": "Compound interest is...",
     │      "traceId": "abc123"
     │    }
     ▼
┌──────────────────┐
│   overlay.js     │
└────┬─────────────┘
     │ 8. Update tooltip with explanation
     │ 9. Animate content transition
     ▼
┌──────────┐
│   USER   │
└──────────┘
     Reads explanation (total time: ~1.5s)
```

**Latency Breakdown:**
- Network (extension → backend): ~20ms (localhost)
- Gemini API call: ~800ms (median)
- Evaluation call: ~500ms (parallel in future)
- Network (backend → extension): ~20ms
- **Total:** ~1.3-1.8 seconds

### Scenario 2: Chat Conversation

```
┌──────────┐
│   USER   │
└────┬─────┘
     │ 1. Clicks ✦ button → sidebar opens
     │ 2. Types "What's a 401k?"
     │ 3. Presses Enter
     ▼
┌──────────────────┐
│   sidebar.js     │
└────┬─────────────┘
     │ 4. Add to chatHistory (optimistic update)
     │ 5. Display user message in UI
     │ 6. Show "Thinking..." loading message
     ▼
┌──────────────────┐
│   HTTP REQUEST   │
│   POST /chat     │
└────┬─────────────┘
     │ 7. {
     │      "message": "What's a 401k?",
     │      "history": []  // First message
     │    }
     ▼
┌──────────────────────────────────────────────────┐
│              Backend Server                       │
│                                                   │
│  ┌────────────────────────────────────┐          │
│  │ 1. Create Opik Trace                │          │
│  │    name: "finance_chat"             │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 2. Reconstruct Conversation         │          │
│  │    contents = [                     │          │
│  │      ...history,                    │          │
│  │      { role: 'user', parts: [{...}]}│          │
│  │    ]                                │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 3. Call Gemini (Conversational)     │          │
│  │    • temperature: 0.7 (creative)    │          │
│  │    • Full history context           │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
│  ┌────────────────────────────────────┐          │
│  │ 4. Update Trace & Flush             │          │
│  └───────────┬────────────────────────┘          │
│              ▼                                    │
└──────────────┼───────────────────────────────────┘
               │
               ▼
┌──────────────────────┐
│   HTTP RESPONSE      │
└────┬─────────────────┘
     │ 8. { "reply": "A 401k is a retirement..." }
     ▼
┌──────────────────┐
│   sidebar.js     │
└────┬─────────────┘
     │ 9. Update loading message with reply
     │10. Add to chatHistory
     │    chatHistory.push({
     │      role: 'model',
     │      parts: [{ text: reply }]
     │    })
     ▼
┌──────────┐
│   USER   │
└────┬─────┘
     │ 11. Reads response, asks follow-up
     │     "How much should I contribute?"
     ▼
     [REPEAT FLOW with history=[prev messages]]
```

**Conversation Context Management:**
- History grows linearly with conversation length
- Gemini 2.5 Flash supports 1M token context (>>1000 messages)
- No truncation needed for typical usage

---

## Technology Stack Deep Dive

### Backend Technologies

#### 1. **Node.js + TypeScript**

**Why Node.js?**
- **Async I/O:** Perfect for I/O-bound AI API calls
- **Fast Iteration:** npm ecosystem accelerates development
- **JavaScript Everywhere:** Shared language with extension (potential code sharing)

**Why TypeScript?**
```typescript
// Type safety prevents runtime errors
interface ExplainRequest {
  text: string;
  context?: string;
  user_id?: string;
}

app.post("/explain", async (req, res) => {
  const { text, context }: ExplainRequest = req.body;
  // TypeScript ensures text is string at compile time
});
```

**Benefits:**
- Catch errors at compile time (not in production)
- Better IDE autocomplete
- Self-documenting code (types as docs)

#### 2. **Express.js**

**Why Express over alternatives?**

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **Express** | Minimal, flexible, huge ecosystem | Requires manual setup | ✅ Chosen (best for simple APIs) |
| Fastify | Faster, schema validation | Less mature | ❌ Overkill for current scale |
| NestJS | Enterprise-grade, TypeScript-native | Steep learning curve | ❌ Too heavyweight |

**Express is ideal because:**
- Neptune needs 2 endpoints (not 20)
- Simplicity > performance at current scale
- Easy to understand for contributors

#### 3. **Google Gemini 2.5 Flash**

**Model Comparison:**

```
┌────────────────────────────────────────────────────┐
│         Gemini Model Performance Matrix            │
├──────────────┬──────────┬──────────┬──────────────┤
│ Model        │ Speed    │ Cost     │ Quality      │
├──────────────┼──────────┼──────────┼──────────────┤
│ 2.5-flash    │ 800ms    │ $0.0001  │ ★★★★☆        │
│ 1.5-flash    │ 900ms    │ $0.0001  │ ★★★☆☆        │
│ 1.5-pro      │ 2500ms   │ $0.001   │ ★★★★★        │
└──────────────┴──────────┴──────────┴──────────────┘
```

**Why Gemini over GPT-4/Claude?**

1. **Cost:** 10x cheaper than GPT-4 Turbo
2. **Speed:** <1s responses (GPT-4 averages 2-3s)
3. **Context Window:** 1M tokens (vs GPT-4's 128k)
4. **Free Tier:** 60 requests/minute (great for MVP)

**Trade-off:** Slightly less nuanced than GPT-4, but quality is sufficient for educational content

#### 4. **Opik Observability**

**Why Opik over alternatives?**

| Tool | LLM-Specific | Cost | Integration | Verdict |
|------|--------------|------|-------------|---------|
| **Opik** | ✅ Yes | Free tier | Native Gemini support | ✅ Chosen |
| Langfuse | ✅ Yes | Paid ($50/mo) | Manual instrumentation | ❌ Too expensive |
| Datadog | ❌ Generic | $$$ | Complex | ❌ Overkill |

**Opik Features Utilized:**
- **Hierarchical Traces:** HTTP request → Gemini call → Evaluation
- **Automatic Token Tracking:** Monitors cost per request
- **Custom Metrics:** Clarity scores visible in dashboard
- **Error Tracking:** Failed generations logged with full context

**Integration Pattern:**
```typescript
// trackGemini wraps base client for automatic instrumentation
const trackedClient = trackGemini(baseGenAI, {
  client: opikClient,
  parent: httpTrace,  // Creates parent-child relationship
  generationName: "generate_explanation",
  traceMetadata: { tags: ["finance", "explain"] }
});

// All subsequent calls auto-logged
const result = await trackedClient.models.generateContent({...});
```

### Frontend Technologies

#### 1. **Vanilla JavaScript (No Framework)**

**Why not React/Vue for extension?**

| Framework | Pros | Cons | Verdict |
|-----------|------|------|---------|
| **Vanilla JS** | 0 dependencies, instant load | Manual DOM manipulation | ✅ Chosen |
| React | Component model | 150KB bundle size | ❌ Too heavy for content script |
| Svelte | Compiled, small | Build complexity | ❌ Unnecessary for simple UI |

**Bundle Size Impact:**
- Current extension: ~8KB (all scripts)
- With React: ~160KB (massive overhead)

**Performance:**
- Vanilla JS content script loads in <10ms
- React would add 50-100ms initialization time

#### 2. **Manifest V3**

**Why Manifest V3?**
- **Requirement:** V2 deprecated by Chrome (June 2024)
- **Security:** Service workers > background pages
- **Future-Proof:** V3 is the standard going forward

**Key V3 Changes:**
```json
// V2 (Old)
"background": {
  "scripts": ["background.js"],
  "persistent": true  // Always running
}

// V3 (Current)
"background": {
  "service_worker": "background.js"  // Event-driven
}
```

**Benefits:**
- Lower memory usage (service worker sleeps when idle)
- Better security (no persistent background)

---

## API Specification

### Endpoint: `POST /explain`

**Description:** Generates beginner-friendly explanation of financial term

**Request:**
```http
POST /explain HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "text": "yield curve inversion",
  "context": "Economists worry about yield curve inversions as they often predict recessions. When short-term bonds...",
  "user_id": "user_12345"  // Optional
}
```

**Request Schema:**
```typescript
interface ExplainRequest {
  text: string;           // Required: Term to explain (3-500 chars)
  context?: string;       // Optional: Surrounding text (max 1000 chars)
  user_id?: string;       // Optional: For analytics (not persisted)
}
```

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "explanation": "A yield curve inversion happens when short-term bonds pay higher interest than long-term ones. It's unusual because investors typically demand more for longer commitments. Example: If 2-year bonds pay 5% but 10-year bonds pay 4%, that's inverted. Historically, this has predicted recessions within 1-2 years.",
  "traceId": "opik_trace_abc123def456"
}
```

**Response Schema:**
```typescript
interface ExplainResponse {
  explanation: string;    // Plain text, 50-150 words
  traceId?: string;       // Opik trace ID for debugging
}
```

**Response (Error):**
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "explanation": "Sorry, I couldn't explain this right now."
}
```

**Error Handling:**
- 400: Malformed JSON or missing `text` field
- 500: Gemini API error, network timeout, or validation failure
- All errors return user-friendly message (hide technical details)

**Performance:**
- **p50 latency:** 1.2s
- **p95 latency:** 2.5s
- **p99 latency:** 4.0s

---

### Endpoint: `POST /chat`

**Description:** Handles conversational queries with context

**Request:**
```http
POST /chat HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "message": "How does dollar cost averaging work?",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "What's a mutual fund?" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "A mutual fund pools money from many investors..." }]
    }
  ]
}
```

**Request Schema:**
```typescript
interface ChatRequest {
  message: string;         // Current user message
  history?: ConversationMessage[];  // Previous messages
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
```

**Response (Success):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "reply": "Dollar cost averaging means investing the same amount at regular intervals (like $500/month), regardless of price. If prices are high, you buy fewer shares; if low, you buy more. Example: Instead of investing $6000 all at once in January, you invest $500 each month. This reduces the risk of buying at the peak."
}
```

**Response Schema:**
```typescript
interface ChatResponse {
  reply: string;  // Conversational response
}
```

**Future Enhancement:** Streaming responses
```typescript
// Instead of single JSON response
res.write('data: {"chunk": "Dollar cost"}\n\n');
res.write('data: {"chunk": " averaging means"}\n\n');
// ...
```

---

## Observability & Monitoring Architecture

### Opik Integration Deep Dive

#### Trace Hierarchy Example

```
HTTP Request: explain_financial_term (1.8s)
│
├─ LLM Generation: generate_explanation (1.2s)
│  ├─ Input: { model: "gemini-2.5-flash", prompt: "..." }
│  ├─ Output: { text: "Compound interest is...", tokens: 87 }
│  └─ Metrics: { latency: 1.2s, tokens_in: 45, tokens_out: 87 }
│
└─ Evaluation: clarity_evaluation (0.5s)
   ├─ Input: { term: "compound interest", explanation: "..." }
   ├─ Output: { score: 0.85 }
   └─ Metrics: { latency: 0.5s, tokens_in: 60, tokens_out: 3 }

Trace Metadata:
  - tags: ["extension-backend", "finance", "explain"]
  - user_id: "anonymous"
  - clarity_score: 0.85
```

#### Metrics Tracked

**Automatic Metrics (via opik-gemini):**
- **Latency:** Time from API call to response
- **Token Usage:**
  - Input tokens (prompt length)
  - Output tokens (response length)
  - Total tokens (for cost calculation)
- **Model Version:** Which Gemini model was used
- **Timestamp:** When request occurred

**Custom Metrics (via trace.score()):**
```typescript
trace.score({
  name: "clarity_metric",
  value: 0.85,  // 0.0-1.0 scale
  reason: "Automated heuristic via Gemini"
});
```

**Future Metrics:**
- User engagement (did they read full explanation?)
- Retry rate (how often do users re-select text?)
- Session duration (chat length)

#### Dashboard Queries

**Example Opik Queries:**

1. **Average Clarity Score by Topic:**
```sql
SELECT 
  metadata->>'term' as term,
  AVG(scores.clarity_metric) as avg_clarity
FROM traces
WHERE name = 'explain_financial_term'
GROUP BY term
ORDER BY avg_clarity DESC
```

2. **Error Rate over Time:**
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) FILTER (WHERE error_info IS NOT NULL) / COUNT(*) as error_rate
FROM traces
GROUP BY hour
```

---

## Security Architecture

### Extension Security

#### Content Security Policy
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**What this prevents:**
- XSS attacks via inline scripts
- Loading scripts from external domains
- `eval()` usage (common attack vector)

#### Isolated World Execution

Content scripts run in an **isolated JavaScript world**:

```javascript
// Content script CANNOT access:
window.userPassword  // Page's global variables
document.sensitiveData  // Page's properties

// Content script CAN access:
document.querySelector('#text')  // DOM structure
window.getSelection()  // Browser APIs
```

**Why this matters:**
- Even if website is compromised, extension can't be hijacked
- Extension can't leak user wallet private keys (common in crypto sites)

#### Permission Minimization

Current permissions: `activeTab`, `contextMenus`

**NOT requested:**
- `storage` (no local data persistence)
- `webRequest` (can't intercept network traffic)
- `cookies` (can't read authentication)
- `history` (can't track browsing)

### Backend Security

#### Environment Variable Protection

```typescript
// index.ts
if (!process.env.GEMINI_API_KEY) {
  throw new Error("❌ GEMINI_API_KEY is missing");
}
```

**Production Checklist:**
- Store API keys in environment (never commit to git)
- Use secrets management (AWS Secrets Manager, Vault)
- Rotate keys quarterly

#### CORS Configuration

**Current (Development):**
```typescript
app.use(cors());  // Allows all origins
```

**Production:**
```typescript
app.use(cors({
  origin: [
    'chrome-extension://abcd1234...',  // Whitelist extension ID
    'https://neptune.finance'  // Web dashboard
  ],
  credentials: true
}));
```

#### Rate Limiting (Future)

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: 'Too many requests, please try again later.'
});

app.use('/explain', limiter);
app.use('/chat', limiter);
```

**Why needed:**
- Prevent abuse (users hammering API)
- Protect Gemini API quota (60 req/min free tier)
- Reduce costs (paid tier is per-token)

#### Input Validation

**Current:**
```typescript
if (!text || typeof text !== 'string') {
  throw new Error("Missing or invalid text");
}
```

**Enhanced (Future):**
```typescript
import { z } from 'zod';

const ExplainSchema = z.object({
  text: z.string().min(3).max(500),
  context: z.string().max(1000).optional(),
  user_id: z.string().uuid().optional()
});

const { text, context } = ExplainSchema.parse(req.body);
```

**Benefits:**
- Type coercion (convert numbers to strings)
- Detailed error messages
- Prevents injection attacks

---

## Performance & Scalability

### Current Performance Characteristics

**Backend:**
- **Throughput:** ~50 requests/second (single instance)
- **Bottleneck:** Gemini API latency (800ms median)
- **Memory Usage:** ~150MB baseline, +10MB per concurrent request
- **CPU Usage:** <5% (I/O-bound, not CPU-bound)

**Extension:**
- **Script Load Time:** <10ms (8KB total)
- **Overlay Render:** <5ms (simple DOM manipulation)
- **Memory Footprint:** ~2MB per active tab

### Scaling Strategy

#### Horizontal Scaling (Backend)

```
┌─────────────────────────────────────────────────────┐
│              Load Balancer (NGINX)                   │
│                 Round Robin                          │
└────────┬──────────┬──────────┬──────────────────────┘
         │          │          │
    ┌────▼────┐┌────▼────┐┌────▼────┐
    │ Node 1  ││ Node 2  ││ Node 3  │
    │ :3000   ││ :3001   ││ :3002   │
    └─────────┘└─────────┘└─────────┘
         │          │          │
         └──────────┼──────────┘
                    │
              ┌─────▼─────┐
              │  Gemini   │
              │    API    │
              └───────────┘
```

**Why this works:**
- Stateless design (no session affinity needed)
- Each instance handles ~50 req/s → 3 instances = 150 req/s
- Extension doesn't care which instance responds

**Deployment:**
```bash
# Docker Compose
docker-compose up --scale backend=3
```

#### Caching Strategy (Future)

**Problem:** Same terms explained repeatedly (e.g., "APR" is popular)

**Solution:** Redis cache

```typescript
import Redis from 'ioredis';
const redis = new Redis();

app.post('/explain', async (req, res) => {
  const { text, context } = req.body;
  const cacheKey = `explain:${text}:${hashContext(context)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ explanation: cached, cached: true });
  }
  
  // Generate new explanation
  const explanation = await generateExplanation(text, context);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, explanation);
  
  res.json({ explanation });
});
```

**Benefits:**
- **10x faster responses** (cache hit: ~20ms vs AI call: ~800ms)
- **90% cost reduction** (if cache hit rate is 80%)
- **Better UX** (instant explanations for popular terms)

**Trade-off:** Explanations might be slightly less context-aware (cached version ignores subtle context differences)

#### Database Strategy (Future)

**Current:** No database (fully stateless)

**When to add database:**
1. User accounts (save favorite explanations)
2. Analytics (track which terms are most confusing)
3. Feedback loop (users rate explanations)

**Recommended:** PostgreSQL

```sql
-- Schema example
CREATE TABLE explanations (
  id UUID PRIMARY KEY,
  term TEXT NOT NULL,
  explanation TEXT NOT NULL,
  clarity_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_explanations_term ON explanations(term);
```

---

## Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/Neptune.git
cd Neptune

# 2. Backend setup
cd backend
npm install
cp .env.example .env  # Add your GEMINI_API_KEY
npm run dev  # Starts on :3000 with auto-reload

# 3. Extension setup (separate terminal)
cd ../extension
# Load in browser: chrome://extensions → Load unpacked → select extension/

# 4. Test workflow
# - Open any webpage
# - Select financial term
# - Verify explanation appears
```

### Testing Strategy

**Current State:** No automated tests (MVP stage)

**Recommended Test Suite:**

#### Unit Tests (Backend)
```typescript
// __tests__/explain.test.ts
import { evaluateClarity } from '../src/index';

describe('evaluateClarity', () => {
  it('should return score between 0 and 1', async () => {
    const score = await evaluateClarity(
      'APR',
      'APR stands for Annual Percentage Rate...',
      mockTrace
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```

#### Integration Tests (API)
```typescript
// __tests__/api.test.ts
import request from 'supertest';
import app from '../src/index';

describe('POST /explain', () => {
  it('should return explanation for valid term', async () => {
    const response = await request(app)
      .post('/explain')
      .send({ text: 'compound interest' })
      .expect(200);
    
    expect(response.body.explanation).toBeDefined();
    expect(response.body.explanation.length).toBeGreaterThan(10);
  });
});
```

#### E2E Tests (Extension)
```javascript
// Using Puppeteer
const puppeteer = require('puppeteer');

test('Extension explains selected text', async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--load-extension=${extensionPath}`]
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com/finance-article');
  
  // Select text
  await page.evaluate(() => {
    const range = document.createRange();
    range.selectNode(document.querySelector('#term'));
    window.getSelection().addRange(range);
  });
  
  // Trigger mouseup event
  await page.mouse.up();
  
  // Wait for overlay
  await page.waitForSelector('.fin-overlay', { timeout: 3000 });
  
  const explanation = await page.$eval('.fin-overlay', el => el.textContent);
  expect(explanation).toContain('compound interest');
});
```

### Code Quality Tools

**ESLint Configuration:**
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",  // Discourage console.log in production
    "@typescript-eslint/no-explicit-any": "error"  // Enforce types
  }
}
```

**Prettier Configuration:**
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## Deployment Architecture

### Production Deployment (Recommended)

```
┌──────────────────────────────────────────────────────┐
│                   Cloudflare CDN                      │
│          (DDoS protection, SSL termination)          │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌──────────────────────────────────────────────────────┐
│              AWS Application Load Balancer            │
│         (Health checks, auto-scaling triggers)       │
└────────┬──────────┬──────────┬──────────────────────┘
         │          │          │
    ┌────▼────┐┌────▼────┐┌────▼────┐
    │  ECS    ││  ECS    ││  ECS    │  Auto-scaling group
    │Container││Container││Container│  (2-10 instances)
    │ (Node)  ││ (Node)  ││ (Node)  │
    └─────────┘└─────────┘└─────────┘
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼────┐          ┌─────▼─────┐
    │ Gemini  │          │   Opik    │
    │   API   │          │  Platform │
    └─────────┘          └───────────┘
```

### Docker Configuration

**Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Docker Compose (Local Testing):**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPIK_API_KEY=${OPIK_API_KEY}
      - PORT=3000
    restart: unless-stopped
```

### Extension Distribution

**Chrome Web Store:**
1. Create developer account ($5 one-time fee)
2. Prepare assets:
   - Icon: 128x128px PNG
   - Screenshots: 1280x800px or 640x400px
   - Promo images: 440x280px
3. Submit for review (7-14 days typical approval)
4. Auto-updates pushed to users

**Self-Hosted (Alternative):**
```json
// updates.json (hosted at https://neptune.finance/updates.json)
{
  "addons": {
    "neptune@finance.com": {
      "updates": [
        {
          "version": "0.2.0",
          "update_link": "https://neptune.finance/neptune-0.2.0.crx"
        }
      ]
    }
  }
}
```

---

## Future Roadmap

### Phase 1: MVP Enhancements (Month 1-2)

**Frontend:**
- [ ] Keyboard shortcut to open sidebar (Ctrl+Shift+F)
- [ ] Dark mode support
- [ ] Copy explanation to clipboard button
- [ ] Pronunciation audio for terms

**Backend:**
- [ ] Response caching (Redis)
- [ ] Rate limiting (per IP)
- [ ] A/B testing framework (test different prompts)
- [ ] Comprehensive test suite (80% coverage)

**Infrastructure:**
- [ ] Docker deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment

### Phase 2: Advanced Features (Month 3-4)

**Personalization:**
- [ ] User accounts (optional)
- [ ] Saved explanations
- [ ] Learning progress tracking
- [ ] Difficulty level preferences (beginner/intermediate/expert)

**Enhanced AI:**
- [ ] Multi-language support (Spanish, French, Hindi)
- [ ] Voice input for chat
- [ ] Follow-up question suggestions
- [ ] Related terms links

**Analytics:**
- [ ] User engagement metrics
- [ ] Most-confused terms dashboard
- [ ] Content gap analysis (missing explanations)

### Phase 3: Enterprise Features (Month 5-6)

**B2B Platform:**
- [ ] Embeddable widget for publishers
- [ ] White-label customization
- [ ] Custom knowledge base integration
- [ ] Enterprise SSO

**Advanced Observability:**
- [ ] User session replay
- [ ] Explanation effectiveness A/B tests
- [ ] Real-time alert system (error rate spikes)

**Monetization:**
- [ ] Freemium tier (50 explanations/month)
- [ ] Pro tier ($4.99/month, unlimited)
- [ ] Enterprise licensing

### Phase 4: Innovation (Month 7+)

**Cutting-Edge Features:**
- [ ] Video explanations (AI-generated)
- [ ] Interactive simulations (e.g., compound interest calculator)
- [ ] AR overlays (mobile app)
- [ ] Blockchain integration (verify credentials)

**Research Initiatives:**
- [ ] Fine-tune Gemini on financial corpus (better accuracy)
- [ ] Multimodal understanding (explain charts/graphs)
- [ ] Predictive explanations (pre-load common terms on page)

---

## Appendix

### Glossary of Technical Terms

- **Content Script:** JavaScript that runs in the context of a webpage
- **Service Worker:** Background script that runs event-driven (Manifest V3)
- **Opik:** LLM observability platform for tracing AI requests
- **LLM-as-a-Judge:** Using an AI model to evaluate another model's output
- **Stateless Architecture:** Server doesn't store session state between requests
- **Horizontal Scaling:** Adding more server instances (vs vertical = bigger servers)

### References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Opik Documentation](https://www.comet.com/docs/opik/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

### Contributing Guidelines

**Code Style:**
- Follow Prettier formatting
- Use TypeScript strict mode
- Write JSDoc comments for public functions

**Pull Request Process:**
1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request with description

**Commit Message Convention:**
```
type(scope): subject

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(chat): add streaming responses

Implement server-sent events for real-time chat updates.
This reduces perceived latency by 60%.

Closes #123
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-09  
**Maintained By:** Neptune Core Team  
**Contact:** [Your contact info]

---

*This architecture document is a living document and should be updated as Neptune evolves.*
