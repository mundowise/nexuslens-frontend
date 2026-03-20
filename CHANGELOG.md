# Changelog

## [0.3.0] - 2026-03-19

### Added
- Custom NexusLens logo used throughout the app (splash screen, navbar, auth page, favicon)
- Redesigned Nexus 3D view with tube-based synapses and physical materials (MeshStandardMaterial)
- Connections list panel in Nexus view showing cross-document relationships
- Confirm password field on registration
- Word document (.docx) upload support
- Starfield component for animated background stars in Nexus view

## [0.2.0] - 2026-03-19

### Added
- ARIA attributes across all key components (Navbar, AuthPage, FindingCard, UploadModal, CompareView, DocumentSelector, PdfViewer, NexusPanel, AlertCard, SplashScreen)
- Particle burst effect on new document upload in Nexus 3D view (R3F `<points>`, 50 particles, category-colored, 1s fade)
- WebGL detection and fallback grid view (`NexusFallback.tsx`) when 3D is unavailable
- Error boundary around NexusScene to gracefully degrade to fallback
- `nexus.webgl_unavailable` i18n key (es/en)

### Fixed
- Unused variables removed: `midY` in DependencyLines, `group`/`angle` in AnalysisAnimation
- Unused catch parameters removed from document store
- Hardcoded "Oops" / "Recargar" in ErrorBoundary replaced with neutral text

## [0.1.0] - 2026-03-15

### Added
- Nexus 3D document universe with R3F (DocumentSphere, Synapse, ClusterHalo, CursorGlow)
- Lens document analysis view with PDF viewer, findings, and compare mode
- Timeline view with scatter chart, alerts, and dependency lines
- JWT authentication with login/register
- Bilingual i18n (es/en)
- Dark/light theme with CSS custom properties
- Audio feedback (Howler.js)
- GSAP page transitions
- tsparticles background
- Drag-and-drop upload with WebSocket progress tracking
- Analysis animation during document processing
