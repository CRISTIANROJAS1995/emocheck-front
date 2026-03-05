# EmoCheck — Ajuste Backend: Módulos Multi-Instrumento

> **Fecha:** 05 de Marzo 2026
> **Módulo afectado:** Salud Mental (`/mental-health`) — y cualquier módulo con más de un instrumento
> **Prioridad:** 🔴 Bloqueante — el usuario no puede presentar más de 1 instrumento

---

## Contexto

El módulo de **Salud Mental** tiene varios instrumentos independientes que el usuario presenta uno a uno:

| Instrumento | Descripción |
|---|---|
| BAI | Inventario de Ansiedad de Beck |
| BDI | Inventario de Depresión de Beck |
| DASS-21 | Escala de Depresión, Ansiedad y Estrés |
| ICSP-VC | Índice de Calidad del Sueño |
| TMMS-24 | Escala de Inteligencia Emocional |
| PSS-10 | Escala de Estrés Percibido |

El usuario entra al módulo, elige un instrumento, lo responde y vuelve a la pantalla de selección para elegir el siguiente. **Cada instrumento es una evaluación independiente con su propio `evaluationID`.**

---

## Problema 1 — `POST /api/evaluation/start` devuelve 409 al presentar el 2do instrumento

### Flujo actual (roto)

```
1. Usuario presenta BAI
   POST /api/evaluation/start  { "moduleID": 3 }
   → HTTP 200  { "evaluationID": 101 }   ✅

2. Usuario responde BAI y completa
   POST /api/evaluation/101/complete
   → HTTP 200  { resultado del BAI }     ✅

3. Usuario vuelve al módulo y elige BDI
   POST /api/evaluation/start  { "moduleID": 3 }
   → HTTP 409  EVALUATION_ALREADY_COMPLETED  ❌
```

### Flujo esperado

```
1. Usuario presenta BAI
   POST /api/evaluation/start  { "moduleID": 3, "instrumentID": 5 }
   → HTTP 200  { "evaluationID": 101 }   ✅

2. Usuario responde BAI y completa
   POST /api/evaluation/101/complete
   → HTTP 200  { resultado del BAI }     ✅

3. Usuario vuelve al módulo y elige BDI
   POST /api/evaluation/start  { "moduleID": 3, "instrumentID": 7 }
   → HTTP 200  { "evaluationID": 102 }   ✅  (nuevo evaluationID)

4. Usuario responde BDI y completa
   POST /api/evaluation/102/complete
   → HTTP 200  { resultado del BDI }     ✅
```

### Cambio requerido en el backend

**Modificar `POST /api/evaluation/start` para:**

1. **Aceptar `instrumentID` en el body** (campo opcional):

```json
{
  "moduleID": 3,
  "instrumentID": 7,
  "isAnonymous": false,
  "period": "2026-03"
}
```

2. **Cambiar la validación de unicidad:** en lugar de bloquear cuando ya existe una evaluación completada del módulo, validar por `(moduleID + instrumentID)` — o sea, un usuario puede tener múltiples evaluaciones del mismo módulo siempre que sean de instrumentos distintos.

**Regla de unicidad actual (incorrecta):**
```
Un usuario NO puede tener más de una evaluación completada por módulo.
```

**Regla de unicidad correcta:**
```
Un usuario NO puede tener más de una evaluación completada por instrumento.
Si instrumentID no viene en el body → mantener la validación actual por módulo.
```

**Ejemplo de validación en pseudocódigo:**
```csharp
// Antes (bloquea todo el módulo)
var yaCompletado = db.Evaluations.Any(e =>
    e.UserID == userId &&
    e.ModuleID == moduleID &&
    e.IsCompleted == true);

// Después (bloquea solo el instrumento específico)
var yaCompletado = instrumentID.HasValue
    ? db.Evaluations.Any(e =>
          e.UserID == userId &&
          e.InstrumentID == instrumentID &&
          e.IsCompleted == true)
    : db.Evaluations.Any(e =>
          e.UserID == userId &&
          e.ModuleID == moduleID &&
          e.IsCompleted == true);
```

3. **Guardar `instrumentID` en la tabla `Evaluations`** para que luego se devuelva en `my-completed` (ver Problema 2).

---

## Problema 2 — `GET /api/evaluation/my-completed` no devuelve `instrumentCode`

### Situación actual

El endpoint devuelve las evaluaciones completadas pero sin indicar a qué instrumento corresponde cada una:

```json
[
  {
    "evaluationID": 101,
    "moduleID": 3,
    "instrumentCode": null,          ← viene null
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-05T10:00:00Z",
    "result": {
      "dimensionScores": [
        {
          "dimensionName": "Ansiedad",
          "instrumentCode": null,    ← viene null
          "score": 12,
          "maxScore": 21
        }
      ]
    }
  },
  {
    "evaluationID": 102,
    "moduleID": 3,
    "instrumentCode": null,          ← viene null — ¿esto es BAI o BDI?
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-05T11:00:00Z",
    "result": { ... }
  }
]
```

Sin `instrumentCode` el frontend **no puede saber** qué instrumentos ya fueron respondidos. El resultado: o todos los instrumentos aparecen disponibles (el usuario puede presentarlos de nuevo) o todos aparecen bloqueados.

### Respuesta esperada

```json
[
  {
    "evaluationID": 101,
    "moduleID": 3,
    "instrumentCode": "BAI",         ← código del instrumento respondido
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-05T10:00:00Z",
    "result": {
      "evaluationResultID": 55,
      "totalScore": 18,
      "riskLevel": "Moderado",
      "scorePercentage": 43.0,
      "interpretation": "Se detectaron síntomas moderados de ansiedad.",
      "dimensionScores": [
        {
          "dimensionScoreID": 10,
          "dimensionName": "Ansiedad",
          "instrumentCode": "BAI",   ← código también en cada dimensión
          "score": 18,
          "maxScore": 42,
          "riskLevel": "Moderado"
        }
      ],
      "recommendations": [
        {
          "recommendationID": 3,
          "recommendationText": "Practica técnicas de respiración diafragmática.",
          "isViewed": false
        }
      ]
    }
  },
  {
    "evaluationID": 102,
    "moduleID": 3,
    "instrumentCode": "BDI",         ← distinto instrumento, mismo módulo
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-05T11:00:00Z",
    "result": {
      "dimensionScores": [
        {
          "dimensionName": "Depresión",
          "instrumentCode": "BDI",
          "score": 8,
          "maxScore": 63,
          "riskLevel": "Leve"
        }
      ]
    }
  }
]
```

### Cambio requerido en el backend

1. **En la tabla `Evaluations`:** guardar el `InstrumentID` cuando se crea la evaluación (viene del campo `instrumentID` del `POST /evaluation/start`).

2. **En la query de `my-completed`:** hacer JOIN con la tabla `Instruments` para resolver el `code` del instrumento y devolverlo en el campo `instrumentCode`:

```csharp
// Pseudocódigo
select e.EvaluationID,
       e.ModuleID,
       i.Code as InstrumentCode,        // ← JOIN con Instruments
       m.Name as AssessmentModuleName,
       e.CompletedAt,
       r.*                              // resultado con dimensiones y recomendaciones
from Evaluations e
left join Instruments i on e.InstrumentID = i.InstrumentID
left join Modules m on e.ModuleID = m.ModuleID
left join EvaluationResults r on e.EvaluationID = r.EvaluationID
where e.UserID = @userId and e.IsCompleted = true
```

3. **En `dimensionScores`:** cada dimension ya debería tener un `InstrumentCode` asociado (por la tabla de rangos o de instrumentos). Solo es necesario incluirlo en el DTO de respuesta.

---

## Resumen de cambios

| # | Endpoint | Cambio | Impacto |
|---|---|---|---|
| 1 | `POST /api/evaluation/start` | Aceptar `instrumentID` en el body; validar unicidad por instrumento (no por módulo) | Permite presentar múltiples instrumentos del mismo módulo |
| 2 | `GET /api/evaluation/my-completed` | Devolver `instrumentCode` en la raíz y en `dimensionScores[]` | El frontend puede marcar correctamente qué instrumentos ya fueron completados |

---

## Pantallas afectadas

### `/mental-health` — Selector de instrumentos
- **Bug actual:** Al completar BAI e intentar presentar BDI → mensaje "Instrumento ya completado"
- **Con el fix:** Cada instrumento se puede presentar de forma independiente

### `/mental-health/instrument-results` — Resultados por instrumento
- **Bug actual:** Solo aparece 1 instrumento marcado como completado aunque se hayan presentado varios
- **Con el fix:** Cada instrumento completado aparece con su badge ✅

---

## Contacto

Para dudas sobre el formato esperado o aclaraciones técnicas, contactar al equipo frontend.
