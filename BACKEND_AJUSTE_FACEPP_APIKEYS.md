# Backend — Ajuste: API Keys en `POST /api/evaluation/facepp/detect`

**Fecha:** 5 de marzo de 2026
**Prioridad:** ✅ RESUELTO — Backend actualizado. Frontend listo para build.
**Endpoint:** `POST /api/evaluation/facepp/detect`

---

## Problema actual

El endpoint responde con el siguiente error:

```json
{ "error_message": "MISSING_ARGUMENTS: api_key" }
```

Esto ocurre porque el backend no tiene las variables de entorno `AzureCognitive:FacePlusPlus:ApiKey` y `ApiSecret` configuradas en el servidor, entonces llama a Face++ sin credenciales.

---

## Ajuste requerido

El frontend ya envía las keys en el body como fallback temporal. El backend debe leerlas si las variables de entorno no están disponibles.

### Body actual que envía el frontend

```json
POST /api/evaluation/facepp/detect
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageBase64": "<imagen JPEG en base64 sin prefijo data:image>",
  "apiKey": "fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs",
  "apiSecret": "xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26"
}
```

### DTO esperado (agregar los campos opcionales)

```csharp
public class FacePlusPlusDetectRequest
{
    public string ImageBase64 { get; set; }

    // Fallback: si las variables de entorno no están configuradas,
    // usar las keys que envía el frontend
    public string? ApiKey    { get; set; }
    public string? ApiSecret { get; set; }
}
```

### Lógica de resolución de keys (prioridad: servidor > body)

```csharp
// Prioridad 1: variables de entorno del servidor (lo correcto en producción)
// Prioridad 2: keys del body enviadas por el frontend (fallback temporal)
var apiKey = _config["AzureCognitive:FacePlusPlus:ApiKey"]
             ?? request.ApiKey
             ?? throw new InvalidOperationException("Face++ ApiKey no configurada");

var apiSecret = _config["AzureCognitive:FacePlusPlus:ApiSecret"]
                ?? request.ApiSecret
                ?? throw new InvalidOperationException("Face++ ApiSecret no configurada");
```

### Llamada a Face++ (sin cambios en esta parte)

```csharp
var form = new MultipartFormDataContent();
form.Add(new StringContent(apiKey),          "api_key");
form.Add(new StringContent(apiSecret),       "api_secret");
form.Add(new StringContent(request.ImageBase64), "image_base64");
form.Add(new StringContent("emotion,headpose,blur,facequality"), "return_attributes");

var response = await _httpClient.PostAsync(
    "https://api-us.faceplusplus.com/facepp/v3/detect",
    form
);

// Retornar la respuesta tal cual al frontend (pass-through)
var content = await response.Content.ReadAsStringAsync();
return Ok(JsonSerializer.Deserialize<object>(content));
```

---

## Respuesta esperada (pass-through de Face++)

```json
HTTP 200
{
  "image_id": "abc123",
  "request_id": "...",
  "time_used": 312,
  "faces": [
    {
      "face_token": "...",
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
          "motionblur":   { "value": 8 },
          "gaussianblur": { "value": 5 }
        },
        "facequality": { "value": 88.3 }
      }
    }
  ]
}
```

Si no hay rostro en la imagen:

```json
HTTP 200
{
  "faces": []
}
```

---

## Errores de Face++ que el frontend ya maneja

| `error_message` de Face++ | Acción recomendada en backend |
|---|---|
| `FREE_CALL_COUNT_LIMIT` | Retornar `HTTP 200` con el JSON de Face++ tal cual |
| `AUTHENTICATION_ERROR`  | Retornar `HTTP 200` con el JSON de Face++ tal cual |
| `MISSING_ARGUMENTS`     | No debería ocurrir con este fix |
| Timeout Face++ (>10s)   | Retornar `HTTP 504` (ya configurado) |

---

## Plan de transición

| Fase | Acción |
|---|---|
| **Ahora (temporal)** | Backend lee `apiKey`/`apiSecret` del body como fallback → análisis funciona de inmediato |
| **Cuando estén listas las variables de entorno** | Setear `AzureCognitive:FacePlusPlus:ApiKey` y `ApiSecret` en el servidor → el fallback del body es ignorado automáticamente |
| **Largo plazo (opcional)** | El frontend puede dejar de enviar las keys en el body una vez confirmado que las variables de entorno están funcionando |

---

## Keys de Face++

```
ApiKey    = fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs
ApiSecret = xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26
```

Para configurar en local: `appsettings.Development.json`

```json
{
  "AzureCognitive": {
    "FacePlusPlus": {
      "ApiKey": "fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs",
      "ApiSecret": "xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26"
    }
  }
}
```
