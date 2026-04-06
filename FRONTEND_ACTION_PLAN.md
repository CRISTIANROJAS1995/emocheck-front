# Plan de Acción — Integración Frontend

## Contexto

Cada módulo de EmoCheck (Salud Mental, Fatiga Laboral, etc.) tiene un **plan de acción** con hasta 5 pasos fijos que el usuario recorre de forma secuencial. El progreso es **individual por usuario**: la API usa el `UserID` embebido en el JWT, el frontend nunca necesita enviarlo.

Pasos estándar por módulo:

| Orden | StepKey | Nombre típico |
|:---:|---|---|
| 1 | `BIENVENIDA` | Bienvenida |
| 2 | `APRENDE` | Aprende |
| 3 | `CONECTA` | Conecta |
| 4 | `ACTUA` | Actúa |
| 5 | `CIERRE` | Cierre y certificado |

---

## Base URL y autenticación

Todos los endpoints requieren:

```
Authorization: Bearer <token>
```

El token ya contiene el `UserID`. La API lo usa internamente; el frontend **no envía el ID del usuario en ningún endpoint**.

---

## Endpoints de usuario (todos los roles autenticados)

### 1. `GET /api/action-plan/modules`

Obtiene todos los módulos con el progreso del usuario autenticado.
Úsalo para renderizar la **barra lateral** con el listado de módulos y el porcentaje de avance.

**Respuesta `200`:**

```json
[
  {
    "moduleID": 1,
    "moduleName": "Salud Mental",
    "moduleCode": "MENTAL_HEALTH",
    "iconName": "brain",
    "colorHex": "#5C6BC0",
    "totalSteps": 5,
    "completedSteps": 1,
    "progressPercent": 20
  },
  {
    "moduleID": 2,
    "moduleName": "Fatiga Laboral",
    "moduleCode": "FATIGUE",
    "iconName": "energy",
    "colorHex": "#EF5350",
    "totalSteps": 5,
    "completedSteps": 0,
    "progressPercent": 0
  }
]
```

**Uso recomendado:**
- Iterar el arreglo para construir la lista de módulos en el sidebar.
- Mostrar `progressPercent` como barra de progreso junto a cada módulo.
- Al hacer clic en un módulo, cargar sus pasos con el endpoint 2.

---

### 2. `GET /api/action-plan/{moduleId}/steps`

Obtiene los 5 pasos de un módulo con el estado de completado del usuario.
Úsalo para mostrar **los sub-ítems del módulo** en el sidebar y el estado de cada uno.

**Parámetro de ruta:** `moduleId` — ID del módulo seleccionado.

**Respuesta `200`:**

```json
[
  {
    "actionPlanStepID": 11,
    "moduleID": 1,
    "stepOrder": 1,
    "stepKey": "BIENVENIDA",
    "title": "Bienvenida",
    "subtitle": "Conoce tu plan",
    "description": "En esta primera etapa te presentamos el plan de acción diseñado especialmente para ti...",
    "durationWeeks": 1,
    "topicsCount": 3,
    "resourcesCount": 5,
    "hasCertification": false,
    "isCompleted": true,
    "completedAt": "2026-03-15T10:30:00Z"
  },
  {
    "actionPlanStepID": 12,
    "moduleID": 1,
    "stepOrder": 2,
    "stepKey": "APRENDE",
    "title": "Aprende",
    "subtitle": null,
    "description": "Aquí encontrarás los recursos educativos clave...",
    "durationWeeks": 2,
    "topicsCount": 5,
    "resourcesCount": 8,
    "hasCertification": false,
    "isCompleted": false,
    "completedAt": null
  }
]
```

---

### 3. `GET /api/action-plan/{moduleId}/steps/{stepId}`

Obtiene el **detalle completo** de un paso con navegación anterior/siguiente.
Úsalo para renderizar el **panel principal** de contenido cuando el usuario selecciona un paso.

**Parámetros de ruta:** `moduleId`, `stepId`.

**Respuesta `200`:**

```json
{
  "actionPlanStepID": 12,
  "moduleID": 1,
  "stepOrder": 2,
  "stepKey": "APRENDE",
  "title": "Aprende",
  "subtitle": "Recursos educativos",
  "description": "Aquí encontrarás los recursos educativos clave...",
  "durationWeeks": 2,
  "topicsCount": 5,
  "resourcesCount": 8,
  "hasCertification": false,
  "isCompleted": false,
  "completedAt": null,
  "totalSteps": 5,
  "previousStepID": 11,
  "nextStepID": 13
}
```

> `previousStepID` y `nextStepID` son `null` si estás en el primer o último paso respectivamente.

**Uso recomendado para la navegación Anterior / Siguiente:**

```js
// Si la respuesta tiene nextStepID:
router.push(`/action-plan/${moduleId}/steps/${step.nextStepID}`)

// Si previousStepID es null, deshabilitar el botón "Anterior"
// Si nextStepID es null, deshabilitar el botón "Siguiente"
```

---

### 4. `POST /api/action-plan/{moduleId}/steps/{stepId}/complete`

Marca un paso como **completado**. No requiere body.
Llama este endpoint cuando el usuario pulsa el botón de completar el paso.

**Parámetros de ruta:** `moduleId`, `stepId`.
**Body:** ninguno.

**Respuesta `200`:**

```json
{
  "actionPlanStepID": 12,
  "isCompleted": true,
  "completedAt": "2026-04-06T14:22:00Z",
  "moduleProgressPercent": 40
}
```

> Usa `moduleProgressPercent` para actualizar en tiempo real la barra de progreso del módulo en el sidebar sin hacer otro fetch.

**Notas:**
- Si el paso ya estaba marcado como completado, el endpoint responde igualmente `200` sin errores (idempotente).
- La fecha `completedAt` es el momento exacto del primer marcado; no se sobreescribe si ya existía.

---

### 5. `DELETE /api/action-plan/{moduleId}/steps/{stepId}/complete`

Desmarca un paso como completado (lo revierte a pendiente).

**Parámetros de ruta:** `moduleId`, `stepId`.
**Body:** ninguno.

**Respuesta `200`:**

```json
{
  "actionPlanStepID": 12,
  "isCompleted": false,
  "completedAt": null,
  "moduleProgressPercent": 20
}
```

---

## Endpoints de administración (solo `SuperAdmin`)

Estos endpoints permiten gestionar el contenido de los pasos desde el panel de administración.

### `POST /api/action-plan/steps` — Crear paso

```json
// Body
{
  "moduleID": 1,
  "stepOrder": 1,
  "stepKey": "BIENVENIDA",
  "title": "Bienvenida",
  "subtitle": "Conoce tu plan",
  "description": "Texto completo del paso...",
  "durationWeeks": 1,
  "topicsCount": 3,
  "resourcesCount": 5,
  "hasCertification": false
}
```

**Respuesta `201`:** `ActionPlanStepDto` del paso creado.

---

### `PUT /api/action-plan/steps/{stepId}` — Actualizar paso

Todos los campos son opcionales. Solo se actualiza lo que se envía.

```json
// Body (ejemplo: cambiar título y marcar inactivo)
{
  "title": "Nuevo título",
  "isActive": false
}
```

**Respuesta `200`:** `ActionPlanStepDto` actualizado.

---

### `DELETE /api/action-plan/steps/{stepId}` — Eliminar paso

**Respuesta `204`:** sin body.

---

## Manejo de errores

| Código | Causa |
|--------|-------|
| `401` | Token ausente o expirado |
| `403` | Rol sin permiso para ese endpoint (ej. no-SuperAdmin en creación de pasos) |
| `404` | Módulo o paso no encontrado |

---

## Flujo de pantalla recomendado

### Al iniciar la pantalla "Mi Plan de Acción"

```
1. GET /api/action-plan/modules
   → Renderizar sidebar con módulos y porcentajes

2. Al seleccionar un módulo:
   GET /api/action-plan/{moduleId}/steps
   → Mostrar los 5 sub-ítems con check si isCompleted = true

3. Al seleccionar un paso:
   GET /api/action-plan/{moduleId}/steps/{stepId}
   → Mostrar panel principal con título, descripción, y tarjeta de metadatos
   → Activar/desactivar botones Anterior / Siguiente según previousStepID / nextStepID
```

### Al completar un paso

```
1. POST /api/action-plan/{moduleId}/steps/{stepId}/complete
2. Actualizar estado local del paso: isCompleted = true
3. Actualizar barra de progreso del módulo con moduleProgressPercent
4. (Opcional) Navegar automáticamente al siguiente paso si nextStepID != null
```

---

## Tipos TypeScript de referencia

```typescript
interface ActionPlanModuleDto {
  moduleID: number;
  moduleName: string;
  moduleCode: string | null;
  iconName: string | null;
  colorHex: string | null;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;   // 0–100
}

interface ActionPlanStepDto {
  actionPlanStepID: number;
  moduleID: number;
  stepOrder: number;
  stepKey: string;            // "BIENVENIDA" | "APRENDE" | "CONECTA" | "ACTUA" | "CIERRE"
  title: string;
  subtitle: string | null;
  description: string;
  durationWeeks: number | null;
  topicsCount: number | null;
  resourcesCount: number | null;
  hasCertification: boolean;
  isCompleted: boolean;
  completedAt: string | null; // ISO 8601 UTC
}

interface ActionPlanStepDetailDto extends ActionPlanStepDto {
  totalSteps: number;
  previousStepID: number | null;
  nextStepID: number | null;
}

interface CompleteStepResultDto {
  actionPlanStepID: number;
  isCompleted: boolean;
  completedAt: string | null;
  moduleProgressPercent: number; // 0–100, recalculado en servidor
}
```
