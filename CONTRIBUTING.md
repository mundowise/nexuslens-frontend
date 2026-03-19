# Contributing

## How to contribute

1. Fork the repo
2. Create a branch (`git checkout -b feature/thing`)
3. Make your changes
4. Open a PR

## Dev setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Code style

- TypeScript strict — avoid `any`
- Functional components with hooks
- Zustand for shared state
- Motion for animations, GSAP only for complex timelines
- Tailwind for styling

## Commits

```
feat: add sphere clustering
fix: PDF scroll on finding click
style: adjust card hover state
refactor: extract 3D scene module
```

## Bugs

Open an issue. Include browser, OS, steps to reproduce, and screenshots if it's visual.

## Security issues

Don't open a public issue — email the maintainer directly (see SECURITY.md).
