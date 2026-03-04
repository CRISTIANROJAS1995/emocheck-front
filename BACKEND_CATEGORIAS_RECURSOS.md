# EmoCheck — Solicitud Backend: CRUD de Categorías de Recursos

> **Fecha:** 4 de Marzo 2026  
> **Preparado por:** Equipo Frontend  
> **Prioridad:** 🔴 Alta  
> **Contexto:** El módulo de Recursos (`/resources`) usa categorías que vienen del backend. Actualmente el backend solo expone `GET` para categorías. El frontend necesita poder crearlas, editarlas y eliminarlas desde el panel de administración (`/admin/resources`).

---

## Problema actual

Las categorías que devuelve `GET /api/resource/categories` tienen nombres genéricos como:

- Salud Mental
- Bienestar Físico
- Desarrollo Personal
- Clima y Cultura
- Compromiso Organizacional

Los nombres correctos que debe manejar la plataforma son:

- **Mindfulness**
- **Neuropausas**
- **Calibración Emocional**
- *(otras que el equipo de contenido defina)*

Como no existen endpoints de escritura para categorías, el frontend no puede crearlas ni corregirlas. El administrador queda bloqueado.

---

## Endpoints requeridos

### 1. Crear categoría

```
POST /api/resource/categories
Auth: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "name": "Mindfulness",
  "description": "Ejercicios de respiración, atención plena y meditación guiada"
}
```

**Respuesta esperada `201 Created`:**
```json
{
  "resourceCategoryID": 5,
  "name": "Mindfulness",
  "description": "Ejercicios de respiración, atención plena y meditación guiada",
  "isActive": true,
  "displayOrder": 0,
  "resourceCount": 0
}
```

---

### 2. Actualizar categoría

```
PUT /api/resource/categories/{id}
Auth: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "name": "Mindfulness",
  "description": "Descripción actualizada"
}
```

**Respuesta esperada `200 OK`:** misma estructura que el POST.

---

### 3. Eliminar categoría

```
DELETE /api/resource/categories/{id}
Auth: SuperAdmin
```

**Respuesta esperada `200 OK` o `204 No Content`.**

> ⚠️ Si la categoría tiene recursos asociados, retornar `400 Bad Request` con mensaje:  
> `"No se puede eliminar una categoría que tiene recursos asociados"`

---

### 4. Activar / Desactivar categoría *(opcional pero deseable)*

```
PATCH /api/resource/categories/{id}/toggle-active
Auth: SuperAdmin
```

**Respuesta esperada `200 OK`:**
```json
{
  "resourceCategoryID": 5,
  "isActive": false
}
```

---

## Categorías iniciales a crear en BD

Una vez desplegados los endpoints, el frontend creará estas categorías desde el panel admin. Pero si es más fácil, el backend puede insertarlas directamente en la BD:

| Nombre | Descripción |
|---|---|
| Mindfulness | Ejercicios de respiración y atención plena |
| Neuropausas | Pausas activas para recargar energía mental |
| Calibración Emocional | Recursos para analizar y regular el estado emocional |
| Bienestar Físico | Ejercicios y hábitos saludables |
| Desarrollo Personal | Aprendizaje, metas y crecimiento |

> Las categorías actuales (Salud Mental, Clima y Cultura, etc.) pueden **renombrarse** o eliminarse si no tienen recursos asociados.

---

## Comportamiento esperado en `GET /api/resource/categories`

El endpoint existente ya funciona. Solo se pide que incluya el campo `resourceCount` en cada categoría:

```json
[
  {
    "resourceCategoryID": 1,
    "name": "Mindfulness",
    "description": "...",
    "isActive": true,
    "displayOrder": 1,
    "resourceCount": 4      // ← este campo es importante para el frontend
  }
]
```

Si actualmente `resourceCount` viene en `0` para todas aunque haya recursos, revisar el query del backend.

---

## Estado actual en el frontend

El frontend **ya tiene implementado** el panel de administración de categorías en `/admin/resources`:

- ✅ Formulario para crear categoría → llama `POST /api/resource/categories`
- ✅ Edición inline → llama `PUT /api/resource/categories/{id}`
- ✅ Eliminación con confirmación → llama `DELETE /api/resource/categories/{id}`
- ✅ Permisos: solo `SuperAdmin` y `Psychologist` pueden crear/editar; solo `SuperAdmin` puede eliminar

Todo está listo en el frontend. Solo falta que el backend habilite los endpoints.

---

## Resumen de lo solicitado

| # | Endpoint | Método | Prioridad |
|---|---|---|---|
| 1 | `/api/resource/categories` | `POST` | 🔴 Alta |
| 2 | `/api/resource/categories/{id}` | `PUT` | 🔴 Alta |
| 3 | `/api/resource/categories/{id}` | `DELETE` | 🔴 Alta |
| 4 | `/api/resource/categories/{id}/toggle-active` | `PATCH` | 🟡 Media |
| 5 | Insertar categorías correctas en BD | — | 🔴 Alta |
| 6 | `resourceCount` correcto en GET categories | — | 🟡 Media |
