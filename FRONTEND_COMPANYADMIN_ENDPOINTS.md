# Endpoints CompanyAdmin — Ver información de un usuario específico

> **Contexto:** El rol `CompanyAdmin` necesita visualizar la información de cualquier usuario de su empresa. Los endpoints personales (`/my-*`) usan el JWT del usuario autenticado como fuente del `userId`. Los endpoints de admin reciben el `userId` como parámetro en la URL y aplican el mismo servicio internamente.

---

## Tabla de reemplazo

| Vista / Funcionalidad | Endpoint personal (usuario propio) | Endpoint CompanyAdmin (por userId) |
|---|---|---|
| Lista de evaluaciones | `GET /api/evaluation/my-evaluations` | `GET /api/evaluation/user/{userId}` |
| Evaluaciones completadas con score, riesgo y dimensiones | `GET /api/evaluation/my-completed` | `GET /api/evaluation/user/{userId}/completed` |
| Historial de lecturas emocionales (Face ID) | `GET /api/evaluation/emotional-analysis/history` | `GET /api/evaluation/emotional-analysis/history/{userId}` |
| Solicitudes de soporte | `GET /api/support/my-requests` | `GET /api/support/user/{userId}` |

---

## Detalle de cada endpoint

### 1. Lista de evaluaciones

```
GET /api/evaluation/user/{userId}
Authorization: Bearer <token_CompanyAdmin>
```

**Respuesta:** igual a `/my-evaluations`

```json
[
  {
    "evaluationID": 12,
    "moduleID": 3,
    "moduleName": "Riesgo Psicosocial",
    "status": "Completed",
    "startedAt": "2026-03-10T14:00:00Z",
    "completedAt": "2026-03-10T14:45:00Z"
  }
]
```

---

### 2. Evaluaciones completadas con score, riesgo y dimensiones

```
GET /api/evaluation/user/{userId}/completed
Authorization: Bearer <token_CompanyAdmin>
```

**Respuesta:** igual a `/my-completed`

```json
[
  {
    "evaluationID": 12,
    "moduleName": "Riesgo Psicosocial",
    "completedAt": "2026-03-10T14:45:00Z",
    "result": {
      "evaluationResultID": 7,
      "totalScore": 68,
      "scorePercentage": 56.6,
      "riskLevel": "Medio",
      "interpretation": "Riesgo medio identificado en carga de trabajo.",
      "scoreRangeLabel": "Medio",
      "scoreRangeColor": "#FFA500",
      "dimensionScores": [ ... ],
      "recommendations": [ ... ]
    }
  }
]
```

---

### 3. Historial de lecturas emocionales (Face ID)

```
GET /api/evaluation/emotional-analysis/history/{userId}
Authorization: Bearer <token_CompanyAdmin>
```

**Query params opcionales** (mismos que el endpoint personal):

| Param | Tipo | Descripción |
|---|---|---|
| `days` | int | Últimos N días (ej. `?days=30`) |
| `from` | DateTime ISO 8601 | Fecha inicio (ej. `?from=2026-03-01`) |
| `to` | DateTime ISO 8601 | Fecha fin (ej. `?to=2026-04-01`) |
| `limit` | int | Máximo de registros |

**Ejemplo:**
```
GET /api/evaluation/emotional-analysis/history/561?days=30
```

**Respuesta:** igual a `/emotional-analysis/history`

```json
[
  {
    "emotionReadingID": 5,
    "evaluationID": null,
    "emotion": "anger",
    "confidence": 0.076,
    "attention": 62,
    "concentration": 56,
    "balance": 38,
    "positivity": 34,
    "calm": 34,
    "fatigueScore": 0.67,
    "timestamp": "2026-04-07T20:23:16.687Z"
  }
]
```

---

### 4. Solicitudes de soporte

```
GET /api/support/user/{userId}
Authorization: Bearer <token_CompanyAdmin>
```

**Respuesta:** igual a `/my-requests`

```json
[
  {
    "supportRequestID": 3,
    "subject": "Consulta sobre resultado",
    "status": "Open",
    "createdAt": "2026-04-01T09:00:00Z"
  }
]
```

---

## Cómo obtener el `userId` del usuario seleccionado

El `userId` viene del endpoint de usuarios de la empresa:

```
GET /api/users/my-company
Authorization: Bearer <token_CompanyAdmin>
```

Cada objeto del array devuelve `userID`. Ese valor es el que se pasa como `{userId}` en todos los endpoints de arriba.

```json
[
  {
    "userID": 561,
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@empresa.com",
    "siteName": "Sede Central",
    "areaName": "Recursos Humanos"
  }
]
```

---

## Notas de seguridad

- Todos los endpoints de admin validan el JWT. Si el token no tiene rol `CompanyAdmin` (o `SuperAdmin`, `Psychologist`, `HRManager`), la API retorna **401/403**.
- El backend **no valida** que el `userId` pertenezca a la misma empresa del `CompanyAdmin`. Se asume que el frontend filtra previamente usando `/api/users/my-company`.
