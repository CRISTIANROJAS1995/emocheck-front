# ✅ Issue #9 — `dimensionScores` y `recommendations` vienen vacíos

> **Fecha:** 22 de Febrero 2026
> **Prioridad:** 🔴 Alta → ✅ Resuelto
> **Reportado por:** Equipo Frontend
> **Resuelto por:** Equipo Backend — 22 de Febrero 2026
> **Afecta:** `/mental-health/results`, `/work-fatigue/results`, `/organizational-climate/results`, `/psychosocial-risk/results`

---

## ✅ Estado: Resuelto

El backend desplegó los ajustes requeridos. El equipo frontend eliminó la llamada extra a
`GET /api/evaluation/{id}/result`. Ahora `GET /api/evaluation/my-completed` es la
**única fuente de datos** para dimensiones y recomendaciones.

**Cambios aplicados en el frontend:**
- Eliminada la llamada extra a `GET /api/evaluation/{evaluationId}/result` del componente `assessment-results`
- `hydrateDimensionsFromEvaluationResult()` marcado como `@deprecated` en `assessment-hydration.service.ts`
- El flujo de hidratación queda: `my-completed` → `recommendation/by-result/{id}` (solo si recs aún vacías)

---

## Descripción del problema (histórico)

En la pantalla de resultados de evaluación, las barras de dimensiones aparecen al **0%**
y la sección de recomendaciones dice **"No hay recomendaciones disponibles"**, aunque el
usuario sí completó la evaluación correctamente.

Después de investigar, confirmamos que el problema está en el backend: los arrays
`dimensionScores` y `recommendations` llegan **vacíos** (`[]`) en las respuestas de los
endpoints de evaluación.

---

## Endpoints afectados

### 1. `GET /api/evaluation/my-completed`

**Respuesta actual (incorrecta):**

```json
{
  "evaluationID": 123,
  "assessmentModuleName": "Salud Mental",
  "completedAt": "2026-02-20T10:00:00Z",
  "result": {
    "evaluationResultID": 45,
    "evaluationID": 123,
    "totalScore": 15,
    "riskLevel": "Alto",
    "scorePercentage": 75.0,
    "interpretation": "Tu estado emocional es adecuado.",
    "calculatedAt": "2026-02-20T10:01:00Z",
    "dimensionScores": [],      ← VACÍO
    "recommendations": []       ← VACÍO
  }
}
```

**Respuesta esperada (correcta):**

```json
{
  "evaluationID": 123,
  "assessmentModuleName": "Salud Mental",
  "completedAt": "2026-02-20T10:00:00Z",
  "result": {
    "evaluationResultID": 45,
    "evaluationID": 123,
    "totalScore": 15,
    "riskLevel": "Alto",
    "scorePercentage": 75.0,
    "interpretation": "Tu estado emocional es adecuado.",
    "calculatedAt": "2026-02-20T10:01:00Z",
    "dimensionScores": [
      {
        "dimensionScoreID": 1,
        "dimensionName": "Ansiedad",
        "score": 8,
        "maxScore": 21,
        "riskLevel": "Bajo"
      },
      {
        "dimensionScoreID": 2,
        "dimensionName": "Depresión",
        "score": 5,
        "maxScore": 27,
        "riskLevel": "Bajo"
      }
    ],
    "recommendations": [
      {
        "recommendationID": 1,
        "title": "Técnicas de respiración",
        "recommendationText": "Practica respiración diafragmática 10 minutos al día.",
        "isViewed": false
      }
    ]
  }
}
```

---

### 2. `POST /api/evaluation/{id}/complete`

Mismo problema. La respuesta de este endpoint también debe incluir `dimensionScores`
y `recommendations` poblados, con la misma estructura mostrada arriba.

---

## ⚠️ Punto crítico — `maxScore` no puede ser `0`

El frontend calcula el porcentaje de cada dimensión con la fórmula:

```
porcentaje = (score / maxScore) * 100
```

Si `maxScore` viene en `0`, el resultado siempre será **0%** aunque el `score` sea correcto.

**`maxScore` debe ser el puntaje máximo posible del instrumento:**

| Instrumento | `maxScore` correcto |
|---|---|
| GAD-7 (Ansiedad) | `21` |
| PHQ-9 (Depresión) | `27` |
| ISI (Insomnio) | `28` |
| PSS (Estrés Percibido) | `40` |

---

## Impacto visual actual

| Elemento en pantalla | Lo que ve el usuario ahora | Lo que debería ver |
|---|---|---|
| Barras de dimensiones | Todas al **0%** | Porcentaje real por dimensión |
| Recomendaciones | "No hay recomendaciones disponibles" | Lista de recomendaciones personalizadas |

---

## Solución aplicada — checklist

- [x] `GET /api/evaluation/my-completed` → `result.dimensionScores` viene poblado (no `[]`)
- [x] `GET /api/evaluation/my-completed` → `result.recommendations` viene poblado (no `[]`)
- [x] `POST /api/evaluation/{id}/complete` → respuesta incluye `dimensionScores` poblado
- [x] `POST /api/evaluation/{id}/complete` → respuesta incluye `recommendations` poblado
- [x] `dimensionScores[].maxScore` tiene el valor real del instrumento (no `0`)

---

## Nota sobre workaround temporal en el frontend

~~Mientras se resuelve este issue, el frontend ya implementó un fallback que hace una
llamada adicional a `GET /api/evaluation/{evaluationId}/result` para intentar recuperar
los datos de dimensiones y recomendaciones.~~

**Workaround eliminado.** El frontend usa únicamente `GET /api/evaluation/my-completed`
como fuente definitiva de datos de dimensiones y recomendaciones.
