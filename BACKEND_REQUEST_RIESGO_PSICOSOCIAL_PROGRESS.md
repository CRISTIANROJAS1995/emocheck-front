# Solicitud Backend — Progreso por programa y semana: Módulo Riesgo Psicosocial

**Fecha:** 2026-04-08  
**Área:** Plan de Acción (`/api/action-plan/`)  
**Prioridad:** Alta

---

## Contexto

El módulo **Riesgo Psicosocial** está dividido en **5 programas independientes**. Cada programa es un curso propio con su propia bienvenida, semanas (S1–S12) y cierre. El usuario es asignado a **uno o más programas** según su perfil o cargo en la empresa.

### Los 5 programas y sus prefijos en el frontend

| Programa | `moduleCode` propuesto | Prefijo HTML | Semanas |
|---|---|---|---|
| PRO-Activo de Bienestar | `RP_PRO_ACTIVO` | `pa` | 12 semanas + bienvenida + cierre = **14 pasos** |
| Co-Gestores de Bienestar | `RP_CO_GESTORES` | `rp` | 12 semanas + bienvenida + cierre = **14 pasos** |
| Arquitectos de Bienestar | `RP_ARQUITECTOS` | `lb` | 12 semanas + bienvenida + cierre = **14 pasos** |
| Cultura de Bienestar | `RP_CULTURA` | `ve` | 12 semanas + bienvenida + cierre = **14 pasos** |
| Ecosistema Inclusivo | `RP_ECOSISTEMA` | `ei` | 4 temas + bienvenida + cierre = **6 pasos** |

---

## Diseño propuesto: cada programa = un módulo independiente en la API

La solución más limpia y compatible con la API existente es tratar cada programa como su **propio módulo** en la base de datos, con su propio `moduleID` y `moduleCode`. De esta forma:

- `GET /api/action-plan/modules` devuelve **solo los programas asignados al usuario** (1 o más).
- `GET /api/action-plan/{moduleId}/steps` retorna los pasos del programa.
- El frontend agrupa visualmente todos los programas bajo el mismo módulo "Riesgo Psicosocial" basándose en el prefijo `RP_`.

```
Usuario A (operativo)      → recibe RP_PRO_ACTIVO  (14 pasos)
Usuario B (profesional)    → recibe RP_CO_GESTORES (14 pasos)
Usuario C (jefatura)       → recibe RP_ARQUITECTOS (14 pasos)
Usuario D (directivo)      → recibe RP_CULTURA     (14 pasos)
Usuario E (diversidad)     → recibe RP_ECOSISTEMA  (6 pasos)
```

---

## Pasos requeridos por programa

### 1. PRO-Activo de Bienestar — `moduleCode: RP_PRO_ACTIVO`

| `stepOrder` | `stepKey`   | `title`                          |
|-------------|-------------|----------------------------------|
| 1           | `BIENVENIDA`| Bienvenida                       |
| 2           | `SEMANA_1`  | S1 · El Poder de la Calma        |
| 3           | `SEMANA_2`  | S2 · ¿Amenaza o Desafío?         |
| 4           | `SEMANA_3`  | S3 · Tú no eres tu trabajo       |
| 5           | `SEMANA_4`  | S4 · Mente Clara, Trabajo Seguro |
| 6           | `SEMANA_5`  | S5 · Foco en lo Controlable      |
| 7           | `SEMANA_6`  | S6 · Tu Voz es el Motor          |
| 8           | `SEMANA_7`  | S7 · Gestión de Órdenes          |
| 9           | `SEMANA_8`  | S8 · El Poder del Feedback       |
| 10          | `SEMANA_9`  | S9 · Críticas con Resiliencia    |
| 11          | `SEMANA_10` | S10 · Persona vs. Problema       |
| 12          | `SEMANA_11` | S11 · El Apoyo Social            |
| 13          | `SEMANA_12` | S12 · Mi Hogar, Mi Refugio       |
| 14          | `CIERRE`    | Cierre y certificado             |

---

### 2. Co-Gestores de Bienestar — `moduleCode: RP_CO_GESTORES`

| `stepOrder` | `stepKey`   | `title`                              |
|-------------|-------------|--------------------------------------|
| 1           | `BIENVENIDA`| Bienvenida                           |
| 2           | `SEMANA_1`  | S1 · Anclaje de Alto Rendimiento     |
| 3           | `SEMANA_2`  | S2 · Perspectiva Sistémica           |
| 4           | `SEMANA_3`  | S3 · Esencia vs. Rol                 |
| 5           | `SEMANA_4`  | S4 · Foco de Control                 |
| 6           | `SEMANA_5`  | S5 · Deep Work                       |
| 7           | `SEMANA_6`  | S6 · Ingeniería de Prioridades       |
| 8           | `SEMANA_7`  | S7 · Sin Procrastinación             |
| 9           | `SEMANA_8`  | S8 · Sinergia en Agenda              |
| 10          | `SEMANA_9`  | S9 · Resolución de Problemas         |
| 11          | `SEMANA_10` | S10 · Feedback para la Excelencia    |
| 12          | `SEMANA_11` | S11 · Negociación de Apoyos          |
| 13          | `SEMANA_12` | S12 · Desconexión de Alto Nivel      |
| 14          | `CIERRE`    | Cierre y certificado                 |

---

### 3. Arquitectos de Bienestar — `moduleCode: RP_ARQUITECTOS`

| `stepOrder` | `stepKey`   | `title`                              |
|-------------|-------------|--------------------------------------|
| 1           | `BIENVENIDA`| Bienvenida                           |
| 2           | `SEMANA_1`  | S1 · Neurobiología del Mando         |
| 3           | `SEMANA_2`  | S2 · Perspectiva de Escenario        |
| 4           | `SEMANA_3`  | S3 · Integridad vs. Rol              |
| 5           | `SEMANA_4`  | S4 · Arquitectura de Decisiones      |
| 6           | `SEMANA_5`  | S5 · Matriz de Priorización          |
| 7           | `SEMANA_6`  | S6 · Blindaje del Enfoque            |
| 8           | `SEMANA_7`  | S7 · Gestión de la Ejecución         |
| 9           | `SEMANA_8`  | S8 · Sinergia Grupal                 |
| 10          | `SEMANA_9`  | S9 · Delegación Facultativa          |
| 11          | `SEMANA_10` | S10 · Algoritmos de Resolución       |
| 12          | `SEMANA_11` | S11 · Feedback de Alto Rendimiento   |
| 13          | `SEMANA_12` | S12 · Ecosistemas en Equilibrio      |
| 14          | `CIERRE`    | Cierre y certificado                 |

---

### 4. Cultura de Bienestar — `moduleCode: RP_CULTURA`

| `stepOrder` | `stepKey`   | `title`                              |
|-------------|-------------|--------------------------------------|
| 1           | `BIENVENIDA`| Bienvenida                           |
| 2           | `SEMANA_1`  | S1 · Bio-Recarga                     |
| 3           | `SEMANA_2`  | S2 · Zona de Enfoque                 |
| 4           | `SEMANA_3`  | S3 · Pausas Cognitivas               |
| 5           | `SEMANA_4`  | S4 · Brújula de Prioridades          |
| 6           | `SEMANA_5`  | S5 · Inteligencia Financiera         |
| 7           | `SEMANA_6`  | S6 · Sinergia de Equipo              |
| 8           | `SEMANA_7`  | S7 · Maestría en el Cambio           |
| 9           | `SEMANA_8`  | S8 · Algoritmos de Solución          |
| 10          | `SEMANA_9`  | S9 · Tu Voz es el Motor              |
| 11          | `SEMANA_10` | S10 · Escudo del Reconocimiento      |
| 12          | `SEMANA_11` | S11 · Feedback Inteligente           |
| 13          | `SEMANA_12` | S12 · Mi Hogar, Mi Fortaleza         |
| 14          | `CIERRE`    | Cierre y certificado                 |

---

### 5. Ecosistema Inclusivo — `moduleCode: RP_ECOSISTEMA`

| `stepOrder` | `stepKey`  | `title`                    |
|-------------|------------|----------------------------|
| 1           | `BIENVENIDA`| Bienvenida                |
| 2           | `TEMA_1`   | Espacios a tu Medida       |
| 3           | `TEMA_2`   | Corazón del Cuidador       |
| 4           | `TEMA_3`   | Autenticidad sin Barreras  |
| 5           | `TEMA_4`   | Tu Hogar, Tu Trabajo       |
| 6           | `CIERRE`   | Cierre                     |

> **Nota:** Este programa tiene 4 temas (no 12 semanas). Se usa `TEMA_N` en lugar de `SEMANA_N` para diferenciarlo.

---

## Cambios requeridos en `GET /api/action-plan/modules`

Cada programa debe aparecer como entrada separada con los siguientes campos:

```jsonc
[
  {
    "moduleID": 10,
    "moduleName": "PRO-Activo de Bienestar",
    "moduleCode": "RP_PRO_ACTIVO",      // ← Identificador exacto para el frontend
    "totalSteps": 14,
    "completedSteps": 5,
    "progressPercent": 36
  },
  {
    "moduleID": 11,
    "moduleName": "Co-Gestores de Bienestar",
    "moduleCode": "RP_CO_GESTORES",
    "totalSteps": 14,
    "completedSteps": 0,
    "progressPercent": 0
  }
  // ... solo los programas asignados al usuario
]
```

> El frontend detecta que un módulo pertenece a Riesgo Psicosocial cuando `moduleCode` comienza con `RP_`, y los agrupa visualmente bajo el mismo módulo padre.

---

## Cambios requeridos en el frontend (post-integración)

Una vez que el backend retorne los `moduleCode` correctos, se realizarán los siguientes ajustes:

### 1. Agregar los 5 programas al mapa `MODULE_VISUAL`

```typescript
RP_PRO_ACTIVO:  { id: 'rp-pro-activo',  prefix: 'pa',  ... },
RP_CO_GESTORES: { id: 'rp-co-gestores', prefix: 'rp',  ... },
RP_ARQUITECTOS: { id: 'rp-arquitectos', prefix: 'lb',  ... },
RP_CULTURA:     { id: 'rp-cultura',     prefix: 've',  ... },
RP_ECOSISTEMA:  { id: 'rp-ecosistema',  prefix: 'ei',  ... },
```

### 2. Actualizar `STEP_KEY_SUFFIX` para incluir semanas y temas

```typescript
const STEP_KEY_SUFFIX: Record<string, string> = {
    BIENVENIDA: 'bienvenida',
    SEMANA_1:   's1',
    SEMANA_2:   's2',
    // ... hasta SEMANA_12
    SEMANA_12:  's12',
    TEMA_1:     'h1',
    TEMA_2:     'h2',
    TEMA_3:     'h3',
    TEMA_4:     'h4',
    CIERRE:     'cierre',
};
```

### 3. Actualizar `STEP_PREFIX` con los nuevos `moduleCode`

```typescript
const STEP_PREFIX: Record<string, string> = {
    RP_PRO_ACTIVO:  'pa',
    RP_CO_GESTORES: 'rp',
    RP_ARQUITECTOS: 'lb',
    RP_CULTURA:     've',
    RP_ECOSISTEMA:  'ei',
    // ... módulos existentes
};
```

De esta forma, la lógica existente en `_applySteps()` generará automáticamente los IDs correctos, por ejemplo:  
`moduleCode=RP_PRO_ACTIVO` + `stepKey=SEMANA_1` → `pa` + `s1` = **`pa-s1`** ✓ (ya existe en el HTML)

### 4. Eliminar el bypass estático de Riesgo Psicosocial

El módulo actualmente también usa `_applyStaticSections()` como fallback. Una vez mapeados los `moduleCode`, se eliminará esa excepción y los pasos vendrán siempre de la API.

---

## Reglas de asignación (pregunta al backend)

El frontend no gestiona la asignación de programas — eso es responsabilidad del backend. Se necesita confirmar:

1. **¿Cómo se determina qué programa recibe cada usuario?** ¿Por cargo, por empresa, por configuración manual del administrador?
2. **¿Un usuario puede tener más de un programa asignado?** (ej. un directivo que también tiene acceso a Co-Gestores)
3. **¿El endpoint `GET /modules` ya filtra los módulos por usuario autenticado?** (se asume que sí, mediante el token JWT)
4. **¿Se requiere una pantalla de "selección de programa"** si el usuario tiene más de uno asignado? Actualmente el módulo Riesgo Psicosocial muestra todos los programas en el sidebar; si la API solo devuelve los asignados, la UI se adapta automáticamente.

---

## Resumen de lo requerido

| # | Acción | Responsable |
|---|--------|-------------|
| 1 | Crear 5 módulos (`moduleCode: RP_*`) en la BD con sus pasos sembrados | **Backend** |
| 2 | Asignar a cada usuario el/los programa(s) correspondientes | **Backend** |
| 3 | Confirmar que `GET /modules` devuelve solo los programas asignados al usuario | **Backend** |
| 4 | Confirmar que `moduleCode` nunca llega `null` | **Backend** |
| 5 | Agregar `RP_*` a `MODULE_VISUAL`, `STEP_PREFIX` y `STEP_KEY_SUFFIX` | **Frontend** (post confirmación) |
| 6 | Eliminar bypass estático de `RIESGO_PSICOSOCIAL` en `loadSteps()` | **Frontend** (post confirmación) |
