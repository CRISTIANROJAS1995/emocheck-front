# DOCUMENTACION DEL PROYECTO EMOCHECK# 📋 Documentación del Proyecto EmoCheck

**Fecha:** Enero 20, 2026  **Fecha:** Enero 20, 2026
**Version:** 1.0  **Versión:** 1.0
**Repositorio:** emocheck-api  **Repositorio:** emocheck-api
**Owner:** CRISTIANROJAS1995**Owner:** CRISTIANROJAS1995

------

## QUE ES EMOCHECK## 🎯 ¿Qué es EmoCheck?

EmoCheck es una plataforma web de evaluacion y monitoreo de salud mental y bienestar emocional en el trabajo. Permite a las empresas cumplir con normativas de salud ocupacional (SVE Psicosocial) mientras cuidan la salud mental de sus trabajadores de forma continua, confidencial y basada en evidencia cientifica.EmoCheck es una **plataforma web de evaluación y monitoreo de salud mental y bienestar emocional en el trabajo**. Permite a las empresas cumplir con normativas de salud ocupacional (SVE Psicosocial) mientras cuidan la salud mental de sus trabajadores de forma continua, confidencial y basada en evidencia científica.


------



## USUARIOS DEL SISTEMA## 👥 Usuarios del Sistema

### 3 TIPOS DE USUARIOS### **3 Tipos de Usuarios:**

### 1. TRABAJADORES/EMPLEADOS### 1. **Trabajadores/Empleados**

- Acceden para realizar autoevaluaciones- Acceden para realizar autoevaluaciones

- Ven sus propios resultados- Ven sus propios resultados

- Reciben recomendaciones personalizadas- Reciben recomendaciones personalizadas

- Acceden a recursos de bienestar- Acceden a recursos de bienestar



### 2. LIDERES HSE / PSICOLOGOS OCUPACIONALES### 2. **Líderes HSE / Psicólogos Ocupacionales**

- Ven reportes agregados (no individuales, por confidencialidad)- Ven reportes agregados (no individuales, por confidencialidad)

- Gestionan alertas criticas- Gestionan alertas críticas

- Dan seguimiento a casos de riesgo- Dan seguimiento a casos de riesgo

- Generan reportes por area/sede- Generan reportes por área/sede



### 3. ADMINISTRADORES DEL SISTEMA### 3. **Administradores del Sistema**

- Configuran la plataforma- Configuran la plataforma

- Gestionan usuarios y empresas- Gestionan usuarios y empresas

- Acceden a todos los modulos- Acceden a todos los módulos

- Configuran integraciones- Configuran integraciones



------



## MODULOS DE EVALUACION## 📊 Módulos de Evaluación



### 1. SALUD MENTAL### **1. Salud Mental**

Tamizaje de condiciones psicologicas comunes utilizando instrumentos cientificos validados:Tamizaje de condiciones psicológicas comunes utilizando instrumentos científicos validados:



- Ansiedad (GAD-7): Generalized Anxiety Disorder-7- **Ansiedad (GAD-7)**: Generalized Anxiety Disorder-7

- Depresion (PHQ-9): Patient Health Questionnaire-9- **Depresión (PHQ-9)**: Patient Health Questionnaire-9

- Insomnio (ISI): Insomnia Severity Index- **Insomnio (ISI)**: Insomnia Severity Index

- Estres Percibido: Escala de percepcion de estres- **Estrés Percibido**: Escala de percepción de estrés



Resultado: Puntaje + semaforizacion (verde/amarillo/rojo) + recomendaciones personalizadas**Resultado**: Puntaje + semaforización (verde/amarillo/rojo) + recomendaciones personalizadas



### 2. FATIGA LABORAL### **2. Fatiga Laboral**

Evaluacion rapida de:Evaluación rápida de:

- Nivel de energia cognitiva- Nivel de energía cognitiva

- Agotamiento emocional- Agotamiento emocional

- Capacidad de concentracion- Capacidad de concentración



Objetivo: Detectar burnout en etapas tempranas**Objetivo**: Detectar burnout en etapas tempranas



### 3. CLIMA ORGANIZACIONAL### **3. Clima Organizacional**

Percepcion del trabajador sobre:Percepción del trabajador sobre:

- Entorno laboral- Entorno laboral

- Liderazgo- Liderazgo

- Proposito y motivacion- Propósito y motivación

- Relaciones interpersonales- Relaciones interpersonales



### 4. RIESGO PSICOSOCIAL### **4. Riesgo Psicosocial**

Basado en la Bateria del Ministerio del Trabajo (Colombia):Basado en la **Batería del Ministerio del Trabajo** (Colombia):

- Factores intralaborales- Factores intralaborales

- Factores extralaborales- Factores extralaborales

- Estres laboral- Estrés laboral



Cumplimiento legal: Resolucion 2404 de 2019**Cumplimiento legal**: Resolución 2404 de 2019



------



## FLUJO DE USUARIO## 🔄 Flujo de Usuario



### PASO 1: BIENVENIDA Y REGISTRO### **Paso 1: Bienvenida y Registro**

``````

Usuario ingresa > Se registra > Acepta Consentimiento Informado DigitalUsuario ingresa → Se registra → Acepta Consentimiento Informado Digital

``````

- El consentimiento explica: que se hara con sus datos, confidencialidad, proposito- El consentimiento explica: qué se hará con sus datos, confidencialidad, propósito

- Se guarda digitalmente con trazabilidad (fecha, hora, IP)- Se guarda digitalmente con trazabilidad (fecha, hora, IP)



### PASO 2: COMPLETAR PERFIL### **Paso 2: Completar Perfil**

``````

Datos del usuario:Datos del usuario:

- Nombre completo- Nombre completo

- Documento de identidad- Documento de identidad

- Area- Área

- Sede- Sede

- Tipo de cargo- Tipo de cargo

- Correo corporativo- Correo corporativo

``````



### PASO 3: REALIZAR EVALUACION### **Paso 3: Realizar Evaluación**

``````

Selecciona modulo > Responde cuestionario > Sistema calcula resultado automaticamenteSelecciona módulo → Responde cuestionario → Sistema calcula resultado automáticamente

``````

- Las preguntas estan estandarizadas (instrumentos validados cientificamente)- Las preguntas están estandarizadas (instrumentos validados científicamente)

- Sistema asigna puntuacion automatica segun algoritmos establecidos- Sistema asigna puntuación automática según algoritmos establecidos



### PASO 4: VER RESULTADOS### **Paso 4: Ver Resultados**

``````

Resultado semaforizado:Resultado semaforizado:

VERDE: Bienestar adecuado🟢 Verde: Bienestar adecuado

AMARILLO: Atencion preventiva🟡 Amarillo: Atención preventiva

ROJO: Requiere intervencion🔴 Rojo: Requiere intervención

``````



### PASO 5: RECOMENDACIONES PERSONALIZADAS### **Paso 5: Recomendaciones Personalizadas**

Segun el resultado, el sistema entrega:Según el resultado, el sistema entrega:

- Recursos de mindfulness- Recursos de mindfulness

- Pausas activas- Pausas activas

- Ejercicios de respiracion- Ejercicios de respiración

- Recomendacion de consulta psicologica (si aplica)- Recomendación de consulta psicológica (si aplica)



### PASO 6: CENTRO DE RECURSOS DE BIENESTAR### **Paso 6: Centro de Recursos de Bienestar**

Acceso permanente a:Acceso permanente a:

- Calibracion emocional- Calibración emocional

- Mindfulness- Mindfulness

- Neuropausas- Neuropausas

- Apoyo profesional (solicitud de cita con psicologo)- Apoyo profesional (solicitud de cita con psicólogo)



------



## PANEL DE ADMINISTRACION (BACKEND)## 🔐 Panel de Administración (Backend)



### 1. GESTION DE USUARIOS### **1. Gestión de Usuarios**

- Crear/editar/eliminar usuarios- Crear/editar/eliminar usuarios

- Asignar a empresa, area, sede- Asignar a empresa, área, sede

- Ver estado: activo/inactivo- Ver estado: activo/inactivo

- Gestionar roles (trabajador, lider, admin)- Gestionar roles (trabajador, líder, admin)



### 2. MONITOREO DE RESULTADOS### **2. Monitoreo de Resultados**



Tablero Visual con:**Tablero Visual con:**

- Indicadores globales por modulo- Indicadores globales por módulo

- Filtros: fecha, area, sede, nivel de riesgo- Filtros: fecha, área, sede, nivel de riesgo

- Graficos de tendencias (ej: aumento la ansiedad este mes?)- Gráficos de tendencias (ej: ¿aumentó la ansiedad este mes?)

- Comparativos entre areas- Comparativos entre áreas



Ejemplo de vista:**Ejemplo de vista:**

``````

Area: Produccion (50 trabajadores)Área: Producción (50 trabajadores)

--------------------------------------------------------------------------

Salud Mental:Salud Mental:

  VERDE: 35 (70%)  🟢 35 (70%)

  AMARILLO: 10 (20%)  🟡 10 (20%)

  ROJO: 5 (10%)  ALERTA  🔴 5 (10%)  ⚠️ ALERTA

``````



### 3. ALERTAS CRITICAS### **3. Alertas Críticas**

Cuando un trabajador sale en ROJO:Cuando un trabajador sale en **rojo**:

- Se genera alerta automatica- Se genera alerta automática

- Notificacion al psicologo/HSE asignado- Notificación al psicólogo/HSE asignado

- Registro del seguimiento (se contacto? que accion se tomo?)- Registro del seguimiento (¿se contactó? ¿qué acción se tomó?)



IMPORTANTE: El sistema NO muestra el nombre completo, usa ID o iniciales para proteger confidencialidad.**Importante**: El sistema NO muestra el nombre completo, usa ID o iniciales para proteger confidencialidad.



### 4. GESTION DE CONSENTIMIENTOS### **4. Gestión de Consentimientos**

- Repositorio de todos los consentimientos firmados- Repositorio de todos los consentimientos firmados

- Descarga de PDF por usuario- Descarga de PDF por usuario

- Trazabilidad: quien acepto, cuando, desde donde- Trazabilidad: quién aceptó, cuándo, desde dónde



### 5. REPORTES AUTOMATICOS### **5. Reportes Automáticos**

Generacion de informes con indicadores SVE Psicosocial:Generación de informes con indicadores SVE Psicosocial:

- N° casos activos- N° casos activos

- N° casos cerrados- N° casos cerrados

- % de prevalencia/incidencia- % de prevalencia/incidencia

- % de participacion- % de participación

- Exportacion: Excel, PDF- Exportación: Excel, PDF

- Integracion con Power BI/Tableau- Integración con Power BI/Tableau



------



## ARQUITECTURA TECNICA## 🏗️ Arquitectura Técnica



### FRONTEND: ANGULAR 21 (STANDALONE)### **Frontend: Angular 21 (Standalone)**

- Una sola aplicacion web responsive- Una sola aplicación web responsive

- Diseño modular (4 modulos de evaluacion)- Diseño modular (4 módulos de evaluación)

- UX amigable con mensajes de acompañamiento emocional- UX amigable con mensajes de acompañamiento emocional

- Semaforizacion visual clara- Semaforización visual clara

- Graficos interactivos para dashboards- Gráficos interactivos para dashboards



Caracteristicas:**Características:**

- Componentes standalone (sin NgModules)- Componentes standalone (sin NgModules)

- Routing modular- Routing modular

- Estado global con Signals- Estado global con Signals

- Guards para proteccion de rutas- Guards para protección de rutas

- Interceptors para autenticacion- Interceptors para autenticación



### BACKEND: C# / .NET 8 (ARQUITECTURA HEXAGONAL)### **Backend: C# / .NET 8 (Arquitectura Hexagonal)**



Por que hexagonal?  **¿Por qué hexagonal?**

Separacion clara de responsabilidades en capas:Separación clara de responsabilidades en capas:



``````

Domain (Dominio)📁 Domain (Dominio)

   - Entidades: Usuario, Evaluacion, Resultado   - Entidades: Usuario, Evaluacion, Resultado

   - Interfaces: IUsuarioRepository, IEvaluacionService   - Interfaces: IUsuarioRepository, IEvaluacionService

   - Logica de negocio pura   - Lógica de negocio pura



Application (Aplicacion)📁 Application (Aplicación)

   - Casos de uso: CrearEvaluacion, CalcularResultado, GenerarReporte   - Casos de uso: CrearEvaluacion, CalcularResultado, GenerarReporte

   - DTOs: UsuarioDto, ResultadoDto   - DTOs: UsuarioDto, ResultadoDto

   - Servicios de aplicacion   - Servicios de aplicación



Infrastructure (Infraestructura)📁 Infrastructure (Infraestructura)

   - Repositorios: UsuarioRepository (SQL Server)   - Repositorios: UsuarioRepository (SQL Server)

   - Servicios externos: EmailService, PowerBIService   - Servicios externos: EmailService, PowerBIService

   - Autenticacion: JwtTokenService   - Autenticación: JwtTokenService

   - Configuraciones   - Configuraciones

``````



APIs REST PRINCIPALES:**APIs REST Principales:**

``````http

# AUTENTICACION# Autenticación

POST /api/auth/loginPOST /api/auth/login

POST /api/auth/refresh-tokenPOST /api/auth/refresh-token

POST /api/auth/logoutPOST /api/auth/logout



# USUARIOS# Usuarios

POST /api/usuarios/registroPOST /api/usuarios/registro

GET /api/usuarios/{id}GET /api/usuarios/{id}

PUT /api/usuarios/{id}PUT /api/usuarios/{id}

DELETE /api/usuarios/{id}DELETE /api/usuarios/{id}



# CONSENTIMIENTOS# Consentimientos

POST /api/consentimientosPOST /api/consentimientos

GET /api/consentimientos/{usuarioId}GET /api/consentimientos/{usuarioId}



# EVALUACIONES# Evaluaciones

POST /api/evaluaciones/salud-mentalPOST /api/evaluaciones/salud-mental

POST /api/evaluaciones/fatiga-laboralPOST /api/evaluaciones/fatiga-laboral

POST /api/evaluaciones/clima-organizacionalPOST /api/evaluaciones/clima-organizacional

POST /api/evaluaciones/riesgo-psicosocialPOST /api/evaluaciones/riesgo-psicosocial

GET /api/evaluaciones/{usuarioId}GET /api/evaluaciones/{usuarioId}



# RESULTADOS# Resultados

GET /api/resultados/{usuarioId}GET /api/resultados/{usuarioId}

GET /api/resultados/{evaluacionId}/detalleGET /api/resultados/{evaluacionId}/detalle



# DASHBOARD ADMINISTRATIVO# Dashboard Administrativo

GET /api/dashboard/indicadoresGET /api/dashboard/indicadores

GET /api/dashboard/alertasGET /api/dashboard/alertas

GET /api/dashboard/reportesGET /api/dashboard/reportes

POST /api/dashboard/reportes/exportarPOST /api/dashboard/reportes/exportar



# GESTION ADMINISTRATIVA# Gestión Administrativa

GET /api/admin/usuariosGET /api/admin/usuarios

GET /api/admin/empresasGET /api/admin/empresas

GET /api/admin/areasGET /api/admin/areas

GET /api/admin/sedesGET /api/admin/sedes

``````



SEGURIDAD:**Seguridad:**

- JWT + Refresh Tokens- JWT + Refresh Tokens

- Roles y permisos (Claims-based)- Roles y permisos (Claims-based)

- Encriptacion de datos sensibles- Encriptación de datos sensibles

- HTTPS obligatorio- HTTPS obligatorio

- Rate limiting- Rate limiting

- CORS configurado- CORS configurado



### BASE DE DATOS: SQL SERVER### **Base de Datos: SQL Server**



MODELO DE DATOS - TABLAS PRINCIPALES:**Modelo de Datos - Tablas Principales:**



```sql```sql

-- GESTION DE ORGANIZACIONES-- Gestión de Organizaciones

Empresas (Id, Nombre, NIT, RazonSocial, Activa, FechaCreacion)Empresas (Id, Nombre, NIT, RazonSocial, Activa, FechaCreacion)

Areas (Id, Nombre, EmpresaId, Descripcion)Areas (Id, Nombre, EmpresaId, Descripcion)

Sedes (Id, Nombre, Ciudad, Direccion, EmpresaId)Sedes (Id, Nombre, Ciudad, Direccion, EmpresaId)



-- GESTION DE USUARIOS-- Gestión de Usuarios

Usuarios (Usuarios (

    Id,     Id,

    NombreCompleto,     NombreCompleto,

    Documento,     Documento,

    Email,     Email,

    PasswordHash,    PasswordHash,

    AreaId,     AreaId,

    SedeId,     SedeId,

    RolId,     RolId,

    TipoCargoId,    TipoCargoId,

    Activo,    Activo,

    FechaRegistro    FechaRegistro

))



Roles (Id, Nombre, Descripcion)Roles (Id, Nombre, Descripcion)

TiposCargo (Id, Nombre)TiposCargo (Id, Nombre)



-- CONSENTIMIENTO INFORMADO-- Consentimiento Informado

Consentimientos (Consentimientos (

    Id,     Id,

    UsuarioId,     UsuarioId,

    Aceptado,     Aceptado,

    FechaHora,     FechaHora,

    IP,    IP,

    UserAgent,    UserAgent,

    DocumentoPDF    DocumentoPDF

))



-- EVALUACIONES-- Evaluaciones

Modulos (Id, Nombre, Descripcion, TipoInstrumento, PuntajeMax)Modulos (Id, Nombre, Descripcion, TipoInstrumento, PuntajeMax)

Preguntas (Id, ModuloId, TextoPregunta, Orden, TipoRespuesta)Preguntas (Id, ModuloId, TextoPregunta, Orden, TipoRespuesta)

OpcionesRespuesta (Id, PreguntaId, TextoOpcion, Valor, Orden)OpcionesRespuesta (Id, PreguntaId, TextoOpcion, Valor, Orden)



Evaluaciones (Evaluaciones (

    Id,     Id,

    UsuarioId,     UsuarioId,

    ModuloId,     ModuloId,

    FechaInicio,     FechaInicio,

    FechaFin,     FechaFin,

    Estado,     Estado,

    Completada    Completada

))



Respuestas (Respuestas (

    Id,     Id,

    EvaluacionId,     EvaluacionId,

    PreguntaId,     PreguntaId,

    OpcionRespuestaId,    OpcionRespuestaId,

    ValorRespuesta,    ValorRespuesta,

    FechaRespuesta    FechaRespuesta

))



-- RESULTADOS Y ALERTAS-- Resultados y Alertas

Resultados (Resultados (

    Id,     Id,

    EvaluacionId,     EvaluacionId,

    PuntajeTotal,     PuntajeTotal,

    Nivel,  -- Verde/Amarillo/Rojo    Nivel,  -- Verde/Amarillo/Rojo

    Fecha,    Fecha,

    Observaciones    Observaciones

))



Recomendaciones (Recomendaciones (

    Id,     Id,

    ResultadoId,     ResultadoId,

    Texto,     Texto,

    Tipo,  -- Mindfulness, PausaActiva, ConsultaPsicologica    Tipo,  -- Mindfulness, PausaActiva, ConsultaPsicologica

    Prioridad    Prioridad

))



Alertas (Alertas (

    Id,     Id,

    UsuarioId,     UsuarioId,

    ResultadoId,    ResultadoId,

    Nivel,  -- Critico, Alto, Medio    Nivel,  -- Crítico, Alto, Medio

    Atendida,     Atendida,

    ResponsableId,    ResponsableId,

    FechaCreacion,    FechaCreacion,

    FechaAtencion,    FechaAtencion,

    Observaciones    Observaciones

))



-- AUDITORIA Y TRAZABILIDAD-- Auditoría y Trazabilidad

AuditoriaLogs (AuditoriaLogs (

    Id,     Id,

    UsuarioId,     UsuarioId,

    Accion,     Accion,

    Entidad,    Entidad,

    EntidadId,    EntidadId,

    FechaHora,     FechaHora,

    IP,    IP,

    Detalles    Detalles

))

``````



SEGURIDAD EN DB:**Seguridad en DB:**

- Cifrado AES-256 para campos sensibles (PasswordHash, Documento)- Cifrado AES-256 para campos sensibles (PasswordHash, Documento)

- Anonimizacion en reportes (solo ID)- Anonimización en reportes (solo ID)

- Backups automaticos diarios- Backups automáticos diarios

- Logs de auditoria (quien accedio a que y cuando)- Logs de auditoría (quién accedió a qué y cuándo)

- Indices optimizados para consultas frecuentes- Índices optimizados para consultas frecuentes

- Procedimientos almacenados para reportes complejos- Procedimientos almacenados para reportes complejos



------



## SEGURIDAD Y CUMPLIMIENTO LEGAL## 🔒 Seguridad y Cumplimiento Legal



### LEY 1581 DE 2012 (PROTECCION DE DATOS PERSONALES - COLOMBIA)### **Ley 1581 de 2012 (Protección de Datos Personales - Colombia)**

- Consentimiento informado explicito  ✅ Consentimiento informado explícito

- Finalidad clara del tratamiento de datos  ✅ Finalidad clara del tratamiento de datos

- Derecho de acceso, rectificacion y eliminacion  ✅ Derecho de acceso, rectificación y eliminación

- Cifrado y almacenamiento seguro  ✅ Cifrado y almacenamiento seguro

- Trazabilidad de aceptaciones  ✅ Trazabilidad de aceptaciones



### CONFIDENCIALIDAD MEDICA### **Confidencialidad Médica**

- Los datos de salud son ultra sensibles- Los datos de salud son **ultra sensibles**

- Solo el usuario ve sus resultados individuales- Solo el usuario ve sus resultados individuales

- Administradores ven datos agregados o anonimizados- Administradores ven datos **agregados** o **anonimizados**

- En alertas criticas: se usa ID, no nombre completo- En alertas críticas: se usa ID, no nombre completo

- Separacion de datos personales y datos de salud- Separación de datos personales y datos de salud



### TRAZABILIDAD TOTAL### **Trazabilidad Total**

Cada accion se registra:Cada acción se registra:

```json```json

{{

  "id": "12345",  "id": "12345",

  "usuario": "user@empresa.com",  "usuario": "user@empresa.com",

  "accion": "Completo evaluacion de Salud Mental",  "accion": "Completó evaluación de Salud Mental",

  "fecha": "2026-01-20T10:30:45Z",  "fecha": "2026-01-20T10:30:45Z",

  "ip": "192.168.1.100",  "ip": "192.168.1.100",

  "detalles": {  "detalles": {

    "evaluacionId": "EVA-001",    "evaluacionId": "EVA-001",

    "modulo": "Salud Mental",    "modulo": "Salud Mental",

    "resultado": "Amarillo"    "resultado": "Amarillo"

  }  }

}}

``````



### MEDIDAS DE SEGURIDAD IMPLEMENTADAS### **Medidas de Seguridad Implementadas**

- HTTPS obligatorio (TLS 1.3)- ✅ HTTPS obligatorio (TLS 1.3)

- Autenticacion multifactor (opcional)- ✅ Autenticación multifactor (opcional)

- Tokens con expiracion corta- ✅ Tokens con expiración corta

- Refresh tokens almacenados de forma segura- ✅ Refresh tokens almacenados de forma segura

- Validacion de inputs (prevencion XSS, SQL Injection)- ✅ Validación de inputs (prevención XSS, SQL Injection)

- Rate limiting (prevencion DDoS)- ✅ Rate limiting (prevención DDoS)

- Logs de accesos sospechosos- ✅ Logs de accesos sospechosos

- Aislamiento de datos por empresa- ✅ Aislamiento de datos por empresa



------



## INTEGRACIONES## 🔗 Integraciones



### 1. POWER BI / TABLEAU### **1. Power BI / Tableau**

- Dashboard avanzado con visualizaciones- Dashboard avanzado con visualizaciones

- Conexion directa a vistas de SQL Server- Conexión directa a vistas de SQL Server

- Actualizacion en tiempo real- Actualización en tiempo real

- Filtros interactivos por empresa/area/sede- Filtros interactivos por empresa/área/sede



### 2. APIS DE ARL (ADMINISTRADORAS DE RIESGOS LABORALES)### **2. APIs de ARL (Administradoras de Riesgos Laborales)**

- Envio automatico de reportes agregados- Envío automático de reportes agregados

- Cumplimiento de normativas SST- Cumplimiento de normativas SST

- Formato XML o JSON segun requerimientos- Formato XML o JSON según requerimientos



### 3. HR TECH / HRIS (HUMAN RESOURCES INFORMATION SYSTEM)### **3. HR Tech / HRIS (Human Resources Information System)**

- Importacion masiva de usuarios- Importación masiva de usuarios

- Sincronizacion de cambios organizacionales- Sincronización de cambios organizacionales

- Actualizacion automatica de areas/sedes- Actualización automática de áreas/sedes



### 4. SISTEMA DE NOTIFICACIONES### **4. Sistema de Notificaciones**

- Email (SMTP configurado)- Email (SMTP configurado)

- SMS (Twilio/similar)- SMS (Twilio/similar)

- Push notifications (para version PWA futura)- Push notifications (para versión PWA futura)



### 5. EXPORTACION DE DATOS### **5. Exportación de Datos**

- PDF (reportes individuales y agregados)- PDF (reportes individuales y agregados)

- Excel (tablas dinamicas)- Excel (tablas dinámicas)

- CSV (para analisis externos)- CSV (para análisis externos)

- XML (para auditorias y ARL)- XML (para auditorías y ARL)



------



## EXPERIENCIA DE USUARIO (UX)## 🎨 Experiencia de Usuario (UX)



### MENSAJES DE ACOMPAÑAMIENTO EMOCIONAL### **Mensajes de Acompañamiento Emocional**

El sistema usa lenguaje empatico y cercano:El sistema usa lenguaje empático y cercano:



- BIENVENIDA: "Hola Maria, personas sanas, organizaciones fuertes"- ✨ **Bienvenida**: "Hola María, personas sanas, organizaciones fuertes"

- REFLEXION: "Tu bienestar tambien es parte de la productividad"- 🧘 **Reflexión**: "Tu bienestar también es parte de la productividad"

- ALERTA: "Tu cuerpo esta en alerta. Vamos a bajarle el ritmo juntos"- 💚 **Alerta**: "Tu cuerpo está en alerta. Vamos a bajarle el ritmo juntos"

- MOTIVACION: "Recuerda: conocerte es el primer paso para cuidarte"- 🎯 **Motivación**: "Recuerda: conocerte es el primer paso para cuidarte"



### ELEMENTOS CLAVE DE UX### **Elementos Clave de UX:**



#### PAUSAS GUIADAS#### **Pausas Guiadas**

- Ejercicios de respiracion de 2 minutos- Ejercicios de respiración de 2 minutos

- Animaciones visuales relajantes- Animaciones visuales relajantes

- Audio opcional (voz guia)- Audio opcional (voz guía)



#### RESULTADOS EXPLICADOS#### **Resultados Explicados**

- Lenguaje sencillo (sin tecnicismos)- Lenguaje sencillo (sin tecnicismos)

- Graficos visuales claros- Gráficos visuales claros

- Explicacion del puntaje- Explicación del puntaje

- Comparacion con evaluaciones anteriores- Comparación con evaluaciones anteriores



#### RECOMENDACIONES ACCIONABLES#### **Recomendaciones Accionables**

- No solo teoria, sino pasos concretos- No solo teoría, sino pasos concretos

- Videos cortos (2-3 minutos)- Videos cortos (2-3 minutos)

- Recursos descargables- Recursos descargables

- Enlaces a herramientas externas- Enlaces a herramientas externas



#### ACCESO INMEDIATO A AYUDA#### **Acceso Inmediato a Ayuda**

- Boton de "Necesito hablar con alguien"- Botón de "Necesito hablar con alguien"

- Chat o formulario de contacto- Chat o formulario de contacto

- Lineas de emergencia visibles- Líneas de emergencia visibles



### SEMAFORIZACION VISUAL### **Semaforización Visual**



``````

VERDE - BIENESTAR ADECUADO🟢 VERDE - Bienestar Adecuado

   "Excelente! Continua con tus habitos saludables"   "¡Excelente! Continúa con tus hábitos saludables"



AMARILLO - ATENCION PREVENTIVA🟡 AMARILLO - Atención Preventiva

   "Algunos aspectos necesitan atencion. Te recomendamos..."   "Algunos aspectos necesitan atención. Te recomendamos..."



ROJO - REQUIERE INTERVENCION🔴 ROJO - Requiere Intervención

   "Tu bienestar necesita apoyo profesional. Contactanos ahora"   "Tu bienestar necesita apoyo profesional. Contáctanos ahora"

``````



------



## INDICADORES SVE PSICOSOCIAL## 📈 Indicadores SVE Psicosocial



El sistema calcula automaticamente:El sistema calcula automáticamente:



### 1. PREVALENCIA### **1. Prevalencia**

Porcentaje de trabajadores con condicion actualPorcentaje de trabajadores con condición actual

``````

Prevalencia = (Casos actuales / Total trabajadores) x 100Prevalencia = (Casos actuales / Total trabajadores) × 100

``````



### 2. INCIDENCIA### **2. Incidencia**

Porcentaje de casos nuevos en un periodoPorcentaje de casos nuevos en un período

``````

Incidencia = (Casos nuevos en periodo / Total trabajadores) x 100Incidencia = (Casos nuevos en período / Total trabajadores) × 100

``````



### 3. PARTICIPACION### **3. Participación**

Porcentaje de trabajadores que completaron evaluacionPorcentaje de trabajadores que completaron evaluación

``````

Participacion = (Evaluaciones completadas / Total trabajadores) x 100Participación = (Evaluaciones completadas / Total trabajadores) × 100

``````



### 4. EFECTIVIDAD DE INTERVENCIONES### **4. Efectividad de Intervenciones**

Comparacion antes/despues de implementar accionesComparación antes/después de implementar acciones

``````

Mejora = ((Puntaje despues - Puntaje antes) / Puntaje antes) x 100Mejora = ((Puntaje después - Puntaje antes) / Puntaje antes) × 100

``````



### 5. DISTRIBUCION POR NIVEL DE RIESGO### **5. Distribución por Nivel de Riesgo**

Porcentajes por area/sede:Porcentajes por área/sede:

``````

Area X:Área X:

- Verde: 70%- Verde: 70%

- Amarillo: 20%- Amarillo: 20%

- Rojo: 10%- Rojo: 10%

``````



------



## RESUMEN EJECUTIVO## 🚀 Resumen Ejecutivo



### QUE HACE EMOCHECK### **¿Qué hace EmoCheck?**



1. EVALUA la salud mental y bienestar de trabajadores con cuestionarios cientificos1. ✅ **Evalúa** la salud mental y bienestar de trabajadores con cuestionarios científicos

2. DETECTA casos de riesgo con semaforizacion automatica2. ✅ **Detecta** casos de riesgo con semaforización automática

3. ALERTA a los responsables de HSE/psicologia cuando hay casos criticos3. ✅ **Alerta** a los responsables de HSE/psicología cuando hay casos críticos

4. RECOMIENDA recursos personalizados segun el resultado4. ✅ **Recomienda** recursos personalizados según el resultado

5. REPORTA indicadores agregados para toma de decisiones5. ✅ **Reporta** indicadores agregados para toma de decisiones

6. CUMPLE con normativas legales de proteccion de datos y salud ocupacional6. ✅ **Cumple** con normativas legales de protección de datos y salud ocupacional

7. INTEGRA con herramientas externas (BI, ARL, HRIS)7. ✅ **Integra** con herramientas externas (BI, ARL, HRIS)



### BENEFICIOS CLAVE### **Beneficios Clave**



PARA LA EMPRESA:**Para la Empresa:**

- Cumplimiento legal (Resolucion 2404/2019)- Cumplimiento legal (Resolución 2404/2019)

- Reduccion de ausentismo- Reducción de ausentismo

- Mejora del clima laboral- Mejora del clima laboral

- Datos para toma de decisiones- Datos para toma de decisiones

- ROI medible- ROI medible



PARA EL TRABAJADOR:**Para el Trabajador:**

- Autoconocimiento de su salud mental- Autoconocimiento de su salud mental

- Acceso a recursos de bienestar- Acceso a recursos de bienestar

- Confidencialidad garantizada- Confidencialidad garantizada

- Apoyo profesional cuando lo necesita- Apoyo profesional cuando lo necesita

- Prevencion de condiciones graves- Prevención de condiciones graves



PARA EL AREA DE HSE/RRHH:**Para el Área de HSE/RRHH:**

- Visibilidad de tendencias- Visibilidad de tendencias

- Alertas tempranas- Alertas tempranas

- Reportes automatizados- Reportes automatizados

- Seguimiento de casos- Seguimiento de casos

- Evidencia para auditorias- Evidencia para auditorías



------



## STACK TECNOLOGICO## 📦 Stack Tecnológico



### FRONTEND### **Frontend**

- Angular 21 (Standalone Components)- Angular 21 (Standalone Components)

- TypeScript 5.x- TypeScript 5.x

- RxJS para programacion reactiva- RxJS para programación reactiva

- Chart.js / ApexCharts para graficos- Chart.js / ApexCharts para gráficos

- TailwindCSS / Angular Material para UI- TailwindCSS / Angular Material para UI

- PWA capabilities (opcional)- PWA capabilities (opcional)



### BACKEND### **Backend**

- .NET 8 (C#)- .NET 8 (C#)

- Entity Framework Core 8- Entity Framework Core 8

- ASP.NET Core Web API- ASP.NET Core Web API

- FluentValidation- FluentValidation

- AutoMapper- AutoMapper

- MediatR (CQRS pattern)- MediatR (CQRS pattern)

- Serilog (logging estructurado)- Serilog (logging estructurado)

- xUnit (testing)- xUnit (testing)



### BASE DE DATOS### **Base de Datos**

- SQL Server 2022 / Azure SQL- SQL Server 2022 / Azure SQL

- Redis (cache de sesiones)- Redis (caché de sesiones)



### DEVOPS### **DevOps**

- Git / GitHub- Git / GitHub

- Docker / Docker Compose- Docker / Docker Compose

- CI/CD (GitHub Actions / Azure DevOps)- CI/CD (GitHub Actions / Azure DevOps)

- SonarQube (analisis de codigo)- SonarQube (análisis de código)

- Swagger / OpenAPI (documentacion)- Swagger / OpenAPI (documentación)



### INFRAESTRUCTURA (ASUMIDA POR CLIENTE)### **Infraestructura (asumida por cliente)**

- Azure App Service / AWS EC2- Azure App Service / AWS EC2

- Azure SQL Database / AWS RDS- Azure SQL Database / AWS RDS

- Azure Blob Storage / AWS S3- Azure Blob Storage / AWS S3

- Azure Application Insights / CloudWatch- Azure Application Insights / CloudWatch

- CDN para assets estaticos- CDN para assets estáticos

- SSL/TLS certificates- SSL/TLS certificates



------



## PROXIMOS PASOS## 📝 Próximos Pasos



### FASE 1: PLANIFICACION (2 SEMANAS)### **Fase 1: Planificación (2 semanas)**

- Definir requerimientos funcionales detallados- [ ] Definir requerimientos funcionales detallados

- Diseñar modelo de datos completo- [ ] Diseñar modelo de datos completo

- Crear wireframes de pantallas clave- [ ] Crear wireframes de pantallas clave

- Definir arquitectura de integracion- [ ] Definir arquitectura de integración



### FASE 2: DESARROLLO BACKEND (6 SEMANAS)### **Fase 2: Desarrollo Backend (6 semanas)**

- Setup proyecto .NET 8 con arquitectura hexagonal- [ ] Setup proyecto .NET 8 con arquitectura hexagonal

- Implementar autenticacion y autorizacion- [ ] Implementar autenticación y autorización

- Desarrollar APIs de modulo de Salud Mental- [ ] Desarrollar APIs de módulo de Salud Mental

- Implementar sistema de alertas- [ ] Implementar sistema de alertas

- Crear reportes y dashboards API- [ ] Crear reportes y dashboards API



### FASE 3: DESARROLLO FRONTEND (6 SEMANAS)### **Fase 3: Desarrollo Frontend (6 semanas)**

- Setup proyecto Angular 21- [ ] Setup proyecto Angular 21

- Implementar flujo de registro y consentimiento- [ ] Implementar flujo de registro y consentimiento

- Desarrollar modulo de evaluaciones- [ ] Desarrollar módulo de evaluaciones

- Crear dashboard administrativo- [ ] Crear dashboard administrativo

- Implementar centro de recursos- [ ] Implementar centro de recursos



### FASE 4: INTEGRACION Y TESTING (3 SEMANAS)### **Fase 4: Integración y Testing (3 semanas)**

- Integracion frontend-backend- [ ] Integración frontend-backend

- Testing E2E- [ ] Testing E2E

- Testing de seguridad- [ ] Testing de seguridad

- Optimizacion de performance- [ ] Optimización de performance

- Documentacion tecnica- [ ] Documentación técnica



### FASE 5: DESPLIEGUE (1 SEMANA)### **Fase 5: Despliegue (1 semana)**

- Setup de infraestructura- [ ] Setup de infraestructura

- Configuracion de CI/CD- [ ] Configuración de CI/CD

- Migracion de datos (si aplica)- [ ] Migración de datos (si aplica)

- Capacitacion a administradores- [ ] Capacitación a administradores

- Go-live- [ ] Go-live



------



## CONTACTO TECNICO## 📞 Contacto Técnico



Repositorio: https://github.com/CRISTIANROJAS1995/emocheck-api  **Repositorio:** https://github.com/CRISTIANROJAS1995/emocheck-api

Rama principal: main  **Rama principal:** main

Fecha de inicio: Enero 20, 2026  **Fecha de inicio:** Enero 20, 2026



------



## LICENCIA Y CONFIDENCIALIDAD## 📄 Licencia y Confidencialidad



Este documento es confidencial y propiedad del proyecto EmoCheck.  Este documento es confidencial y propiedad del proyecto EmoCheck.

Todos los derechos reservados - 2026Todos los derechos reservados © 2026



------



Ultima actualizacion: 2026-01-20  **Última actualización:** 2026-01-20

Version del documento: 1.0  **Versión del documento:** 1.0

Autor: GitHub Copilot (AI Assistant)**Autor:** GitHub Copilot (AI Assistant)

