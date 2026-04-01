# Integración Front-End: Face ID — Historial y Estado Actual

> **Base URL:** `https://<host>/api/evaluation`
> **Autenticación:** `Authorization: Bearer <JWT>` en todos los requests
> Todos los endpoints filtran automáticamente por el usuario del token — nunca retornan datos de otros usuarios.

---

## Flujo completo de Face++

```
1. Frontend captura frame de cámara (JPEG base64)
        │
        ▼
2. POST /api/evaluation/facepp/detect
   → Proxy server-to-server hacia Face++ (evita CORS)
   → Retorna el JSON crudo de Face++
        │
        ▼
3. Frontend extrae la emoción dominante + confianza del JSON de Face++
        │
        ▼
4. POST /api/evaluation/emotional-analysis/classify
   → Backend calcula scores de bienestar
   → Guarda la lectura en BD (results.EmotionReading) — SIEMPRE
   → Crea alerta de fatiga en BD SOLO si aplica (ver condiciones)
   → Retorna scores al frontend
        │
        ▼
5. Para mostrar la pantalla "Estado actual" + gráfica:
   ├── GET /api/evaluation/emotional-analysis/summary?days=30
   │   → Promedios del período (para los indicadores de estado actual)
   └── GET /api/evaluation/emotional-analysis/history?days=30
       → Lista cronológica de lecturas (para construir la gráfica)
```

---

## Pantalla "Estado actual" — cómo construirla

### Lógica recomendada al cargar la pantalla:

```
GET /summary?days=30
  ├── Si totalReadings = 0  → mostrar "¿Cuéntanos cómo te sientes hoy?"
  └── Si totalReadings > 0  → mostrar indicadores con los promedios

GET /history?days=30
  ├── Si [] vacío            → gráfica vacía / sin datos
  └── Si tiene datos         → construir línea en la gráfica por fecha
```

---

## Endpoints

### 1. Proxy Face++ — Detectar emoción

**`POST /api/evaluation/facepp/detect`**

Envía un frame al backend para que este llame a Face++ server-to-server.

**Request body:**
```json
{
  "imageBase64": "<JPEG en base64, sin prefijo data:image/...>"
}
```

**Response `200 OK`** — JSON crudo de Face++:
```json
{
  "faces": [
    {
      "face_token": "abc123",
      "attributes": {
        "emotion": {
          "happiness":  85.4,
          "neutral":     6.2,
          "sadness":     3.1,
          "anger":       1.9,
          "surprise":    1.8,
          "fear":        1.0,
          "disgust":     0.6
        }
      }
    }
  ],
  "image_id": "...",
  "request_id": "...",
  "time_used": 120
}
```

> **Nota:** Si `faces` está vacío, no se detectó ningún rostro en el frame.

---

### 2. Clasificar emoción y guardar lectura

**`POST /api/evaluation/emotional-analysis/classify`**

El frontend extrae la emoción dominante del JSON de Face++ y la envía aquí. El backend calcula los scores de bienestar **y a partir de ahora guarda la lectura en el historial**.

**Request body:**
```json
{
  "evaluationID": 42,
  "emotion": "happiness",
  "confidence": 0.85,
  "createAlertOnFatigue": true,
  "fatigueAlertThreshold": 0.75
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `evaluationID` | `int` | No | ID de evaluación activa, si aplica |
| `emotion` | `string` | **Sí** | Emoción detectada (ver tabla de valores) |
| `confidence` | `float` | **Sí** | Confianza de 0.0 a 1.0 |
| `createAlertOnFatigue` | `bool` | No | Default `true` |
| `fatigueAlertThreshold` | `float` | No | Umbral para crear alerta (default del servidor: 0.75) |

**Valores válidos para `emotion`:**

| Valor | Descripción |
|---|---|
| `happiness` | Felicidad |
| `neutral` | Neutral |
| `surprise` | Sorpresa |
| `sadness` | Tristeza |
| `anger` | Enojo |
| `fear` | Miedo |
| `contempt` | Desprecio / disgusto |
| `fatigue` | Fatiga |

**Response `200 OK`:**
```json
{
  "isAvailable": true,
  "attention": 82,
  "concentration": 78,
  "balance": 79,
  "positivity": 88,
  "calm": 84,
  "fatigueScore": 0.12,
  "dominantEmotion": "happiness",
  "alertCreated": false,
  "timestamp": "2026-04-01T18:30:00.000Z"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `attention` | `int` (0–100) | Nivel de atención |
| `concentration` | `int` (0–100) | Nivel de concentración |
| `balance` | `int` (0–100) | Equilibrio emocional |
| `positivity` | `int` (0–100) | Positividad |
| `calm` | `int` (0–100) | Calma |
| `fatigueScore` | `float` (0.0–1.0) | Índice de fatiga (0 = sin fatiga, 1 = fatiga máxima) |
| `dominantEmotion` | `string` | Emoción normalizada |
| `alertCreated` | `bool` | `true` si se generó una alerta de fatiga |
| `timestamp` | `ISO 8601 UTC` | Momento de la lectura |

---

### 3. Historial de lecturas del usuario autenticado

**`GET /api/evaluation/emotional-analysis/history`**

Retorna las lecturas del usuario del token JWT, ordenadas de más reciente a más antigua.
Úsalo para construir la **gráfica de seguimiento**.

**Query params opcionales:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `days` | `int` | Lecturas de los últimos N días (ej. `?days=30`) |
| `from` | `datetime ISO 8601` | Desde esta fecha UTC |
| `to` | `datetime ISO 8601` | Hasta esta fecha UTC |
| `limit` | `int` | Máximo de registros a retornar |

**Ejemplos:**
```
GET /api/evaluation/emotional-analysis/history?days=30
GET /api/evaluation/emotional-analysis/history?from=2026-03-01&to=2026-04-01
GET /api/evaluation/emotional-analysis/history?days=7&limit=20
GET /api/evaluation/emotional-analysis/history          ← todo el historial
```

**Response `200 OK`:**
```json
[
  {
    "emotionReadingID": 101,
    "evaluationID": 42,
    "emotion": "happiness",
    "confidence": 0.85,
    "attention": 82,
    "concentration": 78,
    "balance": 79,
    "positivity": 88,
    "calm": 84,
    "fatigueScore": 0.12,
    "timestamp": "2026-04-01T18:30:00.000Z"
  },
  {
    "emotionReadingID": 100,
    "evaluationID": null,
    "emotion": "neutral",
    "confidence": 0.70,
    "attention": 62,
    "concentration": 65,
    "balance": 58,
    "positivity": 60,
    "calm": 63,
    "fatigueScore": 0.38,
    "timestamp": "2026-03-28T10:15:00.000Z"
  }
]
```

> Retorna `[]` si el usuario no tiene lecturas en el período solicitado.

---

### 4. Resumen / Estado actual del usuario autenticado

**`GET /api/evaluation/emotional-analysis/summary`**

Retorna el **promedio** de todas las lecturas del período.
Úsalo para los **indicadores de "Estado actual"** (Atención, Concentración, etc.).

**Query params opcionales:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `days` | `int` | `30` | Período en días hacia atrás desde hoy |

**Ejemplos:**
```
GET /api/evaluation/emotional-analysis/summary           ← últimos 30 días
GET /api/evaluation/emotional-analysis/summary?days=7
GET /api/evaluation/emotional-analysis/summary?days=90
```

**Response `200 OK` — hay lecturas:**
```json
{
  "attention": 71,
  "concentration": 70,
  "balance": 66,
  "positivity": 67,
  "calm": 72,
  "fatigueScore": 0.31,
  "dominantEmotion": "neutral",
  "totalReadings": 8,
  "lastReadingAt": "2026-04-01T18:30:00.000Z"
}
```

**Response `200 OK` — sin lecturas:**
```json
{
  "attention": 0,
  "concentration": 0,
  "balance": 0,
  "positivity": 0,
  "calm": 0,
  "fatigueScore": 0,
  "dominantEmotion": "neutral",
  "totalReadings": 0,
  "lastReadingAt": null
}
```

> Cuando `totalReadings = 0` mostrar el estado vacío / CTA "¿Cuéntanos cómo te sientes hoy?".

---

### 5. Historial de un usuario específico (Admin / Psicólogo)

**`GET /api/evaluation/emotional-analysis/history/{userId}`**
**`GET /api/evaluation/emotional-analysis/summary/{userId}`**

Mismo response que los endpoints anteriores pero para cualquier userId.
Mismos query params disponibles (`days`, `from`, `to`, `limit`).

```
GET /api/evaluation/emotional-analysis/history/332?days=30
GET /api/evaluation/emotional-analysis/summary/332
```

---

## Tabla de historial — columnas sugeridas

| Columna | Campo | Formato sugerido |
|---|---|---|
| Fecha | `timestamp` | `dd/MM/yyyy HH:mm` |
| Emoción | `emotion` | Ícono + etiqueta en español |
| Confianza | `confidence` | `85%` |
| Atención | `attention` | Barra o número (0–100) |
| Concentración | `concentration` | Barra o número (0–100) |
| Equilibrio | `balance` | Barra o número (0–100) |
| Positividad | `positivity` | Barra o número (0–100) |
| Calma | `calm` | Barra o número (0–100) |
| Fatiga | `fatigueScore` | `31%` o chip colorido |

---

## Sugerencia para la gráfica

El campo a graficar puede ser cualquier score. Para una línea de tendencia general se recomienda el **promedio de los 5 scores** por lectura:

```js
// Eje X: timestamp   Eje Y: score promedio o un score individual
const chartData = history.map(r => ({
  date:  new Date(r.timestamp),
  score: Math.round((r.attention + r.concentration + r.balance + r.positivity + r.calm) / 5)
}));
```

O mostrar múltiples líneas (una por dimensión):
```js
// Una serie por dimensión
const series = ['attention', 'concentration', 'balance', 'positivity', 'calm'];
```

---

## Mapeo de emociones a español

```js
const EMOTION_LABELS = {
  happiness: 'Felicidad',
  neutral:   'Neutral',
  surprise:  'Sorpresa',
  sadness:   'Tristeza',
  anger:     'Enojo',
  fear:      'Miedo',
  contempt:  'Disgusto',
  fatigue:   'Fatiga',
};

const EMOTION_ICONS = {
  happiness: '😊',
  neutral:   '😐',
  surprise:  '😲',
  sadness:   '😢',
  anger:     '😠',
  fear:      '😨',
  contempt:  '😒',
  fatigue:   '😴',
};
```

---

## Resumen de todos los endpoints

| Método | Endpoint | Para quién | Uso |
|---|---|---|---|
| `POST` | `/facepp/detect` | Usuario | Proxy Face++ → detectar emoción en frame |
| `POST` | `/emotional-analysis/classify` | Usuario | Enviar emoción → obtener scores + guardar lectura |
| `GET` | `/emotional-analysis/history` | Usuario (propio) | Lecturas para gráfica de seguimiento |
| `GET` | `/emotional-analysis/summary` | Usuario (propio) | Promedios para indicadores de "Estado actual" |
| `GET` | `/emotional-analysis/history/{userId}` | Admin/Psicólogo | Historial de cualquier usuario |
| `GET` | `/emotional-analysis/summary/{userId}` | Admin/Psicólogo | Resumen de cualquier usuario |

---

## Códigos de error

| HTTP | Causa |
|---|---|
| `400` | Datos del request inválidos (ej. `emotion` vacío) |
| `401` | Token JWT faltante o expirado |
| `500` | Error interno del servidor |
| `503` | Azure Cognitive Services no disponible |
| `504` | Timeout al contactar Face++ |
