# EmoCheck — Ajustes Backend Requeridos (Lote 2)

> **Fecha:** 04 de Marzo 2026
> **Reportado por:** Equipo Frontend
> **Módulo afectado:** Seguimiento de Casos (`/casetracking`)

---

## Resumen ejecutivo

| # | Endpoint | Problema | Prioridad |
|---|---|---|---|
| 1 | `GET /api/casetracking/{id}/follow-ups` | Siempre devuelve `[]` aunque existan registros | 🔴 Urgente |
| 2 | `GET /api/casetracking/status/{status}` | `userID: 0` y `userFullName: ""` en todos los casos | 🔴 Urgente |
| 3 | `GET /api/casetracking/status/{status}` | `assignedToUserName: ""` en todos los casos | 🔴 Urgente |
| 4 | `POST /api/casetracking/{id}/follow-ups` | `caseFollowUpID: 0` y `performedByUserID: 0` en la respuesta | 🟡 Media |

---

## Problema 1 — `GET /casetracking/{id}/follow-ups` siempre devuelve `[]`

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
    "description": "Nota del seguimiento clínico",
    "outcome": null,
    "nextActionDate": null,
    "performedAt": "2026-03-04T21:30:22Z"
  }
]
```

**Evidencia:** Se crearon follow-ups correctamente vía `POST` (HTTP 200), pero el `GET` sigue retornando `[]`.

**Impacto crítico:** El historial de seguimientos clínicos no es visible. Un psicólogo no puede ver los seguimientos anteriores de un paciente al reabrir el caso.

**Causa probable:** La query del endpoint no consulta la tabla correcta, o filtra por un campo incorrecto (ej. `CaseTrackingID` vs `CaseFollowUpID`).

---

## Problema 2 y 3 — `GET /casetracking/status/{status}` devuelve `userID: 0` y nombres vacíos

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
  "status": "OPEN",
  "priority": "MEDIUM",
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
  "status": "OPEN",
  "priority": "MEDIUM",
  ...
}
```

**Impacto:** La columna "Usuario" y "Psicólogo" aparece vacía en la tabla de casos.

**Causa probable (dos posibles):**
1. Al crear el caso (`POST /casetracking`) el `userID` no se persiste correctamente en la base de datos.
2. La consulta de lista no hace `JOIN` con la tabla de usuarios para resolver `userFullName` y `assignedToUserName`.

---

## Problema 4 — `POST /casetracking/{id}/follow-ups` devuelve `caseFollowUpID: 0` y `performedByUserID: 0`

**Endpoint:** `POST /api/casetracking/1/follow-ups`

**Request enviado:**
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
  "actionType": "SESSION",
  "description": "Nota del seguimiento",
  "outcome": null,
  "nextActionDate": null,
  "performedAt": "2026-03-04T21:30:22Z"
}
```

**Causa probable:**
- `caseFollowUpID: 0` → el ID generado por el INSERT no se retorna en la respuesta.
- `performedByUserID: 0` → el usuario autenticado no se toma del token JWT; debe ser inyectado desde el contexto del request, no venir del body.

---

## Workarounds actuales en el frontend (temporales)

Mientras el backend despliega los fixes, el frontend aplica las siguientes compensaciones:

| Problema | Workaround |
|---|---|
| `userID: 0` en casos | Se cruza con `GET /api/users` y se usa el `userID` de la alerta relacionada (`alertID`) como fallback |
| `assignedToUserName: ""` | Se busca el nombre del psicólogo en la lista de usuarios por `assignedToUserID` |
| `GET /follow-ups` devuelve `[]` | Los follow-ups se acumulan en memoria desde la respuesta del `POST`. Al cerrar y reabrir el caso, el historial se pierde |

**Estos workarounds se eliminarán del frontend una vez el backend esté corregido.**
