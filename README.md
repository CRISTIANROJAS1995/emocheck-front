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

### Clasificación del estado emocional

# 📊 Rangos del Sistema Emocional — EmoCheck

> **Endpoint:** `POST /api/evaluation/emotional-analysis/classify`
> **Fecha de documentación:** 27 de febrero de 2026

---

## 1. Métrica principal: Promedio de los 5 scores

El backend devuelve 5 scores individuales (0–100). El **frontend** calcula el promedio para determinar el estado general:

```
promedio = (attention + concentration + balance + positivity + calm) / 5
```

---

## 2. Semaforización — Clasificación por promedio

| Rango promedio | Estado | Color | Hex | Mensaje al usuario |
|---|---|---|---|---|
| **≥ 70** | 🟢 **VERDE** — Bienestar saludable | Verde | `#4CAF50` | "¡Excelente! Continúa con tus hábitos saludables" |
| **50 – 69** | 🟠 **NARANJA** — Carga emocional moderada | Naranja | `#FFC107` | "Algunos aspectos necesitan atención. Te recomendamos..." |
| **< 50** | 🔴 **ROJO** — Estado emocional crítico | Rojo | `#F44336` | "Tu cuerpo está en alerta" |

> ⚠️ **Regla especial de fatiga:** si `fatigueScore ≥ 0.75`, el estado se fuerza a 🔴 **ROJO** independientemente del promedio de scores, y se crea una alerta automática en BD.

---

## 3. Scores esperados por emoción

Valores calculados con `confidence ≈ 0.99` (intensidad ~99, `t ≈ 0.99`).
Los scores incluyen la micro-variación determinística: `variation = (intensity % 7) - 3`.

| Emoción | Atención | Concentración | Equilibrio | Positividad | Calma | FatigueScore | **Promedio** | Estado |
|---|---|---|---|---|---|---|---|---|
| `happiness` | ~89 | ~84 | ~91 | ~95 | ~91 | ~0.03 | **~90** | 🟢 Verde |
| `neutral` | ~69 | ~65 | ~69 | ~62 | ~69 | ~0.12 | **~67** | 🟠 Naranja |
| `surprise` | ~87 | ~54 | ~51 | ~64 | ~35 | ~0.18 | **~58** | 🟠 Naranja |
| `contempt` | ~58 | ~55 | ~28 | ~18 | ~32 | ~0.50 | **~38** | 🔴 Rojo |
| `anger` | ~46 | ~41 | ~13 | ~9 | ~9 | ~0.72 | **~24** | 🔴 Rojo |
| `fear` | ~55 | ~36 | ~16 | ~13 | ~11 | ~0.70 | **~26** | 🔴 Rojo |
| `sadness` | ~26 | ~23 | ~19 | ~9 | ~26 | ~0.88 | **~21** | 🔴 Rojo |
| `fatigue` | ~19 | ~16 | ~29 | ~23 | ~36 | ~0.95 | **~25** | 🔴 Rojo |

> **Nota:** Los valores son aproximados. El score final varía ±3 puntos en Atención/Concentración y ±1 en Equilibrio por la micro-variación `(intensity % 7) - 3`.

---

## 4. Rangos por score individual

Cada uno de los 5 scores se mueve dentro de estos límites según la emoción:

### 🟢 Emociones positivas

| Score | `happiness` mín | `happiness` máx |
|---|---|---|
| Atención | 72 | 90 |
| Concentración | 68 | 85 |
| Equilibrio | 75 | 92 |
| Positividad | 80 | 96 |
| Calma | 75 | 92 |
| FatigueScore | 0.03 | 0.18 |

### 🟠 Emociones neutras / mixtas

| Score | `neutral` mín | `neutral` máx | `surprise` mín | `surprise` máx |
|---|---|---|---|---|
| Atención | 60 | 70 | 75 | 88 |
| Concentración | 56 | 66 | 50 | 55 |
| Equilibrio | 58 | 70 | 48 | 52 |
| Positividad | 50 | 63 | 55 | 65 |
| Calma | 60 | 70 | 35 | 38 |
| FatigueScore | 0.12 | 0.25 | 0.18 | 0.20 |

### 🔴 Emociones negativas

| Score | `anger` | `sadness` | `fear` | `contempt` | `fatigue` |
|---|---|---|---|---|---|
| Atención | 45 – 62 | 25 – 50 | 55 – 68 | 58 – 65 | 18 – 42 |
| Concentración | 40 – 58 | 22 – 45 | 35 – 48 | 55 – 62 | 15 – 38 |
| Equilibrio | 12 – 40 | 18 – 42 | 15 – 35 | 28 – 40 | 28 – 42 |
| Positividad | 8 – 35 | 8 – 35 | 12 – 30 | 18 – 32 | 22 – 38 |
| Calma | 8 – 35 | 25 – 42 | 10 – 28 | 32 – 42 | 35 – 48 |
| FatigueScore | 0.35 – 0.72 | 0.45 – 0.88 | 0.40 – 0.70 | 0.30 – 0.50 | 0.55 – 0.95 |

---

## 5. Alerta por fatiga — Condiciones, momento y persistencia en BD

### 5.1 Condiciones para generar la alerta

Se deben cumplir **las 3 condiciones simultáneamente**:

```
1. createAlertOnFatigue = true     ← enviado en el request body (default: true)
          AND
2. fatigueScore >= 0.75            ← backend calculó fatiga alta según la emoción
          AND
3. El usuario existe en BD         ← se consulta para obtener CompanyID y AreaID
```

> Si **cualquiera** de las 3 falla, **no se crea la alerta** y `alertCreated` devuelve `false`.

---

### 5.2 Momento exacto en el flujo

```
POST /api/evaluation/emotional-analysis/classify
         │
         ▼
  1. Calcula intensity y t  (de confidence)
         │
         ▼
  2. Mapea emoción → scores  (attention, concentration, balance, positivity, calm, fatigueScore)
         │
         ▼
  3. Construye EmotionalAnalysisResponseDto
         │
         ▼
  4. Evalúa las 3 condiciones
         │
         ├── NO se cumplen  ──► devuelve response  (alertCreated: false)
         │
         └── SÍ se cumplen
                  │
                  ▼
           INSERT results.Alert   ◄─── se guarda en BD aquí
           SaveChangesAsync()
                  │
                  ▼
           devuelve response  (alertCreated: true)
```

---

### 5.3 Umbral configurable

| Configuración | Valor por defecto | Ubicación |
|---|---|---|
| `AzureCognitive:FatigueAlertThreshold` | `0.75` | `appsettings.json` |
| Override por request | Campo `fatigueAlertThreshold` en el body | `EmotionClassificationRequestDto` |

> El cliente puede enviar su propio umbral en cada request. Si no lo envía, se usa el del servidor (`0.75`).

---

### 5.4 Campos que se guardan en `results.Alert`

| Campo BD | Valor guardado |
|---|---|
| `UserID` | ID del usuario autenticado (JWT) |
| `EvaluationID` | El enviado en el request, o `0` si no se envió |
| `CompanyID` | Obtenido del perfil del usuario en BD |
| `AreaID` | Obtenido del perfil del usuario en BD |
| `AlertType` | `"FATIGUE_DETECTED"` |
| `Severity` | `"CRITICAL"` si `fatigueScore ≥ 0.90` · `"HIGH"` si está entre `0.75` y `0.89` |
| `Status` | `"OPEN"` |
| `Title` | `"Fatiga detectada - Análisis emocional"` |
| `Description` | `"Se detectó un nivel de fatiga de X.XX (umbral: Y.YY) en el análisis emocional del usuario Nombre Apellido."` |
| `CreatedAt` | Fecha/hora UTC del momento del análisis |

---

### 5.5 ¿Qué emociones disparan la alerta? (con confianza ~0.99)

| Emoción | `fatigueScore` calculado | ¿Supera 0.75? | `Severity` |
|---|---|---|---|
| `fatigue` | ~0.95 | ✅ **Sí** | `CRITICAL` |
| `sadness` | ~0.88 | ✅ **Sí** | `HIGH` |
| `anger` | ~0.72 | ❌ No (justo debajo) | — |
| `fear` | ~0.70 | ❌ No | — |
| `contempt` | ~0.50 | ❌ No | — |
| `surprise` | ~0.18 | ❌ No | — |
| `neutral` | ~0.12 | ❌ No | — |
| `happiness` | ~0.03 | ❌ No | — |

> ⚠️ `anger` con confianza muy alta puede llegar a `0.72`, quedando **justo por debajo** del umbral `0.75`. Solo `sadness` y `fatigue` lo superan de forma consistente.

---

## 6. Ejemplo real — "Tu cuerpo está en alerta"

```json
// Request
{
  "emotion": "anger",
  "confidence": 0.98,
  "createAlertOnFatigue": true
}

// Response
{
  "attention":     46,
  "concentration": 41,
  "balance":       13,
  "positivity":     9,
  "calm":           9,
  "fatigueScore":  0.71,
  "dominantEmotion": "anger",
  "alertCreated":  false,
  "timestamp":     "2026-02-27T..."
}

// promedio = (46 + 41 + 13 + 9 + 9) / 5 = 23.6  →  🔴 ROJO
```

---

## 7. Flujo de decisión del frontend

```
response recibido
       │
       ├── alertCreated === true  ──────────────────────► 🔴 ROJO (fatiga crítica)
       │
       ├── fatigueScore >= 0.75   ──────────────────────► 🔴 ROJO (fatiga alta)
       │
       ├── promedio < 50          ──────────────────────► 🔴 ROJO ("Tu cuerpo está en alerta")
       │
       ├── promedio 50–69         ──────────────────────► 🟠 NARANJA (carga moderada)
       │
       └── promedio >= 70         ──────────────────────► 🟢 VERDE (bienestar saludable)
```
---

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
