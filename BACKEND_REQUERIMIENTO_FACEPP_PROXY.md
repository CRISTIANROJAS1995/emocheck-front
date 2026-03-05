# Backend — Proxy Face++ para Análisis Emocional

**Fecha:** 5 de marzo de 2026
**Prioridad:** ✅ RESUELTO — Backend implementado. Frontend actualizado.
**Módulo afectado:** `POST /api/evaluation/facepp/detect`

---

## Estado

| Lado | Estado | Detalle |
|---|---|---|
| Backend | ✅ Implementado | `POST /api/evaluation/facepp/detect` — pass-through Face++, timeout 10s → HTTP 504 |
| Frontend | ✅ Actualizado | `FaceEmotionDetectorService` usa `backendDetectUrl` con `{ imageBase64 }` |
| API keys producción | ⚠️ Pendiente coordinar | Variables de entorno: `AzureCognitive.FacePlusPlus.ApiKey` y `ApiSecret` en servidor |

---

## Problema (resuelto)

Face++ API **no soporta CORS desde el navegador**. Cuando el frontend (Angular) está desplegado en un hosting (Hostinger u otro), el navegador bloquea la llamada directa a `https://api-us.faceplusplus.com/facepp/v3/detect` con error CORS.

En desarrollo local (`ng serve`) esto no ocurre porque Angular usa un proxy interno (`proxy.conf.json`) que redirige la llamada desde el servidor Node. En producción ese proxy no existe.

---

## Solución requerida

Implementar un endpoint en el backend que actúe como **proxy transparente** hacia Face++ API:

```
POST /api/evaluation/facepp/detect
```

El frontend ya llama este endpoint. Solo falta que el backend lo implemente.

---

## Contrato del endpoint

### Request

```
POST /api/evaluation/facepp/detect
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageBase64": "<imagen JPEG en base64, sin prefijo data:image>"
}
```

### Lógica del backend

1. Recibir `imageBase64` del frontend
2. Construir un `multipart/form-data` con:
   - `api_key` = `fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs`  ← guardar en config del servidor
   - `api_secret` = `xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26` ← guardar en config del servidor
   - `image_base64` = el valor recibido del frontend
   - `return_attributes` = `emotion,headpose,blur,facequality`
3. Hacer `POST https://api-us.faceplusplus.com/facepp/v3/detect` con ese FormData
4. Retornar la respuesta de Face++ **tal cual** al frontend (pass-through)

### Response exitosa (pass-through de Face++)

```json
HTTP 200
{
  "image_id": "abc123",
  "request_id": "...",
  "time_used": 312,
  "faces": [
    {
      "face_token": "...",
      "face_rectangle": { "top": 100, "left": 80, "width": 200, "height": 200 },
      "attributes": {
        "emotion": {
          "anger": 0.2,
          "disgust": 0.1,
          "fear": 0.3,
          "happiness": 85.5,
          "neutral": 12.4,
          "sadness": 0.8,
          "surprise": 0.7
        },
        "headpose": {
          "pitch_angle": -2.1,
          "roll_angle": 0.5,
          "yaw_angle": 3.2
        },
        "blur": {
          "blurness": { "threshold": 50, "value": 10 },
          "motionblur": { "threshold": 50, "value": 8 },
          "gaussianblur": { "threshold": 50, "value": 5 }
        },
        "facequality": {
          "threshold": 70.1,
          "value": 88.3
        }
      }
    }
  ]
}
```

### Response sin rostro detectado

```json
HTTP 200
{
  "image_id": "...",
  "request_id": "...",
  "time_used": 150,
  "faces": []
}
```

### Errores de Face++ a manejar

| `error_message` de Face++ | Qué retornar al frontend |
|---|---|
| `FREE_CALL_COUNT_LIMIT` | Retornar tal cual (el frontend lo interpreta) |
| `AUTHENTICATION_ERROR` | Retornar tal cual o HTTP 500 con mensaje claro |
| `IMAGE_ERROR_UNSUPPORTED_FORMAT` | Retornar tal cual |
| Timeout de Face++ (>5s) | HTTP 504 o retornar `{ "faces": [] }` |

---

## Consideraciones de seguridad

- Las API keys de Face++ **deben estar en variables de entorno del servidor**, NO hardcodeadas en el código fuente del backend.
- El endpoint debe requerir autenticación (`Authorization: Bearer <token>`) para evitar abuso.
- Opcional: rate-limiting por usuario (ej. máx 100 llamadas por hora por usuario).

---

## Por qué es necesario (resumen técnico)

| Escenario | ¿Funciona? | Razón |
|---|---|---|
| `ng serve` local | ✅ | El proxy de Angular intercepta antes de que el navegador haga la petición |
| Producción sin proxy backend | ❌ | CORS: el navegador bloquea peticiones cross-origin a Face++ |
| Producción **con** proxy backend | ✅ | El frontend llama a su propio backend (mismo origen o CORS configurado), el backend llama a Face++ server-to-server sin restricciones |

---

## Estado actual del frontend (implementado ✅)

```typescript
// face-emotion-detector.service.ts — ACTIVO
private readonly backendDetectUrl = `${environment.apiUrl}/evaluation/facepp/detect`;

// callFacePlusPlusWithRetry usa:
this.http.post<any>(this.backendDetectUrl, { imageBase64: base64Image })
```

Casos de error manejados en el frontend:

| Error | Comportamiento |
|---|---|
| `FREE_CALL_COUNT_LIMIT` | Detiene análisis + mensaje al usuario |
| `AUTHENTICATION_ERROR` | Log en consola (API keys no configuradas en servidor) |
| HTTP 504 | Salta el frame, no reintenta |
| CORS (status 0) | Mensaje al usuario: "restricción de seguridad del navegador" |

---

## ⚠️ Pendiente antes de producción

Coordinar con el equipo de backend el seteo de las API keys en el servidor de producción:

```
AzureCognitive.FacePlusPlus.ApiKey    = fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs
AzureCognitive.FacePlusPlus.ApiSecret = xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26
```

En local (desarrollo): agregar en `appsettings.Development.json` del backend bajo la sección `AzureCognitive.FacePlusPlus`.

---

## 🔴 Ajuste urgente requerido al backend — Fallback de API keys en el body

**Problema detectado:** El endpoint devuelve `{"error_message":"MISSING_ARGUMENTS: api_key"}` porque las variables de entorno no están configuradas en el servidor aún.

**Solución temporal (hasta que las variables de entorno estén configuradas):**

El frontend ahora envía las keys en el body como fallback:

```json
POST /api/evaluation/facepp/detect
{
  "imageBase64": "<base64>",
  "apiKey": "fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs",
  "apiSecret": "xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26"
}
```

**El backend debe ajustar la lógica de resolución de keys así:**

```csharp
// Prioridad: variables de entorno del servidor > keys del body (fallback)
var apiKey    = _config["AzureCognitive:FacePlusPlus:ApiKey"]
                ?? request.ApiKey
                ?? throw new Exception("Face++ API key not configured");

var apiSecret = _config["AzureCognitive:FacePlusPlus:ApiSecret"]
                ?? request.ApiSecret
                ?? throw new Exception("Face++ API secret not configured");
```

**Una vez que las variables de entorno estén seteadas en el servidor**, las keys del body serán ignoradas automáticamente (la variable de entorno tiene prioridad). El frontend puede seguir enviándolas sin problema.
