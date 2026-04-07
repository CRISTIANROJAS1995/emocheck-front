# Permisos de Endpoints por Rol — EmoCheck Frontend

Este documento lista todos los endpoints que consume el frontend, organizados por menú y rol,
para que el backend configure los permisos correctos por rol.

> **Convención de URLs:** todas tienen el prefijo `/api`  
> **Scoped** = el backend inyecta el `CompanyID` desde el JWT automáticamente (no se envía en la URL)

---

## 1. SuperAdmin / SystemAdmin / Admin

### Centro de Control (`/admin`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/indicators` | Indicadores generales |
| GET | `/dashboard/risk-distribution` | Distribución de riesgo |
| GET | `/dashboard/trends` | Tendencias |
| GET | `/dashboard/module-statistics` | Estadísticas por módulo |
| GET | `/dashboard/area-comparison` | Comparativo por área |

### Módulos (`/admin/modules`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/catalog/modules` | Listar módulos |
| POST | `/catalog/modules` | Crear módulo |
| PUT | `/catalog/modules/{id}` | Actualizar módulo |
| DELETE | `/catalog/modules/{id}` | Desactivar módulo |

### Evaluaciones (`/admin/evaluations`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/evaluation/my-company` | Listar evaluaciones de empresa |
| GET | `/evaluation/{id}/details` | Detalle de evaluación |

### Gestión de la Organización (`/admin/config`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/company` | Listar empresas |
| POST | `/company` | Crear empresa |
| PUT | `/company/{id}` | Actualizar empresa |
| DELETE | `/company/{id}` | Desactivar empresa |
| GET | `/company/{id}/sites` | Sedes de empresa |
| POST | `/company/sites` | Crear sede |
| PUT | `/company/sites/{id}` | Actualizar sede |
| DELETE | `/company/sites/{id}` | Desactivar sede |
| GET | `/company/{id}/areas` | Áreas de empresa |
| POST | `/company/areas` | Crear área |
| PUT | `/company/areas/{id}` | Actualizar área |
| DELETE | `/company/areas/{id}` | Desactivar área |
| GET | `/catalog/job-types` | Tipos de cargo |
| POST | `/catalog/job-types` | Crear tipo de cargo |
| PUT | `/catalog/job-types/{id}` | Actualizar tipo de cargo |
| DELETE | `/catalog/job-types/{id}` | Desactivar tipo de cargo |

### Recomendaciones (`/admin/recommendations`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/recommendations` | Listar recomendaciones |
| POST | `/recommendations` | Crear recomendación |
| PUT | `/recommendations/{id}` | Actualizar recomendación |
| DELETE | `/recommendations/{id}` | Eliminar recomendación |

### Seguimiento de Indicadores (`/admin/reports`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/export` | Solicitar exportación |
| GET | `/export/my-exports` | Ver mis exportaciones |
| GET | `/export/{id}` | Detalle de exportación |
| GET | `/export/{id}/download` | Descargar archivo exportado |

### Seguimiento a Casos (`/admin/cases`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/casetracking/status/OPEN` | Casos abiertos |
| GET | `/casetracking/status/IN_PROGRESS` | Casos en progreso |
| GET | `/casetracking/status/CLOSED` | Casos cerrados |
| GET | `/casetracking/status/ESCALATED` | Casos escalados |
| GET | `/casetracking/{id}` | Detalle de caso |
| POST | `/casetracking` | Crear caso |
| PUT | `/casetracking/{id}` | Actualizar caso |
| PATCH | `/casetracking/{id}/close` | Cerrar caso |
| GET | `/casetracking/{id}/follow-ups` | Seguimientos del caso |
| POST | `/casetracking/{id}/follow-ups` | Agregar seguimiento |

### Usuarios (`/admin/users`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Listar usuarios |
| POST | `/users` | Crear usuario |
| PUT | `/users/{id}` | Actualizar usuario |
| DELETE | `/users/{id}` | Eliminar usuario |
| PATCH | `/users/{id}/activate` | Activar usuario |
| PATCH | `/users/{id}/deactivate` | Desactivar usuario |
| POST | `/users/{id}/roles/{roleId}` | Asignar rol |
| DELETE | `/users/{id}/roles/{roleId}` | Quitar rol |
| POST | `/auth/admin-reset-password/{id}` | Resetear contraseña |
| POST | `/users/bulk-upload` | Carga masiva (multipart) |
| GET | `/catalog/roles/active` | Listar roles activos |

### Alertas (`/admin/alerts`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alert` | Listar todas las alertas |
| GET | `/alert/{id}` | Detalle de alerta |
| GET | `/alert/statistics` | Estadísticas de alertas |
| GET | `/alert/status/{status}` | Alertas por estado |
| GET | `/alert/severity/{severity}` | Alertas por severidad |
| GET | `/alert/company/{companyId}` | Alertas por empresa |
| GET | `/alert/area/{areaId}` | Alertas por área |
| POST | `/alert` | Crear alerta |
| PATCH | `/alert/{id}/acknowledge` | Reconocer alerta |
| PATCH | `/alert/{id}/resolve` | Resolver alerta |

### Auditoría (`/admin/audit`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/audit` | Listar registros de auditoría |
| GET | `/audit/{id}` | Detalle de registro |

### Recursos (`/admin/resources`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/resources` | Listar recursos |
| POST | `/resources` | Crear recurso |
| PUT | `/resources/{id}` | Actualizar recurso |
| DELETE | `/resources/{id}` | Eliminar recurso |

### Catálogos (`/admin/catalogs`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/catalog/job-types` | Tipos de cargo |
| GET | `/catalog/roles/active` | Roles activos |
| GET | `/catalog/roles` | Todos los roles |
| POST | `/catalog/roles` | Crear rol |
| PUT | `/catalog/roles/{id}` | Actualizar rol |
| DELETE | `/catalog/roles/{id}` | Desactivar rol |

### Ayuda (`/support`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/support/professionals` | Listar profesionales |
| POST | `/support` | Crear solicitud de soporte |
| GET | `/support/my-requests` | Mis solicitudes |

---

## 2. CompanyAdmin / HRManager

> Todos los endpoints `my-company` **no reciben `companyId` en la URL** — el backend lo extrae del JWT.

### Seguimiento de Usuarios (`/admin` — Dashboard)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/my-company/indicators` | Indicadores de mi empresa |
| GET | `/dashboard/my-company/risk-distribution` | Distribución de riesgo |
| GET | `/dashboard/my-company/trends` | Tendencias |
| GET | `/dashboard/my-company/module-statistics` | Estadísticas por módulo |
| GET | `/dashboard/my-company/area-comparison` | Comparativo por área |

### Alertas (`/admin/alerts`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alert/my-company` | Alertas de mi empresa |
| GET | `/alert/{id}` | Detalle de alerta |
| PATCH | `/alert/{id}/acknowledge` | Reconocer alerta |
| PATCH | `/alert/{id}/resolve` | Resolver alerta |

### Seguimiento a Casos (`/admin/cases`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/casetracking/my-company` | Casos de mi empresa |
| GET | `/casetracking/{id}` | Detalle de caso |
| POST | `/casetracking` | Crear caso |
| PUT | `/casetracking/{id}` | Actualizar caso |
| PATCH | `/casetracking/{id}/close` | Cerrar caso |
| GET | `/casetracking/{id}/follow-ups` | Seguimientos del caso |
| POST | `/casetracking/{id}/follow-ups` | Agregar seguimiento |

### Reportes y Exportaciones (`/admin/reports`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/export` | Solicitar exportación |
| GET | `/export/my-exports` | Ver mis exportaciones |
| GET | `/export/{id}` | Detalle de exportación |
| GET | `/export/{id}/download` | Descargar archivo |

### Operaciones adicionales disponibles para CompanyAdmin / HRManager
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/my-company` | Listar usuarios de mi empresa |
| POST | `/users/my-company` | Crear usuario en mi empresa |
| GET | `/company/my-company` | Ver datos de mi empresa |
| GET | `/company/my-company/detail` | Detalle de mi empresa |
| PUT | `/company/my-company` | Actualizar mi empresa |
| GET | `/company/my-company/sites` | Sedes de mi empresa |
| POST | `/company/my-company/sites` | Crear sede |
| PUT | `/company/my-company/sites/{id}` | Actualizar sede |
| DELETE | `/company/my-company/sites/{id}` | Desactivar sede |
| GET | `/company/my-company/areas` | Áreas de mi empresa |
| POST | `/company/my-company/areas` | Crear área |
| PUT | `/company/my-company/areas/{id}` | Actualizar área |
| DELETE | `/company/my-company/areas/{id}` | Desactivar área |
| GET | `/evaluation/my-company` | Evaluaciones de mi empresa |
| GET | `/support/my-company` | Solicitudes de soporte de mi empresa |
| GET | `/catalog/roles/active` | Roles disponibles |
| GET | `/catalog/job-types` | Tipos de cargo |

---

## 3. Psychologist

### Seguimiento a Casos (`/admin/cases`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/casetracking/status/OPEN` | Casos abiertos |
| GET | `/casetracking/status/IN_PROGRESS` | Casos en progreso |
| GET | `/casetracking/status/CLOSED` | Casos cerrados |
| GET | `/casetracking/status/ESCALATED` | Casos escalados |
| GET | `/casetracking/{id}` | Detalle de caso |
| PUT | `/casetracking/{id}` | Actualizar caso (alimentar seguimiento) |
| GET | `/casetracking/{id}/follow-ups` | Seguimientos del caso |
| POST | `/casetracking/{id}/follow-ups` | Agregar seguimiento |

### Alertas (`/admin/alerts`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/alert` | Listar alertas |
| GET | `/alert/{id}` | Detalle de alerta |
| PATCH | `/alert/{id}/acknowledge` | Reconocer alerta |
| PATCH | `/alert/{id}/resolve` | Resolver alerta |

### Ayuda (`/support`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/support/professionals` | Listar profesionales |
| POST | `/support` | Crear solicitud |
| GET | `/support/my-requests` | Mis solicitudes |

---

## 4. Employee

### Mis Evaluaciones (`/home`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/evaluation/my-evaluations` | Evaluaciones del usuario |
| GET | `/evaluation/my-completed` | Evaluaciones completadas con resultado |

### Mi Seguimiento (`/my-tracking`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/my-tracking` | Datos de seguimiento personal |

### Mi Plan (`/my-plan`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/recommendations/my-plan` | Plan de recomendaciones |

### Mi Perfil (`/profile`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users/{id}` | Ver perfil |
| PUT | `/users/{id}` | Actualizar perfil |

### Recursos (`/resources`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/resources` | Listar recursos disponibles |

### Ayuda (`/support`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/support/professionals` | Listar profesionales |
| POST | `/support` | Crear solicitud de soporte |
| GET | `/support/my-requests` | Mis solicitudes |

---

## Resumen de Endpoints `my-company` (Scoped por JWT)

Estos endpoints deben validar que el usuario tenga rol `CompanyAdmin` o `HRManager`,
y el backend extrae el `companyId` del token — **no se envía en la URL**.

| Endpoint | Método | Equivalente global |
|----------|--------|--------------------|
| `/users/my-company` | GET / POST | `/users` |
| `/company/my-company` | GET / PUT | `/company/{id}` |
| `/company/my-company/detail` | GET | `/company/{id}/detail` |
| `/company/my-company/sites` | GET / POST | `/company/{id}/sites` |
| `/company/my-company/sites/{id}` | PUT / DELETE | `/company/sites/{id}` |
| `/company/my-company/areas` | GET / POST | `/company/{id}/areas` |
| `/company/my-company/areas/{id}` | PUT / DELETE | `/company/areas/{id}` |
| `/alert/my-company` | GET | `/alert` |
| `/casetracking/my-company` | GET | `/casetracking` |
| `/evaluation/my-company` | GET | `/evaluation` |
| `/support/my-company` | GET | `/support` |
| `/dashboard/my-company/indicators` | GET | `/dashboard/indicators` |
| `/dashboard/my-company/risk-distribution` | GET | `/dashboard/risk-distribution` |
| `/dashboard/my-company/trends` | GET | `/dashboard/trends` |
| `/dashboard/my-company/module-statistics` | GET | `/dashboard/module-statistics` |
| `/dashboard/my-company/area-comparison` | GET | `/dashboard/area-comparison` |
