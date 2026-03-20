<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Groq-Llama_3.3-orange?style=for-the-badge" />
</p>

<h1 align="center">⚡ AI Planning Agent</h1>

<p align="center">
  <strong>A multi-agent AI system that turns problem statements into professional, exportable execution plans.</strong>
</p>

<p align="center">
  <a href="#demo">Demo</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#project-structure">Project Structure</a>
</p>

---

## Demo

> **Live:** [your-app.vercel.app](https://your-app.vercel.app)
> **Loom Walkthrough:** [Watch Video](#)

| Light Mode | Dark Mode |
|---|---|
| ![Light Mode](#) | ![Dark Mode](#) |

---

## Features

### Core

- **Multi-Agent Pipeline** — Three specialized AI agents (Planner → Insight → Execution) work sequentially, each building on the previous agent's output. This is **not** a single-prompt solution.
- **Structured Report Output** — Clean, report-style UI with four sections: Problem Breakdown, Stakeholders, Solution Approach, and Action Plan.
- **AI-Powered Section Editing** — Click "AI Edit" on any section and use natural language instructions like *"Make this more detailed"* or *"Rewrite in a professional tone."* Only that section gets re-processed.
- **Export as DOCX & PDF** — Download professionally formatted documents with proper headings, colored section bars, bullet points, and clean typography.

### Bonus

- **Streaming Responses** — Watch each agent's output appear in real-time via Server-Sent Events (SSE).
- **Agent Reasoning Steps** — Expand any completed agent to see its reasoning/thought process.
- **Version History** — Every AI edit creates a new version. Restore any previous version with one click.
- **Dark / Light Mode** — Full theme toggle with true black dark mode (`#09090b`). Persists your preference.
- **Responsive Design** — Works across desktop, tablet, and mobile.

---

## Architecture

### Multi-Agent Pipeline

This is the critical architectural decision. The system uses **three independent agents**, each implemented as a separate Next.js API route with its own system prompt:

```
User Input
    │
    ▼
┌─────────────────────┐
│   Planner Agent      │  → Breaks problem into components
│   /api/agents/planner│  → Identifies stakeholders
└─────────┬───────────┘
          │ output feeds into
          ▼
┌─────────────────────┐
│   Insight Agent      │  → Enriches with strategic context
│   /api/agents/insight│  → Adds market/technical insights
└─────────┬───────────┘
          │ both outputs feed into
          ▼
┌─────────────────────┐
│   Execution Agent    │  → Synthesizes into final report
│   /api/agents/exec   │  → Produces 4 structured sections
└─────────┬───────────┘
          │
          ▼
    Structured Report
    (editable + exportable)
```

### Why This Matters

- Each agent has a **dedicated system prompt** optimized for its role
- Agents communicate via **structured JSON** — not string concatenation
- The Execution Agent receives **both** the Planner and Insight outputs, enabling synthesis
- Section editing uses a **separate edit agent** that processes only the targeted section

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side API routes + React client |
| **AI** | Groq (Llama 3.3 70B) | Fastest inference speed for live demos |
| **Styling** | Tailwind CSS 4 | Utility-first, CSS variable theming |
| **DOCX Export** | `docx` library | Proper Word document generation |
| **PDF Export** | `jsPDF` | Client-side PDF with color-coded sections |
| **Language** | TypeScript | Full type safety across agents |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ai-planning-agent.git
cd ai-planning-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

Add your Groq API key to `.env.local`:

```env
GROQ_API_KEY=gsk_your_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Then add `GROQ_API_KEY` as an environment variable in your Vercel project dashboard:

**Settings → Environment Variables → Add `GROQ_API_KEY`**

### Other Platforms

The app is a standard Next.js application. It can be deployed to any platform that supports Node.js:

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agents/
│   │   │   ├── planner/route.ts     ← Planner Agent (SSE streaming)
│   │   │   ├── insight/route.ts     ← Insight Agent (SSE streaming)
│   │   │   └── execution/route.ts   ← Execution Agent (SSE streaming)
│   │   └── edit-section/route.ts    ← Section-level AI editing
│   ├── layout.tsx                   ← Root layout
│   ├── page.tsx                     ← Main application (client component)
│   └── globals.css                  ← Theme variables (light + dark)
│
├── components/
│   ├── AgentProgress.tsx            ← Pipeline visualization + reasoning
│   ├── ReportSection.tsx            ← Section card with AI edit + versions
│   └── ExportButtons.tsx            ← DOCX & PDF generation
│
├── hooks/
│   ├── useAgentPipeline.ts          ← Core orchestration (runs 3 agents)
│   └── useTheme.ts                  ← Dark/light mode toggle
│
├── lib/
│   ├── groq.ts                      ← Groq SDK wrapper (streaming + sync)
│   └── agents.ts                    ← System prompts for all agents
│
└── types/
    └── index.ts                     ← TypeScript interfaces
```

---

## How It Works

### 1. Input
User types a problem statement (e.g., *"Build a creator marketplace platform"*).

### 2. Agent Pipeline
Three agents run sequentially with streaming:

- **Planner Agent** — Analyzes the problem, identifies 4-8 core components, maps stakeholders. Output: structured JSON.
- **Insight Agent** — Receives the Planner's output. Adds strategic context, market dynamics, technical feasibility insights. Output: enriched JSON.
- **Execution Agent** — Receives **both** previous outputs. Synthesizes everything into a 4-section report with markdown formatting. Output: final report JSON.

### 3. Report Display
The report renders with four color-coded sections. Each section supports:
- **AI Edit** — Quick presets ("More Detailed", "Shorten", "Professional Tone") or custom instructions
- **Version History** — Every edit is versioned; click to restore any version
- **Agent Reasoning** — Expand to see each agent's thought process

### 4. Export
- **DOCX** — Generated with the `docx` library. Includes proper headings, bullet points, bold text, section dividers.
- **PDF** — Generated with `jsPDF`. Color-coded section headers, wrapped text, page breaks, professional typography.

---

## API Reference

### `POST /api/agents/planner`
Breaks down a problem statement into components.

**Body:** `{ "problemStatement": "string" }`
**Response:** SSE stream → final JSON with `reasoning`, `components`, `problemBreakdown`, `stakeholders`

### `POST /api/agents/insight`
Enriches the planner's analysis with strategic context.

**Body:** `{ "problemStatement": "string", "plannerOutput": object }`
**Response:** SSE stream → final JSON with `reasoning`, `enrichedBreakdown`, `stakeholderAnalysis`, `contextualInsights`

### `POST /api/agents/execution`
Synthesizes all inputs into a structured report.

**Body:** `{ "problemStatement": "string", "plannerOutput": object, "insightOutput": object }`
**Response:** SSE stream → final JSON with `reasoning`, `sections` (4 sections)

### `POST /api/edit-section`
Re-processes a single section based on user instruction.

**Body:** `{ "sectionTitle": "string", "sectionContent": "string", "instruction": "string" }`
**Response:** SSE stream → rewritten section content

---

## Design Decisions

| Decision | Reasoning |
|---|---|
| **SSE over WebSockets** | Simpler, unidirectional streaming. Perfect for one-way AI output. Works on Vercel serverless. |
| **CSS Variables for theming** | Enables instant dark/light toggle without Tailwind's `dark:` prefix on every element. Cleaner, more maintainable. |
| **Client-side exports** | No server-side rendering needed for DOCX/PDF. Reduces serverless function usage and latency. |
| **Groq over OpenAI** | 10x faster inference. Critical for live demos where speed perception matters. Free tier is generous. |
| **Separate API routes per agent** | Clear separation of concerns. Each agent can be independently tested, modified, or replaced. |

---

## License

MIT
