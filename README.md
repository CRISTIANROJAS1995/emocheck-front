<div align="center">

# 🧠 EmoCheck — Frontend

**Plataforma web de evaluación y monitoreo de salud mental y bienestar emocional en el trabajo**

![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/Licencia-Propietaria-red?style=for-the-badge)

</div>

---

## 📌 ¿Qué es EmoCheck?

EmoCheck es una plataforma web de salud mental ocupacional que permite a las empresas **evaluar, monitorear y actuar** sobre el bienestar emocional de sus trabajadores de forma continua, confidencial y basada en evidencia científica.

Está diseñada para ayudar a las organizaciones a cumplir con normativas de salud ocupacional colombianas (**SVE Psicosocial**, **Resolución 2404 de 2019**) mientras cuidan activamente la salud mental de su equipo.

> *"Personas sanas, organizaciones fuertes."*

---

## 👥 Tipos de Usuario

| Rol | Descripción |
|-----|-------------|
| **Trabajador / Empleado** | Realiza autoevaluaciones, ve sus resultados y accede a recursos de bienestar |
| **Líder HSE / Psicólogo Ocupacional** | Consulta reportes agregados, gestiona alertas críticas y hace seguimiento a casos de riesgo |
| **Administrador** | Gestiona usuarios, empresas, áreas, sedes y configuraciones de la plataforma |

---

## 📊 Módulos de Evaluación

EmoCheck incluye 4 módulos de evaluación basados en instrumentos científicos validados:

### 1. 🧠 Salud Mental
Tamizaje de condiciones psicológicas comunes:
- **GAD-7** — Ansiedad generalizada
- **PHQ-9** — Depresión
- **ISI** — Insomnio
- **Escala de Estrés Percibido**

### 2. ⚡ Fatiga Laboral
Evaluación rápida de:
- Nivel de energía cognitiva
- Agotamiento emocional
- Capacidad de concentración

> Objetivo: Detectar burnout en etapas tempranas.

### 3. 🤝 Clima Organizacional
Percepción del trabajador sobre:
- Entorno laboral y liderazgo
- Propósito, motivación y relaciones interpersonales

### 4. ⚠️ Riesgo Psicosocial
Basado en la **Batería del Ministerio del Trabajo (Colombia)**:
- Factores intralaborales y extralaborales
- Estrés laboral
- Cumplimiento legal: Resolución 2404 de 2019

---

## 🎭 Análisis Emocional con IA (Face++)

EmoCheck cuenta con un módulo de análisis emocional en tiempo real que utiliza la **cámara del dispositivo** y la API de reconocimiento facial de [Face++](https://www.faceplusplus.com/) (Megvii).

### ¿Cómo funciona?

```
Cámara del usuario
      │
      ▼  cada 4 segundos
[Canvas HTML] ── JPEG base64 ──► [Face++ Cloud API]
                                        │
                             7 emotion scores (0-100)
                                        │
                                        ▼
                          Agrega 3-5 detecciones con
                          ponderación por calidad de frame
                                        │
                                        ▼
                    POST /api/evaluation/emotional-analysis/classify
                                        │
                                        ▼
                    5 scores de bienestar + pantalla de resultado
```

### Detección de emociones
Face++ detecta las **7 emociones básicas** por frame:
`happiness` · `sadness` · `anger` · `disgust` · `fear` · `surprise` · `neutral`

### Ponderación inteligente de frames
Cada frame capturado recibe un **peso de calidad** (0–1) calculado con:

| Factor | Descripción |
|--------|-------------|
| **Pose** | Penaliza cabezas giradas >45° (yaw) o inclinadas >35° (pitch) |
| **Face Quality** | Score directo de Face++ (0–100) normalizado |
| **Blur** | Penaliza motion blur o gaussian blur excesivos |

### Algoritmo de agregación
El componente acumula entre 3 y 5 detecciones y aplica:
1. **Promedio ponderado** por calidad × peso temporal (frames recientes pesan más)
2. **Detección de micro-expresiones**: picos breves de emoción (>2.5× el promedio) amplifican en un 25%
3. **Boost + supresión de neutral**: emociones negativas ×30, positivas ×5, neutral se suprime ante presencia negativa

### Resultados en pantalla

| Estado | Color | Mensaje |
|--------|-------|---------|
| Saludable | 🟢 Verde | "¡Excelente! Tu estado emocional es saludable" |
| Carga emocional | 🟠 Naranja | "Parece que hay algo de carga emocional" |
| En alerta | 🔴 Rojo | "Tu cuerpo está en alerta" |

### Límites del Free Tier
- **1.000 llamadas/día** (~16 sesiones diarias, 5 calls por sesión)
- **1 request/segundo** — con throttle automático y retry con backoff exponencial
- Si se agota el límite diario, se muestra un mensaje claro al usuario

> Las credenciales de Face++ se configuran en `src/environments/environment.ts`:
> `facePlusPlusApiKey`, `facePlusPlusApiSecret`, `facePlusPlusApiUrl`

---

## 🏗️ Arquitectura del Proyecto

### Stack Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **Angular** | 19 | Framework principal (Standalone Components) |
| **TypeScript** | 5.6 | Lenguaje base |
| **RxJS** | 7.8 | Programación reactiva |
| **TailwindCSS** | 3.4 | Estilos utilitarios |
| **Angular Material** | 19 | Componentes UI |
| **ApexCharts / ng-apexcharts** | 4.3 / 1.15 | Gráficas y dashboards |
| **Transloco** | 7.5 | Internacionalización (i18n) |
| **Luxon** | 3.5 | Manejo de fechas |
| **SweetAlert2** | 11.x | Alertas y modales |
| **Quill / ngx-quill** | 2.0 / 27.0 | Editor de texto enriquecido |
| **CryptoJS** | 4.2 | Cifrado en cliente |

### Estructura de carpetas

```
src/
├── app/
│   ├── core/               # Servicios globales, guards, interceptors, modelos
│   │   ├── services/       # AuthService, EmotionalAnalysisService, FaceEmotionDetectorService...
│   │   └── auth/           # Guards y lógica de autenticación
│   ├── layout/             # Shell de la aplicación (navbar, sidebar)
│   ├── modules/            # Módulos de negocio (lazy loaded)
│   │   └── admin/
│   │       └── pages/
│   │           ├── emotional-analysis/   # Análisis emocional con Face++
│   │           ├── evaluations/          # Módulos de evaluación
│   │           ├── home/                 # Dashboard del usuario
│   │           ├── resources/            # Centro de recursos de bienestar
│   │           └── profile/              # Perfil del usuario
│   └── shared/             # Componentes, pipes y directivas reutilizables
├── @fuse/                  # Librería base de UI (Fuse theme)
├── environments/           # Configuración por entorno (dev / prod)
└── public/
    ├── i18n/               # Archivos de traducción (en.json, tr.json)
    ├── icons/              # Íconos SVG del sistema
    └── images/             # Imágenes y logos
```

### Patrón de arquitectura Angular

- **Standalone Components**: sin `NgModules`, cada componente declara sus propias dependencias
- **Lazy Loading**: las rutas cargan los módulos bajo demanda
- **Signals**: estado reactivo con Angular Signals
- **Guards**: protección de rutas por rol y autenticación
- **HTTP Interceptors**: adjuntan el JWT automáticamente y manejan renovación de tokens

---

## 🔒 Seguridad y Autenticación

- **JWT + Refresh Tokens** con expiración corta
- Tokens almacenados en `localStorage` con claves configuradas en `environment.ts`
- Interceptor HTTP que adjunta el `Bearer` token en cada request y renueva automáticamente al expirar
- **Roles y permisos** basados en claims del token
- Proxy CORS para Face++ en desarrollo (configurado en `proxy.conf.json`)

---

## 🧭 Flujo Principal del Usuario

```
Registro / Login
      │
      ▼
Consentimiento Informado Digital  ──► Guardado con fecha, hora e IP
      │
      ▼
Completar Perfil  ──► Área, sede, cargo, documento
      │
      ▼
Seleccionar Evaluación  ──► Salud Mental / Fatiga / Clima / Riesgo Psicosocial
      │                     + Análisis Emocional con IA (Face++)
      ▼
Responder Cuestionario  ──► Instrumentos científicos validados
      │
      ▼
Ver Resultado Semaforizado  ──► 🟢 Verde / 🟡 Amarillo / 🔴 Rojo
      │
      ▼
Recomendaciones Personalizadas  ──► Mindfulness, pausas activas, consulta psicológica
      │
      ▼
Centro de Recursos  ──► Acceso permanente a herramientas de bienestar
```

---

## 🎨 Experiencia de Usuario (UX)

EmoCheck usa **lenguaje empático y cercano** en toda la interfaz:

- *"Tu bienestar también es parte de la productividad"*
- *"Tu cuerpo está en alerta. Vamos a bajarle el ritmo juntos 🧘"*
- *"Recuerda: conocerte es el primer paso para cuidarte"*

### Elementos clave

| Elemento | Descripción |
|----------|-------------|
| **Semaforización visual** | Verde / Amarillo / Rojo con mensajes contextuales |
| **Pausas guiadas** | Ejercicios de respiración con animaciones (ej. técnica 4-7-8) |
| **Resultados explicados** | Sin tecnicismos, con gráficas claras y comparativas históricas |
| **Recomendaciones accionables** | Videos cortos, recursos descargables, enlace a psicólogo |
| **Acceso inmediato a ayuda** | Botón de contacto con psicólogo / WhatsApp de soporte |

---

## ⚙️ Instalación y Desarrollo Local

### Requisitos previos

- Node.js 20+
- Angular CLI 19+
- Credenciales de Face++ ([registro gratuito](https://www.faceplusplus.com/))

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/CRISTIANROJAS1995/emocheck-front.git
cd emocheck-front

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Editar src/environments/environment.ts con:
#   - apiUrl: URL del backend
#   - facePlusPlusApiKey: tu API Key de Face++
#   - facePlusPlusApiSecret: tu API Secret de Face++

# 4. Iniciar servidor de desarrollo
npm start
# La aplicación queda disponible en http://localhost:4200
```

> El proxy de Face++ está configurado en `proxy.conf.json` y se activa automáticamente con `ng serve`. Redirige `/facepp/*` → `https://api-us.faceplusplus.com`.

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo con proxy |
| `npm run build` | Build de producción |
| `npm test` | Ejecutar tests unitarios (Karma/Jasmine) |
| `npm run watch` | Build en modo watch |

---

## 🌍 Internacionalización (i18n)

El proyecto usa **Transloco** para soporte multilenguaje. Los archivos de traducción están en:

```
public/i18n/
├── en.json   # Inglés
└── tr.json   # Turco
```

La configuración principal está en `transloco.config.js`.

---

## 🔗 Backend

Este repositorio corresponde únicamente al **frontend**. El backend está desarrollado en **.NET 8 (C#)** con arquitectura hexagonal y expone una API REST documentada con Swagger.

- **Repositorio backend:** [github.com/CRISTIANROJAS1995/emocheck-api](https://github.com/CRISTIANROJAS1995/emocheck-api)
- **Base de datos:** SQL Server 2022 / Azure SQL
- **Autenticación:** JWT con refresh tokens
- **Patrón:** CQRS con MediatR, Entity Framework Core 8

---

## 📄 Cumplimiento Legal

| Normativa | Descripción |
|-----------|-------------|
| **Ley 1581 de 2012** | Protección de datos personales — Colombia |
| **Resolución 2404 de 2019** | SVE Psicosocial — Ministerio del Trabajo Colombia |
| **Confidencialidad médica** | Resultados individuales solo visibles para el propio usuario |
| **Anonimización** | Reportes administrativos usan ID, nunca nombre completo |
| **Consentimiento informado** | Digital, con trazabilidad de fecha, hora e IP |
| **Cifrado AES-256** | Para campos sensibles en base de datos |

---

## 📞 Contacto y Soporte

- **Repositorio:** [github.com/CRISTIANROJAS1995/emocheck-front](https://github.com/CRISTIANROJAS1995/emocheck-front)
- **Soporte WhatsApp:** +57 324 456 3035

---

<div align="center">

© 2026 EmoCheck — Todos los derechos reservados.  
*Este repositorio es de uso privado y confidencial.*

</div>
