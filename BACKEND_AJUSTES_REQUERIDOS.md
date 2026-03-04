# EmoCheck — Ajustes requeridos en el Backend

> **Fecha de última actualización:** 04 de Marzo 2026
> **Preparado por:** Equipo Frontend
> **Versión API:** V5
> **Estado:** 🔴 Nuevos ajustes pendientes — ver sección V2 al final del documento

---

## Estado final (lote anterior — 22/02/2026)

| # | Endpoint | Problema | Estado |
|---|---|---|---|
| 1 | `POST /api/evaluation/emotional-analysis` | Endpoint inexistente / 405 | ✅ Resuelto |
| 2 | `GET /api/evaluation/my-completed` | `result` venía `null` | ✅ Resuelto |
| 3 | `GET /api/evaluation/my-completed` | `assessmentModuleName` venía `null` | ✅ Resuelto |
| 4 | `GET /api/support/professionals` | Endpoint no existía en V5 | ✅ Resuelto |
| 5 | `GET /api/evaluation/my-completed` o `my-results` | `riskLevel` e `interpretation` en inglés | ✅ Resuelto |
| 6 | `GET /api/support/my-requests` | Faltaba campo `scheduledDate` | ✅ Resuelto |
| 7 | `GET /api/users/me` | Confirmar campo `createdAt` | ✅ Resuelto |
| 8 | `GET /api/recommendation/by-result/{id}` | Confirmar nombre del campo de texto | ✅ Resuelto |
| 9 | `GET /api/evaluation/my-completed` | `dimensionScores` y `recommendations` vienen vacíos | ✅ Resuelto |

---

## 🔴 Nuevos ajustes requeridos — Lote V2 (04/03/2026)

| # | Endpoint | Problema | Prioridad |
|---|---|---|---|
| 1 | `GET /api/casetracking/status/{status}` | `userID` viene `0` y `userFullName` viene `""` | 🔴 Alta |
| 2 | `GET /api/casetracking/status/{status}` | `assignedToUserName` viene `""` | 🔴 Alta |
| 3 | `GET /api/casetracking/{id}/follow-ups` | **Siempre devuelve `[]`** aunque existan follow-ups creados | 🔴 Alta |
| 4 | `POST /api/casetracking/{id}/follow-ups` | El campo `caseFollowUpID` viene `0` en la respuesta | 🟡 Media |

---

### Detalle de cada problema

---

#### 🔴 Problema 1 y 2 — `GET /api/casetracking/status/{status}` devuelve `userID: 0` y nombres vacíos

**Endpoint:** `GET /api/casetracking/status/OPEN`

**Respuesta actual (incorrecta):**
```json
{
  "caseTrackingID": 1,
  "caseNumber": "CASE-2026-0001",
  "alertID": 7,
  "userID": 0,
  "userFullName": "",
  "assignedToUserID": 3,
  "assignedToUserName": "",
  ...
}
```

**Respuesta esperada:**
```json
{
  "caseTrackingID": 1,
  "caseNumber": "CASE-2026-0001",
  "alertID": 7,
  "userID": 12,
  "userFullName": "Simón Rojas",
  "assignedToUserID": 3,
  "assignedToUserName": "Psychologist Rojas",
  ...
}
```

**Causa probable:** Al crear el caso (`POST /casetracking`) el `userID` no se guarda correctamente en la base de datos, o la consulta de lista no hace JOIN con la tabla de usuarios.

**Impacto:** La columna "Usuario" y "Psicólogo" de la tabla de casos aparece vacía.

**Workaround actual en frontend:** Se cruza con `GET /api/users` para resolver nombres, usando el `userID` de la alerta relacionada como fallback cuando `userID = 0`.

---

#### 🔴 Problema 3 — `GET /api/casetracking/{id}/follow-ups` siempre devuelve `[]`

**Endpoint:** `GET /api/casetracking/1/follow-ups`

**Respuesta actual (incorrecta):**
```json
[]
```

**Respuesta esperada:**
```json
[
  {
    "caseFollowUpID": 1,
    "caseTrackingID": 1,
    "performedByUserID": 5,
    "performedByUserName": "Psychologist Rojas",
    "actionType": "SESSION",
    "description": "Nota del seguimiento",
    "outcome": null,
    "nextActionDate": null,
    "performedAt": "2026-03-04T21:30:22Z"
  }
]
```

**Causa probable:** La consulta de lista de follow-ups no está implementada o filtra por un campo incorrecto.

**Impacto crítico:** El historial de seguimientos clínicos no es visible. Un psicólogo no puede ver los seguimientos anteriores de un paciente al reabrir el caso.

**Workaround actual en frontend:** Los follow-ups se acumulan en memoria mientras el panel está abierto. Al cerrar y reabrir el caso, el historial se pierde.

---

#### 🟡 Problema 4 — `POST /api/casetracking/{id}/follow-ups` devuelve `caseFollowUpID: 0`

**Endpoint:** `POST /api/casetracking/1/follow-ups`

**Request (correcto):**
```json
{
  "actionType": "SESSION",
  "description": "Nota del seguimiento"
}
```

**Respuesta actual:**
```json
{
  "caseFollowUpID": 0,
  "caseTrackingID": 1,
  "performedByUserID": 0,
  "performedByUserName": "",
  "actionType": "SESSION",
  "description": "Nota del seguimiento",
  "outcome": null,
  "nextActionDate": null,
  "performedAt": "2026-03-04T21:30:22Z"
}
```

**Respuesta esperada:**
```json
{
  "caseFollowUpID": 3,
  "caseTrackingID": 1,
  "performedByUserID": 5,
  "performedByUserName": "Psychologist Rojas",
  ...
}
```

**Causa probable:** El ID no se retorna después del INSERT, y el usuario autenticado (`performedByUserID`) no se toma del token JWT.

**Impacto:** Menor — el seguimiento sí se guarda pero sin ID válido ni nombre del psicólogo que lo creó.

---

### Resumen de prioridades

| Prioridad | # | Acción requerida |
|---|---|---|
| 🔴 URGENTE | 3 | Implementar correctamente `GET /casetracking/{id}/follow-ups` — devuelve los registros de la tabla |
| 🔴 URGENTE | 1, 2 | En `GET /casetracking/status/{status}`, hacer JOIN con tabla Users para `userFullName` y `assignedToUserName` |
| 🟡 MEDIA | 4 | En `POST /casetracking/{id}/follow-ups`, retornar el ID generado y tomar `performedByUserID` del token JWT |



- **`evaluations.service.ts`**: eliminado el fallback a `GET /evaluation/results/my-results`. Ahora `getMyCompletedEvaluationsWithResult()` llama directamente a `GET /evaluation/my-completed` sin workarounds.
- **`emotional-analysis.service.ts`**: eliminado el resultado neutro hardcodeado. `performFullAnalysis()` ahora recibe y muestra los datos reales del backend.
- **`assessment-hydration.service.ts`**: eliminada la llamada extra a `GET /api/evaluation/{evaluationId}/result`. `hydrateDimensionsFromEvaluationResult()` marcado como `@deprecated`. `GET /api/evaluation/my-completed` es ahora la única fuente de datos para dimensiones y recomendaciones.


---

## Resumen ejecutivo

Se identificaron **8 problemas** en la API V5 que impiden que las pantallas del empleado
funcionen correctamente. Algunos tienen workarounds temporales en el frontend, pero la
solución definitiva debe venir del backend.

| # | Endpoint | Problema | Prioridad | Estado frontend |
|---|---|---|---|---|
| 1 | `POST /api/evaluation/emotional-analysis` | Endpoint inexistente / 405 | 🔴 Alta | Fallback neutro temporal |
| 2 | `GET /api/evaluation/my-completed` | `result` viene `null` | 🔴 Alta | Fallback a `my-results` temporal |
| 3 | `GET /api/evaluation/my-completed` | `assessmentModuleName` viene `null` | 🔴 Alta | Sin solución posible |
| 4 | `GET /api/support/professionals` | Endpoint no existe en V5 | 🔴 Alta | Sección vacía |
| 5 | `GET /api/evaluation/my-completed` o `my-results` | `riskLevel` e `interpretation` en inglés | 🔴 Alta | Se muestra en inglés al usuario |
| 6 | `GET /api/support/my-requests` | Falta campo `scheduledDate` | 🟡 Media | Muestra "Sin programar" |
| 7 | `GET /api/users/me` | Confirmar que incluye `createdAt` | 🟡 Media | Muestra `—` si falta |
| 8 | `GET /api/recommendation/by-result/{id}` | Confirmar nombre del campo de texto | 🟡 Media | Recomendaciones vacías |
| **9** | **`GET /api/evaluation/my-completed`** | **`dimensionScores` y `recommendations` vienen `[]` vacíos** | **🔴 Alta** | **Fallback a `GET /evaluation/{id}/result` temporal** |

---

## Detalle de cada ajuste

---

### 9. 🔴 `GET /api/evaluation/my-completed` — `dimensionScores` y `recommendations` vienen vacíos

**Pantalla afectada:** `/mental-health/results`, `/work-fatigue/results`, `/organizational-climate/results`, `/psychosocial-risk/results`

**Descripción del problema:**
El campo `result.dimensionScores` viene como `[]` (array vacío) y `result.recommendations` también viene `[]` en `GET /api/evaluation/my-completed`. Esto provoca que en la pantalla de resultados:

- Todas las barras de dimensiones (Ansiedad GAD-7, Depresión PHQ, Insomnio ISI, etc.) aparezcan al **0%**
- La sección "Recomendaciones personalizadas" muestre **"No hay recomendaciones disponibles"**

Lo mismo ocurre en la respuesta del `POST /api/evaluation/{id}/complete`.

**Comportamiento actual:**
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
    "dimensionScores": [],        ← VACÍO — problema
    "recommendations": []         ← VACÍO — problema
  }
}
```

**Comportamiento esperado:**
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

**Aplica también a:**
- `POST /api/evaluation/{id}/complete` → la respuesta debe incluir `dimensionScores` y `recommendations` poblados.

**Workaround temporal en el frontend:**
El frontend hace una llamada adicional a `GET /api/evaluation/{evaluationId}/result` para obtener las dimensiones y recomendaciones cuando llegan vacías de `my-completed`. Esto genera una llamada extra innecesaria por cada evaluación que el usuario consulta.

**Solución requerida:**
Que `dimensionScores` y `recommendations` vengan poblados directamente en:
1. `GET /api/evaluation/my-completed` → campo `result.dimensionScores` y `result.recommendations`
2. `POST /api/evaluation/{id}/complete` → en la respuesta directa

> **Verificar también:** que `dimensionScores[].maxScore` sea el valor real del instrumento (ej: `21` para GAD-7, `27` para PHQ-9), no `0`. Si `maxScore = 0`, el frontend muestra 0% aunque el score sea correcto.

---



**Pantalla afectada:** `/emotional-analysis`

**Descripción del problema:**
Al llamar a `POST /api/evaluation/emotional-analysis`, el servidor responde con
**405 Method Not Allowed**. Esto indica que la URL existe en el servidor pero el
método HTTP `POST` no está habilitado para ella.

**Comportamiento actual:**
```
POST https://kratosconquer-001-site1.mtempurl.com/api/evaluation/emotional-analysis
→ 405 Method Not Allowed
```

**Opciones para el backend (elegir una):**

**Opción A — Implementar el endpoint:**
```
POST /api/evaluation/emotional-analysis
Auth: ✅ Cualquier rol
```

Body que envía el frontend:
```json
{
  "framesBase64": ["base64string1", "base64string2", "base64string3"],
  "createAlertOnFatigue": true
}
```

Response esperada:
```json
{
  "attention": 75,
  "concentration": 68,
  "balance": 72,
  "positivity": 65,
  "calm": 70,
  "fatigueScore": 0.3,
  "dominantEmotion": "neutral",
  "alertCreated": false,
  "timestamp": "2026-02-22T10:00:00Z"
}
```

**Opción B — Si el endpoint no se va a implementar:**
Retornar `404 Not Found` en lugar de `405`. Esto permite que el frontend identifique
correctamente que el endpoint no existe y active el fallback sin ambigüedad.

---

### 2. 🔴 `GET /api/evaluation/my-completed` — El objeto `result` viene `null` o vacío

**Pantalla afectada:** `/my-tracking`

**Descripción del problema:**
El endpoint retorna el listado de evaluaciones completadas, pero el campo `result`
dentro de cada evaluación viene `null` o sin datos. Sin este campo, la pantalla
`/my-tracking` no puede mostrar: score, nivel de riesgo, dimensiones ni recomendaciones.

**Comportamiento actual:**
```json
[
  {
    "evaluationID": 123,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-02-20T10:00:00Z",
    "result": null
  }
]
```

**Comportamiento esperado:**
```json
[
  {
    "evaluationID": 123,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-02-20T10:00:00Z",
    "result": {
      "evaluationResultID": 45,
      "evaluationID": 123,
      "totalScore": 15,
      "riskLevel": "Verde",
      "scorePercentage": 75.0,
      "interpretation": "Tu estado emocional es adecuado. Continúa con tus hábitos de bienestar.",
      "calculatedAt": "2026-02-20T10:01:00Z",
      "dimensionScores": [
        {
          "dimensionScoreID": 1,
          "dimensionName": "Ansiedad",
          "score": 8,
          "maxScore": 10,
          "riskLevel": "Verde"
        }
      ],
      "recommendations": [
        {
          "recommendationID": 1,
          "title": "Respiración profunda",
          "recommendationText": "Practica respiración diafragmática 5 minutos al día.",
          "isViewed": false
        }
      ]
    }
  }
]
```

**Nota:** El frontend tiene un workaround temporal que llama a
`GET /api/evaluation/results/my-results` como fallback. La solución definitiva es que
`my-completed` incluya el `result` embebido directamente.

---

### 3. 🔴 `GET /api/evaluation/my-completed` — El campo `assessmentModuleName` viene `null`

**Pantalla afectada:** `/my-tracking`

**Descripción del problema:**
El campo `assessmentModuleName` viene `null` en algunos o todos los items del array.
Sin este campo, el frontend no puede identificar a qué módulo pertenece cada evaluación.

**Comportamiento actual:**
```json
{
  "evaluationID": 123,
  "assessmentModuleName": null,
  "completedAt": "2026-02-20T10:00:00Z"
}
```

**Comportamiento esperado:**
```json
{
  "evaluationID": 123,
  "assessmentModuleName": "Salud Mental",
  "completedAt": "2026-02-20T10:00:00Z"
}
```

**Nombres de módulo que acepta el frontend:**

| Módulo | Valores aceptados en `assessmentModuleName` |
|---|---|
| Salud Mental | `"Salud Mental"`, `"Mental"`, `"salud"` |
| Fatiga Laboral | `"Fatiga Laboral"`, `"Fatiga"`, `"Fatigue"` |
| Clima Organizacional | `"Clima Organizacional"`, `"Clima"`, `"Climate"` |
| Riesgo Psicosocial | `"Riesgo Psicosocial"`, `"Psicosocial"` |

---

### 4. 🔴 `GET /api/support/professionals` — Endpoint no existe en la API V5

**Pantalla afectada:** `/support` → sección "Emergencias"

**Descripción del problema:**
La pantalla de Ayuda (`/support`) llama a `GET /api/support/professionals` para mostrar
la lista de contactos de emergencia (psicólogos disponibles con número de teléfono).
Este endpoint **no está documentado ni implementado** en la API V5, por lo que la sección
siempre muestra "Sin contactos disponibles".

**Endpoint requerido:**
```
GET /api/support/professionals
Auth: ✅ Cualquier rol
```

**Response esperada:**
```json
[
  {
    "professionalSupportID": 1,
    "fullName": "Dra. María López",
    "email": "mlopez@emocheck.com",
    "phone": "+57 300 000 0001",
    "isEmergencyContact": true,
    "availability": "Lunes a Viernes 8am - 6pm",
    "specialties": ["Ansiedad", "Estrés laboral"],
    "bio": "Psicóloga clínica con 10 años de experiencia."
  }
]
```

**Lógica de uso en el frontend:**
- Filtra los profesionales con `isEmergencyContact === true`
- Los muestra en la tarjeta de Emergencias con nombre, teléfono y disponibilidad

---

### 5. 🔴 `riskLevel` e `interpretation` vienen en inglés

**Pantallas afectadas:** `/mental-health/results`, `/my-tracking`, y todos los módulos de evaluación

**Descripción del problema:**
Los campos `riskLevel` e `interpretation` que retorna el backend vienen en inglés.
Estos valores se muestran **directamente al usuario final** en la pantalla de resultados.

**Comportamiento actual:**
```json
{
  "riskLevel": "HIGH",
  "interpretation": "Evaluation completed for module 'Salud Mental'. Risk level: HIGH."
}
```

**Lo que ve el usuario:**
- Badge: `HIGH`
- Descripción: `Evaluation completed for module 'Salud Mental'. Risk level: HIGH.`

**Comportamiento esperado:**
```json
{
  "riskLevel": "Alto",
  "interpretation": "Se han detectado indicadores de riesgo alto. Te recomendamos buscar apoyo profesional."
}
```

**Tabla de traducción requerida para `riskLevel`:**

| Valor actual (inglés) | Valor esperado (español) |
|---|---|
| `"LOW"` / `"Green"` | `"Bajo"` o `"Verde"` |
| `"MEDIUM"` / `"Yellow"` | `"Medio"` o `"Amarillo"` |
| `"HIGH"` / `"Red"` | `"Alto"` o `"Rojo"` |
| `"SEVERE"` | `"Severo"` |
| `"MODERATE"` | `"Moderado"` |
| `"MILD"` | `"Leve"` |

**Para `interpretation`:** debe ser una oración en español que describa el resultado del
usuario. Ejemplos:

- Riesgo bajo: `"Tu estado emocional es adecuado. Continúa con tus hábitos de bienestar."`
- Riesgo medio: `"Se han detectado algunos indicadores de atención. Te recomendamos explorar los recursos disponibles."`
- Riesgo alto: `"Se han detectado indicadores de riesgo alto. Te recomendamos buscar apoyo profesional."`

**Aplica a todos los endpoints que devuelvan resultados:**
- `GET /api/evaluation/results/my-results`
- `GET /api/evaluation/my-completed` (campo `result`)
- `GET /api/evaluation/{id}/result`

---

### 6. 🟡 `GET /api/support/my-requests` — Falta el campo `scheduledDate`

**Pantalla afectada:** `/my-tracking` → sección "Seguimientos Psicosociales"

**Descripción del problema:**
La sección "Próximo seguimiento" usa el campo `scheduledDate` de cada solicitud de apoyo
para mostrar la fecha de la próxima cita con el psicólogo. Si este campo no existe,
siempre muestra "Sin programar".

**Comportamiento esperado en cada item:**
```json
{
  "supportRequestID": 1,
  "requestType": "PSYCHOLOGICAL",
  "subject": "Apoyo por estrés laboral",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "scheduledDate": "2026-03-10T10:00:00Z",
  "requestedAt": "2026-02-15T08:00:00Z",
  "updatedAt": "2026-02-18T09:00:00Z"
}
```

**Lógica que usa el frontend:**
- **Última sesión:** requests con `status === "RESOLVED"`, ordenadas por `updatedAt` DESC → toma la primera.
- **Próximo seguimiento:** requests con `status === "OPEN"` o `"IN_PROGRESS"` que tengan `scheduledDate`, ordenadas por `scheduledDate` ASC → toma la primera.

---

### 7. 🟡 `GET /api/users/me` — Confirmar que incluye el campo `createdAt`

**Pantalla afectada:** `/my-tracking` → tarjeta "Tiempo en EmoCheck"

**Descripción del problema:**
El frontend usa `createdAt` del perfil del usuario autenticado para calcular cuánto
tiempo lleva en la plataforma (ej: "1 mes", "3 días", "1 año").

**Confirmar que la respuesta incluye:**
```json
{
  "userID": 1,
  "firstName": "Juan",
  "lastName": "Operativo",
  "email": "juan@empresa.com",
  "createdAt": "2026-01-15T00:00:00Z"
}
```

**Nota:** El frontend acepta tanto `createdAt` como `creationDate`. Solo confirmar que
uno de los dos existe en la respuesta.

---

### 8. 🟡 `GET /api/recommendation/by-result/{evaluationResultId}` — Confirmar nombre del campo de texto

**Pantalla afectada:** `/my-tracking` → sección "Recomendaciones Personalizadas"

**Descripción del problema:**
El frontend lee el texto de cada recomendación buscando los campos en este orden:
`recommendationText` → `description` → `text` → `title`. Si el backend usa un nombre
diferente, las recomendaciones aparecen vacías.

**Confirmar que cada item tiene al menos uno de estos campos:**
```json
{
  "recommendationID": 1,
  "recommendationText": "Practica respiración diafragmática 5 minutos al día.",
  "title": "Técnica de respiración",
  "isViewed": false
}
```

**Si el backend usa otro nombre de campo** (ej: `content`, `body`, `message`),
notificar al equipo frontend para actualizar el mapeo.

---

## Verificación post-ajuste

Una vez aplicados los ajustes, el equipo frontend verificará los siguientes flujos:

### `/support`
- [ ] La sección "Emergencias" muestra los profesionales con teléfono y disponibilidad
- [ ] El botón "Nueva solicitud" crea correctamente la solicitud y aparece en la lista
- [ ] Los estados de las solicitudes (`OPEN`, `IN_PROGRESS`, `RESOLVED`) se muestran en español

### `/my-tracking`
- [ ] Los módulos completados muestran su score y nivel de riesgo **en español**
- [ ] Las barras de progreso por dimensión tienen datos con etiquetas **en español**
- [ ] Las recomendaciones personalizadas se muestran con texto
- [ ] La tarjeta "Tiempo en EmoCheck" muestra días/meses/años reales
- [ ] La sección "Seguimientos Psicosociales" muestra fechas reales de citas

### `/mental-health/results` (y todos los módulos)
- [ ] El badge de riesgo muestra texto en español (ej: `"Alto"` en lugar de `"HIGH"`)
- [ ] La descripción del resultado está en español

### `/emotional-analysis`
- [ ] El análisis facial completa sin error 405
- [ ] Los scores de atención, concentración, equilibrio, positividad y calma son reales

---

## Contacto

Para dudas sobre el formato esperado o aclaraciones técnicas, contactar al equipo frontend.


---

## Resumen ejecutivo

Se identificaron **6 problemas** en la API V5 que impiden que las pantallas del empleado
(`/my-tracking`, `/emotional-analysis`) funcionen correctamente. Algunos tienen workarounds
temporales en el frontend, pero la solución definitiva debe venir del backend.

| # | Endpoint | Tipo | Prioridad | Estado frontend |
|---|---|---|---|---|
| 1 | `POST /api/evaluation/emotional-analysis` | Endpoint inexistente / 405 | 🔴 Alta | Fallback neutro temporal |
| 2 | `GET /api/evaluation/my-completed` | `result` viene `null` | 🔴 Alta | Fallback a `my-results` temporal |
| 3 | `GET /api/evaluation/my-completed` | `assessmentModuleName` viene `null` | 🔴 Alta | Sin solución posible |
| 4 | `GET /api/support/my-requests` | Falta campo `scheduledDate` | 🟡 Media | Muestra "Sin programar" |
| 5 | `GET /api/users/me` | Confirmar que incluye `createdAt` | 🟡 Media | Muestra `—` si falta |
| 6 | `GET /api/recommendation/by-result/{id}` | Confirmar nombre del campo | 🟡 Media | Recomendaciones vacías |

---

## Detalle de cada ajuste

---

### 1. 🔴 `POST /api/evaluation/emotional-analysis` — Devuelve 405 Method Not Allowed

**Pantalla afectada:** `/emotional-analysis`

**Descripción del problema:**
Al llamar a `POST /api/evaluation/emotional-analysis`, el servidor responde con
**405 Method Not Allowed**. Esto indica que la URL existe en el servidor pero el
método HTTP `POST` no está habilitado para ella.

**Comportamiento actual:**
```
POST https://kratosconquer-001-site1.mtempurl.com/api/evaluation/emotional-analysis
→ 405 Method Not Allowed
```

**Opciones para el backend (elegir una):**

**Opción A — Implementar el endpoint:**
```
POST /api/evaluation/emotional-analysis
Auth: ✅ Cualquier rol
```

Body que envía el frontend:
```json
{
  "framesBase64": ["base64string1", "base64string2", "base64string3"],
  "createAlertOnFatigue": true
}
```

Response esperada:
```json
{
  "attention": 75,
  "concentration": 68,
  "balance": 72,
  "positivity": 65,
  "calm": 70,
  "fatigueScore": 0.3,
  "dominantEmotion": "neutral",
  "alertCreated": false,
  "timestamp": "2026-02-22T10:00:00Z"
}
```

**Opción B — Si el endpoint no se va a implementar:**
Retornar `404 Not Found` en lugar de `405`. Esto permite que el frontend identifique
correctamente que el endpoint no existe y active el fallback sin ambigüedad.

---

### 2. 🔴 `GET /api/evaluation/my-completed` — El objeto `result` viene `null` o vacío

**Pantalla afectada:** `/my-tracking`

**Descripción del problema:**
El endpoint retorna el listado de evaluaciones completadas, pero el campo `result`
dentro de cada evaluación viene `null` o sin datos. Sin este campo, la pantalla
`/my-tracking` no puede mostrar: score, nivel de riesgo, dimensiones ni recomendaciones.

**Comportamiento actual:**
```json
[
  {
    "evaluationID": 123,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-02-20T10:00:00Z",
    "result": null   ← PROBLEMA
  }
]
```

**Comportamiento esperado:**
```json
[
  {
    "evaluationID": 123,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-02-20T10:00:00Z",
    "result": {
      "evaluationResultID": 45,
      "evaluationID": 123,
      "totalScore": 15,
      "riskLevel": "Green",
      "scorePercentage": 75.0,
      "interpretation": "Tu estado emocional es adecuado...",
      "calculatedAt": "2026-02-20T10:01:00Z",
      "dimensionScores": [
        {
          "dimensionScoreID": 1,
          "dimensionName": "Ansiedad",
          "score": 8,
          "maxScore": 10,
          "riskLevel": "Green"
        }
      ],
      "recommendations": [
        {
          "recommendationID": 1,
          "title": "Respiración profunda",
          "recommendationText": "Practica respiración diafragmática 5 minutos al día.",
          "isViewed": false
        }
      ]
    }
  }
]
```

**Nota:** El frontend tiene un workaround temporal que llama a
`GET /api/evaluation/results/my-results` como fallback y cruza los datos por `evaluationID`.
Sin embargo, esto genera una segunda llamada innecesaria. La solución definitiva es que
`my-completed` incluya el `result` embebido directamente.

---

### 3. 🔴 `GET /api/evaluation/my-completed` — El campo `assessmentModuleName` viene `null`

**Pantalla afectada:** `/my-tracking`

**Descripción del problema:**
El campo `assessmentModuleName` viene `null` en algunos o todos los items del array.
Sin este campo, el frontend no puede identificar a qué módulo pertenece cada evaluación
(Salud Mental, Fatiga Laboral, Clima Organizacional, Riesgo Psicosocial), por lo que
todos los módulos aparecen como "Evaluación pendiente" aunque estén completados.

**Comportamiento actual:**
```json
{
  "evaluationID": 123,
  "assessmentModuleName": null,   ← PROBLEMA
  "completedAt": "2026-02-20T10:00:00Z"
}
```

**Comportamiento esperado:**
```json
{
  "evaluationID": 123,
  "assessmentModuleName": "Salud Mental",   ← debe ser el nombre del módulo
  "completedAt": "2026-02-20T10:00:00Z"
}
```

**Nombres de módulo que espera el frontend** (debe coincidir uno de estos, sin importar
mayúsculas/minúsculas):

| Módulo frontend | Nombres aceptados en `assessmentModuleName` |
|---|---|
| Salud Mental | `"Salud Mental"`, `"Mental"`, `"salud"` |
| Fatiga Laboral | `"Fatiga Laboral"`, `"Fatiga"`, `"Fatigue"` |
| Clima Organizacional | `"Clima Organizacional"`, `"Clima"`, `"Climate"` |
| Riesgo Psicosocial | `"Riesgo Psicosocial"`, `"Psicosocial"` |

---

### 4. 🟡 `GET /api/support/my-requests` — Falta el campo `scheduledDate`

**Pantalla afectada:** `/my-tracking` → sección "Seguimientos Psicosociales"

**Descripción del problema:**
La sección "Próximo seguimiento" en `/my-tracking` usa el campo `scheduledDate` de
cada solicitud de apoyo para mostrar la fecha de la próxima sesión con el psicólogo.
Si este campo no existe en la respuesta, siempre muestra "Sin programar".

**Comportamiento esperado en cada item:**
```json
{
  "supportRequestID": 1,
  "requestType": "PSYCHOLOGICAL",
  "subject": "Apoyo por estrés laboral",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "scheduledDate": "2026-03-10T10:00:00Z",   ← necesario para "Próximo seguimiento"
  "createdAt": "2026-02-15T08:00:00Z",
  "updatedAt": "2026-02-18T09:00:00Z"         ← necesario para "Última sesión"
}
```

**Lógica que usa el frontend:**
- **Última sesión:** busca requests con `status === "RESOLVED"`, ordena por `updatedAt` DESC, toma el primero.
- **Próximo seguimiento:** busca requests con `status === "OPEN"` o `"IN_PROGRESS"` que tengan `scheduledDate`, ordena por `scheduledDate` ASC, toma el primero.

---

### 5. 🟡 `GET /api/users/me` — Confirmar que incluye el campo `createdAt`

**Pantalla afectada:** `/my-tracking` → tarjeta "Tiempo en EmoCheck"

**Descripción del problema:**
El frontend usa `createdAt` del perfil del usuario autenticado para calcular cuánto
tiempo lleva en la plataforma (ej: "1 mes", "3 días", "1 año"). Si este campo no
viene en la respuesta, el valor muestra `—`.

**Confirmar que la respuesta incluye:**
```json
{
  "userID": 1,
  "firstName": "Juan",
  "lastName": "Operativo",
  "email": "juan@empresa.com",
  "createdAt": "2026-01-15T00:00:00Z"   ← necesario
}
```

**Nota:** El frontend acepta tanto `createdAt` como `creationDate`. Si el backend usa
`creationDate`, también funciona. Solo confirmar que uno de los dos existe en la respuesta.

---

### 6. 🟡 `GET /api/recommendation/by-result/{evaluationResultId}` — Confirmar nombre del campo de texto

**Pantalla afectada:** `/my-tracking` → sección "Recomendaciones Personalizadas"

**Descripción del problema:**
El frontend lee el texto de cada recomendación buscando los campos en este orden:
`recommendationText` → `description` → `text` → `title`. Si el backend usa un nombre
de campo diferente, las recomendaciones aparecen vacías aunque el API sí las devuelva.

**Confirmar que cada item tiene al menos uno de estos campos con texto:**
```json
{
  "recommendationID": 1,
  "recommendationText": "Practica respiración diafragmática 5 minutos al día.",
  "title": "Técnica de respiración",
  "isViewed": false
}
```

**Si el backend usa otro nombre de campo** (ej: `content`, `body`, `message`),
notificar al equipo frontend para actualizar el mapeo.

---

## Verificación post-ajuste

Una vez aplicados los ajustes, el equipo frontend verificará los siguientes flujos:

1. **`/my-tracking`**
   - [ ] Los módulos completados muestran su score y nivel de riesgo
   - [ ] Las barras de progreso por dimensión tienen datos
   - [ ] Las recomendaciones personalizadas se muestran
   - [ ] La tarjeta "Tiempo en EmoCheck" muestra días/meses/años reales
   - [ ] La sección "Seguimientos Psicosociales" muestra fechas reales

2. **`/emotional-analysis`**
   - [ ] El análisis facial completa sin error 405 en consola
   - [ ] Los scores de atención, concentración, equilibrio, positividad y calma son reales

3. **`/mental-health` y otros módulos**
   - [ ] Al completar una evaluación, el resultado aparece en `/my-tracking` inmediatamente

---

## Contacto

Para dudas sobre el formato esperado o aclaraciones técnicas, contactar al equipo frontend.
