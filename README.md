# ⚡ Puble / Pumble Automation Suite with Groq AI

A modern, full-featured **Next.js 14** web application designed to manage and automate your **Pumble / Puble** workspace accounts, chats, and private groups with **Groq AI (Llama 3.3)**.

Includes automated keyword-based and Groq AI LLM auto-responders, multi-emoji auto-reactions, channel/group automation controls, scheduled broadcasts, an interactive live chat simulator, and full audit logging.

---

## ⚡ Groq AI Integration

This app integrates the **Groq AI API** for ultra-fast (sub-200ms) LLM inference:
- **Groq Smart Auto-Responders**: Automatically parses incoming message context and uses **Llama 3.3 70B** to draft helpful, natural replies.
- **Groq Sentiment Auto-Reactions**: Dynamically analyzes the emotion and intent of messages to select the best 1–3 emoji reactions.
- **Supported Groq Models**:
  - `llama-3.3-70b-versatile` (Default — State-of-the-art intelligence)
  - `llama-3.1-8b-instant` (Ultra-fast, lowest latency)
  - `mixtral-8x7b-32768` (High context capacity)
  - `gemma2-9b-it` (Google Gemma 2)
- **Built-in Speed & Latency Tester**: Benchmark tokens and latency directly inside the Settings page.

---

## 🚀 Key Features

1. **Groq AI & Static Auto-Responders Engine**
   - **Generation Engines**: Choose between **Groq AI (Llama 3.3)**, **Static Text**, or **Random Pool**.
   - **Custom Prompts per Rule**: Define tailored instructions for each rule (e.g. "Technical support triage", "Sales FAQ lead").
   - **Trigger Modes**: Exact Match, Contains Keyword(s), Bot Mention (`@bot`), and Regular Expressions (Regex).
   - **Dynamic Placeholders**: Automatic replacement for `@{user}`, `#{channel}`, `{time}`, and `{date}`.
   - **Cooldown & Rate Limiting**: Anti-spam cooldown interval per rule.

2. **Auto-Reactions Engine**
   - **Groq AI Sentiment**: Automatically reacts based on AI contextual comprehension.
   - **Keyword & Static Chains**: Multi-emoji chains (e.g. `🎉`, `🚀`, `👍`, `❤️`, `👀`).
   - **Human-like Timing**: Configurable delay slider (0–5000ms) and probability percentage slider (10%–100%).

3. **Channels & Groups Manager**
   - Granular per-channel toggles: Enable/disable Auto-Reply and Auto-React per channel or group.
   - Automated **Welcome Messages** for new members joining specific channels.
   - Quick-connect interface for public channels, private groups, and DMs.

4. **Scheduled Announcements & Reminders**
   - Schedule recurring team standups, Friday wrap-ups, reminders, and broadcast announcements.
   - Recurring frequencies: Daily, Weekdays (Mon–Fri), Hourly, or One-time.
   - "Send Now" one-click broadcast button.

5. **Live Interactive Simulator**
   - Built-in live Pumble chat playground to test all your auto-responders, Groq AI replies, and emoji reactions in real-time.
   - Real-time engine event inspector shows matching rules, model used, and latency in milliseconds.

6. **Activity & Audit Logs**
   - Full audit trail of incoming messages, Groq AI completions, bot replies, and emoji reactions.
   - Search by keyword or sender, filter by event type, and 1-click **Export to JSON**.

7. **Pumble API & Webhooks Ready**
   - Incoming Webhook endpoint: `/api/pumble/webhook`.
   - REST API endpoints for dispatching messages, reactions, and verification.
   - Full configuration JSON export, import, and backup restore.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Groq API Key (get one for free at [https://console.groq.com/keys](https://console.groq.com/keys)):
```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

*(Note: You can also enter and test your Groq API Key directly in the UI under **Bot & API Settings**!)*

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

```
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard & analytics overview
│   │   ├── responders/page.tsx         # Auto-responder rules CRUD (AI + Static)
│   │   ├── reactions/page.tsx          # Auto-reaction rules & emoji manager
│   │   ├── channels/page.tsx           # Channels & Groups management
│   │   ├── scheduled/page.tsx          # Scheduled broadcasts & reminders
│   │   ├── simulator/page.tsx          # Interactive live chat & Groq AI debugger
│   │   ├── logs/page.tsx               # Audit logs & JSON exporter
│   │   ├── settings/page.tsx           # Groq AI & Pumble API settings
│   │   ├── api/
│   │   │   ├── groq/
│   │   │   │   ├── generate/route.ts   # Groq Llama 3 generation route
│   │   │   │   └── react/route.ts      # Groq AI sentiment reaction route
│   │   │   └── pumble/
│   │   │       ├── webhook/route.ts    # Webhook listener with Groq integration
│   │   │       ├── send-message/route.ts
│   │   │       ├── send-reaction/route.ts
│   │   │       └── verify/route.ts
│   │   ├── globals.css                 # Dark modern styling with Tailwind
│   │   └── layout.tsx                  # Root layout with Sidebar and Toast provider
│   ├── components/
│   │   ├── Sidebar.tsx                 # Navigation bar
│   │   ├── Header.tsx                  # Master killswitches & status
│   │   ├── RuleModal.tsx               # Responder creation with Groq prompt settings
│   │   ├── ReactionModal.tsx           # Reaction creation & edit dialog
│   │   └── Toast.tsx                   # Toast notification system
│   ├── lib/
│   │   ├── groq.ts                     # Groq REST API client & prompt engineer
│   │   ├── pumble-service.ts           # Core automation & matching engine
│   │   └── storage.ts                  # LocalStorage sync & default presets
│   └── types/
│       └── pumble.ts                   # TypeScript interfaces & types
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```
