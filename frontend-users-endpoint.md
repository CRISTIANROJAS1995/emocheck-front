# API de Usuarios — Guía para el Frontend

> **Base URL:** `https://<host>/api/users`
> **Autenticación:** Bearer token JWT en el header `Authorization`.
> **Rol requerido (crear / editar):** `SuperAdmin`

---

## 1. Crear usuario — `POST /api/users`

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Campos del body

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `firstName` | `string` (max 100) | ✅ | Nombre |
| `lastName` | `string` (max 100) | ✅ | Apellido |
| `email` | `string` (max 256) | ✅ | Correo electrónico |
| `password` | `string` (min 8) | ✅ | Contraseña inicial |
| `documentType` | `string` (3 chars) | ✅ | `CC`, `CE`, `TI`, `PP`, `NIT` |
| `documentNumber` | `string` (max 20) | ✅ | Número de documento |
| `phone` | `string` (max 20) | ✅ | Teléfono |
| `gender` | `string` (1 char) | ✅ | `M`, `F`, `O` |
| `dateOfBirth` | `string` ISO 8601 | ✅ | Fecha de nacimiento ej. `1990-05-15` |
| `hireDate` | `string` ISO 8601 | ✅ | Fecha de contratación ej. `2024-01-01` |
| `companyID` | `integer` | ✅ | ID de la empresa |
| `siteID` | `integer` | ✅ | ID de la sede |
| `areaID` | `integer` | ✅ | ID del área |
| `jobTypeID` | `integer` | ✅ | ID del tipo de cargo |
| `roleIds` | `integer[]` | ❌ | Lista de IDs de roles a asignar |
| **`maritalStatus`** | `string` (max 30) | ❌ | Estado civil (ver valores) |
| **`educationLevel`** | `string` (max 50) | ❌ | Nivel educativo (ver valores) |
| **`stratum`** | `integer` (1–6) | ❌ | Estrato socioeconómico |
| **`housingType`** | `string` (max 30) | ❌ | Tipo de vivienda (ver valores) |
| **`dependents`** | `integer` | ❌ | Número de personas a cargo |
| **`contractType`** | `string` (max 50) | ❌ | Tipo de contrato (ver valores) |
| **`dailyWorkHours`** | `integer` | ❌ | Horas laborales por día |
| **`jobSeniority`** | `integer` | ❌ | Antigüedad en el cargo (años) |

> Los campos en negrita son **nuevos** — antes no se enviaban y quedaban `null` en la base de datos.

#### Valores admitidos para campos cerrados

> Todos son **datos estáticos** — no hay tablas de catálogo en la BD. Enviar exactamente los valores listados.

**`maritalStatus`** — Estado civil

| Valor a enviar | Descripción |
|---|---|
| `Soltero/a` | Soltero/a |
| `Casado/a` | Casado/a |
| `Unión libre` | Unión libre |
| `Separado/a` | Separado/a |
| `Viudo/a` | Viudo/a |

**`educationLevel`** — Nivel de escolaridad

| Valor a enviar | Descripción |
|---|---|
| `Ninguno` | Sin estudios |
| `Primaria incompleta` | |
| `Primaria completa` | |
| `Bachillerato incompleto` | |
| `Bachillerato completo` | |
| `Técnica/tecnología incompleta` | |
| `Técnica/tecnología completa` | |
| `Profesional incompleto` | |
| `Profesional completo` | |
| `Posgrado` | |

**`stratum`** — Estrato socioeconómico: entero del `1` al `6`

**`housingType`** — Tipo de vivienda

| Valor a enviar |
|---|
| `Propia` |
| `Arrendada` |
| `Familiar` |
| `Otra` |

**`dependents`** — Número de personas a cargo: entero ≥ `0`

**`contractType`** — Tipo de contrato

| Valor a enviar | Descripción |
|---|---|
| `Indefinido` | Contrato a término indefinido |
| `Temporal` | Contrato a término fijo |
| `Prestación de servicios` | |
| `Aprendizaje` | Contrato de aprendizaje |
| `Otro` | |

**`dailyWorkHours`** — Horas de trabajo diarias (enviar el **número entero**, no texto)

| Valor | Significado |
|---|---|
| `1` | Menos de 8 horas |
| `2` | 8 horas |
| `3` | Más de 8 horas |

**`jobSeniority`** — Antigüedad en el cargo (enviar el **número entero**, no texto)

| Valor | Significado |
|---|---|
| `1` | Menos de 1 año |
| `2` | Entre 1 y 5 años |
| `3` | Entre 6 y 10 años |
| `4` | Entre 11 y 20 años |
| `5` | Más de 20 años |

---

### Ejemplo — request body completo

```json
{
  "firstName": "Laura",
  "lastName": "Gómez",
  "email": "lgomez@empresa.com",
  "password": "Segura2025!",
  "documentType": "CC",
  "documentNumber": "1020304050",
  "phone": "3001234567",
  "gender": "F",
  "dateOfBirth": "1992-08-20",
  "hireDate": "2023-03-01",
  "companyID": 1,
  "siteID": 3,
  "areaID": 7,
  "jobTypeID": 12,
  "roleIds": [2],
  "maritalStatus": "Casado/a",
  "educationLevel": "Profesional completo",
  "stratum": 3,
  "housingType": "Arrendada",
  "dependents": 2,
  "contractType": "Indefinido",
  "dailyWorkHours": 2,
  "jobSeniority": 2
}
```

### Ejemplo — response `201 Created`

```json
{
  "userID": 58,
  "firstName": "Laura",
  "lastName": "Gómez",
  "fullName": "Laura Gómez",
  "email": "lgomez@empresa.com",
  "documentType": "CC",
  "documentNumber": "1020304050",
  "phone": "3001234567",
  "gender": "F",
  "dateOfBirth": "1992-08-20T00:00:00Z",
  "hireDate": "2023-03-01T00:00:00Z",
  "isActive": true,
  "lastLoginAt": null,
  "createdAt": "2026-03-30T14:22:00Z",
  "profilePhotoUrl": null,
  "maritalStatus": "Casado/a",
  "educationLevel": "Profesional completo",
  "stratum": 3,
  "housingType": "Arrendada",
  "dependents": 2,
  "contractType": "Indefinido",
  "dailyWorkHours": 2,
  "jobSeniority": 2,
  "companyID": 1,
  "companyName": "Empresa Demo S.A.",
  "siteID": 3,
  "siteName": "Sede Norte",
  "areaID": 7,
  "areaName": "Recursos Humanos",
  "jobTypeID": 12,
  "jobTypeName": "Analista",
  "roles": ["Employee"]
}
```

---

## 2. Actualizar usuario — `PUT /api/users/{id}`

Todos los campos son **opcionales** — se envían solo los que se quieren modificar (patch semántico).

### Ejemplo — request body mínimo (solo actualiza datos sociodemográficos)

```http
PUT /api/users/58
Authorization: Bearer <token>
Content-Type: application/json

{
  "maritalStatus": "Separado/a",
  "educationLevel": "Posgrado",
  "stratum": 4,
  "housingType": "Propia",
  "dependents": 0,
  "contractType": "Prestación de servicios",
  "dailyWorkHours": 2,
  "jobSeniority": 3
}
```

### Ejemplo — response `200 OK`

Devuelve el objeto `UserDto` completo (misma estructura que el `201` de arriba) con los valores actualizados.

---

## 3. Carga masiva — `POST /api/users/bulk-upload`

Sube un archivo `.xlsx` con múltiples usuarios. La fila 1 debe ser el encabezado; los datos empiezan en la fila 2.

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Estructura del Excel

| Col | Campo | Tipo | Requerido | Ejemplo |
|---|---|---|---|---|
| 1 | `FirstName` | texto | ✅ | `Laura` |
| 2 | `LastName` | texto | ✅ | `Gómez` |
| 3 | `Email` | texto | ✅ | `lgomez@empresa.com` |
| 4 | `Password` | texto (min 8) | ✅ | `Segura2025!` |
| 5 | `DocumentType` | `CC`/`CE`/`TI`/`PP`/`NIT` | ✅ | `CC` |
| 6 | `DocumentNumber` | texto | ✅ | `1020304050` |
| 7 | `Phone` | texto | ✅ | `3001234567` |
| 8 | `Gender` | `M`/`F`/`O` | ✅ | `F` |
| 9 | `DateOfBirth` | `YYYY-MM-DD` | ✅ | `1992-08-20` |
| 10 | `HireDate` | `YYYY-MM-DD` | ✅ | `2023-03-01` |
| 11 | `CompanyID` | entero | ✅ | `1` |
| 12 | `SiteID` | entero | ✅ | `3` |
| 13 | `AreaID` | entero | ✅ | `7` |
| 14 | `JobTypeID` | entero | ✅ | `12` |
| 15 | `RoleIds` | enteros separados por `,` | ❌ | `2,5` |
| **16** | **`MaritalStatus`** | texto | ❌ | `casado` |
| **17** | **`EducationLevel`** | texto | ❌ | `universitario` |
| **18** | **`Stratum`** | entero 1–6 | ❌ | `3` |
| **19** | **`HousingType`** | texto | ❌ | `arrendada` |
| **20** | **`Dependents`** | entero | ❌ | `2` |
| **21** | **`ContractType`** | texto | ❌ | `indefinido` |
| **22** | **`DailyWorkHours`** | entero | ❌ | `8` |
| **23** | **`JobSeniority`** | entero (años) | ❌ | `3` |

> Las columnas 16–23 son nuevas. Si se dejan vacías, el campo queda `null` (no causa error).
> Los valores admitidos para cada columna son **exactamente los mismos** que en la sección 1 (campos cerrados). `DailyWorkHours` y `JobSeniority` se escriben como número entero (ej. `2`, no `8 horas`).

### Ejemplo de fila completa

```
Laura | Gómez | lgomez@empresa.com | Segura2025! | CC | 1020304050 | 3001234567 | F | 1992-08-20 | 2023-03-01 | 1 | 3 | 7 | 12 | 2 | Casado/a | Profesional completo | 3 | Arrendada | 2 | Indefinido | 2 | 2
```

### Response `200 OK`

```json
{
  "totalRows": 10,
  "created": 9,
  "skipped": 1,
  "errors": [
    {
      "row": 5,
      "email": "duplicado@empresa.com",
      "reason": "El correo ya está registrado"
    }
  ]
}
```

---

## 4. Campos que **el formulario actual no envía** y siguen siendo `null`

Los siguientes campos existen en la base de datos y **ya están soportados por la API**, pero el formulario de _Crear Nuevo Usuario_ no los incluye aún:

| Campo DB | Campo API | Formulario actual |
|---|---|---|
| `DateOfBirth` | `dateOfBirth` | ❌ No aparece |
| `HireDate` | `hireDate` | ❌ No aparece (requerido en DB) |
| `MaritalStatus` | `maritalStatus` | ❌ No aparece |
| `EducationLevel` | `educationLevel` | ❌ No aparece |
| `Stratum` | `stratum` | ❌ No aparece |
| `HousingType` | `housingType` | ❌ No aparece |
| `Dependents` | `dependents` | ❌ No aparece |
| `ContractType` | `contractType` | ❌ No aparece |
| `DailyWorkHours` | `dailyWorkHours` | ❌ No aparece |
| `JobSeniority` | `jobSeniority` | ❌ No aparece |

> ⚠️ `hireDate` es **NOT NULL** en la base de datos y **requerido** en el DTO. Si el formulario no lo envía, la creación fallará con un error `400`.

---

## 5. Resumen de cambios en la API

Estos cambios ya están desplegados en la rama actual:

- `CreateUserDto` — añadidos 8 campos sociodemográficos opcionales
- `UpdateUserDto` — igual
- `UserDto` (respuesta) — devuelve los 8 campos nuevos
- `UserService.CreateAsync` — persiste los nuevos campos al crear
- `UserService.UpdateAsync` — persiste los nuevos campos al editar
- `UserService.BulkCreateAsync` — persiste los nuevos campos en carga masiva Excel
