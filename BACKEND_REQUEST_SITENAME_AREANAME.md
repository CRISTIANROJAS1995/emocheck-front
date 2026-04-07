# Solicitud Backend — Incluir `siteName` y `areaName` en respuesta de usuarios

## Contexto

En el módulo **Seguimiento de Usuarios** (`/admin/company-tracking`) se lista a todos los colaboradores
de la empresa. Necesitamos mostrar la **Sede** y el **Área** de cada usuario en la tabla.

Actualmente el frontend hace dos llamadas extra al arrancar la vista:

1. `GET /api/company/my-company/sites` — para obtener la lista de sedes
2. `GET /api/company/my-company/areas` — para obtener la lista de áreas

Luego cruza `siteID` y `areaID` de cada usuario contra esos catálogos para resolver el nombre.
Esto agrega latencia y complejidad innecesaria.

---

## Problema

Los endpoints de usuarios (`GET /api/users/my-company` y `GET /api/users`) retornan el ID pero
**no incluyen el nombre** de la sede ni del área en el objeto de cada usuario:

```json
{
  "userID": 12,
  "firstName": "Juan",
  "lastName": "Rojas",
  "siteID": 3,
  "areaID": 7
}
```

---

## Solicitud

Agregar los campos `siteName` y `areaName` directamente en la respuesta de los siguientes endpoints:

| Endpoint | Método |
|---|---|
| `GET /api/users` | SuperAdmin |
| `GET /api/users/my-company` | HRManager / CompanyAdmin |
| `GET /api/users/{id}` | Cualquier rol autenticado |

### Respuesta esperada

```json
{
  "userID": 12,
  "firstName": "Juan",
  "lastName": "Rojas",
  "siteID": 3,
  "siteName": "Sede Norte",
  "areaID": 7,
  "areaName": "Recursos Humanos"
}
```

> Los campos `siteName` y `areaName` pueden ser `null` si el usuario no tiene sede/área asignada.

---

## Impacto esperado

- Se eliminan las 2 llamadas extra al catálogo de sedes/áreas.
- La columna **Sede / Área** en `/admin/company-tracking` se mostrará correctamente sin lógica de cruce en el frontend.
- Mejora de rendimiento y simplificación del código frontend.
