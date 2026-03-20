# NexusLens Frontend

SPA for NexusLens. Three modes: analyze documents (Lens), explore connections in 3D (Nexus), and track deadlines (Timeline). Uses OpenAI GPT-4o for document analysis via the backend API.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4 + shadcn/ui** — dark glassmorphism theme
- **React Three Fiber + Drei + Postprocessing** — 3D scene with bloom
- **Motion + GSAP** — UI and transition animations
- **tsParticles** — background particle effects
- **Recharts + D3** — timeline charts
- **react-pdf** — PDF viewer
- **Zustand** — state management
- **axios** — HTTP client
- **Howler.js** — subtle UI sounds
- **Lucide React** — icons
- Custom NexusLens logo (SVG) used across splash screen, navbar, and auth pages

## Setup

```bash
git clone https://github.com/orl99/nexuslens-frontend.git
cd nexuslens-frontend

npm install

cp .env.example .env
# set your backend URL

npm run dev
```

Runs at `http://localhost:5173`

## Project layout

```
src/
├── components/
│   ├── ui/              # shadcn components
│   ├── lens/            # PDF viewer, finding cards, doc compare
│   ├── nexus/           # 3D scene, spheres, synapses, cursor glow
│   ├── timeline/        # timeline view, alert cards
│   └── shared/          # layout, nav, upload
├── stores/              # zustand stores
├── services/            # API client
├── hooks/
├── types/
├── lib/
└── assets/audio/        # sound effects (~50KB total)
```

## Modes

**Lens** — upload a PDF, get AI analysis with risk/obligation/deadline cards. Click a card to jump to the exact paragraph in the PDF.

**Nexus** — 3D graph where each document is a sphere and semantic connections show as glowing lines. Colors by category, clustering by theme. Orbit controls to navigate.

**Timeline** — dates extracted from all documents on a single timeline. Alerts when deadlines overlap or create conflicts.

## License

MIT
