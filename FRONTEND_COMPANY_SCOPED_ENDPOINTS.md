# Integración de Endpoints por Empresa (`my-company`)

## Contexto

Se agregó un sistema de jerarquía por empresa a la API. Cada usuario autenticado tiene un `CompanyID` embebido en su JWT. Los nuevos endpoints `my-company` usan ese claim automáticamente: **el frontend no necesita enviar el `companyId` como parámetro**, la API lo toma directamente del token.

> **Regla de oro:** Si el usuario tiene rol `HRManager`, usa los endpoints `/my-company`. Si tiene rol `SuperAdmin`, puede seguir usando los endpoints globales existentes (sin cambios).

---

## 1. Autenticación — Claims del Token

El JWT ya incluye los siguientes claims. No hay cambios en el login.

```json
{
  "sub": "42",
  "email": "hrmanager@empresa.com",
  "name": "Juan Pérez",
  "CompanyID": "7",
  "SiteID": "3",
  "AreaID": "12",
  "role": "HRManager"
}
```

Todos los endpoints `my-company` requieren que el token esté presente en el header:

```
Authorization: Bearer <token>
``

---

## 2. Roles y quién puede usar qué

| Rol | Acceso |
|-----|--------|
| `SuperAdmin` | Todos los endpoints globales existentes + endpoints `my-company` |
| `HRManager` | **Solo** endpoints `my-company` (datos de su empresa) |
| `Psychologist` | Endpoints propios de su flujo (sin cambio) |
| `Employee` | Solo sus propios datos (sin cambio) |

---

## 3. Usuarios — `/api/users`

### Endpoints nuevos

#### `GET /api/users/my-company`
Retorna todos los usuarios de la empresa del token.

```http
GET /api/users/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `UserDto[]`

---

#### `GET /api/users/my-company/paged`
Lista paginada de usuarios de la empresa. Soporta filtros opcionales.

```http
GET /api/users/my-company/paged?page=1&pageSize=20&siteId=3&isActive=true&search=juan
Authorization: Bearer <token>
```

| Query param | Tipo | Descripción |
|---|---|---|
| `page` | int | Página (default: 1) |
| `pageSize` | int | Tamaño (default: 20, máx: 100) |
| `siteId` | int? | Filtrar por sede |
| `areaId` | int? | Filtrar por área |
| `isActive` | bool? | Filtrar activos/inactivos |
| `search` | string? | Búsqueda por nombre o email |

**Respuesta `200`:** `PagedResultDto<UserDto>`

```json
{
  "items": [ /* UserDto[] */ ],
  "totalCount": 85,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

---

#### `POST /api/users/my-company`
Crea un usuario en la empresa del token. El `companyId` del body es ignorado; la API usa el del token.

```http
POST /api/users/my-company
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Ana",
  "lastName": "Torres",
  "email": "ana.torres@empresa.com",
  "password": "Temp1234!",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "phone": "3001234567",
  "gender": "F",
  "dateOfBirth": "1990-05-15",
  "hireDate": "2024-01-10",
  "siteID": 3,
  "areaID": 12,
  "jobTypeID": 5,
  "roleIds": [3]
}
```

> **Nota:** `companyID` en el body es opcional y se ignora. La API asigna automáticamente el `CompanyID` del token.

**Respuesta `201`:** `UserDto`

---

## 4. Empresa, Sedes y Áreas — `/api/company`

### 4.1 Empresa

#### `GET /api/company/my-company`
Retorna los datos de la empresa del token.

```http
GET /api/company/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `CompanyDto`

```json
{
  "companyID": 7,
  "businessName": "Empresa S.A.S.",
  "tradeName": "Empresa",
  "taxID": "900123456-1",
  "industry": "Manufactura",
  "email": "contacto@empresa.com",
  "phone": "6012345678",
  "address": "Calle 100 # 50-30",
  "cityName": "Bogotá",
  "isActive": true
}
```

---

#### `GET /api/company/my-company/detail`
Retorna empresa completa con sus sedes y áreas.

```http
GET /api/company/my-company/detail
Authorization: Bearer <token>
```

**Respuesta `200`:** `CompanyDetailDto`

```json
{
  "companyID": 7,
  "businessName": "Empresa S.A.S.",
  "sites": [
    { "siteID": 3, "name": "Sede Principal", "address": "...", "isActive": true }
  ],
  "areas": [
    { "areaID": 12, "name": "Recursos Humanos", "isActive": true }
  ]
}
```

---

#### `PUT /api/company/my-company`
Actualiza los datos de la empresa del token.

```http
PUT /api/company/my-company
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "6019876543",
  "address": "Carrera 15 # 80-20",
  "website": "https://empresa.com"
}
```

**Respuesta `200`:** `CompanyDto` actualizado.

---

### 4.2 Sedes

#### `GET /api/company/my-company/sites`
Retorna todas las sedes de la empresa del token.

```http
GET /api/company/my-company/sites
Authorization: Bearer <token>
```

**Respuesta `200`:** `SiteDto[]`

---

#### `POST /api/company/my-company/sites`
Crea una sede en la empresa del token. `companyID` en el body es ignorado.

```http
POST /api/company/my-company/sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sede Norte",
  "address": "Av. 68 # 12-30",
  "cityID": 1,
  "phone": "6011234567"
}
```

**Respuesta `201`:** `SiteDto`

---

#### `PUT /api/company/my-company/sites/{id}`
Actualiza una sede **validando que pertenezca a la empresa del token**.

```http
PUT /api/company/my-company/sites/3
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sede Principal Renovada",
  "phone": "6019999999"
}
```

**Respuestas:** `200` OK | `403 Forbid` (sede de otra empresa) | `404` (no existe)

---

#### `DELETE /api/company/my-company/sites/{id}`
Desactiva una sede **validando que pertenezca a la empresa del token**.

```http
DELETE /api/company/my-company/sites/3
Authorization: Bearer <token>
```

**Respuestas:** `200` OK | `403 Forbid` | `404`

---

### 4.3 Áreas

#### `GET /api/company/my-company/areas`
Retorna todas las áreas de la empresa del token.

```http
GET /api/company/my-company/areas
Authorization: Bearer <token>
```

**Respuesta `200`:** `AreaDto[]`

---

#### `POST /api/company/my-company/areas`
Crea un área en la empresa del token. `companyID` en el body es ignorado.

```http
POST /api/company/my-company/areas
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Calidad",
  "siteID": 3,
  "managerName": "Pedro Gómez"
}
```

**Respuesta `201`:** `AreaDto`

---

#### `PUT /api/company/my-company/areas/{id}`
Actualiza un área **validando que pertenezca a la empresa del token**.

```http
PUT /api/company/my-company/areas/12
Authorization: Bearer <token>
Content-Type: application/json

{
  "managerName": "Laura Martínez"
}
```

**Respuestas:** `200` OK | `403 Forbid` | `404`

---

#### `DELETE /api/company/my-company/areas/{id}`
Desactiva un área **validando que pertenezca a la empresa del token**.

```http
DELETE /api/company/my-company/areas/12
Authorization: Bearer <token>
```

**Respuestas:** `200` OK | `403 Forbid` | `404`

---

## 5. Alertas — `/api/alert`

#### `GET /api/alert/my-company`
Retorna todas las alertas de la empresa del token.

```http
GET /api/alert/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `AlertDto[]`

---

## 6. Evaluaciones — `/api/evaluation`

#### `GET /api/evaluation/my-company`
Retorna todas las evaluaciones de todos los usuarios de la empresa del token.

```http
GET /api/evaluation/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `EvaluationDto[]`

---

## 7. Seguimiento de Casos — `/api/casetracking`

#### `GET /api/casetracking/my-company`
Retorna todos los casos de seguimiento asociados a usuarios de la empresa del token.

```http
GET /api/casetracking/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `CaseTrackingDto[]`

---

## 8. Solicitudes de Soporte — `/api/support`

#### `GET /api/support/my-company`
Retorna todas las solicitudes de soporte de la empresa del token.

```http
GET /api/support/my-company
Authorization: Bearer <token>
```

**Respuesta `200`:** `SupportRequestDto[]`

---

## 9. Dashboard — `/api/dashboard`

Todos los endpoints de dashboard tienen una variante `my-company` que inyecta automáticamente el `CompanyID` del token. Los filtros adicionales (`siteId`, `areaId`, `period`, etc.) siguen funcionando como parámetros opcionales.

### Endpoints disponibles

| Endpoint | Descripción |
|---|---|
| `GET /api/dashboard/my-company/indicators` | KPIs principales (participación, alertas, riesgo) |
| `GET /api/dashboard/my-company/trends` | Tendencias temporales |
| `GET /api/dashboard/my-company/risk-distribution` | Distribución LOW/MODERATE/HIGH/SEVERE |
| `GET /api/dashboard/my-company/module-statistics` | Estadísticas por módulo |
| `GET /api/dashboard/my-company/area-comparison` | Comparativa por área |

### Ejemplo — Indicadores con filtro de sede

```http
GET /api/dashboard/my-company/indicators?siteId=3&period=2025-03
Authorization: Bearer <token>
```

**Respuesta `200`:**

```json
{
  "totalEvaluations": 120,
  "completedEvaluations": 95,
  "completionRate": 79.17,
  "averageScore": 62.4,
  "highRiskCount": 8,
  "activeAlerts": 5,
  "openCases": 3,
  "totalUsers": 132,
  "participatingUsers": 95,
  "participationRate": 71.97
}
```

### Ejemplo — Tendencias

```http
GET /api/dashboard/my-company/trends?periodType=monthly
Authorization: Bearer <token>
```

### Parámetros opcionales disponibles en todos los `my-company/dashboard`

| Query param | Tipo | Descripción |
|---|---|---|
| `siteId` | int? | Filtrar por sede |
| `areaId` | int? | Filtrar por área |
| `moduleId` | int? | Filtrar por módulo |
| `period` | string? | Período YYYY-MM |
| `startDate` | DateTime? | Fecha inicio |
| `endDate` | DateTime? | Fecha fin |

> **Importante:** `companyId` en el query es ignorado para estos endpoints; la API siempre usa el del token.

---

## 10. Manejo de Errores

| Código | Cuándo ocurre |
|---|---|
| `401 Unauthorized` | Token inválido o expirado |
| `403 Forbidden` | El recurso (sede/área) no pertenece a la empresa del token |
| `404 Not Found` | El recurso no existe |
| `400 Bad Request` | Datos inválidos o regla de negocio incumplida |

---

## 11. Guía de Implementación por Pantalla

### Panel de administración `HRManager`

```
/dashboard
  → GET /api/dashboard/my-company/indicators
  → GET /api/dashboard/my-company/risk-distribution
  → GET /api/dashboard/my-company/module-statistics

/usuarios
  → GET /api/users/my-company/paged   (lista paginada con búsqueda)
  → POST /api/users/my-company        (crear usuario)
  → PUT  /api/users/{id}              (editar usuario — endpoint existente)
  → PATCH /api/users/{id}/deactivate  (desactivar — endpoint existente)

/organizacion
  → GET /api/company/my-company/detail   (empresa con sedes y áreas)
  → POST/PUT/DELETE /api/company/my-company/sites/{id}
  → POST/PUT/DELETE /api/company/my-company/areas/{id}

/alertas
  → GET /api/alert/my-company

/evaluaciones
  → GET /api/evaluation/my-company

/casos
  → GET /api/casetracking/my-company

/soporte
  → GET /api/support/my-company
```

---

## 12. Ejemplo de integración en código (TypeScript / fetch)

```typescript
const API_BASE = 'https://api.emocheck.com';

// Obtener usuarios de mi empresa (paginado)
async function getMyCompanyUsers(page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/api/users/my-company/paged?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json(); // PagedResultDto<UserDto>
}

// Crear usuario en mi empresa
async function createUserInMyCompany(data: CreateUserPayload) {
  const res = await fetch(`${API_BASE}/api/users/my-company`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), // NO incluir companyID
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // UserDto
}

// Dashboard de mi empresa
async function getMyCompanyIndicators(filters = {}) {
  const params = new URLSearchParams(filters as Record<string, string>);
  const res = await fetch(`${API_BASE}/api/dashboard/my-company/indicators?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json(); // DashboardIndicatorsDto
}

// Crear área en mi empresa
async function createArea(name: string, siteId?: number) {
  const res = await fetch(`${API_BASE}/api/company/my-company/areas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, siteID: siteId }), // NO incluir companyID
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // AreaDto
}
```

---

## 13. Comparación: endpoints globales vs. `my-company`

| Operación | Endpoint global (SuperAdmin) | Endpoint my-company (HRManager) |
|---|---|---|
| Listar usuarios | `GET /api/users/company/{id}` | `GET /api/users/my-company` |
| Listar usuarios paginado | `GET /api/users/paged?companyId=7` | `GET /api/users/my-company/paged` |
| Ver mi empresa | `GET /api/company/{id}` | `GET /api/company/my-company` |
| Sedes | `GET /api/company/{id}/sites` | `GET /api/company/my-company/sites` |
| Áreas | `GET /api/company/{id}/areas` | `GET /api/company/my-company/areas` |
| Alertas | `GET /api/alert/company/{id}` | `GET /api/alert/my-company` |
| Dashboard | `GET /api/dashboard/indicators?companyId=7` | `GET /api/dashboard/my-company/indicators` |

> Los endpoints globales **no cambiaron** y siguen funcionando igual para `SuperAdmin`.
