<div align="center">

# NexusLens

**Analisis documental inteligente con visualizacion 3D**

Sube tus contratos, polizas y documentos legales. NexusLens los analiza, encuentra riesgos, obligaciones y fechas criticas, y te muestra todo en un grafo 3D interactivo.

[![Demo](https://img.shields.io/badge/Demo-nexuslens.net-blue)](https://nexuslens.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo en vivo](https://nexuslens.net) · [Backend](https://github.com/Xplus-Technologies-open-source/nexuslens-backend)

---

</div>

## El Problema

Leer documentos legales y financieros es tedioso, consume horas, y es facil pasar por alto clausulas importantes. Un contrato de alquiler puede tener penalizaciones escondidas en la pagina 12. Una poliza de seguro puede excluir exactamente lo que necesitas cubrir. Y cuando tienes multiples documentos relacionados, encontrar contradicciones entre ellos es casi imposible manualmente.

## La Solucion

NexusLens automatiza todo ese proceso. Subes un PDF y en segundos obtienes:

- **Hallazgos categorizados**: riesgos, obligaciones, costos, fechas limite y preguntas sugeridas
- **Nivel de riesgo**: puntuacion de 0 a 10 basada en el contenido del documento
- **Conexiones entre documentos**: deteccion automatica de contradicciones, dependencias y solapamientos
- **Linea de tiempo**: todas las fechas criticas organizadas cronologicamente

Todo presentado en tres vistas interactivas que hacen la informacion accesible y comprensible.

## Vistas

### Lens (Lente)

La vista principal para explorar documentos. Sube PDFs, ve el analisis con hallazgos resaltados por severidad, lee el texto original del documento y navega entre las clausulas importantes.

### Nexus (Grafo 3D)

Un grafo tridimensional donde cada documento es un nodo y sus hallazgos orbitan alrededor. Las conexiones entre documentos se muestran como aristas con colores que indican el tipo de relacion (contradiccion, dependencia, complemento). Puedes rotar, hacer zoom y seleccionar nodos para ver detalles.

### Timeline (Linea de Tiempo)

Todos los eventos con fechas extraidos de tus documentos organizados en un grafico temporal. Fechas de vencimiento, renovaciones, plazos de pago — todo visible de un vistazo con alertas para fechas proximas.

## Stack Tecnico

### Frontend (este repositorio)
- **React 19** con TypeScript
- **Vite 8** como build tool
- **Tailwind CSS 4** para estilos
- **React Three Fiber** + Three.js para el grafo 3D
- **Framer Motion** para animaciones
- **Recharts** para la linea de tiempo
- **Zustand** para estado global
- **i18next** para internacionalizacion (ES/EN)
- **Caddy** como servidor web en produccion

### Backend ([repositorio](https://github.com/Xplus-Technologies-open-source/nexuslens-backend))
- **FastAPI** con Python 3.12
- **PostgreSQL 17** con **pgvector** para embeddings vectoriales
- **Redis 7** para cache y cola de tareas
- **SQLAlchemy** async con asyncpg
- **Alembic** para migraciones
- **OpenAI GPT-4o** para analisis documental
- **OpenAI text-embedding-3-small** para embeddings (1536 dimensiones)
- **PyMuPDF** + **pdfplumber** para extraccion de texto
- **Tesseract OCR** como fallback para PDFs escaneados

## Arquitectura

```
Usuario (Browser)
    |
    v
Caddy (Frontend)
    |
    |-- Archivos estaticos (React SPA)
    |-- /api/* --> FastAPI Backend
                      |
                      |-- PostgreSQL + pgvector
                      |-- Redis
                      |-- OpenAI API
```

El frontend es una SPA servida por Caddy. Todas las llamadas a `/api/*` se proxean al backend FastAPI. El backend procesa los documentos, llama a OpenAI para el analisis, genera embeddings vectoriales, y almacena todo en PostgreSQL.

## Funcionalidades

### Analisis de Documentos
- Subida de PDF, imagenes (PNG, JPEG, TIFF) y documentos Word
- Extraccion de texto con PyMuPDF + OCR fallback con Tesseract
- Analisis con GPT-4o que categoriza el documento, extrae hallazgos y calcula riesgo
- Cada hallazgo incluye: tipo, severidad, titulo, descripcion, texto original, pagina, explicacion en lenguaje simple y preguntas sugeridas
- Barra de progreso en tiempo real durante el analisis

### Embeddings y Conexiones
- Cada hallazgo se convierte en un vector de 1536 dimensiones
- Similitud coseno para encontrar hallazgos relacionados entre documentos
- Analisis de pares similares para determinar: contradiccion, dependencia, solapamiento o complemento
- Almacenado en pgvector para busquedas eficientes

### Autenticacion
- Registro y login con JWT
- Cada usuario tiene sus documentos aislados

### Comparacion de Documentos
- Selecciona dos documentos y obtiene un analisis de diferencias clave
- Util para comparar versiones de contratos o polizas

### Internacionalizacion
- Interfaz completa en Espanol e Ingles
- Deteccion automatica del idioma del navegador

### Tema Visual
- Modo oscuro y claro
- Particulas de fondo animadas
- Efectos de bloom en el grafo 3D
- Transiciones suaves entre vistas

## Instalacion Local

### Requisitos

| Componente | Version |
|------------|---------|
| Node.js | 22+ |
| Python | 3.12+ |
| PostgreSQL | 17 con pgvector |
| Redis | 7+ |
| OpenAI API Key | con acceso a GPT-4o |

### Pasos

```bash
# Clonar ambos repositorios
git clone https://github.com/Xplus-Technologies-open-source/nexuslens-frontend.git
git clone https://github.com/Xplus-Technologies-open-source/nexuslens-backend.git

# Backend
cd nexuslens-backend
cp .env.example .env
# Editar .env con tu OPENAI_API_KEY y JWT_SECRET_KEY
docker compose up -d  # Levanta PostgreSQL + Redis
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd nexuslens-frontend
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### Variables de Entorno

**Backend (.env)**
```
DATABASE_URL=postgresql+asyncpg://nexuslens:nexuslens@localhost:5432/nexuslens
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=tu-clave-secreta
OPENAI_API_KEY=sk-tu-api-key
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Estructura del Proyecto

```
nexuslens-frontend/           (este repositorio)
├── src/
│   ├── App.tsx               # Router principal (3 modos)
│   ├── components/
│   │   ├── lens/             # Vista de analisis de documentos
│   │   ├── nexus/            # Grafo 3D (Three.js)
│   │   ├── timeline/         # Linea de tiempo (Recharts)
│   │   └── shared/           # Upload, errores, particulas
│   ├── stores/               # Zustand (app, documents, auth)
│   ├── services/             # Cliente API (axios)
│   └── locales/              # Traducciones ES/EN
├── Dockerfile
├── Caddyfile
└── package.json

nexuslens-backend/            (repositorio separado)
├── app/
│   ├── main.py               # FastAPI entry point
│   ├── models/               # User, Document, Finding, Connection, TimelineEvent
│   ├── routers/              # auth, documents, findings, connections, timeline, graph
│   └── services/             # ai_service, pdf_service, embedding_service, graph_service
├── alembic/                  # Migraciones
├── Dockerfile
├── docker-compose.yml        # PostgreSQL + Redis
└── requirements.txt
```

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/register | Crear cuenta |
| POST | /api/auth/login | Iniciar sesion |
| GET | /api/auth/me | Perfil del usuario |
| POST | /api/documents/upload | Subir documento |
| GET | /api/documents | Listar documentos |
| GET | /api/documents/:id | Detalle con hallazgos |
| GET | /api/documents/:id/progress | Progreso del analisis |
| DELETE | /api/documents/:id | Eliminar documento |
| POST | /api/documents/compare | Comparar dos documentos |
| GET | /api/connections | Conexiones entre hallazgos |
| GET | /api/timeline | Eventos temporales |
| GET | /api/timeline/alerts | Alertas proximas |
| GET | /api/graph | Datos del grafo 3D |

## Seguridad

- Autenticacion JWT
- Rate limiting en endpoints criticos
- Validacion de archivos por magic bytes
- Limite de tamano configurable
- CORS restringido al dominio del frontend
- Headers de seguridad (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

## Despliegue en Produccion

Ambos repositorios incluyen Dockerfiles listos para produccion:

- **Frontend**: multi-stage build (Node 22 → Caddy 2) con reverse proxy integrado
- **Backend**: Python 3.12 slim con Tesseract OCR y migraciones automaticas al arrancar
- **Base de datos**: PostgreSQL 17 con pgvector (docker-compose en el backend)
- **Cache**: Redis 7 Alpine

## Licencia

MIT

---

<div align="center">

Desarrollado por **Xplus Technologies**

</div>
