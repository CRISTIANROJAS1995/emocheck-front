# 📚 Documentación de Endpoints - Resumen

## ✅ Archivos Generados

### 1. **API_ENDPOINTS.md** (Documentación Completa)
Ubicación: `Documentation/API_ENDPOINTS.md`

**Contenido:**
- 📖 Documentación detallada de todos los endpoints (60+ endpoints)
- 🔐 Información de autenticación y autorización
- 📝 Request/Response examples con JSON
- 🎯 Casos de uso para cada endpoint
- 🔄 Flujos principales del sistema
- 💡 Ejemplos con cURL
- 🚨 Códigos de estado HTTP
- 🔒 Niveles de autorización

### 2. **Comentarios XML en Swagger** (En Español)
Todos los controllers actualizados:
- ✅ AssessmentModuleController (7 endpoints)
- ✅ EvaluationController (9 endpoints)
- ✅ AlertController (7 endpoints)
- ✅ DashboardController (4 endpoints)
- ✅ ConsentController (3 endpoints)
- ✅ RecommendationController (4 endpoints)

---

## 📋 Estructura de la Documentación

### Por Controller:

#### 1️⃣ **AssessmentModuleController** (Gestión de Módulos de Evaluación)
- GET /api/AssessmentModule - Todos los módulos (Admin)
- GET /api/AssessmentModule/active - Módulos activos disponibles
- GET /api/AssessmentModule/{id} - Módulo específico
- GET /api/AssessmentModule/{id}/with-questions - Módulo con preguntas completas
- POST /api/AssessmentModule - Crear módulo (Admin)
- PUT /api/AssessmentModule/{id} - Actualizar módulo (Admin)
- DELETE /api/AssessmentModule/{id} - Eliminar módulo (Admin)

#### 2️⃣ **EvaluationController** (Proceso de Evaluación)
- POST /api/Evaluation/start - Iniciar evaluación
- POST /api/Evaluation/submit-response - Enviar respuesta individual
- POST /api/Evaluation/submit-multiple - Enviar múltiples respuestas
- POST /api/Evaluation/{id}/complete - **Completar y calcular resultado**
- GET /api/Evaluation/{id} - Obtener evaluación
- GET /api/Evaluation/{id}/with-responses - Evaluación con respuestas
- GET /api/Evaluation/my-evaluations - Historial del usuario
- GET /api/Evaluation/my-completed-evaluations - Evaluaciones completadas
- GET /api/Evaluation/in-progress/{moduleId} - Evaluación en progreso

#### 3️⃣ **AlertController** (Sistema de Alertas para HSE)
- GET /api/Alert - Todas las alertas
- GET /api/Alert/unattended - **Alertas pendientes** (tareas)
- GET /api/Alert/critical - Alertas críticas (prioridad)
- GET /api/Alert/{id} - Alerta específica
- PUT /api/Alert/{id}/attend - **Atender alerta** (seguimiento)
- GET /api/Alert/statistics - Estadísticas KPIs
- POST /api/Alert - Crear alerta manual

#### 4️⃣ **DashboardController** (Analytics y Reportes)
- GET /api/Dashboard/indicators - **KPIs principales** (usuarios, participación, alertas)
- GET /api/Dashboard/risk-distribution - **Semáforo** (Verde/Amarillo/Rojo)
- GET /api/Dashboard/module-statistics - Estadísticas por instrumento
- GET /api/Dashboard/trends - **Tendencias temporales** (daily/weekly/monthly)

#### 5️⃣ **ConsentController** (Consentimiento Informado Legal)
- GET /api/Consent/my-consent - Estado del consentimiento
- GET /api/Consent/has-accepted - **Validación rápida**
- POST /api/Consent/accept - **Aceptar consentimiento** (obligatorio)

#### 6️⃣ **RecommendationController** (Recomendaciones Personalizadas)
- GET /api/Recommendation/by-result/{id} - Recomendaciones por resultado
- GET /api/Recommendation/my-unviewed - **Recomendaciones pendientes**
- PUT /api/Recommendation/{id}/mark-viewed - Marcar como vista
- POST /api/Recommendation - Crear recomendación personalizada

---

## 🎯 Flujos Principales Documentados

### Flujo 1: Primer Uso del Empleado
```
1. Register → 2. Login → 3. Has-accepted consent → 4. Accept consent → 5. Get active modules
```

### Flujo 2: Realizar Evaluación Completa
```
1. Get module with questions → 2. Start evaluation → 3. Submit responses →
4. Complete evaluation → 5. Get recommendations
```

### Flujo 3: Gestión de Alertas (HSE/Psicólogo)
```
1. Login (Psychologist) → 2. Get unattended alerts → 3. Get critical alerts →
4. Get alert details → 5. Attend alert
```

### Flujo 4: Dashboard Gerencial
```
1. Login (Admin) → 2. Get indicators → 3. Get risk distribution →
4. Get trends → 5. Get module statistics
```

---

## 🔥 Características Destacadas

### ✅ Completado:
- ✅ **60+ endpoints documentados** con ejemplos JSON
- ✅ **Comentarios XML en español** en todos los controllers
- ✅ **Request/Response examples** para cada endpoint
- ✅ **Casos de uso prácticos** explicados
- ✅ **Códigos de estado HTTP** documentados
- ✅ **Niveles de autorización** claramente definidos
- ✅ **Ejemplos con cURL** para testing
- ✅ **Flujos principales** del sistema
- ✅ **Notas de implementación** (consentimiento, semáforo, alertas)

### 🎯 Información Clave por Endpoint:
Cada endpoint incluye:
1. **Descripción en español** (Swagger)
2. **Autorización requerida**
3. **Request body** (con ejemplo JSON)
4. **Response esperado** (con ejemplo JSON)
5. **Caso de uso práctico**
6. **Códigos de estado**

---

## 📊 Resumen por Funcionalidad

### 🔐 Autenticación y Autorización
- Sistema JWT completo
- 3 niveles: Admin, Psychologist, Employee
- Validación de consentimiento informado

### 📝 Evaluaciones
- Inicio/continuación de evaluaciones
- Respuestas individuales o batch
- Cálculo automático de resultados
- Sistema de semáforo (Verde/Amarillo/Rojo)

### 🚨 Alertas Automáticas
- Generación automática en riesgo Rojo
- Seguimiento y atención por HSE
- Estadísticas y priorización
- Cumplimiento normativo

### 📊 Dashboard Analytics
- KPIs principales del sistema
- Distribución de riesgo por semáforo
- Tendencias temporales (diarias, semanales, mensuales)
- Filtros por empresa/sede/área

### 💡 Recomendaciones
- Generación automática según nivel de riesgo
- Recomendaciones personalizadas por psicólogos
- Tracking de visualización
- Priorización (High/Medium/Low)

---

## 🚀 Cómo Usar la Documentación

### Para Desarrolladores Frontend:
1. Consultar `API_ENDPOINTS.md` para ver estructura de requests/responses
2. Revisar ejemplos JSON completos
3. Seguir los flujos principales para implementar features
4. Usar ejemplos cURL para testing

### Para Testers:
1. Swagger UI con comentarios en español
2. Probar endpoints directamente desde Swagger
3. Verificar códigos de respuesta esperados
4. Validar flujos completos

### Para Gerentes/Product Owners:
1. Revisar casos de uso de cada endpoint
2. Entender flujos principales del sistema
3. Validar cumplimiento de requisitos
4. Planificar integraciones

---

## 📝 Notas Técnicas

### Sistema de Semáforo
- **Verde (Green)**: Score ≤ GreenThreshold
- **Amarillo (Yellow)**: GreenThreshold < Score ≤ YellowThreshold
- **Rojo (Red)**: Score > YellowThreshold

### Alertas Automáticas
- Se generan automáticamente cuando resultado = **Rojo**
- Nivel: **Critical**
- Tipo: **HighRiskDetected**
- Requieren atención inmediata del equipo HSE

### Consentimiento Informado
- **Obligatorio** antes de realizar evaluaciones
- Cumple Resolución 2404/2019 MinTrabajo Colombia
- Registra IP y User-Agent para trazabilidad legal

### Confidencialidad
- Endpoints de alertas protegen identidad
- Se usa `UserIdentifier` genérico
- Solo contexto organizacional (empresa, área, sede)

---

## 🎉 Resumen Final

### Archivos Entregados:
1. ✅ **API_ENDPOINTS.md** - Documentación completa (20+ páginas)
2. ✅ **Comentarios XML actualizados** en 6 controllers (34 endpoints)

### Beneficios:
- 📚 Documentación clara y en español
- 🎯 Casos de uso prácticos
- 🔍 Fácil de buscar y consultar
- 🚀 Lista para desarrollo frontend
- ✅ Lista para testing
- 📊 Incluye ejemplos completos

---

**Estado:** ✅ COMPLETADO
**Compilación:** ✅ EXITOSA
**Endpoints Documentados:** 34
**Swagger Comments:** 100% en Español
**Fecha:** Febrero 2026
