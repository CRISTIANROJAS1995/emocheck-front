# 🔌 GUÍA DE ENDPOINTS API - EMOCHECK

## Documentación para Desarrollador Frontend

**Versión:** 1.0
**Fecha:** Febrero 3, 2026
**Backend:** .NET 8 Web API
**Base URL:** `https://kratosconquer-001-site1.mtempurl.com/api` (ajustar según ambiente)

---

## 📋 TABLA DE CONTENIDOS

1. [Configuración Inicial](#configuración-inicial)
2. [Autenticación](#autenticación)
3. [Flujo Completo de Usuario](#flujo-completo-de-usuario)
4. [Panel de Administración](#panel-de-administración)
5. [Modelos de Datos (DTOs)](#modelos-de-datos-dtos)
6. [Códigos de Estado](#códigos-de-estado)
7. [Ejemplos de Implementación](#ejemplos-de-implementación)

---

## ⚙️ CONFIGURACIÓN INICIAL

### Variables de Entorno

```typescript
// environment.ts
export const environment = {
    production: false,
    apiUrl: 'https://localhost:7001/api',
    apiTimeout: 30000,
};
```

### Interceptor HTTP (Headers)

Todos los endpoints requieren estos headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {token}',  // Excepto login y registro
  'Accept': 'application/json'
}
```

### Formatos de Respuesta (IMPORTANTE)

La API no es 100% consistente en el “envelope” de respuesta. Según Swagger, existen dos patrones:

1. **ApiResponse<T>** (común en `auth`, `users`, `resources`, `support`, etc.)

```typescript
interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    errors?: string[];
}
```

2. **DTO directo / primitivo** (común en `evaluation`, `consent`, `recommendation`, etc.)

```json
{
    "evaluationID": 123,
    "assessmentModuleID": 1,
    "startedAt": "2026-02-03T11:00:00Z",
    "isCompleted": false
}
```

Además, Swagger expone múltiples content-types para algunos endpoints (`text/plain`, `application/json`, `text/json`). El frontend debe tolerar ambos.

---

## 🔐 AUTENTICACIÓN

### 1. Login

**Endpoint:** `POST /api/auth/login`
**Auth requerido:** ❌ No

**Request Body:**

```json
{
    "email": "usuario@empresa.com",
    "password": "Password123!"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Autenticación exitosa",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "refresh_token_string",
        "expiresIn": 3600,
        "user": {
            "userId": 123,
            "fullName": "Juan Pérez",
            "email": "usuario@empresa.com",
            "roles": ["Employee"]
        }
    }
}
```

**Errores comunes:**

- `401 Unauthorized`: Credenciales inválidas
- `400 Bad Request`: Email o password faltante

---

### 2. Recuperar Contraseña

**Endpoint:** `POST /api/auth/forgot-password`
**Auth requerido:** ❌ No

**Request Body:**

```json
{
    "email": "usuario@empresa.com"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Si el correo existe, recibirás un enlace para restablecer tu contraseña",
    "data": "Solicitud procesada"
}
```

---

### 3. Restablecer Contraseña

**Endpoint:** `POST /api/auth/reset-password`
**Auth requerido:** ❌ No

**Request Body:**

```json
{
    "token": "reset_token_from_email",
    "newPassword": "NewPassword123!"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Contraseña restablecida exitosamente",
    "data": null
}
```

---

### 4. Renovar Token (Refresh)

**Endpoint:** `POST /api/auth/refresh-token`
**Auth requerido:** ✅ Sí (Refresh Token)

**Request Body:**

```json
{
    "refreshToken": "current_refresh_token"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Token renovado",
    "data": {
        "token": "new_jwt_token",
        "refreshToken": "new_refresh_token",
        "expiresIn": 3600
    }
}
```

---

## 👤 FLUJO COMPLETO DE USUARIO

### PASO 1: REGISTRO Y CONSENTIMIENTO

#### 1.1 Registrar Usuario

**Endpoint:** `POST /api/users/register`
**Auth requerido:** ❌ No

**Request Body:**

```json
{
    "fullName": "María García",
    "documentNumber": "1234567890",
    "email": "maria.garcia@empresa.com",
    "password": "Password123!",
    "companyId": 1,
    "siteId": 2,
    "areaId": 3,
    "jobTypeId": 5
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
        "userId": 456,
        "fullName": "María García",
        "email": "maria.garcia@empresa.com",
        "creationDate": "2026-02-03T10:30:00Z"
    }
}
```

---

#### 1.2 Verificar Estado de Consentimiento

**Endpoint:** `GET /api/consent/has-accepted`
**Auth requerido:** ✅ Sí

**Response (200 OK):** boolean directo (según Swagger; puede venir como `text/plain`)

Ejemplos válidos:

```text
true
```

```json
false
```

**Uso en frontend:**

```typescript
// Si hasAccepted === false, mostrar modal de consentimiento
// Si hasAccepted === true, permitir acceso a evaluaciones
```

---

#### 1.3 Aceptar Consentimiento Informado

**Endpoint:** `POST /api/consent/accept`
**Auth requerido:** ✅ Sí

**Request Body:** `AcceptConsentDto`

```json
{
    "accepted": true,
    "consentVersion": "v1"
}
```

**Response (200 OK):** `InformedConsentDto` (DTO directo)

```json
{
    "informedConsentID": 789,
    "userID": 456,
    "accepted": true,
    "acceptedAt": "2026-02-03T10:35:00Z",
    "consentVersion": "v1",
    "documentPdfUrl": "https://..."
}
```

---

#### 1.4 Obtener Mi Consentimiento

**Endpoint:** `GET /api/consent/my-consent`
**Auth requerido:** ✅ Sí

**Response (200 OK):** `InformedConsentDto` (DTO directo; Swagger permite `text/plain`, `application/json`, `text/json`)

---

### PASO 2: COMPLETAR PERFIL

#### 2.1 Obtener Mi Perfil

**Endpoint:** `GET /api/users/{userId}`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Usuario obtenido",
    "data": {
        "userId": 456,
        "fullName": "María García",
        "documentNumber": "1234567890",
        "email": "maria.garcia@empresa.com",
        "companyId": 1,
        "companyName": "Empresa ABC S.A.",
        "siteId": 2,
        "siteName": "Sede Bogotá",
        "areaId": 3,
        "areaName": "Recursos Humanos",
        "jobTypeId": 5,
        "jobTypeName": "Analista",
        "stateId": 1,
        "stateName": "Activo",
        "creationDate": "2026-02-03T10:30:00Z"
    }
}
```

---

#### 2.2 Actualizar Mi Perfil

**Endpoint:** `PUT /api/users/{userId}`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "fullName": "María García Pérez",
    "documentNumber": "1234567890",
    "email": "maria.garcia@empresa.com",
    "siteId": 3,
    "areaId": 4,
    "jobTypeId": 6
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Usuario actualizado exitosamente",
    "data": {
        "userId": 456,
        "fullName": "María García Pérez"
        // ... otros campos actualizados
    }
}
```

---

### PASO 3: REALIZAR EVALUACIÓN

#### 3.1 Listar Módulos de Evaluación Disponibles

**Endpoint:** `GET /api/assessmentmodule/active`
**Auth requerido:** ✅ Sí

**Response (200 OK):** DTO directo `AssessmentModuleDto[]`

---

#### 3.2 Obtener Detalles de un Módulo (con preguntas)

**Endpoint:** `GET /api/assessmentmodule/{id}/with-questions`
**Auth requerido:** ✅ Sí

**Response (200 OK):** DTO directo `AssessmentModuleWithQuestionsDto`

---

#### 3.3 Iniciar una Evaluación

**Endpoint:** `POST /api/evaluation/start`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "assessmentModuleID": 1
}
```

**Response (200 OK):** DTO directo `EvaluationDto`

**Nota importante:** Antes de iniciar, el backend valida que el usuario haya aceptado el consentimiento informado.

---

#### 3.4 Enviar Respuesta a una Pregunta

**Endpoint:** `POST /api/evaluation/submit-response`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "evaluationID": 5001,
    "questionID": 101,
    "questionOptionID": 1002,
    "responseValue": "1"
}
```

**Response (200 OK):** DTO directo `EvaluationResponseDto`

**Lógica en frontend:**

```typescript
// Repetir este endpoint por cada pregunta respondida
// Mostrar barra de progreso: (respuestasEnviadas / totalPreguntas) * 100
```

---

#### 3.5 Completar Evaluación (Finalizar)

**Endpoint:** `POST /api/evaluation/{evaluationId}/complete`
**Auth requerido:** ✅ Sí

**Request Body:** _(no lleva body; solo path param)_

**Response (200 OK):** DTO directo `EvaluationResultDto`

**Lógica en frontend:**

```typescript
// Al completar, redirigir automáticamente a la página de resultados
// Si necesitas recomendaciones por resultado: GET /api/recommendation/by-result/{evaluationResultId}
```

---

### PASO 4: VER RESULTADOS

#### 4.1 Resultado de Evaluación

Según Swagger v1, el resultado se obtiene al completar la evaluación:

- `POST /api/evaluation/{evaluationId}/complete` → retorna `EvaluationResultDto`

Para re-hidratar resultados completados (por ejemplo si faltan dimensiones/recomendaciones en cache local):

- `GET /api/evaluation/my-completed-evaluations` → `EvaluationWithResultDto[]`

**Semaforización:**

- 🟢 **Green** → "Bienestar Adecuado" → `#4CAF50`
- 🟡 **Yellow** → "Atención Preventiva" → `#FFC107`
- 🔴 **Red** → "Requiere Intervención" → `#F44336`

---

#### 4.2 Dimensiones y Recomendaciones

En `EvaluationResultDto`, los campos `dimensionScores` y `recommendations` son **nullable** en Swagger. Es decir:

- Si el backend los calcula/genera, vendrán poblados.
- Si no, pueden venir `null` o `[]` y el frontend debe mostrar un estado explícito (sin inventar datos).

---

#### 4.3 Obtener Historial de Mis Evaluaciones

**Endpoint:** `GET /api/evaluation/my-evaluations`
**Auth requerido:** ✅ Sí

**Query Params:**

- `moduleId` (opcional): Filtrar por módulo
- `status` (opcional): "Completed", "InProgress", "Abandoned"
- `startDate` (opcional): Formato ISO 8601
- `endDate` (opcional): Formato ISO 8601

**Response (200 OK):** DTO directo `EvaluationDto[]` (según Swagger; algunos endpoints del backend usan `ApiResponse<T>`, pero este endpoint en Swagger retorna array directo)

---

### PASO 5: RECOMENDACIONES PERSONALIZADAS

#### 5.1 Obtener Mis Recomendaciones

**Endpoint:** `GET /api/recommendation/my-unviewed`
**Auth requerido:** ✅ Sí

**Response (200 OK):** DTO directo `RecommendationDto[]`

---

#### 5.2 Obtener Recomendaciones por Resultado Específico

**Endpoint:** `GET /api/recommendation/by-result/{evaluationResultId}`
**Auth requerido:** ✅ Sí

**Response:** Similar al anterior, pero filtrado por resultado específico.

---

#### 5.3 Marcar Recomendación como Leída

**Endpoint:** `PUT /api/recommendation/{id}/mark-viewed`
**Auth requerido:** ✅ Sí

**Response (200 OK):** _(sin body; 200 OK)_

---

### PASO 6: CENTRO DE RECURSOS DE BIENESTAR

#### 6.1 Obtener Categorías de Recursos

**Endpoint:** `GET /api/resources/categories`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Categorías obtenidas",
    "data": [
        {
            "resourceCategoryId": 1,
            "categoryName": "Manejo del Estrés",
            "description": "Técnicas y herramientas para gestionar el estrés laboral",
            "iconUrl": "/assets/categories/stress.svg",
            "resourceCount": 15,
            "isActive": true
        },
        {
            "resourceCategoryId": 2,
            "categoryName": "Mindfulness",
            "description": "Ejercicios de atención plena y meditación",
            "iconUrl": "/assets/categories/mindfulness.svg",
            "resourceCount": 22,
            "isActive": true
        },
        {
            "resourceCategoryId": 3,
            "categoryName": "Pausas Activas",
            "description": "Ejercicios físicos para realizar en el trabajo",
            "iconUrl": "/assets/categories/active-breaks.svg",
            "resourceCount": 18,
            "isActive": true
        }
    ]
}
```

---

#### 6.2 Obtener Recursos de Bienestar

**Endpoint:** `GET /api/resources`
**Auth requerido:** ✅ Sí

**Query Params:**

- `categoryId` (opcional): Filtrar por categoría
- `resourceType` (opcional): "Video", "Article", "Audio", "Exercise", "PDF"
- `targetAudience` (opcional): "Green", "Yellow", "Red", "All"
- `isFeatured` (opcional): true/false

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Recursos obtenidos",
    "data": [
        {
            "wellnessResourceId": 101,
            "resourceCategoryId": 2,
            "categoryName": "Mindfulness",
            "title": "Meditación guiada de 5 minutos",
            "description": "Una breve sesión de meditación perfecta para tu descanso",
            "resourceType": "Video",
            "contentUrl": "https://cdn.emocheck.com/videos/meditation-5min.mp4",
            "thumbnailUrl": "https://cdn.emocheck.com/thumbs/meditation-5min.jpg",
            "author": "Dr. Carlos Mendoza",
            "durationMinutes": 5,
            "tags": "meditación, relajación, mindfulness",
            "targetAudience": "All",
            "viewCount": 1250,
            "rating": 4.8,
            "isFeatured": true,
            "createdAt": "2026-01-10T00:00:00Z"
        },
        {
            "wellnessResourceId": 102,
            "resourceCategoryId": 3,
            "categoryName": "Pausas Activas",
            "title": "Ejercicios de estiramiento para oficina",
            "description": "Rutina de 3 minutos para aliviar tensión muscular",
            "resourceType": "Video",
            "contentUrl": "https://cdn.emocheck.com/videos/stretching.mp4",
            "thumbnailUrl": "https://cdn.emocheck.com/thumbs/stretching.jpg",
            "author": "Lic. Ana Ruiz",
            "durationMinutes": 3,
            "tags": "estiramiento, pausas activas, ergonomía",
            "targetAudience": "All",
            "viewCount": 980,
            "rating": 4.5,
            "isFeatured": false,
            "createdAt": "2026-01-20T00:00:00Z"
        }
    ]
}
```

---

#### 6.3 Obtener Recursos por Categoría

**Endpoint:** `GET /api/resources/category/{categoryId}`
**Auth requerido:** ✅ Sí

**Response:** Similar al anterior, filtrado por categoría.

---

#### 6.4 Obtener Recursos Destacados

**Endpoint:** `GET /api/resources/featured`
**Auth requerido:** ✅ Sí

**Response:** Lista de recursos donde `isFeatured = true`.

---

#### 6.5 Obtener Recursos Recomendados (según mi riesgo)

**Endpoint:** `GET /api/resources/recommended`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Recursos recomendados obtenidos",
    "data": {
        "userRiskLevel": "Yellow",
        "recommendationReason": "Basado en tu última evaluación (Atención Preventiva)",
        "resources": [
            {
                "wellnessResourceId": 105,
                "title": "Técnicas de manejo de ansiedad",
                "description": "Aprende estrategias efectivas para controlar la ansiedad",
                "resourceType": "Article",
                "contentUrl": "https://cdn.emocheck.com/articles/anxiety-management.pdf",
                "durationMinutes": 10,
                "targetAudience": "Yellow"
            }
            // ... más recursos específicos para nivel Yellow
        ]
    }
}
```

---

#### 6.6 Registrar Acceso a un Recurso (Analytics)

**Endpoint:** `POST /api/resources/{resourceId}/track-access`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "durationSeconds": 180,
    "completedPercentage": 100,
    "rating": 5,
    "feedback": "Muy útil, me ayudó a relajarme"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Acceso registrado",
    "data": {
        "userResourceAccessId": 5001,
        "accessedAt": "2026-02-03T12:00:00Z"
    }
}
```

**Uso en frontend:**

```typescript
// Llamar este endpoint cuando:
// - El usuario termine de ver un video
// - El usuario descargue un PDF
// - El usuario complete un ejercicio
// Esto ayuda a mejorar recomendaciones futuras
```

---

#### 6.7 Obtener Profesionales de Apoyo

**Endpoint:** `GET /api/support/professionals`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Profesionales obtenidos",
    "data": [
        {
            "professionalSupportID": 10,
            "professionalType": "Psychologist",
            "name": "Dra. Laura Martínez",
            "specialty": "Estrés Laboral",
            "phone": "+57 300 1234567",
            "email": "laura.martinez@emocheck.com",
            "address": null,
            "website": null,
            "availableHours": "Lun-Vie 09:00-17:00",
            "isEmergency": false,
            "is24Hours": false,
            "languages": "es"
        }
    ]
}
```

---

#### 6.8 Obtener Contactos de Emergencia

**Endpoint:** `GET /api/support/professionals/emergency`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Contactos de emergencia obtenidos",
    "data": [
        {
            "professionalSupportID": 15,
            "professionalType": "Emergency",
            "name": "Línea de emergencia",
            "specialty": null,
            "phone": "+57 300 9876543",
            "email": "emergencias@emocheck.com",
            "address": null,
            "website": null,
            "availableHours": null,
            "isEmergency": true,
            "is24Hours": true,
            "languages": "es"
        }
    ]
}
```

---

#### 6.9 Crear Solicitud de Apoyo Psicológico

**Endpoint:** `POST /api/support/requests`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "evaluationResultID": 2001,
    "requestType": "Consultation",
    "urgencyLevel": "Medium",
    "subject": "Necesito ayuda con manejo de estrés",
    "description": "He estado sintiendo mucha presión en el trabajo y me gustaría hablar con un profesional",
    "preferredContactMethod": "VideoCall",
    "preferredSchedule": "Lunes o Miércoles por la tarde"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Solicitud creada exitosamente. Un profesional te contactará pronto.",
    "data": {
        "supportRequestID": 8001,
        "userID": 456,
        "userFullName": "María García",
        "assignedToPsychologistID": null,
        "psychologistName": null,
        "requestType": "Consultation",
        "urgencyLevel": "Medium",
        "status": "Pending",
        "subject": "Necesito ayuda con manejo de estrés",
        "description": "He estado sintiendo mucha presión en el trabajo y me gustaría hablar con un profesional",
        "preferredContactMethod": "VideoCall",
        "preferredSchedule": "Lunes o Miércoles por la tarde",
        "requestedAt": "2026-02-03T12:30:00Z",
        "assignedAt": null,
        "completedAt": null,
        "resolution": null,
        "satisfactionRating": null
    }
}
```

---

#### 6.10 Obtener Mis Solicitudes de Apoyo

**Endpoint:** `GET /api/support/requests/my`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Solicitudes obtenidas",
    "data": [
        {
            "supportRequestID": 8001,
            "userID": 456,
            "userFullName": "María García",
            "assignedToPsychologistID": 10,
            "psychologistName": "Dra. Laura Martínez",
            "requestType": "Consultation",
            "urgencyLevel": "Medium",
            "status": "Assigned",
            "subject": "Necesito ayuda con manejo de estrés",
            "description": "He estado sintiendo mucha presión en el trabajo y me gustaría hablar con un profesional",
            "preferredContactMethod": "VideoCall",
            "preferredSchedule": "Lunes o Miércoles por la tarde",
            "requestedAt": "2026-02-03T12:30:00Z",
            "assignedAt": "2026-02-03T14:00:00Z",
            "completedAt": null,
            "resolution": null,
            "satisfactionRating": null
        }
    ]
}
```

---

## 🔐 PANEL DE ADMINISTRACIÓN

### GESTIÓN DE USUARIOS

#### Admin 1. Listar Todos los Usuarios

**Endpoint:** `GET /api/users`
**Auth requerido:** ✅ Sí (Admin)
**Rol requerido:** `Admin` o `CompanyAdmin`

**Query Params:**

- `companyId` (opcional): Filtrar por empresa
- `siteId` (opcional): Filtrar por sede
- `areaId` (opcional): Filtrar por área
- `stateId` (opcional): Filtrar por estado
- `search` (opcional): Buscar por nombre o email

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Usuarios obtenidos",
    "data": [
        {
            "userId": 456,
            "fullName": "María García",
            "email": "maria.garcia@empresa.com",
            "documentNumber": "1234567890",
            "companyName": "Empresa ABC S.A.",
            "siteName": "Sede Bogotá",
            "areaName": "Recursos Humanos",
            "jobTypeName": "Analista",
            "stateName": "Activo",
            "roles": ["Employee"],
            "creationDate": "2026-02-03T10:30:00Z",
            "lastEvaluationDate": "2026-02-03T11:10:00Z",
            "evaluationsCompleted": 3,
            "lastRiskLevel": "Yellow"
        }
        // ... más usuarios
    ]
}
```

---

#### Admin 2. Crear Usuario (Admin)

**Endpoint:** `POST /api/users`
**Auth requerido:** ✅ Sí (Admin)

**Request Body:**

```json
{
    "fullName": "Pedro López",
    "documentNumber": "9876543210",
    "email": "pedro.lopez@empresa.com",
    "password": "TempPassword123!",
    "companyId": 1,
    "siteId": 2,
    "areaId": 3,
    "jobTypeId": 5,
    "roles": ["Employee"]
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Usuario creado exitosamente",
    "data": {
        "userId": 789,
        "fullName": "Pedro López",
        "email": "pedro.lopez@empresa.com",
        "temporaryPassword": "TempPassword123!",
        "mustChangePassword": true
    }
}
```

---

#### Admin 3. Eliminar Usuario

**Endpoint:** `DELETE /api/users/{userId}`
**Auth requerido:** ✅ Sí (Admin)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Usuario eliminado exitosamente",
    "data": null
}
```

---

### MONITOREO DE RESULTADOS (DASHBOARD)

#### Dashboard 1. Obtener Indicadores Principales (KPIs)

**Endpoint:** `GET /api/dashboard/indicators`
**Auth requerido:** ✅ Sí (Psychologist, Admin)
**Rol requerido:** `Psychologist`, `HSE`, `Admin`

**Query Params:**

- `companyId` (opcional)
- `siteId` (opcional)
- `areaId` (opcional)
- `startDate` (opcional): ISO 8601
- `endDate` (opcional): ISO 8601

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Indicadores obtenidos",
    "data": {
        "totalUsers": 250,
        "activeUsers": 240,
        "totalEvaluations": 450,
        "completedEvaluations": 420,
        "participationRate": 93.3,
        "averageCompletionTime": 12.5,
        "riskDistribution": {
            "green": {
                "count": 175,
                "percentage": 70.0
            },
            "yellow": {
                "count": 50,
                "percentage": 20.0
            },
            "red": {
                "count": 25,
                "percentage": 10.0
            }
        },
        "pendingAlerts": 5,
        "attendedAlerts": 20,
        "openCases": 8,
        "closedCases": 12,
        "period": {
            "startDate": "2026-01-01T00:00:00Z",
            "endDate": "2026-02-03T23:59:59Z"
        }
    }
}
```

**Uso en frontend:**

```typescript
// Mostrar en cards:
// - Total usuarios
// - Tasa de participación (gauge chart)
// - Distribución de riesgo (pie/donut chart)
// - Alertas pendientes (badge con número)
```

---

#### Dashboard 2. Distribución de Riesgo

**Endpoint:** `GET /api/dashboard/risk-distribution`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Query Params:** Mismos que Dashboard 1

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Distribución obtenida",
    "data": {
        "byArea": [
            {
                "areaId": 3,
                "areaName": "Recursos Humanos",
                "totalUsers": 30,
                "green": 21,
                "yellow": 6,
                "red": 3,
                "greenPercentage": 70.0,
                "yellowPercentage": 20.0,
                "redPercentage": 10.0
            },
            {
                "areaId": 5,
                "areaName": "Producción",
                "totalUsers": 50,
                "green": 30,
                "yellow": 15,
                "red": 5,
                "greenPercentage": 60.0,
                "yellowPercentage": 30.0,
                "redPercentage": 10.0
            }
        ],
        "bySite": [
            // Similar estructura
        ],
        "byModule": [
            {
                "moduleId": 1,
                "moduleName": "Salud Mental (PHQ-9)",
                "totalEvaluations": 200,
                "green": 140,
                "yellow": 40,
                "red": 20
            }
        ]
    }
}
```

**Uso en frontend:**

```typescript
// Gráfico de barras agrupadas por área
// Cada barra dividida en 3 colores (verde, amarillo, rojo)
```

---

#### Dashboard 3. Tendencias

**Endpoint:** `GET /api/dashboard/trends`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Query Params:**

- `companyId` (opcional)
- `moduleId` (opcional)
- `startDate` (requerido)
- `endDate` (requerido)
- `groupBy` (opcional): "day", "week", "month" (default: "week")

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Tendencias obtenidas",
    "data": {
        "period": "week",
        "trends": [
            {
                "date": "2026-01-06",
                "weekNumber": 1,
                "totalEvaluations": 45,
                "green": 32,
                "yellow": 10,
                "red": 3,
                "averageScore": 8.5,
                "participationRate": 90.0
            },
            {
                "date": "2026-01-13",
                "weekNumber": 2,
                "totalEvaluations": 50,
                "green": 35,
                "yellow": 12,
                "red": 3,
                "averageScore": 9.2,
                "participationRate": 100.0
            },
            {
                "date": "2026-01-20",
                "weekNumber": 3,
                "totalEvaluations": 48,
                "green": 30,
                "yellow": 13,
                "red": 5,
                "averageScore": 10.1,
                "participationRate": 96.0
            }
        ]
    }
}
```

**Uso en frontend:**

```typescript
// Gráfico de líneas con 3 series:
// - Verde (línea verde)
// - Amarillo (línea amarilla)
// - Rojo (línea roja)
// Eje X: Semanas
// Eje Y: Cantidad de evaluaciones
```

---

#### Dashboard 4. Comparativos entre Áreas

**Endpoint:** `GET /api/dashboard/comparisons`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Query Params:**

- `companyId` (opcional)
- `moduleId` (opcional)
- `startDate` (opcional)
- `endDate` (opcional)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Comparativos obtenidos",
    "data": {
        "areas": [
            {
                "areaId": 3,
                "areaName": "Recursos Humanos",
                "averageScore": 8.5,
                "riskLevel": "Green",
                "participationRate": 95.0,
                "totalUsers": 30,
                "evaluationsCompleted": 28
            },
            {
                "areaId": 5,
                "areaName": "Producción",
                "averageScore": 12.3,
                "riskLevel": "Yellow",
                "participationRate": 88.0,
                "totalUsers": 50,
                "evaluationsCompleted": 44
            },
            {
                "areaId": 7,
                "areaName": "Ventas",
                "averageScore": 15.8,
                "riskLevel": "Red",
                "participationRate": 92.0,
                "totalUsers": 40,
                "evaluationsCompleted": 37
            }
        ],
        "recommendation": "El área de Ventas requiere intervención inmediata debido a altos niveles de riesgo."
    }
}
```

---

### ALERTAS CRÍTICAS

#### Alertas 1. Listar Todas las Alertas

**Endpoint:** `GET /api/alerts`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Query Params:**

- `status` (opcional): "Pending", "Attended"
- `alertLevel` (opcional): "Critical", "High", "Medium"
- `startDate` (opcional)
- `endDate` (opcional)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Alertas obtenidas",
    "data": [
        {
            "alertId": 301,
            "userId": 456,
            "userInitials": "M.G.",
            "userIdAnonymized": "USR-456",
            "evaluationResultId": 2001,
            "alertLevel": "High",
            "alertType": "MentalHealth",
            "description": "Resultado en ROJO en módulo de Salud Mental",
            "isAttended": false,
            "attendedByUserId": null,
            "attendedByUserName": null,
            "attendedAt": null,
            "actionTaken": null,
            "notes": null,
            "createdAt": "2026-02-03T11:10:00Z",
            "urgencyDays": 0,
            "priorityScore": 95
        }
    ]
}
```

**Nota de confidencialidad:** El sistema NO devuelve nombres completos, solo iniciales o ID anonimizado.

---

#### Alertas 2. Obtener Alertas Pendientes

**Endpoint:** `GET /api/alerts/pending`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Response:** Similar al anterior, filtrado por `isAttended = false`.

---

#### Alertas 3. Obtener Alertas Críticas

**Endpoint:** `GET /api/alerts/critical`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Response:** Similar al anterior, filtrado por `alertLevel = "Critical"`.

---

#### Alertas 4. Atender una Alerta

**Endpoint:** `POST /api/alerts/{alertId}/attend`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Request Body:**

```json
{
    "actionTaken": "Se contactó al usuario vía telefónica. Se programó cita con psicólogo para el 5 de febrero.",
    "notes": "Usuario mostró disposición a recibir apoyo. Se activó protocolo de seguimiento."
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Alerta atendida exitosamente",
    "data": {
        "alertId": 301,
        "isAttended": true,
        "attendedByUserId": 10,
        "attendedByUserName": "Dr. Roberto García",
        "attendedAt": "2026-02-03T15:30:00Z",
        "actionTaken": "Se contactó al usuario vía telefónica...",
        "notes": "Usuario mostró disposición..."
    }
}
```

---

#### Alertas 5. Actualizar Seguimiento de Alerta

**Endpoint:** `PUT /api/alerts/{alertId}/update`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Request Body:**

```json
{
    "actionTaken": "Segunda sesión realizada. Usuario reporta mejoría en estado de ánimo.",
    "notes": "Continuar seguimiento semanal por 2 semanas más."
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Alerta actualizada",
    "data": {
        "alertId": 301,
        "updatedAt": "2026-02-10T16:00:00Z"
    }
}
```

---

### SEGUIMIENTO DE CASOS

#### Casos 1. Listar Casos de Seguimiento

**Endpoint:** `GET /api/case-tracking`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Query Params:**

- `status` (opcional): "Open", "InProgress", "Resolved", "Closed"
- `priority` (opcional): "Low", "Medium", "High", "Critical"
- `psychologistId` (opcional)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Casos obtenidos",
    "data": [
        {
            "caseTrackingId": 501,
            "alertId": 301,
            "userId": 456,
            "userInitials": "M.G.",
            "assignedToPsychologistId": 10,
            "assignedToPsychologistName": "Dr. Roberto García",
            "caseNumber": "CASE-2026-001",
            "status": "InProgress",
            "priority": "High",
            "initialAssessment": "Usuario presenta síntomas moderados de depresión...",
            "interventionPlan": "Plan de 6 sesiones de terapia cognitivo-conductual...",
            "progressNotes": "Sesión 1: Usuario participativo...",
            "finalOutcome": null,
            "openedAt": "2026-02-03T15:30:00Z",
            "closedAt": null,
            "nextFollowUpDate": "2026-02-10T10:00:00Z",
            "followUpCount": 1,
            "requiresExternalReferral": false,
            "externalReferralDetails": null,
            "createdAt": "2026-02-03T15:30:00Z",
            "updatedAt": "2026-02-03T15:30:00Z"
        }
    ]
}
```

---

#### Casos 2. Crear Caso de Seguimiento

**Endpoint:** `POST /api/case-tracking`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Request Body:**

```json
{
    "alertId": 301,
    "userId": 456,
    "assignedToPsychologistId": 10,
    "priority": "High",
    "initialAssessment": "Usuario presenta síntomas moderados de depresión según PHQ-9. Puntaje de 12/27.",
    "interventionPlan": "Plan de 6 sesiones de terapia cognitivo-conductual. Frecuencia semanal.",
    "nextFollowUpDate": "2026-02-10T10:00:00Z"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Caso creado exitosamente",
    "data": {
        "caseTrackingId": 501,
        "caseNumber": "CASE-2026-001",
        "status": "Open",
        "openedAt": "2026-02-03T15:30:00Z"
    }
}
```

---

#### Casos 3. Actualizar Caso

**Endpoint:** `PUT /api/case-tracking/{caseId}`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Request Body:**

```json
{
    "status": "InProgress",
    "progressNotes": "Sesión 2 completada. Usuario reporta mejoría en patrón de sueño. Aplicadas técnicas de reestructuración cognitiva.",
    "nextFollowUpDate": "2026-02-17T10:00:00Z",
    "requiresExternalReferral": false
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Caso actualizado",
    "data": {
        "caseTrackingId": 501,
        "status": "InProgress",
        "followUpCount": 2,
        "updatedAt": "2026-02-10T11:00:00Z"
    }
}
```

---

#### Casos 4. Cerrar Caso

**Endpoint:** `PUT /api/case-tracking/{caseId}/close`
**Auth requerido:** ✅ Sí (Psychologist, Admin)

**Request Body:**

```json
{
    "finalOutcome": "Usuario completó exitosamente 6 sesiones de terapia. Mejoría significativa en puntaje PHQ-9 (de 12 a 4). Usuario reporta estrategias adquiridas y compromiso con seguimiento preventivo mensual.",
    "requiresExternalReferral": false,
    "externalReferralDetails": null
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Caso cerrado exitosamente",
    "data": {
        "caseTrackingId": 501,
        "status": "Closed",
        "closedAt": "2026-03-15T16:00:00Z",
        "totalFollowUps": 6,
        "durationDays": 40
    }
}
```

---

### GESTIÓN DE CONSENTIMIENTOS

Según Swagger v1, los únicos endpoints disponibles para Consentimiento son:

#### Consent 1. Obtener Mi Consentimiento

**Endpoint:** `GET /api/consent/my-consent`
**Auth requerido:** ✅ Sí

**Response (200 OK):** DTO directo `InformedConsentDto` (puede venir como `text/plain` o JSON)

---

#### Consent 2. Verificar Si Ya Acepté

**Endpoint:** `GET /api/consent/has-accepted`
**Auth requerido:** ✅ Sí

**Response (200 OK):** boolean crudo (puede venir como `text/plain` o JSON)

---

#### Consent 3. Aceptar Consentimiento

**Endpoint:** `POST /api/consent/accept`
**Auth requerido:** ✅ Sí

**Request Body:** `AcceptConsentDto`

```json
{
    "accepted": true,
    "consentVersion": "1.0"
}
```

**Response (200 OK):** DTO directo `InformedConsentDto`

> Nota: En Swagger v1 NO existen endpoints tipo `GET /api/consent/history` ni `GET /api/consent/by-user/{userId}`. No documentar/implementar rutas admin “fantasma”.

---

### REPORTES Y EXPORTACIONES

#### Export 1. Solicitar Exportación de Datos

**Endpoint:** `POST /api/export/request`
**Auth requerido:** ✅ Sí

**Request Body:**

```json
{
    "exportType": "Full",
    "fileFormat": "JSON",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-02-03T23:59:59Z",
    "reason": "Solicitud de datos personales (GDPR)"
}
```

**Valores válidos:**

- **exportType:** "Full", "Partial", "EvaluationsOnly", "PersonalDataOnly"
- **fileFormat:** "JSON", "CSV", "PDF"

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Exportación solicitada. Recibirás un email cuando esté lista.",
    "data": {
        "dataExportId": 1001,
        "exportType": "Full",
        "fileFormat": "JSON",
        "status": "Pending",
        "estimatedCompletionTime": "5-10 minutos",
        "requestedAt": "2026-02-03T16:00:00Z"
    }
}
```

---

#### Export 2. Obtener Mis Exportaciones

**Endpoint:** `GET /api/export/my`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Exportaciones obtenidas",
    "data": [
        {
            "dataExportId": 1001,
            "exportType": "Full",
            "fileFormat": "JSON",
            "status": "Completed",
            "fileSize": 2048000,
            "fileSizeFormatted": "2.0 MB",
            "requestedAt": "2026-02-03T16:00:00Z",
            "completedAt": "2026-02-03T16:05:30Z",
            "expiresAt": "2026-02-10T16:05:30Z",
            "downloadUrl": "/api/export/1001/download"
        }
    ]
}
```

**Estados posibles:**

- `Pending` → Procesando
- `Processing` → En proceso
- `Completed` → Listo para descargar
- `Failed` → Error en generación

---

#### Export 3. Descargar Exportación

**Endpoint:** `GET /api/export/{exportId}/download`
**Auth requerido:** ✅ Sí

**Response (200 OK):**

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="export_1001_20260203.json"

[Binary file content]
```

**Uso en frontend:**

```typescript
// Descargar como archivo
window.location.href = `${apiUrl}/export/${exportId}/download`;
// O usar FileSaver.js para mejor UX
```

---

## 📦 MODELOS DE DATOS (DTOs)

Nota: Esta sección describe los **schemas del backend** tal como aparecen en Swagger.
En el frontend puedes mapear estos campos a modelos camelCase si lo prefieres.

### LoginDto

```typescript
interface LoginDto {
    email: string;
    password: string;
}
```

### RegisterUserDto

```typescript
interface RegisterUserDto {
    fullName: string;
    documentNumber: string;
    email: string;
    password: string;
    companyId: number;
    siteId?: number;
    areaId?: number;
    jobTypeId?: number;
}
```

### UserDto

```typescript
interface UserDto {
    userId: number;
    fullName: string;
    documentNumber: string;
    email: string;
    companyId?: number;
    companyName?: string;
    siteId?: number;
    siteName?: string;
    areaId?: number;
    areaName?: string;
    jobTypeId?: number;
    jobTypeName?: string;
    stateId: number;
    stateName: string;
    roles: string[];
    creationDate: string;
    lastUpdateDate?: string;
}
```

### ConsentDto

```typescript
interface AcceptConsentDto {
    accepted: boolean;
    consentVersion?: string | null;
}

interface InformedConsentDto {
    informedConsentID: number;
    userID: number;
    accepted: boolean;
    acceptedAt: string; // date-time
    consentVersion?: string | null;
    documentPdfUrl?: string | null;
}
```

### AssessmentModuleDto

```typescript
interface AssessmentModuleDto {
    assessmentModuleID: number;
    moduleName?: string | null;
    description?: string | null;
    instrumentType?: string | null;
    maxScore: number;
    greenThreshold: number;
    yellowThreshold: number;
    orderIndex: number;
    isActive: boolean;
}

interface QuestionDto {
    questionID: number;
    assessmentModuleID: number;
    questionText?: string | null;
    orderIndex: number;
    responseType?: string | null;
    isRequired: boolean;
    options?: QuestionOptionDto[] | null;
}

interface QuestionOptionDto {
    questionOptionID: number;
    questionID: number;
    optionText?: string | null;
    optionValue: number;
    orderIndex: number;
}
```

### EvaluationDto

```typescript
interface StartEvaluationDto {
    assessmentModuleID: number;
}

interface EvaluationDto {
    evaluationID: number;
    userID: number;
    assessmentModuleID: number;
    assessmentModuleName?: string | null;
    startedAt: string; // date-time
    completedAt?: string | null; // date-time
    status?: string | null;
    isCompleted: boolean;
}

interface SubmitResponseDto {
    evaluationID: number;
    questionID: number;
    questionOptionID?: number | null;
    responseValue?: string | null;
}
```

### EvaluationResultDto

```typescript
interface EvaluationResultDto {
    evaluationResultID: number;
    evaluationID: number;
    totalScore: number;
    riskLevel?: string | null;
    scorePercentage: number;
    interpretation?: string | null;
    calculatedAt: string; // date-time
    dimensionScores?: DimensionScoreDto[] | null;
    recommendations?: RecommendationDto[] | null;
}

interface DimensionScoreDto {
    dimensionScoreID: number;
    dimensionName?: string | null;
    score: number;
    maxScore: number;
    riskLevel?: string | null;
}
```

### RecommendationDto

```typescript
interface RecommendationDto {
    recommendationID: number;
    typeName?: string | null;
    title?: string | null;
    recommendationText?: string | null;
    priority?: string | null;
    resourceUrl?: string | null;
    isViewed: boolean;
}
```

### WellnessResourceDto

```typescript
interface ResourceCategoryDto {
    resourceCategoryId: number;
    categoryName: string;
    description: string;
    iconUrl?: string;
    resourceCount: number;
    isActive: boolean;
}

interface WellnessResourceDto {
    wellnessResourceId: number;
    resourceCategoryId: number;
    categoryName: string;
    title: string;
    description: string;
    resourceType: 'Video' | 'Article' | 'Audio' | 'Exercise' | 'PDF';
    contentUrl: string;
    thumbnailUrl?: string;
    author?: string;
    durationMinutes?: number;
    tags?: string;
    targetAudience: 'Green' | 'Yellow' | 'Red' | 'All';
    viewCount: number;
    rating?: number;
    isFeatured: boolean;
    createdAt: string;
}

interface ResourceAccessDto {
    durationSeconds: number;
    completedPercentage: number;
    rating?: number;
    feedback?: string;
}
```

### SupportDto

```typescript
interface ProfessionalSupportDto {
    professionalSupportID: number;
    professionalType?: string | null;
    name?: string | null;
    specialty?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    website?: string | null;
    availableHours?: string | null;
    isEmergency: boolean;
    is24Hours: boolean;
    languages?: string | null;
}

interface CreateSupportRequestDto {
    evaluationResultID?: number | null;
    requestType?: string | null;
    urgencyLevel?: string | null;
    subject?: string | null;
    description?: string | null;
    preferredContactMethod?: string | null;
    preferredSchedule?: string | null;
}

interface SupportRequestDto {
    supportRequestID: number;
    userID: number;
    userFullName?: string | null;
    assignedToPsychologistID?: number | null;
    psychologistName?: string | null;
    requestType?: string | null;
    urgencyLevel?: string | null;
    status?: string | null;
    subject?: string | null;
    description?: string | null;
    preferredContactMethod?: string | null;
    preferredSchedule?: string | null;
    requestedAt: string; // date-time
    assignedAt?: string | null; // date-time
    completedAt?: string | null; // date-time
    resolution?: string | null;
    satisfactionRating?: number | null;
}
```

### AlertDto

```typescript
interface AlertDto {
    alertId: number;
    userId: number;
    userInitials: string;
    userIdAnonymized: string;
    evaluationResultId: number;
    alertLevel: 'Critical' | 'High' | 'Medium';
    alertType: 'MentalHealth' | 'Burnout' | 'PsychosocialRisk';
    description: string;
    isAttended: boolean;
    attendedByUserId?: number;
    attendedByUserName?: string;
    attendedAt?: string;
    actionTaken?: string;
    notes?: string;
    createdAt: string;
    urgencyDays: number;
    priorityScore: number;
}

interface AttendAlertDto {
    actionTaken: string;
    notes?: string;
}
```

### CaseTrackingDto

```typescript
interface CreateCaseTrackingDto {
    alertId: number;
    userId: number;
    assignedToPsychologistId: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    initialAssessment: string;
    interventionPlan: string;
    nextFollowUpDate?: string;
}

interface CaseTrackingDto {
    caseTrackingId: number;
    alertId: number;
    userId: number;
    userInitials: string;
    assignedToPsychologistId: number;
    assignedToPsychologistName: string;
    caseNumber: string;
    status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
    priority: string;
    initialAssessment: string;
    interventionPlan: string;
    progressNotes?: string;
    finalOutcome?: string;
    openedAt: string;
    closedAt?: string;
    nextFollowUpDate?: string;
    followUpCount: number;
    requiresExternalReferral: boolean;
    externalReferralDetails?: string;
    createdAt: string;
    updatedAt: string;
}

interface UpdateCaseTrackingDto {
    status?: string;
    progressNotes?: string;
    nextFollowUpDate?: string;
    requiresExternalReferral?: boolean;
    externalReferralDetails?: string;
}

interface CloseCaseDto {
    finalOutcome: string;
    requiresExternalReferral: boolean;
    externalReferralDetails?: string;
}
```

### DashboardDto

```typescript
interface DashboardIndicatorsDto {
    totalUsers: number;
    activeUsers: number;
    totalEvaluations: number;
    completedEvaluations: number;
    participationRate: number;
    averageCompletionTime: number;
    riskDistribution: {
        green: { count: number; percentage: number };
        yellow: { count: number; percentage: number };
        red: { count: number; percentage: number };
    };
    pendingAlerts: number;
    attendedAlerts: number;
    openCases: number;
    closedCases: number;
    period: {
        startDate: string;
        endDate: string;
    };
}
```

---

## ⚠️ CÓDIGOS DE ESTADO HTTP

### Respuestas Exitosas

- `200 OK` → Operación exitosa (GET, PUT, DELETE)
- `201 Created` → Recurso creado exitosamente (POST)
- `204 No Content` → Operación exitosa sin contenido

### Errores del Cliente

- `400 Bad Request` → Datos inválidos o faltantes
- `401 Unauthorized` → No autenticado (token faltante/inválido)
- `403 Forbidden` → No autorizado (sin permisos)
- `404 Not Found` → Recurso no encontrado
- `409 Conflict` → Conflicto (ej: email ya existe)
- `422 Unprocessable Entity` → Validación fallida

### Errores del Servidor

- `500 Internal Server Error` → Error del servidor
- `503 Service Unavailable` → Servicio no disponible

---

## 💡 EJEMPLOS DE IMPLEMENTACIÓN

### Ejemplo 1: Servicio de Autenticación (Angular)

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            userId: number;
            fullName: string;
            email: string;
            roles: string[];
        };
    };
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${this.apiUrl}/auth/login`, {
                email,
                password,
            })
            .pipe(
                tap((response) => {
                    if (response.success) {
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem(
                            'refreshToken',
                            response.data.refreshToken
                        );
                        localStorage.setItem(
                            'user',
                            JSON.stringify(response.data.user)
                        );
                    }
                })
            );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}
```

---

### Ejemplo 2: Interceptor HTTP

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        const token = this.authService.getToken();

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
}
```

---

### Ejemplo 3: Servicio de Evaluaciones

```typescript
// evaluation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class EvaluationService {
    private apiUrl = `${environment.apiUrl}/evaluation`;

    constructor(private http: HttpClient) {}

    getAssessmentModules(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/assessmentmodule/active`);
    }

    getModuleDetails(moduleId: number): Observable<any> {
        return this.http.get(
            `${environment.apiUrl}/assessmentmodule/${moduleId}/with-questions`
        );
    }

    startEvaluation(assessmentModuleId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/start`, {
            assessmentModuleID: assessmentModuleId,
        });
    }

    submitResponse(data: {
        evaluationID: number;
        questionID: number;
        questionOptionID?: number | null;
        responseValue?: string | null;
    }): Observable<any> {
        return this.http.post(`${this.apiUrl}/submit-response`, data);
    }

    completeEvaluation(evaluationId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${evaluationId}/complete`, null);
    }

    getMyCompletedEvaluations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/my-completed-evaluations`);
    }

    getMyEvaluations(filters?: {
        moduleId?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<any> {
        let params = new HttpParams();
        if (filters) {
            Object.keys(filters).forEach((key) => {
                if (filters[key]) {
                    params = params.set(key, filters[key]);
                }
            });
        }
        return this.http.get(`${this.apiUrl}/my-evaluations`, { params });
    }
}
```

---

### Ejemplo 4: Componente de Evaluación

```typescript
// evaluation.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EvaluationService } from '../services/evaluation.service';

@Component({
    selector: 'app-evaluation',
    templateUrl: './evaluation.component.html',
})
export class EvaluationComponent implements OnInit {
    module: any;
    evaluation: any;
    currentQuestionIndex = 0;
    answers: Map<number, number> = new Map();
    isLoading = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private evaluationService: EvaluationService
    ) {}

    ngOnInit(): void {
        const moduleId = this.route.snapshot.params['moduleId'];
        this.loadModule(moduleId);
    }

    loadModule(moduleId: number): void {
        this.isLoading = true;
        this.evaluationService.getModuleDetails(moduleId).subscribe({
            next: (module) => {
                this.module = module;
                this.startEvaluation();
            },
            error: (error) => {
                console.error('Error loading module:', error);
                this.isLoading = false;
            },
        });
    }

    startEvaluation(): void {
        this.evaluationService
            .startEvaluation(this.module.assessmentModuleId)
            .subscribe({
                next: (evaluation) => {
                    this.evaluation = evaluation;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error starting evaluation:', error);
                    this.isLoading = false;
                },
            });
    }

    selectAnswer(questionId: number, optionId: number, value: number): void {
        this.answers.set(questionId, optionId);

        // Enviar respuesta al backend
        this.evaluationService
            .submitResponse({
                evaluationID: this.evaluation.evaluationID,
                questionID: questionId,
                questionOptionID: optionId,
                responseValue: String(value),
            })
            .subscribe({
                next: () => {
                    console.log('Answer saved');
                },
                error: (error) => {
                    console.error('Error saving answer:', error);
                },
            });
    }

    nextQuestion(): void {
        if (this.currentQuestionIndex < this.module.questions.length - 1) {
            this.currentQuestionIndex++;
        } else {
            this.completeEvaluation();
        }
    }

    previousQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    completeEvaluation(): void {
        this.isLoading = true;
        this.evaluationService
            .completeEvaluation(this.evaluation.evaluationID)
            .subscribe({
                next: (result) => {
                    const resultId = result.evaluationResultID;
                    this.router.navigate(['/results', resultId]);
                },
                error: (error) => {
                    console.error('Error completing evaluation:', error);
                    this.isLoading = false;
                },
            });
    }

    get progress(): number {
        return (
            ((this.currentQuestionIndex + 1) / this.module.questions.length) *
            100
        );
    }

    get currentQuestion(): any {
        return this.module.questions[this.currentQuestionIndex];
    }
}
```

---

### Ejemplo 5: Guard de Autenticación

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return false;
        }

        const requiredRoles = route.data['roles'] as string[];
        if (requiredRoles) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const hasRole = requiredRoles.some((role) =>
                user.roles?.includes(role)
            );

            if (!hasRole) {
                this.router.navigate(['/unauthorized']);
                return false;
            }
        }

        return true;
    }
}
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### 1. **Manejo de Errores**

Siempre validar `response.success` antes de acceder a `response.data`:

```typescript
this.service.getData().subscribe({
    next: (response) => {
        if (response.success) {
            this.data = response.data;
        } else {
            this.showError(response.message);
        }
    },
    error: (error) => {
        this.showError('Error de conexión');
    },
});
```

### 2. **Tokens de Autenticación**

- El token JWT expira en **1 hora** (3600 segundos)
- Implementar lógica de refresh automático
- Renovar token antes de que expire

### 3. **Confidencialidad**

- Los endpoints de alertas y casos **NO devuelven nombres completos**
- Solo iniciales o IDs anonimizados
- Cumplimiento de privacidad médica

### 4. **Paginación**

Actualmente los endpoints NO tienen paginación. Si tienes muchos registros, considera implementar:

- Scroll infinito en frontend
- O solicitar paginación en backend

### 5. **Filtros de Fecha**

Usar formato ISO 8601:

```typescript
startDate: '2026-01-01T00:00:00Z';
endDate: '2026-02-03T23:59:59Z';
```

### 6. **Carga de Archivos**

Los recursos (videos, PDFs) están en URLs externas (CDN).
No hay endpoints de upload de archivos desde frontend.

### 7. **WebSockets / Real-time**

Actualmente NO hay WebSockets. Las notificaciones son:

- Vía polling (consultar cada X segundos)
- O vía email (backend envía automáticamente)

---

## 📞 SOPORTE

**Documentación adicional:**

- Swagger UI: `https://api.emocheck.com/swagger` (cuando esté en producción)
- Postman Collection: Disponible en el repositorio

**Contacto Backend:**

- Repositorio: https://github.com/CRISTIANROJAS1995/emocheck-api
- Issues: Reportar en GitHub Issues

---

**Última actualización:** Febrero 3, 2026
**Versión del documento:** 1.0
**Autor:** Equipo EmoCheck

---

✅ **Checklist de Implementación Frontend:**

- [ ] Configurar interceptor HTTP con token Bearer
- [ ] Implementar guards de autenticación y roles
- [ ] Crear servicio de autenticación (login, logout, refresh)
- [ ] Crear servicio de evaluaciones
- [ ] Crear servicio de recursos de bienestar
- [ ] Crear servicio de dashboard (admin)
- [ ] Implementar manejo de errores global
- [ ] Configurar variables de entorno (dev, prod)
- [ ] Implementar caché local (localStorage) para optimización
- [ ] Agregar loading states en todas las llamadas HTTP

🚀 **¡Listo para comenzar el desarrollo frontend!**
