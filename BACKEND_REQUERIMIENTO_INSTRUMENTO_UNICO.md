# Requerimiento Backend — Restricción de Instrumento Único por Usuario

**Fecha solicitud:** Marzo 2026  
**Fecha cierre:** Marzo 5, 2026  
**Estado:** ✅ COMPLETADO — todos los cambios implementados en `develop`  
**Módulo afectado:** Evaluaciones (`/evaluation/*`)  

---

## Resumen de Implementación

Todos los cambios de backend solicitados han sido implementados. A continuación se documenta el contrato final acordado entre frontend y backend.

---

## 1. `POST /evaluation/start` — Rechazo de duplicados completados ✅

Si el usuario ya tiene una evaluación **completada** (`isCompleted = true`) para el módulo solicitado, el endpoint retorna:

```http
HTTP 409 Conflict
```
```json
{
  "success": false,
  "error": {
    "code": "EVALUATION_ALREADY_COMPLETED",
    "message": "El usuario ya completó una evaluación para este módulo. Solo se permite una evaluación por módulo."
  }
}
```

El código `EVALUATION_ALREADY_COMPLETED` es **estable** y no cambiará en futuras versiones.

**Comportamiento normal** (sin evaluación completada previa) — sin cambios:
```http
HTTP 200 OK / 201 Created
```
```json
{
  "evaluationID": 55,
  "moduleID": 3,
  "startedAt": "2026-03-05T09:00:00Z",
  "isCompleted": false
}
```

**Nota:** Si el usuario tiene una evaluación **en progreso** (no completada), el frontend la reutiliza sin llamar a `start` nuevamente — este caso no es bloqueado por el backend.

---

## 2. `GET /evaluation/my-completed` — Campo `moduleID` numérico ✅

El campo `moduleID` ya estaba presente en la respuesta. No fue necesario ningún cambio.

---

## 3. `GET /evaluation/my-completed` — Campo `instrumentCode` por evaluación ✅

Se agregó el campo `instrumentCode` en cada item del array.

**Contrato:**
- Para instrumentos **simples** (BAI, BDI, MFI-20, ISI, GAD-7, etc.): devuelve el código directamente (`"BAI"`, `"BDI"`, etc.)
- Para instrumentos con **sub-escalas** (DASS-21): devuelve `null`. El código se infiere desde `result.dimensionScores[].instrumentCode` (e.g. `DASS21_ANXIETY`, `DASS21_DEPRESSION`, `DASS21_STRESS`)

**Ejemplo de respuesta:**
```json
[
  {
    "evaluationID": 42,
    "moduleID": 3,
    "instrumentCode": "BAI",
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-01T10:30:00Z",
    "result": {
      "evaluationResultID": 101,
      "dimensionScores": [ ... ],
      ...
    }
  },
  {
    "evaluationID": 43,
    "moduleID": 3,
    "instrumentCode": null,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2026-03-02T14:00:00Z",
    "result": {
      "evaluationResultID": 102,
      "dimensionScores": [
        { "instrumentCode": "DASS21_ANXIETY", ... },
        { "instrumentCode": "DASS21_DEPRESSION", ... },
        { "instrumentCode": "DASS21_STRESS", ... }
      ],
      ...
    }
  }
]
```

---

## 4. Implementación Frontend (completada junto con el backend)

### `AssessmentService`
- **`isModuleAlreadyCompleted(apiModuleId)`** — pre-flight check en `submit()` y `submitRich()`:
  1. Llama a `GET /evaluation/my-completed`
  2. Verifica si existe algún item con el mismo `moduleID` numérico (con fallback a keyword-matching del `assessmentModuleName`)
  3. Si existe → lanza `{ code: 'ALREADY_COMPLETED' }` antes de llamar a `POST /evaluation/start`
- **Captura HTTP 409 del backend** — si el pre-flight falla (e.g. race condition), el 409 del backend es capturado dentro del `catchError` del `POST /evaluation/start` y normalizado al mismo código `ALREADY_COMPLETED` para que la UI lo maneje uniformemente.

### `AssessmentHydrationService`
- **`getCompletedInstrumentCodes(moduleId)`** — nuevo método público que retorna un `Set<string>` con todos los códigos de instrumentos completados para el módulo. Combina:
  - `instrumentCode` directo del item (instrumentos simples)
  - `result.dimensionScores[].instrumentCode` (sub-escalas como DASS-21)
- **DTOs actualizados** con los campos `moduleID` e `instrumentCode`
- **`resolveModuleId(item)`** — helper interno que resuelve el `AssessmentModuleId` frontend desde un item de la respuesta

### `InstrumentSelectorComponent`
- **`ngOnInit()`** — usa `getCompletedInstrumentCodes()` directamente (en paralelo con `getModuleInstruments()`) para determinar qué tarjetas deshabilitar, eliminando la dependencia del estado local
- **`_submitRichAnswers()` error handler** — captura `ALREADY_COMPLETED`, muestra alerta informativa y redirige a la pantalla de resultados del módulo

---

## 5. Flujo Final

```
Usuario navega a /mental-health
        │
        ▼
Frontend: forkJoin(
  getCompletedInstrumentCodes('mental-health'),  ← GET /evaluation/my-completed
  getModuleInstruments('mental-health')
)
        │
        ▼
Tarjetas de instrumentos completados → deshabilitadas (gris, "Completado")
        │
        ▼
Usuario intenta iniciar instrumento ya completado (bug de UI, URL directa, etc.)
        │
        ▼
Frontend: isModuleAlreadyCompleted() → true → lanza ALREADY_COMPLETED
(Si falla el pre-flight por cualquier razón:)
        │
        ▼
Backend: POST /evaluation/start → HTTP 409 EVALUATION_ALREADY_COMPLETED
        │
        ▼
Frontend captura 409 → normaliza a ALREADY_COMPLETED
        │
        ▼
UI: alerta informativa → redirige a /mental-health/instrument-results
```


Cada usuario solo puede presentar cada instrumento de evaluación **una única vez**. Una vez que un instrumento está completado (`isCompleted = true`), no debe poder volver a iniciarse, ni desde el frontend ni desde el backend.

El frontend ya implementó una capa de protección en `AssessmentService` (pre-flight check antes de llamar a `POST /evaluation/start`), pero esta protección es **insuficiente por sí sola** porque:

- Depende de que `GET /evaluation/my-completed` devuelva datos correctos y consistentes.
- No impide llamadas directas a la API (Postman, scripts, otras apps).
- El backend es la única fuente de verdad confiable.

---

## 2. Problema Actual

### 2.1 Endpoint `POST /evaluation/start`

**Comportamiento actual (sin confirmar):**  
Se desconoce si el endpoint rechaza el inicio de una nueva evaluación cuando el usuario ya tiene una evaluación **completada** para el mismo módulo.

**Comportamiento requerido:**  
Si el usuario ya completó una evaluación para el módulo solicitado, el endpoint debe retornar un error **antes de crear una nueva evaluación**.

### 2.2 Falta de campo `moduleID` en `GET /evaluation/my-completed`

El DTO de respuesta actual es:

```json
{
  "evaluationID": 42,
  "assessmentModuleName": "Salud Mental",
  "completedAt": "2025-06-01T10:30:00Z",
  "result": { ... }
}
```

El campo `moduleID` (numérico) **no está presente** en la respuesta. El frontend actualmente infiere el módulo a partir del nombre (`assessmentModuleName`) usando coincidencia de palabras clave, lo que es frágil ante cambios de nomenclatura.

---

## 3. Cambios Requeridos

### 3.1 `POST /evaluation/start` — Rechazar duplicados completados

**Descripción:**  
Antes de crear una nueva evaluación, verificar si el usuario ya tiene una evaluación con `isCompleted = true` para el mismo `moduleID`. Si existe, rechazar la solicitud.

**Request (sin cambios):**
```json
POST /evaluation/start
{
  "moduleID": 3
}
```

**Response cuando ya existe una evaluación completada:**
```http
HTTP 409 Conflict
```
```json
{
  "success": false,
  "error": {
    "code": "EVALUATION_ALREADY_COMPLETED",
    "message": "El usuario ya completó una evaluación para este módulo. Solo se permite una evaluación por módulo."
  }
}
```

**Response normal cuando no existe evaluación completada (sin cambios):**
```http
HTTP 200 OK / 201 Created
```
```json
{
  "evaluationID": 55,
  "moduleID": 3,
  "startedAt": "2025-06-05T09:00:00Z",
  "isCompleted": false
}
```

**Notas de implementación:**
- La validación debe hacerse a nivel de base de datos/servicio, no solo en el controlador.
- Si el usuario tiene una evaluación **en progreso** (no completada), el frontend ya reutiliza esa evaluación; este caso no debe ser bloqueado.
- El código de error `EVALUATION_ALREADY_COMPLETED` debe ser estable (no cambiar en futuras versiones).

---

### 3.2 `GET /evaluation/my-completed` — Incluir `moduleID` numérico

**Descripción:**  
Agregar el campo `moduleID` (número entero) en cada item del array de respuesta para que el frontend pueda identificar el módulo sin depender de la coincidencia por nombre de texto.

**Response actual:**
```json
[
  {
    "evaluationID": 42,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2025-06-01T10:30:00Z",
    "result": { ... }
  }
]
```

**Response requerida:**
```json
[
  {
    "evaluationID": 42,
    "moduleID": 3,
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2025-06-01T10:30:00Z",
    "result": { ... }
  }
]
```

**Notas de implementación:**
- El campo `moduleID` debe ser el mismo valor que se envía en `POST /evaluation/start { "moduleID": 3 }`.
- El campo `assessmentModuleName` debe mantenerse por compatibilidad con versiones anteriores del cliente.
- Cambio no-breaking (solo agrega campo).

---

### 3.3 (Opcional pero recomendado) `GET /evaluation/my-completed` — Incluir `instrumentCode` por instrumento

**Descripción:**  
Para módulos multi-instrumento (ej. Salud Mental con DASS-21, BAI, BDI, etc.), cada evaluación debería indicar qué instrumento fue respondido. Esto permitiría al frontend saber exactamente qué instrumento dentro de un módulo ya fue completado, bloqueando solo ese instrumento y no todos los del módulo.

**Response requerida (extensión futura):**
```json
[
  {
    "evaluationID": 42,
    "moduleID": 3,
    "instrumentCode": "DASS21",
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2025-06-01T10:30:00Z",
    "result": { ... }
  },
  {
    "evaluationID": 43,
    "moduleID": 3,
    "instrumentCode": "BAI",
    "assessmentModuleName": "Salud Mental",
    "completedAt": "2025-06-02T14:00:00Z",
    "result": { ... }
  }
]
```

**Notas:**
- Si no se puede agregar `instrumentCode` directamente a este endpoint en el corto plazo, el frontend puede inferirlo a partir de `result.dimensionScores[].instrumentCode` (ya disponible en la respuesta actual).
- Este campo habilita una futura mejora: bloquear solo el instrumento específico ya completado, no todo el módulo.

---

## 4. Comportamiento Esperado (Flujo Completo)

```
Usuario navega a /mental-health
        │
        ▼
Frontend llama GET /evaluation/my-completed
        │
        ▼
Frontend marca tarjetas de instrumentos completados como deshabilitadas
(ej. DASS-21 completado → tarjeta gris, no clickable)
        │
        ▼
Usuario intenta iniciar instrumento ya completado
(ej. acceso directo, bug de UI, llamada externa)
        │
        ▼
Frontend llama POST /evaluation/start { moduleID: 3 }
        │
        ▼
Backend verifica: ¿existe evaluación completada para user + moduleID?
        │
       SÍ → Retorna HTTP 409 { code: "EVALUATION_ALREADY_COMPLETED" }
        │
        ▼
Frontend captura el error, muestra mensaje amigable,
redirige a /mental-health/instrument-results para ver resultados
```

---

## 5. Impacto Frontend (Ya Implementado)

El frontend ya maneja este escenario:

1. **`AssessmentService.isModuleAlreadyCompleted()`** — Pre-flight check en `submitRich()` y `submit()` que consulta `/evaluation/my-completed` antes de llamar a `/evaluation/start`. Lanza error `{ code: 'ALREADY_COMPLETED' }` si el módulo ya está completado.

2. **`InstrumentSelectorComponent.ngOnInit()`** — Hidrata siempre desde el backend (`hydrateModuleResultFromCompletedEvaluations`) antes de construir las tarjetas, garantizando que instrumentos ya completados aparezcan deshabilitados incluso en sesiones nuevas.

3. **`InstrumentSelectorComponent._submitRichAnswers()`** — Maneja el error `ALREADY_COMPLETED`: muestra alerta informativa y redirige a la pantalla de resultados.

Con el cambio 3.1 del backend, si el frontend falla en su pre-flight check (por cualquier razón), el backend lo bloqueará de todas formas con HTTP 409. El frontend deberá reconocer este código HTTP o el body `{ code: "EVALUATION_ALREADY_COMPLETED" }` y mostrar el mismo mensaje amigable.

---

## 6. Resumen de Cambios Solicitados

| # | Endpoint | Tipo de cambio | Prioridad |
|---|----------|----------------|-----------|
| 3.1 | `POST /evaluation/start` | Retornar HTTP 409 si módulo ya tiene evaluación completada | **Alta** |
| 3.2 | `GET /evaluation/my-completed` | Agregar campo `moduleID` numérico en cada item | **Alta** |
| 3.3 | `GET /evaluation/my-completed` | Agregar campo `instrumentCode` por evaluación | Media |

---

## 7. Notas Adicionales

- **Retrocompatibilidad:** Los cambios 3.2 y 3.3 son **no-breaking** (solo agregan campos). Los clientes que no los usen seguirán funcionando.
- **Autenticación:** Todos los endpoints mencionados requieren JWT válido. La validación de "módulo ya completado" debe ser por usuario autenticado, no global.
- **Ambientes:** Aplicar el cambio en todos los ambientes (dev, staging, prod) de forma coordinada con el despliegue del frontend.
