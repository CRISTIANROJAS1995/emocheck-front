# EmoCheck API — Guía de Integración para Frontend

> **Versión:** 5.0 · **Fecha:** 21 de Febrero 2026
> **Backend:** .NET 8 Web API · Clean Architecture
> **Autenticación:** JWT Bearer Token
> **Base URL:** `https://localhost:7000` (dev) | `https://api.emocheck.com` (prod)
> **Formato:** JSON (`Content-Type: application/json`)

---

## 📋 Tabla de Contenidos

1. [Configuración inicial](#1-configuración-inicial)
2. [Autenticación y sesión](#2-autenticación-y-sesión)
3. [Estructura de respuestas](#3-estructura-de-respuestas)
4. [Roles y permisos](#4-roles-y-permisos)
5. [Auth](#5-auth)
6. [OTP — Recuperación de contraseña](#6-otp--recuperación-de-contraseña)
7. [Usuarios](#7-usuarios)
8. [Catálogos (Countries, States, Cities, Job Types, Roles)](#8-catálogos)
9. [Empresa, Sedes y Áreas](#9-empresa-sedes-y-áreas)
10. [Assessment — Módulos e Instrumentos](#10-assessment--módulos-e-instrumentos)
11. [Assessment — Preguntas, Opciones y Rangos](#11-assessment--preguntas-opciones-y-rangos)
12. [Evaluaciones](#12-evaluaciones)
13. [Alertas](#13-alertas)
14. [Seguimiento de Casos](#14-seguimiento-de-casos)
15. [Recomendaciones](#15-recomendaciones)
16. [Recursos de Bienestar](#16-recursos-de-bienestar)
17. [Solicitudes de Apoyo](#17-solicitudes-de-apoyo)
18. [Consentimiento Informado](#18-consentimiento-informado)
19. [Dashboard](#19-dashboard)
20. [Exportación de Datos](#20-exportación-de-datos)
21. [Logs de Auditoría](#21-logs-de-auditoría)
22. [Logs del Sistema](#22-logs-del-sistema)
23. [Manejo de errores](#23-manejo-de-errores)
24. [Flujos completos paso a paso](#24-flujos-completos-paso-a-paso)

---

## 1. Configuración inicial

### Variables de entorno

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7000/api',
};
```

### Interceptor HTTP — Agregar token automáticamente

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

### Configurar en app.config.ts

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

---

## 2. Autenticación y sesión

EmoCheck usa **JWT** con refresh tokens.

```
[Login] → recibe { token, refreshToken, expiresAt }
       ↓
[Peticiones] → envía token en header Authorization: Bearer <token>
       ↓
[Token expirado 401] → llama POST /api/auth/refresh-token
       ↓
[Cerrar sesión] → llama POST /api/auth/revoke-token
```

- **Token de acceso:** expira en **60 minutos**
- **Refresh token:** expira en **7 días**
- Guardar ambos en `localStorage` o estado global (NgRx, Pinia, Zustand, etc.)

---

## 3. Estructura de respuestas

Todas las respuestas siguen este formato:

```typescript
interface ApiResponse<T> {
  data: T;           // El objeto o lista retornado
  message: string;   // Mensaje descriptivo
  success: boolean;  // true si fue exitoso
  errors?: string[]; // Solo en errores de validación
}
```

**Ejemplo de respuesta exitosa:**
```json
{
  "data": { "userID": 1, "email": "admin@emocheck.com" },
  "message": "Login exitoso",
  "success": true
}
```

**Ejemplo de error de validación (400):**
```json
{
  "data": null,
  "message": "Error de validación",
  "success": false,
  "errors": ["El campo Email es obligatorio", "La contraseña debe tener mínimo 8 caracteres"]
}
```

---

## 4. Roles y permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `SuperAdmin` | Administrador total del sistema | Todo |
| `Psychologist` | Psicólogo clínico | Casos, alertas, recursos, dashboard |
| `HRManager` | Gestor de RRHH | Usuarios de su empresa, dashboard |
| `Employee` | Empleado | Solo su propia información y evaluaciones |

> 🔒 Los endpoints marcados con un rol específico retornan **403 Forbidden** si el usuario no tiene ese rol.

---

## 5. Auth

**Base:** `POST /api/auth/...`

---

### 5.1 Login

```
POST /api/auth/login
Auth: ❌ No requerido
```

**Body:**
```json
{
  "email": "admin@emocheck.com",
  "password": "Admin123!"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123refreshtoken...",
  "expiresAt": "2026-02-21T15:00:00Z",
  "user": {
    "userID": 1,
    "firstName": "Admin",
    "lastName": "EmoCheck",
    "email": "admin@emocheck.com",
    "roles": ["SuperAdmin"]
  }
}
```

> 💡 Guardar `token` y `refreshToken` en localStorage al hacer login.

---

### 5.2 Refresh Token

```
POST /api/auth/refresh-token
Auth: ❌ No requerido
```

**Body:**
```json
{
  "refreshToken": "abc123refreshtoken..."
}
```

**Response 200:** Mismo formato que Login.

---

### 5.3 Revocar Token (Logout)

```
POST /api/auth/revoke-token
Auth: ✅ Bearer token
```

**Body:**
```json
{
  "refreshToken": "abc123refreshtoken..."
}
```

**Response 200:** `{ "message": "Token revocado" }`

---

### 5.4 Revocar todos los tokens de un usuario

```
POST /api/auth/revoke-all/{userId}
Auth: ✅ SuperAdmin
```

---

### 5.5 Cambiar contraseña

```
POST /api/auth/change-password
Auth: ✅ Bearer token (cualquier rol)
```

**Body:**
```json
{
  "currentPassword": "Admin123!",
  "newPassword": "NuevoPass456!",
  "confirmNewPassword": "NuevoPass456!"
}
```

---

### 5.6 Reset de contraseña por admin

```
POST /api/auth/admin-reset-password/{userId}
Auth: ✅ SuperAdmin
```

**Body:**
```json
{
  "newPassword": "TempPass123!"
}
```

---

## 6. OTP — Recuperación de contraseña

**Base:** `POST /api/otp/...`

Flujo recomendado para "¿Olvidaste tu contraseña?":

```
[1] POST /otp/generate  → envía el código al email
[2] POST /otp/validate  → verifica que el código es correcto
[3] POST /otp/reset-password → establece la nueva contraseña
```

---

### 6.1 Generar OTP

```
POST /api/otp/generate
Auth: ❌ No requerido
```

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "purpose": "PASSWORD_RESET"
}
```

**Propósitos válidos:** `PASSWORD_RESET`, `EMAIL_VERIFICATION`, `TWO_FACTOR`

---

### 6.2 Validar OTP

```
POST /api/otp/validate
Auth: ❌ No requerido
```

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "otpCode": "123456",
  "purpose": "PASSWORD_RESET"
}
```

---

### 6.3 Reenviar OTP

```
POST /api/otp/resend
Auth: ❌ No requerido
```

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "purpose": "PASSWORD_RESET"
}
```

---

### 6.4 Reset de contraseña con OTP

```
POST /api/otp/reset-password
Auth: ❌ No requerido
```

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "otpCode": "123456",
  "newPassword": "NuevoPass123!",
  "confirmNewPassword": "NuevoPass123!"
}
```

---

### 6.5 Historial de OTPs por usuario (SuperAdmin)

```
GET /api/otp/history/{userId}
Auth: ✅ SuperAdmin
```

---

## 7. Usuarios

**Base:** `/api/users`
**Auth:** ✅ Bearer token (roles varían por endpoint)

---

### 7.1 Listar todos los usuarios

```
GET /api/users
Roles: SuperAdmin, Psychologist, HRManager
```

---

### 7.2 Obtener usuario por ID

```
GET /api/users/{id}
Auth: ✅ Cualquier rol
```

---

### 7.3 Obtener usuario por email

```
GET /api/users/email/{email}
Roles: SuperAdmin
```

**Ejemplo:** `GET /api/users/email/juan@empresa.com`

---

### 7.4 Filtrar usuarios

```
GET /api/users/company/{companyId}    → Roles: SuperAdmin, HRManager
GET /api/users/site/{siteId}          → Roles: SuperAdmin, HRManager
GET /api/users/area/{areaId}          → Roles: SuperAdmin, HRManager
GET /api/users/me                     → Cualquier rol (devuelve el usuario autenticado)
```

---

### 7.5 Crear usuario

```
POST /api/users
Roles: SuperAdmin
```

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@empresa.com",
  "password": "Pass123!",
  "companyID": 1,
  "siteID": 1,
  "areaID": 1,
  "jobTypeID": 1,
  "phone": "+57300000000",
  "gender": "M",
  "birthDate": "1990-01-15"
}
```

---

### 7.6 Actualizar usuario

```
PUT /api/users/{id}
Roles: SuperAdmin
```

**Body (todos los campos opcionales):**
```json
{
  "firstName": "Juan Carlos",
  "phone": "+57311000000",
  "areaID": 2,
  "jobTypeID": 3
}
```

---

### 7.7 Activar / Desactivar usuario

```
PATCH /api/users/{id}/deactivate    → Roles: SuperAdmin
PATCH /api/users/{id}/activate      → Roles: SuperAdmin
```

Sin body.

---

### 7.8 Gestionar roles de usuario

```
POST   /api/users/{userId}/roles/{roleId}    → Asignar rol   (SuperAdmin)
DELETE /api/users/{userId}/roles/{roleId}    → Quitar rol    (SuperAdmin)
```

Sin body.

---

## 8. Catálogos

**Base:** `/api/catalog`
**Auth:** ✅ Bearer token
**Operaciones de escritura:** Solo `SuperAdmin`

> Los catálogos son los datos de referencia del sistema: geografía y configuración. Son usados para poblar selects/dropdowns en el frontend.

---

### 8.1 Países

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/catalog/countries` | Todos los países | Autenticado |
| `GET` | `/api/catalog/countries/active` | Solo países activos | Autenticado |
| `GET` | `/api/catalog/countries/{id}` | País por ID | Autenticado |
| `POST` | `/api/catalog/countries` | Crear país | SuperAdmin |
| `PUT` | `/api/catalog/countries/{id}` | Actualizar país | SuperAdmin |
| `DELETE` | `/api/catalog/countries/{id}` | Desactivar país (soft delete) | SuperAdmin |

**Crear País — Body:**
```json
{
  "name": "Colombia",        // string, requerido, máx 100
  "iSOCode": "COL",          // string, requerido, máx 3
  "phoneCode": "+57"         // string, requerido, máx 5
}
```

**Actualizar País — Body (todos opcionales):**
```json
{
  "name": "Colombia",
  "iSOCode": "COL",
  "phoneCode": "+57",
  "isActive": true
}
```

**Response (CountryDto):**
```json
{
  "countryID": 1,
  "name": "Colombia",
  "iSOCode": "COL",
  "phoneCode": "+57",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### 8.2 Departamentos / Estados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalog/states` | Todos los departamentos |
| `GET` | `/api/catalog/states/by-country/{countryId}` | Por país |
| `GET` | `/api/catalog/states/{id}` | Por ID |
| `POST` | `/api/catalog/states` | Crear (SuperAdmin) |
| `PUT` | `/api/catalog/states/{id}` | Actualizar (SuperAdmin) |
| `DELETE` | `/api/catalog/states/{id}` | Desactivar (SuperAdmin) |

**Crear Departamento — Body:**
```json
{
  "countryID": 1,          // int, requerido
  "name": "Cundinamarca",  // string, requerido, máx 100
  "code": "CUN"            // string, opcional, máx 10
}
```

**Response (StateDto):**
```json
{
  "stateID": 1,
  "countryID": 1,
  "countryName": "Colombia",
  "name": "Cundinamarca",
  "code": "CUN",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### 8.3 Ciudades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalog/cities` | Todas las ciudades |
| `GET` | `/api/catalog/cities/by-state/{stateId}` | Por departamento |
| `GET` | `/api/catalog/cities/{id}` | Por ID |
| `POST` | `/api/catalog/cities` | Crear (SuperAdmin) |
| `PUT` | `/api/catalog/cities/{id}` | Actualizar (SuperAdmin) |
| `DELETE` | `/api/catalog/cities/{id}` | Desactivar (SuperAdmin) |

**Crear Ciudad — Body:**
```json
{
  "stateID": 1,           // int, requerido
  "name": "Bogotá D.C."  // string, requerido, máx 100
}
```

**Response (CityDto):**
```json
{
  "cityID": 1,
  "stateID": 1,
  "stateName": "Cundinamarca",
  "name": "Bogotá D.C.",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### 8.4 Tipos de Cargo (Job Types)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalog/job-types` | Todos los tipos de cargo |
| `GET` | `/api/catalog/job-types/active` | Solo activos |
| `GET` | `/api/catalog/job-types/{id}` | Por ID |
| `POST` | `/api/catalog/job-types` | Crear (SuperAdmin) |
| `PUT` | `/api/catalog/job-types/{id}` | Actualizar (SuperAdmin) |
| `DELETE` | `/api/catalog/job-types/{id}` | Desactivar (SuperAdmin) |

**Crear Tipo de Cargo — Body:**
```json
{
  "name": "Analista de Datos",                              // string, requerido, máx 100
  "description": "Cargo de análisis y visualización"       // string, opcional, máx 300
}
```

**Response (JobTypeDto):**
```json
{
  "jobTypeID": 1,
  "name": "Analista de Datos",
  "description": "Cargo de análisis y visualización",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### 8.5 Roles del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalog/roles` | Todos los roles (SuperAdmin) |
| `GET` | `/api/catalog/roles/active` | Solo activos |
| `GET` | `/api/catalog/roles/{id}` | Por ID (SuperAdmin) |
| `POST` | `/api/catalog/roles` | Crear (SuperAdmin) |
| `PUT` | `/api/catalog/roles/{id}` | Actualizar (SuperAdmin) |
| `DELETE` | `/api/catalog/roles/{id}` | Desactivar (SuperAdmin) |

**Crear Rol — Body:**
```json
{
  "name": "Auditor",                                        // string, requerido, máx 50
  "description": "Rol de auditoría con acceso de lectura"  // string, requerido, máx 200
}
```

**Response (RoleDto):**
```json
{
  "roleID": 1,
  "name": "Auditor",
  "description": "Rol de auditoría con acceso de lectura",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

## 9. Empresa, Sedes y Áreas

**Base:** `/api/company`
**Auth:** ✅ Bearer token

---

### 9.1 Empresas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/company` | Todas las empresas | SuperAdmin |
| `GET` | `/api/company/active` | Empresas activas | SuperAdmin, HRManager, Psychologist |
| `GET` | `/api/company/{id}` | Por ID | SuperAdmin, HRManager, Psychologist |
| `GET` | `/api/company/{id}/detail` | Con sedes y áreas incluidas | SuperAdmin, HRManager, Psychologist |
| `POST` | `/api/company` | Crear empresa | SuperAdmin |
| `PUT` | `/api/company/{id}` | Actualizar empresa | SuperAdmin |
| `DELETE` | `/api/company/{id}` | Desactivar empresa | SuperAdmin |

**Crear Empresa — Body:**
```json
{
  "businessName": "Empresa ABC S.A.S",     // string, requerido, máx 200
  "tradeName": "Empresa ABC",              // string, requerido, máx 200
  "taxID": "900123456-1",                  // string, requerido, máx 20 (NIT)
  "industry": "Tecnología",               // string, requerido, máx 100
  "email": "contacto@empresaabc.com",     // string, email válido, requerido
  "phone": "+57 1 3456789",               // string, requerido, máx 20
  "address": "Cra 15 # 93-75 Of 502",    // string, requerido, máx 300
  "cityID": 1,                            // int, requerido
  "website": "https://empresaabc.com",    // string, opcional, máx 300
  "logoUrl": "https://cdn.com/logo.png",  // string, opcional, máx 500
  "employeeCount": 150                    // int, opcional
}
```

**Response (CompanyDetailDto):**
```json
{
  "companyID": 1,
  "businessName": "Empresa ABC S.A.S",
  "tradeName": "Empresa ABC",
  "taxID": "900123456-1",
  "industry": "Tecnología",
  "email": "contacto@empresaabc.com",
  "phone": "+57 1 3456789",
  "address": "Cra 15 # 93-75 Of 502",
  "cityID": 1,
  "cityName": "Bogotá D.C.",
  "website": "https://empresaabc.com",
  "logoUrl": null,
  "employeeCount": 150,
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00Z",
  "sites": [ ... ],
  "areas": [ ... ]
}
```

---

### 9.2 Sedes (Sites)

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/company/sites` | Todas las sedes | SuperAdmin |
| `GET` | `/api/company/{companyId}/sites` | Sedes de una empresa | SuperAdmin, HRManager, Psychologist |
| `GET` | `/api/company/sites/{id}` | Por ID | SuperAdmin, HRManager, Psychologist |
| `POST` | `/api/company/sites` | Crear sede | SuperAdmin |
| `PUT` | `/api/company/sites/{id}` | Actualizar sede | SuperAdmin |
| `DELETE` | `/api/company/sites/{id}` | Desactivar sede | SuperAdmin |

**Crear Sede — Body:**
```json
{
  "companyID": 1,                    // int, requerido
  "name": "Sede Norte",             // string, requerido, máx 150
  "address": "Cra 7 # 127-50",     // string, requerido, máx 300
  "cityID": 1,                      // int, requerido
  "phone": "+57 1 6543210"          // string, opcional, máx 20
}
```

**Response (SiteDto):**
```json
{
  "siteID": 1,
  "companyID": 1,
  "companyName": "Empresa ABC",
  "name": "Sede Norte",
  "address": "Cra 7 # 127-50",
  "cityID": 1,
  "cityName": "Bogotá D.C.",
  "phone": "+57 1 6543210",
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00Z"
}
```

---

### 9.3 Áreas

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/company/areas` | Todas las áreas | SuperAdmin |
| `GET` | `/api/company/{companyId}/areas` | Áreas de una empresa | SuperAdmin, HRManager, Psychologist |
| `GET` | `/api/company/areas/{id}` | Por ID | SuperAdmin, HRManager, Psychologist |
| `POST` | `/api/company/areas` | Crear área | SuperAdmin |
| `PUT` | `/api/company/areas/{id}` | Actualizar área | SuperAdmin |
| `DELETE` | `/api/company/areas/{id}` | Desactivar área | SuperAdmin |

**Crear Área — Body:**
```json
{
  "companyID": 1,                    // int, requerido
  "siteID": 1,                       // int, opcional (área puede no tener sede)
  "name": "Recursos Humanos",       // string, requerido, máx 150
  "managerName": "María López"      // string, opcional, máx 200
}
```

**Response (AreaDto):**
```json
{
  "areaID": 1,
  "companyID": 1,
  "companyName": "Empresa ABC",
  "siteID": 1,
  "siteName": "Sede Norte",
  "name": "Recursos Humanos",
  "managerName": "María López",
  "isActive": true,
  "createdAt": "2026-01-15T00:00:00Z"
}
```

---

## 10. Assessment — Módulos e Instrumentos

**Base:** `/api/assessmentmodule`
**Auth:** ✅ Bearer token

---

### 10.1 Módulos de Evaluación

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/assessmentmodule/modules` | Todos los módulos | Autenticado |
| `GET` | `/api/assessmentmodule/modules/active` | Solo activos | Autenticado |
| `GET` | `/api/assessmentmodule/modules/{id}` | Por ID | Autenticado |
| `GET` | `/api/assessmentmodule/modules/{id}/instruments` | Módulo con sus instrumentos | Autenticado |
| `GET` | `/api/assessmentmodule/modules/{id}/full` | Módulo completo (instrumentos + preguntas + opciones) | Autenticado |
| `POST` | `/api/assessmentmodule/modules` | Crear módulo | SuperAdmin |
| `PUT` | `/api/assessmentmodule/modules/{id}` | Actualizar módulo | SuperAdmin |
| `DELETE` | `/api/assessmentmodule/modules/{id}` | Eliminar módulo | SuperAdmin |

**Crear Módulo — Body:**
```json
{
  "code": "MENTAL_HEALTH",          // string, requerido — identificador único
  "name": "Salud Mental",          // string, requerido
  "description": "Evaluación...",  // string, opcional
  "minScore": 0,                   // decimal, requerido
  "maxScore": 100,                 // decimal, requerido
  "iconName": "brain",             // string, opcional
  "colorHex": "#4A90D9",           // string, opcional (color del módulo en UI)
  "displayOrder": 1,               // int, opcional
  "estimatedMinutes": 10           // int, opcional
}
```

---

### 10.2 Instrumentos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/assessmentmodule/instruments/by-module/{moduleId}` | Por módulo |
| `GET` | `/api/assessmentmodule/instruments/{id}` | Por ID |
| `GET` | `/api/assessmentmodule/instruments/{id}/questions` | Con preguntas |
| `POST` | `/api/assessmentmodule/instruments` | Crear (SuperAdmin) |
| `PUT` | `/api/assessmentmodule/instruments/{id}` | Actualizar (SuperAdmin) |
| `DELETE` | `/api/assessmentmodule/instruments/{id}` | Eliminar (SuperAdmin) |

**Crear Instrumento — Body:**
```json
{
  "moduleID": 1,                         // int, requerido
  "code": "GAD7",                        // string, requerido
  "name": "GAD-7 Ansiedad Generalizada", // string, requerido
  "description": "Escala de 7 ítems",   // string, opcional
  "scientificBasis": "Spitzer 2006",    // string, opcional
  "scaleMin": 0,                         // int — valor mínimo de cada opción
  "scaleMax": 3,                         // int — valor máximo de cada opción
  "itemCount": 7,                        // int — número de preguntas
  "maxScore": 21,                        // decimal — puntuación máxima total
  "minScore": 0,                         // decimal — puntuación mínima total
  "weightInModule": 50.00,               // decimal — peso dentro del módulo (0-100)
  "displayOrder": 1                      // int, opcional
}
```

---

## 11. Assessment — Preguntas, Opciones y Rangos

**Base:** `/api/assessment`
**Auth:** ✅ Bearer token
**Escritura:** Solo `SuperAdmin`

---

### 11.1 Preguntas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/assessment/questions/by-instrument/{instrumentId}` | Por instrumento |
| `GET` | `/api/assessment/questions/{id}` | Por ID |
| `GET` | `/api/assessment/questions/{id}/options` | Pregunta con sus opciones |
| `POST` | `/api/assessment/questions` | Crear pregunta |
| `PUT` | `/api/assessment/questions/{id}` | Actualizar pregunta |
| `DELETE` | `/api/assessment/questions/{id}` | Desactivar pregunta |

**Crear Pregunta — Body:**
```json
{
  "instrumentID": 1,                                            // int, requerido
  "questionText": "¿Con qué frecuencia se ha sentido nervioso?", // string, requerido, máx 500
  "questionNumber": 1,                                          // int, requerido — orden en el instrumento
  "originalItemNumber": 1,                                      // int, opcional — número del ítem original
  "isReversed": false,                                          // bool — si la puntuación se invierte
  "dimensionCode": "ANXIETY",                                   // string, opcional, máx 30
  "isRequired": true,                                           // bool
  "helpText": "Piense en los últimos 14 días"                   // string, opcional, máx 300
}
```

**Response (QuestionDto):**
```json
{
  "questionID": 1,
  "instrumentID": 1,
  "questionText": "¿Con qué frecuencia se ha sentido nervioso?",
  "questionNumber": 1,
  "isReversed": false,
  "dimensionCode": "ANXIETY",
  "isRequired": true,
  "helpText": "Piense en los últimos 14 días",
  "isActive": true
}
```

---

### 11.2 Opciones de Respuesta

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/assessment/options/by-question/{questionId}` | Opciones de una pregunta |
| `GET` | `/api/assessment/options/{id}` | Por ID |
| `POST` | `/api/assessment/options` | Crear opción |
| `PUT` | `/api/assessment/options/{id}` | Actualizar opción |
| `DELETE` | `/api/assessment/options/{id}` | Eliminar opción |

**Crear Opción — Body:**
```json
{
  "questionID": 1,          // int, requerido
  "optionText": "Nunca",    // string, requerido, máx 200
  "numericValue": 0,        // int, requerido — valor que suma al puntaje
  "displayOrder": 1         // int, opcional — orden de presentación
}
```

> 💡 **Ejemplo de opciones para GAD-7:**
> ```
> "Nunca" = 0  |  "Varios días" = 1  |  "Más de la mitad" = 2  |  "Casi todos los días" = 3
> ```

---

### 11.3 Rangos de Puntuación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/assessment/score-ranges/by-instrument/{instrumentId}` | Rangos de un instrumento |
| `GET` | `/api/assessment/score-ranges/{id}` | Por ID |
| `POST` | `/api/assessment/score-ranges` | Crear rango |
| `PUT` | `/api/assessment/score-ranges/{id}` | Actualizar rango |
| `DELETE` | `/api/assessment/score-ranges/{id}` | Eliminar rango |

**Crear Rango — Body:**
```json
{
  "instrumentID": 1,                 // int, requerido
  "rangeLevel": "LOW",               // string, requerido — LOW, MODERATE, HIGH, SEVERE
  "label": "Ansiedad mínima",        // string, requerido, máx 100
  "colorHex": "#4CAF50",             // string, requerido, máx 7 (hex color)
  "minScore": 0,                     // decimal, requerido
  "maxScore": 4,                     // decimal, requerido
  "description": "Sin síntomas...",  // string, opcional, máx 300
  "displayOrder": 1                  // int, opcional
}
```

> 💡 **Rangos típicos GAD-7:**
> | RangeLevel | Label | Min | Max | Color |
> |-----------|-------|-----|-----|-------|
> | `LOW` | Mínimo | 0 | 4 | `#4CAF50` (verde) |
> | `MODERATE` | Leve | 5 | 9 | `#FFC107` (amarillo) |
> | `HIGH` | Moderado | 10 | 14 | `#FF9800` (naranja) |
> | `SEVERE` | Severo | 15 | 21 | `#F44336` (rojo) |

---

## 12. Evaluaciones

**Base:** `/api/evaluation`
**Auth:** ✅ Bearer token

---

### 12.1 Iniciar evaluación

```
POST /api/evaluation/start
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "moduleID": 1,         // int, requerido
  "isAnonymous": false,  // bool — si la evaluación es anónima
  "period": "2026-02"    // string — período (formato YYYY-MM)
}
```

**Response:** El objeto `Evaluation` con el `evaluationID` para usarlo en las siguientes llamadas.

---

### 12.2 Enviar respuesta individual

```
POST /api/evaluation/respond
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "evaluationID": 1,   // int, requerido
  "questionID": 1,     // int, requerido
  "selectedValue": 2   // int — el numericValue de la opción elegida
}
```

---

### 12.3 Enviar múltiples respuestas de una vez

```
POST /api/evaluation/respond-multiple
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "evaluationID": 1,
  "responses": [
    { "questionID": 1, "selectedValue": 2 },
    { "questionID": 2, "selectedValue": 1 },
    { "questionID": 3, "selectedValue": 0 }
  ]
}
```

> 💡 Usar este endpoint en lugar de llamadas individuales para mejorar rendimiento.

---

### 12.4 Completar evaluación

```
POST /api/evaluation/{id}/complete
Auth: ✅ Cualquier rol
```

Sin body. Marca la evaluación como completada y genera el resultado.

---

### 12.5 Consultar evaluaciones

```
GET /api/evaluation/{id}                    → Evaluación por ID
GET /api/evaluation/{id}/details            → Con todas las respuestas
GET /api/evaluation/my-evaluations          → Mis evaluaciones (usuario autenticado)
GET /api/evaluation/my-completed            → Mis evaluaciones completadas
GET /api/evaluation/in-progress/{moduleId}  → Mi evaluación en curso de un módulo
GET /api/evaluation/user/{userId}           → Evaluaciones de un usuario (Admin/Psic.)
```

---

### 12.6 Resultados

```
GET /api/evaluation/results/{resultId}       → Resultado por ID
GET /api/evaluation/{id}/result              → Resultado de una evaluación
GET /api/evaluation/results/my-results       → Mis resultados
GET /api/evaluation/results/user/{userId}    → Resultados de un usuario (Admin/Psic.)
```

---

## 13. Alertas

**Base:** `/api/alert`
**Auth:** ✅ Bearer token

---

### 13.1 Consultar alertas

```
GET /api/alert                           → Todas (SuperAdmin, Psychologist, HRManager)
GET /api/alert/{id}                      → Por ID
GET /api/alert/status/{status}           → Por estado
GET /api/alert/company/{companyId}       → Por empresa
GET /api/alert/area/{areaId}             → Por área
GET /api/alert/severity/{severity}       → Por severidad
GET /api/alert/statistics                → Estadísticas generales
```

**Estados válidos:** `OPEN` · `ACKNOWLEDGED` · `IN_PROGRESS` · `RESOLVED` · `DISMISSED`

**Severidades válidas:** `LOW` · `MEDIUM` · `HIGH` · `CRITICAL`

---

### 13.2 Crear alerta

```
POST /api/alert
Roles: SuperAdmin, Psychologist, HRManager
```

**Body:**
```json
{
  "evaluationID": 1,
  "userID": 1,
  "severity": "HIGH",
  "alertType": "RISK",
  "description": "Puntuación de alto riesgo detectada"
}
```

---

### 13.3 Acusar recibo de alerta

```
PATCH /api/alert/{id}/acknowledge
Roles: Psychologist, HRManager, SuperAdmin
```

Sin body.

---

### 13.4 Resolver alerta

```
PATCH /api/alert/{id}/resolve
Roles: Psychologist, HRManager, SuperAdmin
```

**Body:**
```json
{
  "resolutionNotes": "Se vinculó al usuario al programa de bienestar."
}
```

---

## 14. Seguimiento de Casos

**Base:** `/api/casetracking`
**Auth:** ✅ Bearer token

---

### 14.1 Consultar casos

```
GET /api/casetracking/{id}                        → Por ID
GET /api/casetracking/alert/{alertId}             → Por alerta vinculada
GET /api/casetracking/number/{caseNumber}         → Por número de caso (ej: CASE-2026-0001)
GET /api/casetracking/user/{userId}               → Por usuario afectado
GET /api/casetracking/psychologist/{userId}       → Por psicólogo asignado
GET /api/casetracking/my-cases                    → Mis casos asignados (Psicólogo)
GET /api/casetracking/status/{status}             → Por estado
```

**Estados válidos:** `OPEN` · `IN_PROGRESS` · `CLOSED` · `ESCALATED`

---

### 14.2 Crear caso

```
POST /api/casetracking
Roles: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "alertID": 1,              // int, requerido
  "userID": 1,               // int, requerido — usuario afectado
  "assignedToUserID": 2,     // int, requerido — psicólogo asignado
  "priority": "HIGH",        // string — LOW, MEDIUM, HIGH, CRITICAL
  "description": "Caso derivado de alerta de riesgo moderado"
}
```

---

### 14.3 Actualizar caso

```
PUT /api/casetracking/{id}
Roles: SuperAdmin, Psychologist
```

**Body (todos opcionales):**
```json
{
  "status": "IN_PROGRESS",
  "assignedToUserID": 3,
  "priority": "MEDIUM"
}
```

---

### 14.4 Cerrar caso

```
PATCH /api/casetracking/{id}/close
Roles: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "closeReason": "Intervención exitosa. Usuario incorporado al programa de bienestar."
}
```

---

### 14.5 Agregar seguimiento

```
POST /api/casetracking/{id}/follow-ups
Roles: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "notes": "Primera sesión realizada. Estado general mejorado.",
  "followUpType": "SESSION",
  "scheduledDate": "2026-03-01T10:00:00"
}
```

---

## 15. Recomendaciones

**Base:** `/api/recommendation`
**Auth:** ✅ Bearer token

---

### 15.1 Consultar recomendaciones

```
GET /api/recommendation/by-result/{evaluationResultId}   → Por resultado de evaluación
GET /api/recommendation/active/{userId}                  → Recomendaciones activas de un usuario
```

---

### 15.2 Crear recomendación

```
POST /api/recommendation
Roles: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "evaluationResultID": 1,
  "recommendationTypeID": 1,
  "instrumentID": 1,
  "title": "Técnicas de respiración",
  "description": "Practicar respiración diafragmática 10 min al día",
  "priority": "HIGH",
  "resourceUrl": "https://recursos.emocheck.com/respiracion"
}
```

---

## 16. Recursos de Bienestar

**Base:** `/api/resource`
**Auth:** ✅ Bearer token

---

### 16.1 Consultar recursos

```
GET /api/resource/categories              → Todas las categorías
GET /api/resource/categories/{id}         → Categoría por ID
GET /api/resource                         → Todos los recursos
GET /api/resource/by-category/{id}        → Por categoría
GET /api/resource/recommended             → Recomendados para el usuario autenticado
GET /api/resource/{id}                    → Por ID
```

---

### 16.2 Crear recurso

```
POST /api/resource
Roles: SuperAdmin, Psychologist
```

**Body:**
```json
{
  "resourceCategoryID": 1,                            // int, requerido
  "title": "Meditación guiada anti-estrés",          // string, requerido
  "description": "Audio de 15 minutos",              // string, opcional
  "contentType": "AUDIO",                            // string — VIDEO, AUDIO, ARTICLE, PDF, LINK
  "contentUrl": "https://cdn.emocheck.com/med01.mp3", // string, requerido
  "moduleID": 1,                                     // int, opcional — módulo relacionado
  "targetRiskLevel": "HIGH",                         // string — LOW, MODERATE, HIGH, SEVERE
  "durationMinutes": 15,                             // int, opcional
  "tags": "meditacion,estres,mindfulness",           // string, opcional
  "displayOrder": 1                                  // int, opcional
}
```

---

### 16.3 Actualizar / Eliminar recurso

```
PUT    /api/resource/{id}    → Actualizar (SuperAdmin, Psychologist)
DELETE /api/resource/{id}    → Eliminar (SuperAdmin, Psychologist)
```

---

## 17. Solicitudes de Apoyo

**Base:** `/api/support`
**Auth:** ✅ Bearer token

---

### 17.1 Consultar solicitudes

```
GET /api/support/my-requests               → Mis solicitudes (Employee)
GET /api/support/{id}                      → Por ID
GET /api/support/user/{userId}             → Por usuario (Admin/Psic.)
GET /api/support/status/{status}           → Por estado
GET /api/support/assigned/{psychologistId} → Asignadas a un psicólogo
GET /api/support/my-assigned               → Mis solicitudes asignadas (Psychologist)
```

**Estados válidos:** `OPEN` · `IN_PROGRESS` · `RESOLVED` · `CANCELLED`

---

### 17.2 Crear solicitud

```
POST /api/support
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "requestType": "PSYCHOLOGICAL",   // string — PSYCHOLOGICAL, HR, TECHNICAL
  "subject": "Necesito apoyo",      // string, requerido
  "description": "He experimentado altos niveles de estrés", // string, requerido
  "priority": "MEDIUM",            // string — LOW, MEDIUM, HIGH, URGENT
  "evaluationID": 1                // int, opcional — evaluación relacionada
}
```

---

## 18. Consentimiento Informado

**Base:** `/api/consent`
**Auth:** ✅ Bearer token

> ⚠️ **Flujo obligatorio:** Al primer login, verificar si el usuario ya aceptó el consentimiento. Si no, mostrarlo y requerir aceptación antes de continuar.

---

### 18.1 Verificar consentimiento del usuario

```
GET /api/consent/check
Auth: ✅ Cualquier rol
```

**Response:**
```json
{
  "hasAccepted": false,
  "version": null
}
```

---

### 18.2 Obtener texto del consentimiento

```
GET /api/consent/latest
Auth: ✅ Cualquier rol
```

---

### 18.3 Aceptar consentimiento

```
POST /api/consent/accept
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "version": "1.0",
  "accepted": true,
  "consentText": "Acepto los términos del consentimiento informado para participar en el programa EmoCheck"
}
```

---

## 19. Dashboard

**Base:** `/api/dashboard`
**Auth:** ✅ SuperAdmin, Psychologist, HRManager

Todos los filtros de query son **opcionales**.

---

### 19.1 Indicadores principales

```
GET /api/dashboard/indicators
```

**Query params:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `CompanyID` | int | Filtrar por empresa |
| `SiteID` | int | Filtrar por sede |
| `AreaID` | int | Filtrar por área |
| `ModuleID` | int | Filtrar por módulo |
| `StartDate` | date | Fecha inicio (`2026-01-01`) |
| `EndDate` | date | Fecha fin (`2026-02-21`) |

**Ejemplo:**
```
GET /api/dashboard/indicators?CompanyID=1&StartDate=2026-01-01&EndDate=2026-02-21
```

---

### 19.2 Tendencias temporales

```
GET /api/dashboard/trends?periodType=monthly
```

| Parámetro | Valores | Default |
|-----------|---------|---------|
| `periodType` | `monthly`, `weekly`, `quarterly` | `monthly` |
| `CompanyID` | int | (todos) |

---

### 19.3 Otros endpoints del dashboard

```
GET /api/dashboard/risk-distribution?CompanyID=1      → Distribución de riesgo
GET /api/dashboard/module-statistics                   → Estadísticas por módulo
GET /api/dashboard/area-comparison?CompanyID=1         → Comparativa entre áreas
```

---

## 20. Exportación de Datos

**Base:** `/api/export`
**Auth:** ✅ Bearer token

---

### 20.1 Solicitar exportación

```
POST /api/export
Auth: ✅ Cualquier rol
```

**Body:**
```json
{
  "exportType": "EVALUATIONS",                         // EVALUATIONS, ALERTS, USERS, RESULTS, CASE_TRACKING
  "format": "XLSX",                                    // XLSX, CSV
  "filters": "{\"companyId\": 1, \"startDate\": \"2026-01-01\"}"  // JSON string de filtros
}
```

> ⚠️ La exportación es **asíncrona**. Primero crea la solicitud y luego consulta el estado hasta que esté lista para descargar.

---

### 20.2 Consultar y descargar

```
GET /api/export/my-exports            → Mis exportaciones solicitadas
GET /api/export/{id}                  → Estado de una exportación
GET /api/export/{id}/download         → Descargar el archivo (cuando Status = "COMPLETED")
```

**Flujo de exportación:**
```
[1] POST /api/export                 → obtener exportID
[2] GET  /api/export/{exportID}      → verificar status: PENDING → PROCESSING → COMPLETED
[3] GET  /api/export/{exportID}/download → descargar archivo cuando COMPLETED
```

---

## 21. Logs de Auditoría

**Base:** `/api/auditlog`
**Auth:** ✅ Solo `SuperAdmin`

```
GET /api/auditlog/user/{userId}?startDate=2026-01-01&endDate=2026-02-21
GET /api/auditlog/table/{tableName}?recordId=1
GET /api/auditlog/action/{action}
GET /api/auditlog/date-range?startDate=2026-01-01&endDate=2026-02-21
GET /api/auditlog?pageNumber=1&pageSize=50
```

**Acciones válidas:** `INSERT` · `UPDATE` · `DELETE`

**Ejemplo de tablas:** `Users`, `Companies`, `Evaluations`, `Alerts`, `CaseTracking`

---

## 22. Logs del Sistema

**Base:** `/api/systemlog`
**Auth:** ✅ Solo `SuperAdmin`

```
GET /api/systemlog/date-range?startDate=2026-02-01&endDate=2026-02-21
GET /api/systemlog/errors?since=2026-02-20T00:00:00
```

> El parámetro `since` es opcional. Si no se envía, devuelve los errores de las últimas 24 horas.

---

## 23. Manejo de errores

### Códigos HTTP más comunes

| Código | Significado | Acción recomendada |
|--------|-------------|-------------------|
| `200` | OK | Procesar respuesta |
| `201` | Created | Recurso creado — usar el objeto retornado |
| `400` | Bad Request | Mostrar errores de validación al usuario |
| `401` | Unauthorized | Token expirado → intentar refresh → si falla, redirigir a login |
| `403` | Forbidden | Usuario sin permisos → mostrar mensaje de acceso denegado |
| `404` | Not Found | Recurso no existe → mostrar mensaje adecuado |
| `409` | Conflict | Dato duplicado (email ya existe, etc.) |
| `500` | Server Error | Error interno → mostrar mensaje genérico, no detalles técnicos |

### Interceptor para manejo automático de errores

```typescript
// error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Token expirado: intentar refresh o redirigir a login
          localStorage.removeItem('token');
          router.navigate(['/login']);
          break;
        case 403:
          router.navigate(['/forbidden']);
          break;
        case 500:
          console.error('Error del servidor:', error.error);
          break;
      }
      return throwError(() => error);
    })
  );
};
```

---

## 24. Flujos completos paso a paso

### Flujo A — Primer ingreso de un usuario

```
1. POST /api/auth/login                    → Obtener token y guardarlo
2. GET  /api/consent/check                 → ¿Ya aceptó consentimiento?
   → Si NO: GET /api/consent/latest        → Mostrar texto del consentimiento
             POST /api/consent/accept      → Registrar aceptación
3. GET  /api/users/me                      → Cargar perfil del usuario autenticado
4. GET  /api/assessmentmodule/modules/active → Cargar módulos disponibles
```

---

### Flujo B — Realizar una evaluación completa

```
1. GET  /api/assessmentmodule/modules/active                    → Listar módulos
2. GET  /api/assessmentmodule/modules/{id}/full                 → Cargar módulo completo con preguntas y opciones
3. POST /api/evaluation/start                                   → Iniciar evaluación → obtener evaluationID
4. POST /api/evaluation/respond-multiple                        → Enviar todas las respuestas
5. POST /api/evaluation/{evaluationID}/complete                 → Completar evaluación
6. GET  /api/evaluation/{evaluationID}/result                   → Ver resultados
7. GET  /api/recommendation/by-result/{resultId}               → Ver recomendaciones
```

---

### Flujo C — Recuperar contraseña

```
1. POST /api/otp/generate        { email, purpose: "PASSWORD_RESET" }
2. POST /api/otp/validate        { email, otpCode, purpose }   → Verificar código
3. POST /api/otp/reset-password  { email, otpCode, newPassword, confirmNewPassword }
4. POST /api/auth/login          → Iniciar sesión con la nueva contraseña
```

---

### Flujo D — Administrador configura una nueva empresa (SuperAdmin)

```
1. GET  /api/catalog/countries/active              → Cargar países
2. GET  /api/catalog/states/by-country/{id}        → Cargar departamentos
3. GET  /api/catalog/cities/by-state/{id}          → Cargar ciudades
4. POST /api/company                               → Crear empresa
5. POST /api/company/sites                         → Crear sede(s)
6. POST /api/company/areas                         → Crear área(s)
7. POST /api/users                                 → Crear usuarios asignando company/site/area
```

---

### Flujo E — Gestión de alertas por psicólogo

```
1. GET  /api/alert/status/OPEN                         → Ver alertas pendientes
2. GET  /api/alert/{id}                                → Ver detalle de alerta
3. PATCH /api/alert/{id}/acknowledge                   → Acusar recibo
4. POST /api/casetracking                              → Crear caso vinculado a la alerta
5. POST /api/casetracking/{id}/follow-ups              → Agregar seguimiento de sesión
6. PATCH /api/alert/{id}/resolve                       → Marcar alerta resuelta
7. PATCH /api/casetracking/{id}/close                  → Cerrar el caso
```

---

### Flujo F — Dashboard de indicadores (HRManager)

```
1. GET /api/users/me                                    → Obtener companyID del usuario
2. GET /api/dashboard/indicators?CompanyID={id}         → Indicadores generales
3. GET /api/dashboard/risk-distribution?CompanyID={id}  → Distribución de riesgo
4. GET /api/dashboard/area-comparison?CompanyID={id}    → Comparar áreas
5. GET /api/dashboard/trends?CompanyID={id}&periodType=monthly  → Ver tendencias
```

---

*Documento generado automáticamente — EmoCheck API v5 · Febrero 2026*
