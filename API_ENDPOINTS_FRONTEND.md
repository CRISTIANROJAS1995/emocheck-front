# 🔌 GUÍA DE ENDPOINTS API - EMOCHECK
## Documentación para Desarrollador Frontend

**Versión:** 1.0
**Fecha:** Febrero 3, 2026
**Backend:** .NET 8 Web API
**Base URL:** `https://api.emocheck.com` (ajustar según ambiente)

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
  apiTimeout: 30000
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

### Estructura de Respuesta Estándar

Todas las respuestas siguen este formato:

```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}
```

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

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Estado obtenido",
  "data": {
    "hasAccepted": false
  }
}
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

**Request Body:**
```json
{
  "consentText": "He leído y acepto los términos del consentimiento informado...",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Consentimiento aceptado exitosamente",
  "data": {
    "consentId": 789,
    "acceptedAt": "2026-02-03T10:35:00Z",
    "userId": 456
  }
}
```

---

#### 1.4 Obtener Mi Consentimiento

**Endpoint:** `GET /api/consent/my-consent`
**Auth requerido:** ✅ Sí

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Consentimiento obtenido",
  "data": {
    "consentId": 789,
    "userId": 456,
    "consentText": "Texto completo del consentimiento...",
    "acceptedAt": "2026-02-03T10:35:00Z",
    "ipAddress": "192.168.1.100"
  }
}
```

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
    "fullName": "María García Pérez",
    // ... otros campos actualizados
  }
}
```

---

### PASO 3: REALIZAR EVALUACIÓN

#### 3.1 Listar Módulos de Evaluación Disponibles

**Endpoint:** `GET /api/assessment-modules`
**Auth requerido:** ✅ Sí

**Query Params:**
- `isActive` (opcional): true/false

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Módulos obtenidos",
  "data": [
    {
      "assessmentModuleId": 1,
      "moduleName": "Salud Mental (PHQ-9)",
      "description": "Cuestionario de salud mental para detección de depresión",
      "moduleType": "MentalHealth",
      "estimatedDurationMinutes": 10,
      "totalQuestions": 9,
      "isActive": true,
      "iconUrl": "/assets/icons/mental-health.svg"
    },
    {
      "assessmentModuleId": 2,
      "moduleName": "Ansiedad (GAD-7)",
      "description": "Evaluación de trastorno de ansiedad generalizada",
      "moduleType": "Anxiety",
      "estimatedDurationMinutes": 5,
      "totalQuestions": 7,
      "isActive": true,
      "iconUrl": "/assets/icons/anxiety.svg"
    },
    {
      "assessmentModuleId": 3,
      "moduleName": "Riesgo Psicosocial",
      "description": "Batería de riesgo psicosocial (Ministerio del Trabajo - Colombia)",
      "moduleType": "Psychosocial",
      "estimatedDurationMinutes": 45,
      "totalQuestions": 123,
      "isActive": true,
      "iconUrl": "/assets/icons/psychosocial.svg"
    }
  ]
}
```

---

#### 3.2 Obtener Detalles de un Módulo (con preguntas)

**Endpoint:** `GET /api/assessment-modules/{moduleId}`
**Auth requerido:** ✅ Sí

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Módulo obtenido",
  "data": {
    "assessmentModuleId": 1,
    "moduleName": "Salud Mental (PHQ-9)",
    "description": "Cuestionario de salud mental...",
    "moduleType": "MentalHealth",
    "estimatedDurationMinutes": 10,
    "questions": [
      {
        "questionId": 101,
        "questionText": "¿Con qué frecuencia te has sentido decaído/a, deprimido/a o sin esperanza?",
        "orderIndex": 1,
        "responseType": "MultipleChoice",
        "isRequired": true,
        "options": [
          {
            "questionOptionId": 1001,
            "optionText": "Nunca",
            "optionValue": 0,
            "orderIndex": 1
          },
          {
            "questionOptionId": 1002,
            "optionText": "Varios días",
            "optionValue": 1,
            "orderIndex": 2
          },
          {
            "questionOptionId": 1003,
            "optionText": "Más de la mitad de los días",
            "optionValue": 2,
            "orderIndex": 3
          },
          {
            "questionOptionId": 1004,
            "optionText": "Casi todos los días",
            "optionValue": 3,
            "orderIndex": 4
          }
        ]
      }
      // ... más preguntas
    ]
  }
}
```

---

#### 3.3 Iniciar una Evaluación

**Endpoint:** `POST /api/evaluation/start`
**Auth requerido:** ✅ Sí

**Request Body:**
```json
{
  "assessmentModuleId": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Evaluación iniciada",
  "data": {
    "evaluationId": 5001,
    "userId": 456,
    "assessmentModuleId": 1,
    "moduleName": "Salud Mental (PHQ-9)",
    "status": "InProgress",
    "startedAt": "2026-02-03T11:00:00Z",
    "totalQuestions": 9,
    "answeredQuestions": 0
  }
}
```

**Nota importante:** Antes de iniciar, el backend valida que el usuario haya aceptado el consentimiento informado.

---

#### 3.4 Enviar Respuesta a una Pregunta

**Endpoint:** `POST /api/evaluation/submit-response`
**Auth requerido:** ✅ Sí

**Request Body:**
```json
{
  "evaluationId": 5001,
  "questionId": 101,
  "questionOptionId": 1002,
  "responseValue": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Respuesta guardada",
  "data": {
    "evaluationResponseId": 10001,
    "evaluationId": 5001,
    "questionId": 101,
    "questionOptionId": 1002,
    "responseValue": 1,
    "answeredAt": "2026-02-03T11:02:30Z"
  }
}
```

**Lógica en frontend:**
```typescript
// Repetir este endpoint por cada pregunta respondida
// Mostrar barra de progreso: (respuestasEnviadas / totalPreguntas) * 100
```

---

#### 3.5 Completar Evaluación (Finalizar)

**Endpoint:** `POST /api/evaluation/complete`
**Auth requerido:** ✅ Sí

**Request Body:**
```json
{
  "evaluationId": 5001
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Evaluación completada exitosamente",
  "data": {
    "evaluationId": 5001,
    "status": "Completed",
    "completedAt": "2026-02-03T11:10:00Z",
    "evaluationResultId": 2001,
    "riskLevel": "Yellow",
    "totalScore": 12,
    "scorePercentage": 44.4,
    "redirectTo": "/results/2001"
  }
}
```

**Lógica en frontend:**
```typescript
// Al completar, redirigir automáticamente a la página de resultados
// Usar evaluationResultId para obtener detalles
```

---

### PASO 4: VER RESULTADOS

#### 4.1 Obtener Resultado de una Evaluación

**Endpoint:** `GET /api/evaluation/result/{evaluationResultId}`
**Auth requerido:** ✅ Sí

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Resultado obtenido",
  "data": {
    "evaluationResultId": 2001,
    "evaluationId": 5001,
    "moduleName": "Salud Mental (PHQ-9)",
    "totalScore": 12,
    "maxScore": 27,
    "scorePercentage": 44.4,
    "riskLevel": "Yellow",
    "riskLevelText": "Atención Preventiva",
    "interpretation": "Tus respuestas indican síntomas leves de depresión. Te recomendamos prácticas de autocuidado y seguimiento.",
    "calculatedAt": "2026-02-03T11:10:00Z",
    "colorCode": "#FFC107",
    "iconUrl": "/assets/icons/yellow-alert.svg"
  }
}
```

**Semaforización:**
- 🟢 **Green** → "Bienestar Adecuado" → `#4CAF50`
- 🟡 **Yellow** → "Atención Preventiva" → `#FFC107`
- 🔴 **Red** → "Requiere Intervención" → `#F44336`

---

#### 4.2 Obtener Resultado Detallado (con dimensiones)

**Endpoint:** `GET /api/evaluation/{evaluationId}/detailed-result`
**Auth requerido:** ✅ Sí

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Resultado detallado obtenido",
  "data": {
    "evaluationResultId": 2001,
    "totalScore": 12,
    "riskLevel": "Yellow",
    "interpretation": "Texto de interpretación...",
    "dimensionScores": [
      {
        "dimensionScoreId": 3001,
        "dimensionName": "Estado de ánimo",
        "score": 5,
        "maxScore": 9,
        "percentage": 55.5,
        "riskLevel": "Yellow"
      },
      {
        "dimensionScoreId": 3002,
        "dimensionName": "Energía y motivación",
        "score": 4,
        "maxScore": 9,
        "percentage": 44.4,
        "riskLevel": "Green"
      },
      {
        "dimensionScoreId": 3003,
        "dimensionName": "Concentración",
        "score": 3,
        "maxScore": 9,
        "percentage": 33.3,
        "riskLevel": "Green"
      }
    ],
    "calculatedAt": "2026-02-03T11:10:00Z"
  }
}
```

**Uso en frontend:**
```typescript
// Mostrar gráfico de radar/spider con dimensionScores
// Cada dimensión con su color según riskLevel
```

---

#### 4.3 Obtener Historial de Mis Evaluaciones

**Endpoint:** `GET /api/evaluation/my-evaluations`
**Auth requerido:** ✅ Sí

**Query Params:**
- `moduleId` (opcional): Filtrar por módulo
- `status` (opcional): "Completed", "InProgress", "Abandoned"
- `startDate` (opcional): Formato ISO 8601
- `endDate` (opcional): Formato ISO 8601

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Evaluaciones obtenidas",
  "data": [
    {
      "evaluationId": 5001,
      "assessmentModuleId": 1,
      "moduleName": "Salud Mental (PHQ-9)",
      "status": "Completed",
      "startedAt": "2026-02-03T11:00:00Z",
      "completedAt": "2026-02-03T11:10:00Z",
      "riskLevel": "Yellow",
      "totalScore": 12,
      "hasResult": true
    },
    {
      "evaluationId": 4500,
      "assessmentModuleId": 2,
      "moduleName": "Ansiedad (GAD-7)",
      "status": "Completed",
      "startedAt": "2026-01-15T09:00:00Z",
      "completedAt": "2026-01-15T09:08:00Z",
      "riskLevel": "Green",
      "totalScore": 3,
      "hasResult": true
    }
  ]
}
```

---

### PASO 5: RECOMENDACIONES PERSONALIZADAS

#### 5.1 Obtener Mis Recomendaciones

**Endpoint:** `GET /api/recommendations/my-recommendations`
**Auth requerido:** ✅ Sí

**Query Params:**
- `isRead` (opcional): true/false - Filtrar por leídas/no leídas

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recomendaciones obtenidas",
  "data": [
    {
      "recommendationId": 7001,
      "evaluationResultId": 2001,
      "recommendationType": "Individual",
      "title": "Practica técnicas de respiración",
      "description": "Dedica 5 minutos al día para ejercicios de respiración profunda. Esto ayuda a reducir el estrés y mejorar tu estado de ánimo.",
      "priority": "High",
      "targetAudience": "Employee",
      "isRead": false,
      "createdAt": "2026-02-03T11:10:30Z",
      "resourceUrl": "/resources/breathing-exercises",
      "iconUrl": "/assets/icons/breathing.svg"
    },
    {
      "recommendationId": 7002,
      "evaluationResultId": 2001,
      "recommendationType": "Medical",
      "title": "Considera consultar con un profesional",
      "description": "Tus resultados sugieren que podrías beneficiarte de apoyo profesional. Tenemos psicólogos disponibles.",
      "priority": "High",
      "targetAudience": "Employee",
      "isRead": false,
      "createdAt": "2026-02-03T11:10:30Z",
      "actionButton": {
        "text": "Solicitar cita",
        "url": "/support/request"
      }
    }
  ]
}
```

---

#### 5.2 Obtener Recomendaciones por Resultado Específico

**Endpoint:** `GET /api/recommendations/by-result/{evaluationResultId}`
**Auth requerido:** ✅ Sí

**Response:** Similar al anterior, pero filtrado por resultado específico.

---

#### 5.3 Marcar Recomendación como Leída

**Endpoint:** `POST /api/recommendations/{recommendationId}/mark-read`
**Auth requerido:** ✅ Sí

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Recomendación marcada como leída",
  "data": null
}
```

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
      "professionalSupportId": 10,
      "fullName": "Dra. Laura Martínez",
      "email": "laura.martinez@emocheck.com",
      "phone": "+57 300 1234567",
      "specialties": ["Ansiedad", "Depresión", "Estrés Laboral"],
      "licenseNumber": "PSI-12345",
      "bio": "Psicóloga clínica con 10 años de experiencia en salud ocupacional...",
      "profileImageUrl": "https://cdn.emocheck.com/profiles/laura-martinez.jpg",
      "availableSchedule": {
        "monday": ["09:00-12:00", "14:00-17:00"],
        "tuesday": ["09:00-12:00", "14:00-17:00"],
        "wednesday": ["09:00-12:00"],
        "thursday": ["14:00-17:00"],
        "friday": ["09:00-12:00"]
      },
      "isEmergencyContact": false,
      "rating": 4.9,
      "totalSessions": 245
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
      "professionalSupportId": 15,
      "fullName": "Dr. Roberto García",
      "phone": "+57 300 9876543",
      "emergencyLine": "+57 1 800-AYUDA",
      "email": "emergencias@emocheck.com",
      "isEmergencyContact": true,
      "availability": "24/7"
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
  "evaluationResultId": 2001,
  "requestType": "Consultation",
  "urgencyLevel": "Medium",
  "subject": "Necesito ayuda con manejo de estrés",
  "description": "He estado sintiendo mucha presión en el trabajo y me gustaría hablar con un profesional",
  "preferredContactMethod": "VideoCall",
  "preferredSchedule": "Lunes o Miércoles por la tarde"
}
```

**Valores válidos:**
- **requestType:** "Consultation", "Therapy", "Emergency", "Information"
- **urgencyLevel:** "Low", "Medium", "High", "Critical"
- **preferredContactMethod:** "Phone", "Email", "InPerson", "VideoCall"

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Solicitud creada exitosamente. Un profesional te contactará pronto.",
  "data": {
    "supportRequestId": 8001,
    "userId": 456,
    "requestType": "Consultation",
    "urgencyLevel": "Medium",
    "status": "Pending",
    "requestedAt": "2026-02-03T12:30:00Z",
    "estimatedResponseTime": "24-48 horas"
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
      "supportRequestId": 8001,
      "requestType": "Consultation",
      "urgencyLevel": "Medium",
      "status": "Assigned",
      "subject": "Necesito ayuda con manejo de estrés",
      "requestedAt": "2026-02-03T12:30:00Z",
      "assignedAt": "2026-02-03T14:00:00Z",
      "assignedToPsychologistName": "Dra. Laura Martínez",
      "assignedToPsychologistPhone": "+57 300 1234567",
      "firstContactAt": null,
      "completedAt": null
    }
  ]
}
```

**Estados posibles:**
- `Pending` → Pendiente de asignación
- `Assigned` → Asignada a un profesional
- `InProgress` → En proceso de atención
- `Completed` → Completada
- `Cancelled` → Cancelada

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

#### Consent 1. Obtener Historial de Consentimientos

**Endpoint:** `GET /api/consent/history`
**Auth requerido:** ✅ Sí (Admin)

**Query Params:**
- `userId` (opcional)
- `startDate` (opcional)
- `endDate` (opcional)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Historial obtenido",
  "data": [
    {
      "consentId": 789,
      "userId": 456,
      "userFullName": "María García",
      "userEmail": "maria.garcia@empresa.com",
      "acceptedAt": "2026-02-03T10:35:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "consentVersion": "1.0"
    }
  ]
}
```

---

#### Consent 2. Obtener Consentimiento por Usuario (Admin)

**Endpoint:** `GET /api/consent/by-user/{userId}`
**Auth requerido:** ✅ Sí (Admin)

**Response:** Similar al anterior, filtrado por usuario específico.

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
  consentText: string;
  ipAddress: string;
  userAgent: string;
}

interface InformedConsentDto {
  consentId: number;
  userId: number;
  consentText: string;
  acceptedAt: string;
  ipAddress: string;
  userAgent?: string;
}
```

### AssessmentModuleDto
```typescript
interface AssessmentModuleDto {
  assessmentModuleId: number;
  moduleName: string;
  description: string;
  moduleType: string;
  estimatedDurationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  iconUrl?: string;
  questions?: QuestionDto[];
}

interface QuestionDto {
  questionId: number;
  questionText: string;
  orderIndex: number;
  responseType: string;
  isRequired: boolean;
  options: QuestionOptionDto[];
}

interface QuestionOptionDto {
  questionOptionId: number;
  optionText: string;
  optionValue: number;
  orderIndex: number;
}
```

### EvaluationDto
```typescript
interface StartEvaluationDto {
  assessmentModuleId: number;
}

interface EvaluationDto {
  evaluationId: number;
  userId: number;
  assessmentModuleId: number;
  moduleName: string;
  status: 'InProgress' | 'Completed' | 'Abandoned';
  startedAt: string;
  completedAt?: string;
  totalQuestions: number;
  answeredQuestions: number;
  riskLevel?: 'Green' | 'Yellow' | 'Red';
  totalScore?: number;
  hasResult: boolean;
}

interface SubmitResponseDto {
  evaluationId: number;
  questionId: number;
  questionOptionId: number;
  responseValue: number;
}

interface CompleteEvaluationDto {
  evaluationId: number;
}
```

### EvaluationResultDto
```typescript
interface EvaluationResultDto {
  evaluationResultId: number;
  evaluationId: number;
  moduleName: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  riskLevel: 'Green' | 'Yellow' | 'Red';
  riskLevelText: string;
  interpretation: string;
  calculatedAt: string;
  colorCode: string;
  iconUrl?: string;
}

interface DetailedEvaluationResultDto extends EvaluationResultDto {
  dimensionScores: DimensionScoreDto[];
}

interface DimensionScoreDto {
  dimensionScoreId: number;
  dimensionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  riskLevel: 'Green' | 'Yellow' | 'Red';
}
```

### RecommendationDto
```typescript
interface RecommendationDto {
  recommendationId: number;
  evaluationResultId: number;
  recommendationType: 'Individual' | 'Organizational' | 'Medical';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  targetAudience: 'Employee' | 'Manager' | 'HSE' | 'HR';
  isRead: boolean;
  createdAt: string;
  resourceUrl?: string;
  iconUrl?: string;
  actionButton?: {
    text: string;
    url: string;
  };
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
  professionalSupportId: number;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  licenseNumber?: string;
  bio?: string;
  profileImageUrl?: string;
  availableSchedule?: Record<string, string[]>;
  isEmergencyContact: boolean;
  rating?: number;
  totalSessions?: number;
}

interface CreateSupportRequestDto {
  evaluationResultId?: number;
  requestType: 'Consultation' | 'Therapy' | 'Emergency' | 'Information';
  urgencyLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  subject?: string;
  description?: string;
  preferredContactMethod?: 'Phone' | 'Email' | 'InPerson' | 'VideoCall';
  preferredSchedule?: string;
}

interface SupportRequestDto {
  supportRequestId: number;
  userId: number;
  userFullName: string;
  requestType: string;
  urgencyLevel: string;
  status: 'Pending' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';
  subject?: string;
  description?: string;
  requestedAt: string;
  assignedAt?: string;
  assignedToPsychologistId?: number;
  assignedToPsychologistName?: string;
  firstContactAt?: string;
  completedAt?: string;
  resolution?: string;
  satisfactionRating?: number;
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
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
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
  HttpErrorResponse
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

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
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
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = `${environment.apiUrl}/evaluation`;

  constructor(private http: HttpClient) {}

  getAssessmentModules(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/assessment-modules`);
  }

  getModuleDetails(moduleId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/assessment-modules/${moduleId}`);
  }

  startEvaluation(assessmentModuleId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/start`, { assessmentModuleId });
  }

  submitResponse(data: {
    evaluationId: number;
    questionId: number;
    questionOptionId: number;
    responseValue: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-response`, data);
  }

  completeEvaluation(evaluationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/complete`, { evaluationId });
  }

  getResult(resultId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/result/${resultId}`);
  }

  getDetailedResult(evaluationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${evaluationId}/detailed-result`);
  }

  getMyEvaluations(filters?: {
    moduleId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
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
  templateUrl: './evaluation.component.html'
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
      next: (response) => {
        this.module = response.data;
        this.startEvaluation();
      },
      error: (error) => {
        console.error('Error loading module:', error);
        this.isLoading = false;
      }
    });
  }

  startEvaluation(): void {
    this.evaluationService.startEvaluation(this.module.assessmentModuleId).subscribe({
      next: (response) => {
        this.evaluation = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error starting evaluation:', error);
        this.isLoading = false;
      }
    });
  }

  selectAnswer(questionId: number, optionId: number, value: number): void {
    this.answers.set(questionId, optionId);

    // Enviar respuesta al backend
    this.evaluationService.submitResponse({
      evaluationId: this.evaluation.evaluationId,
      questionId: questionId,
      questionOptionId: optionId,
      responseValue: value
    }).subscribe({
      next: () => {
        console.log('Answer saved');
      },
      error: (error) => {
        console.error('Error saving answer:', error);
      }
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
    this.evaluationService.completeEvaluation(this.evaluation.evaluationId).subscribe({
      next: (response) => {
        const resultId = response.data.evaluationResultId;
        this.router.navigate(['/results', resultId]);
      },
      error: (error) => {
        console.error('Error completing evaluation:', error);
        this.isLoading = false;
      }
    });
  }

  get progress(): number {
    return ((this.currentQuestionIndex + 1) / this.module.questions.length) * 100;
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
  providedIn: 'root'
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
      const hasRole = requiredRoles.some(role => user.roles?.includes(role));

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
  }
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
startDate: "2026-01-01T00:00:00Z"
endDate: "2026-02-03T23:59:59Z"
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
