# Permisos de Módulos por Usuario

El SuperAdmin puede habilitar o deshabilitar módulos individualmente para cada usuario.
El frontend debe respetar esta configuración y mostrar u ocultar módulos según los permisos.

---

## 1. Login — obtener módulos habilitados

Desde el login (y refresh token) la respuesta ya incluye la lista de módulos habilitados. No hace falta llamada extra.

**POST** `/api/auth/login`

```json
{
  "success": true,
  "token": "eyJ...",
  "refreshToken": "abc123",
  "user": {
    "userID": 42,
    "fullName": "Ana García",
    "email": "ana@empresa.com",
    "roles": ["Employee"],
    "companyID": 5,
    "companyName": "Empresa SA",
    "enabledModuleIds": [1, 3, 4]
  }
}
```

> `enabledModuleIds` contiene los IDs de los módulos que el usuario tiene **habilitados**.
> Si un módulo **no aparece** en la lista, el usuario no tiene acceso a él.

### Módulos del sistema

| ModuleID | Nombre | Código |
|---|---|---|
| 1 | Salud Mental | `SALUD_MENTAL` |
| 2 | Fatiga Laboral | `FATIGA` |
| 3 | Clima Organizacional | `CLIMA` |
| 4 | Riesgo Psicosocial | `RIESGO` |
| 5 | Compromiso Organizacional | `ECO` |

---

## 2. Guardar los módulos en el estado global

Al hacer login, guardar `enabledModuleIds` junto al resto del perfil de usuario.

```ts
// Ejemplo con Zustand / Context
interface AuthState {
  user: {
    userID: number;
    fullName: string;
    roles: string[];
    companyID: number;
    enabledModuleIds: number[];  // ← guardar esto
  } | null;
}
```

Al hacer **refresh token**, actualizar también `enabledModuleIds` ya que el SuperAdmin puede haber cambiado los permisos.

---

## 3. Lógica de acceso en el frontend

### Helper recomendado

```ts
function hasModuleAccess(enabledModuleIds: number[], moduleId: number): boolean {
  return enabledModuleIds.includes(moduleId);
}
```

### Uso en navegación / menú lateral

Mostrar solo los módulos que el usuario tiene habilitados:

```ts
const MODULES = [
  { id: 1, name: 'Salud Mental',             route: '/salud-mental'   },
  { id: 2, name: 'Fatiga Laboral',           route: '/fatiga'         },
  { id: 3, name: 'Clima Organizacional',     route: '/clima'          },
  { id: 4, name: 'Riesgo Psicosocial',       route: '/psicosocial'    },
  { id: 5, name: 'Compromiso Organizacional',route: '/eco'            },
];

// Filtrar solo los habilitados
const visibleModules = MODULES.filter(m => enabledModuleIds.includes(m.id));
```

### Protección de rutas

Si el usuario intenta acceder directamente a la URL de un módulo sin permiso, redirigir a `/unauthorized` o a la pantalla de inicio.

```ts
// Ejemplo con React Router guard
function ModuleRoute({ moduleId, children }) {
  const { enabledModuleIds } = useAuth();

  if (!enabledModuleIds.includes(moduleId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// En el router
<ModuleRoute moduleId={4}>
  <PsicosocialPage />
</ModuleRoute>
```

---

## 4. Pantalla de Super Admin — gestión de permisos

El SuperAdmin puede ver y modificar los permisos de módulo de cualquier usuario.

### 4.1 Consultar permisos de un usuario

**GET** `/api/user-modules/{userId}`
Requiere rol: `SuperAdmin`

**Respuesta:**
```json
[
  { "moduleID": 1, "moduleName": "Salud Mental",              "moduleCode": "SALUD_MENTAL", "isEnabled": true,  "displayOrder": 1 },
  { "moduleID": 2, "moduleName": "Fatiga Laboral",            "moduleCode": "FATIGA",       "isEnabled": false, "displayOrder": 2 },
  { "moduleID": 3, "moduleName": "Clima Organizacional",      "moduleCode": "CLIMA",        "isEnabled": true,  "displayOrder": 3 },
  { "moduleID": 4, "moduleName": "Riesgo Psicosocial",        "moduleCode": "RIESGO",       "isEnabled": true,  "displayOrder": 4 },
  { "moduleID": 5, "moduleName": "Compromiso Organizacional", "moduleCode": "ECO",          "isEnabled": false, "displayOrder": 5 }
]
```

Siempre devuelve **todos** los módulos del sistema con su estado actual para ese usuario.

---

### 4.2 Prender o apagar un módulo (toggle individual)

**PATCH** `/api/user-modules/{userId}/module/{moduleId}`
Requiere rol: `SuperAdmin`

**Body:**
```json
{ "isEnabled": false }
```

**Respuesta `200`:**
```json
{ "message": "Módulo 2 deshabilitado para el usuario 42." }
```

---

### 4.3 Guardar todos los permisos en bulk

**PUT** `/api/user-modules/{userId}`
Requiere rol: `SuperAdmin`

Útil al guardar desde un formulario con checkboxes.

**Body:**
```json
{
  "permissions": [
    { "moduleID": 1, "isEnabled": true  },
    { "moduleID": 2, "isEnabled": false },
    { "moduleID": 3, "isEnabled": true  },
    { "moduleID": 4, "isEnabled": true  },
    { "moduleID": 5, "isEnabled": false }
  ]
}
```

**Respuesta `200`:**
```json
{ "message": "Permisos de módulo actualizados." }
```

---

### 4.4 El usuario consulta sus propios módulos

**GET** `/api/user-modules/me`
Cualquier usuario autenticado puede consultar sus propios módulos.
Útil para re-sincronizar sin hacer un refresh token completo.

---

## 5. UI sugerida para el Super Admin

En la pantalla de edición de usuario, agregar una sección **"Módulos habilitados"** con un toggle/switch por módulo:

```
┌─────────────────────────────────────────────┐
│  Módulos habilitados                         │
├────────────────────────────┬────────────────┤
│  Salud Mental              │  ●  ON          │
│  Fatiga Laboral            │  ○  OFF         │
│  Clima Organizacional      │  ●  ON          │
│  Riesgo Psicosocial        │  ●  ON          │
│  Compromiso Organizacional │  ○  OFF         │
└────────────────────────────┴────────────────┘
                        [ Guardar permisos ]
```

- Al abrir la pantalla → llamar `GET /api/user-modules/{userId}` para cargar estado actual.
- Al presionar un toggle → llamar `PATCH /api/user-modules/{userId}/module/{moduleId}` inmediatamente (o acumular y usar el `PUT` bulk al guardar).
- Después de guardar → notificar al usuario que los cambios tomarán efecto en su próxima sesión (o al refrescar el token).

---

## 6. Resumen de endpoints

| Método | Ruta | Rol | Uso |
|---|---|---|---|
| `GET` | `/api/user-modules/me` | Autenticado | Mis módulos (sincronización) |
| `GET` | `/api/user-modules/{userId}` | SuperAdmin | Ver módulos de un usuario |
| `PUT` | `/api/user-modules/{userId}` | SuperAdmin | Guardar todos en bulk |
| `PATCH` | `/api/user-modules/{userId}/module/{moduleId}` | SuperAdmin | Toggle individual |
