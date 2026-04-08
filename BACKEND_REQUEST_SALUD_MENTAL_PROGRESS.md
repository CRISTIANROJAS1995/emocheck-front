# Solicitud Backend — Progreso por semana: Módulo Salud Mental

**Fecha:** 2026-04-08  
**Área:** Plan de Acción (`/api/action-plan/`)  
**Prioridad:** Alta

---

## Contexto

El módulo **Salud Mental** fue reestructurado en el frontend para mostrar **14 pasos individuales** (1 Bienvenida + 12 Semanas + 1 Cierre), cada uno con tres sub-vistas internas (Aprende / Conecta / Actúa) que viven completamente en el frontend y no requieren pasos separados en la base de datos.

Actualmente el frontend **ignora los pasos de la API para este módulo** y carga una estructura estática como fallback, porque los `stepKey` que retorna el backend no coinciden con la nueva granularidad semanal. El objetivo de esta solicitud es sincronizar backend y frontend para que el progreso real del usuario quede persistido.

```typescript
// Fragmento actual del componente — BYPASS que debe eliminarse una vez resuelto:
if (!module.moduleID || module.moduleCode === 'SALUD_MENTAL') {
    this._applyStaticSections(module);   // ← usa datos estáticos, sin API
    return;
}
```

---

## Cambios solicitados al backend

### 1. Verificar / crear los 14 pasos del módulo SALUD_MENTAL

El módulo con `moduleCode = 'SALUD_MENTAL'` debe tener exactamente **14 steps** registrados en la tabla `ActionPlanStep` (o equivalente), con el siguiente orden y `stepKey`:

| `stepOrder` | `stepKey`   | `title` (sugerido)                              |
|-------------|-------------|--------------------------------------------------|
| 1           | `BIENVENIDA`| Bienvenida                                       |
| 2           | `SEMANA_1`  | Semana #1: El universo del ánimo                 |
| 3           | `SEMANA_2`  | Semana #2: Decodificación                        |
| 4           | `SEMANA_3`  | Semana #3: El bucle del ánimo                    |
| 5           | `SEMANA_4`  | Semana #4: Tres pasos para el descanso           |
| 6           | `SEMANA_5`  | Semana #5: P.A.C.O.                              |
| 7           | `SEMANA_6`  | Semana #6: Descarga 180°                         |
| 8           | `SEMANA_7`  | Semana #7: La habitación                         |
| 9           | `SEMANA_8`  | Semana #8: Pirámide de logros                    |
| 10          | `SEMANA_9`  | Semana #9: Y tú emoción habla ¿La escuchas?      |
| 11          | `SEMANA_10` | Semana #10: Interruptores del sueño              |
| 12          | `SEMANA_11` | Semana #11: Ruta hacia el buen dormir            |
| 13          | `SEMANA_12` | Semana #12: La frecuencia de la ansiedad         |
| 14          | `CIERRE`    | Cierre y certificado                             |

> **Nota sobre `hasCertification`:** Solo el step con `stepKey = 'CIERRE'` debe tener `hasCertification = true`.

---

### 2. Confirmar que los endpoints existentes soportan estos pasos

Los siguientes endpoints **ya existen** y deben funcionar sin cambios una vez que los steps estén sembrados:

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GET`  | `/api/action-plan/modules` | Devuelve `progressPercent` del módulo (ya funciona) |
| `GET`  | `/api/action-plan/{moduleId}/steps` | Lista los 14 pasos con `isCompleted` por usuario |
| `GET`  | `/api/action-plan/{moduleId}/steps/{stepId}` | Detalle de un paso con `previousStepID` / `nextStepID` |
| `POST` | `/api/action-plan/{moduleId}/steps/{stepId}/complete` | Marca un paso como completado |
| `DELETE` | `/api/action-plan/{moduleId}/steps/{stepId}/complete` | Desmarca un paso |

**Campos mínimos requeridos en `GET .../steps`:**

```jsonc
[
  {
    "actionPlanStepID": 101,
    "moduleID": 5,
    "stepOrder": 1,
    "stepKey": "BIENVENIDA",
    "title": "Bienvenida",
    "isCompleted": false,
    "completedAt": null,
    "hasCertification": false
  },
  {
    "actionPlanStepID": 102,
    "moduleID": 5,
    "stepOrder": 2,
    "stepKey": "SEMANA_1",
    "title": "Semana #1: El universo del ánimo",
    "isCompleted": true,
    "completedAt": "2026-04-01T10:00:00Z",
    "hasCertification": false
  }
  // ... 12 semanas más + CIERRE
]
```

---

### 3. Confirmar que `GET /api/action-plan/modules` retorna `moduleCode`

El frontend identifica el módulo por `moduleCode`. Es crítico que este campo llegue con el valor exacto `"SALUD_MENTAL"` (mayúsculas, sin espacios):

```jsonc
{
  "moduleID": 5,
  "moduleName": "Salud Mental",
  "moduleCode": "SALUD_MENTAL",      // ← REQUERIDO, no nulo
  "totalSteps": 14,
  "completedSteps": 3,
  "progressPercent": 21
}
```

> Si `moduleCode` llega como `null`, el frontend no puede mapear el módulo a su configuración visual ni a sus pasos estáticos de respaldo.

---

### 4. Lógica de `progressPercent`

El porcentaje de progreso debe calcularse como:

```
progressPercent = round((completedSteps / totalSteps) * 100)
```

Con 14 pasos totales, la granularidad es de ~**7% por paso completado**.

La pantalla lateral del módulo muestra esta barra:

```
[██████░░░░░░░░░░░░░░] 43% completado
```

---

## Cambio en el frontend (post-integración)

Una vez que el backend retorne los pasos correctos, se eliminará el bypass en el componente y se ajustará el mapa `STEP_KEY_SUFFIX` para incluir las semanas:

```typescript
// Se añadirá al mapa STEP_KEY_SUFFIX:
const STEP_KEY_SUFFIX: Record<string, string> = {
    BIENVENIDA: 'bienvenida',
    SEMANA_1:   's1',
    SEMANA_2:   's2',
    SEMANA_3:   's3',
    SEMANA_4:   's4',
    SEMANA_5:   's5',
    SEMANA_6:   's6',
    SEMANA_7:   's7',
    SEMANA_8:   's8',
    SEMANA_9:   's9',
    SEMANA_10:  's10',
    SEMANA_11:  's11',
    SEMANA_12:  's12',
    CIERRE:     'cierre',
    // (keys anteriores como APRENDE, CONECTA, ACTUA siguen funcionando para otros módulos)
};

// Y se eliminará la condición de bypass:
// if (!module.moduleID || module.moduleCode === 'SALUD_MENTAL') { ... }
```

El prefijo de sección para SALUD_MENTAL es `mh`, generando IDs como `mh-s1`, `mh-s2`, ..., `mh-s12`, `mh-bienvenida`, `mh-cierre` — que ya existen en el template HTML.

---

## Preguntas para el backend

1. ¿Ya existen registros de `ActionPlanStep` para el módulo SALUD_MENTAL? Si sí, ¿cuáles son los `stepKey` actuales?
2. ¿El progreso se calcula en tiempo real o se actualiza con un trigger al llamar a `.../complete`?
3. ¿Existe algún mecanismo de **unlocking secuencial** (no se puede completar la Semana 3 sin completar la Semana 2)? El frontend actualmente permite navegación libre entre semanas.
4. ¿Los pasos son **por usuario** (cada empleado tiene su propio `isCompleted`) o son globales? Se asume que son por usuario.

---

## Resumen de lo requerido

| # | Acción | Responsable |
|---|--------|-------------|
| 1 | Sembrar/verificar 14 steps en SALUD_MENTAL con los `stepKey` de la tabla | **Backend** |
| 2 | Confirmar que `moduleCode` nunca llega `null` en `GET /modules` | **Backend** |
| 3 | Confirmar que el cálculo de `progressPercent` usa `completedSteps / 14` | **Backend** |
| 4 | Actualizar `STEP_KEY_SUFFIX` y remover bypass estático | **Frontend** (post confirmación) |
