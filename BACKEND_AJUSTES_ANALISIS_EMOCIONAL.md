# Ajustes Requeridos — Backend: Análisis Emocional
**Fecha:** 5 de marzo de 2026  
**Módulo:** `POST /api/evaluation/emotional-analysis/classify`  
**Prioridad:** 🔴 Alta — afecta directamente la experiencia del usuario  
**Estado:** ✅ RESUELTO — Backend verificado el 5 de marzo de 2026. Mitigación frontend eliminada.

---

## Contexto del flujo actual

El frontend usa **Face++ API** (servicio cloud de Megvii) para detectar la emoción facial del usuario via webcam. Luego envía la emoción al backend para que éste calcule los 5 scores de bienestar:

```
Usuario → Webcam → Face++ API → emoción dominante (happiness, neutral, etc.)
                                       ↓
              POST /evaluation/emotional-analysis/classify
              { emotion: "happiness", confidence: 0.87, createAlertOnFatigue: true }
                                       ↓
              Backend responde: { attention, concentration, balance, positivity, calm, ... }
```

Los 5 scores (0–100) determinan el estado que se muestra al usuario:
- **≥ 70% promedio** → 🟢 Verde — "Estado saludable"
- **50–69%** → 🟠 Naranja — "Carga emocional moderada"
- **< 50%** → 🔴 Rojo — "Tu cuerpo está en alerta"

---

## Problema detectado

### Bug #1 — `happiness` genera estado de alerta (crítico)

**Reproducción:** El usuario está sonriendo, relajado y tranquilo. Face++ detecta `happiness` con alta confianza (0.87). El frontend envía:

```json
POST /api/evaluation/emotional-analysis/classify
{
  "emotion": "happiness",
  "confidence": 0.87,
  "createAlertOnFatigue": true
}
```

**Respuesta actual del backend:**
```json
{
  "attention": 57,
  "concentration": 60,
  "balance": 31,
  "positivity": 22,
  "calm": 35,
  "fatigueScore": 0.82,
  "dominantEmotion": "happiness",
  "alertCreated": true
}
```

**Resultado:** Promedio = 41% → 🔴 "Tu cuerpo está en alerta" — **incorrecto** para un usuario feliz.

---

## Ajustes requeridos

### Ajuste 1 — Mapeo correcto de `happiness` a scores de bienestar

La emoción `happiness` debe generar scores **coherentes con un estado positivo**. Un usuario feliz no puede tener `positivity: 22` ni `calm: 35`.

**Tabla de referencia esperada por emoción:**

| `emotion` recibido | Estado esperado | Rango de scores sugerido |
|---|---|---|
| `happiness` | 🟢 Saludable | attention: 75–90, concentration: 70–85, balance: 70–85, positivity: 80–95, calm: 75–90 |
| `neutral` | 🟠 Carga moderada | attention: 55–70, concentration: 55–70, balance: 50–65, positivity: 50–65, calm: 55–70 |
| `surprise` | 🟠 Carga moderada | attention: 65–80, concentration: 50–65, balance: 45–60, positivity: 55–70, calm: 40–60 |
| `sadness` | 🔴 Alerta | attention: 40–55, concentration: 35–50, balance: 30–45, positivity: 20–35, calm: 30–45 |
| `anger` | 🔴 Alerta | attention: 50–65, concentration: 40–55, balance: 25–40, positivity: 20–35, calm: 20–35 |
| `fear` | 🔴 Alerta | attention: 45–60, concentration: 35–50, balance: 25–40, positivity: 25–40, calm: 20–35 |
| `contempt` / `disgust` | 🔴 Alerta | attention: 45–60, concentration: 40–55, balance: 30–45, positivity: 20–35, calm: 30–45 |

> Los valores exactos dentro del rango pueden usar la `confidence` como modulador (mayor confianza = más extremo el score).

---

### Ajuste 2 — `fatigueScore` no debe ser alto para emociones positivas

**Comportamiento actual:** El backend devuelve `fatigueScore: 0.82` cuando la emoción es `happiness`. El umbral de fatiga del frontend es `0.75` — cualquier valor ≥ 0.75 fuerza estado 🔴 aunque la emoción sea positiva.

**Regla esperada:**

| `emotion` | `fatigueScore` esperado |
|---|---|
| `happiness` | `0.0` – `0.25` (no hay fatiga en estado feliz) |
| `neutral` | `0.25` – `0.55` |
| `surprise` | `0.30` – `0.60` |
| `sadness` | `0.55` – `0.85` |
| `anger` | `0.65` – `0.90` |
| `fear` | `0.65` – `0.90` |
| `contempt` / `disgust` | `0.60` – `0.85` |

---

### Ajuste 3 — `alertCreated` no debe ser `true` para emociones positivas

**Comportamiento actual:** El backend crea una alerta en base de datos cuando `happiness` + `fatigueScore` alto.

**Regla esperada:** `alertCreated: true` **únicamente** cuando la emoción sea negativa (`sadness`, `anger`, `fear`, `contempt`, `disgust`) Y los scores de bienestar sean bajos (promedio < 50%).

Para `happiness` y `neutral`, `alertCreated` debe ser siempre `false`.

---

### Ajuste 4 — El campo `dominantEmotion` debe reflejar la emoción enviada

**Comportamiento actual:** No siempre se devuelve o coincide con el `emotion` enviado en el request.

**Regla esperada:** `dominantEmotion` en la respuesta **debe ser exactamente** el valor `emotion` enviado en el request (o su equivalente normalizado). El frontend lo usa para seleccionar el contenido de intervención correcto.

**Valores válidos esperados en la respuesta:**
```
"happiness" | "neutral" | "surprise" | "sadness" | "anger" | "fear" | "contempt"
```

---

## Resumen del contrato esperado (Request / Response)

### Request (no cambia)
```json
POST /api/evaluation/emotional-analysis/classify
Content-Type: application/json
Authorization: Bearer {token}

{
  "emotion": "happiness",       // string — emoción detectada por Face++
  "confidence": 0.87,           // float 0.0–1.0 — confianza de Face++
  "createAlertOnFatigue": true  // bool — el frontend siempre envía true, pero el backend decide si aplica
}
```

### Response esperada para `happiness`
```json
{
  "attention": 82,
  "concentration": 78,
  "balance": 76,
  "positivity": 88,
  "calm": 80,
  "fatigueScore": 0.10,
  "dominantEmotion": "happiness",
  "alertCreated": false,
  "timestamp": "2026-03-05T14:30:00Z"
}
```
→ Promedio = 80.8% → 🟢 "Estado saludable" ✅

### Response esperada para `anger`
```json
{
  "attention": 55,
  "concentration": 44,
  "balance": 30,
  "positivity": 25,
  "calm": 22,
  "fatigueScore": 0.82,
  "dominantEmotion": "anger",
  "alertCreated": true,
  "timestamp": "2026-03-05T14:30:00Z"
}
```
→ Promedio = 35.2% → 🔴 "Tu cuerpo está en alerta" ✅

---

## Nota sobre la mitigación temporal en el frontend

~~Mientras el backend aplica estos ajustes, el frontend ya tiene una **corrección defensiva** implementada~~

> ✅ **MITIGACIÓN ELIMINADA el 5 de marzo de 2026.**  
> El backend confirmó que los 4 ajustes están implementados y verificados. El frontend ahora confía directamente en los scores del backend sin ninguna lógica de compensación por emoción positiva.

El bloque eliminado era:

```typescript
// ELIMINADO — ya no necesario
const isPositiveEmotion = dominantEmotion === 'happiness' || dominantEmotion === 'happy';
const isRed = !isPositiveEmotion && (alertCreated || fatigueScore >= 0.75 || state === 'critical');
resolvedType = isPositiveEmotion ? 'normal' : (isRed ? 'alert' : 'emotional-load');
```

El frontend ahora evalúa el estado directamente:

```typescript
// Lógica actual — confía en scores del backend
const isRed = result.alertCreated === true ||
              result.fatigueScore >= 0.75 ||
              state === 'critical';
resolvedType = isRed ? 'alert' : state === 'normal' ? 'normal' : 'emotional-load';
```

---

## Contacto y preguntas

Para dudas sobre el flujo completo o los valores exactos de los rangos, coordinar con el equipo de frontend.
