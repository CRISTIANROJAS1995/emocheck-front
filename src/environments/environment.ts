export const environment = {
    production: false,
    // DEV: API local para pruebas (HTTP para evitar ERR_CERT_AUTHORITY_INVALID)
    apiUrl: 'http://localhost:5230/api',
    apiBaseUrl: 'http://localhost:5230',

    // Análisis emocional: usa la misma API local
    emotionalAnalysisApiUrl: 'http://localhost:5230/api',
    apiTimeout: 30000,
    appName: 'EmoCheck',
    version: '1.0.0',

    // 🔧 Configuraciones adicionales
    defaultPageSize: 10,
    maxFileSize: 5242880, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],

    // 🔐 Configuración de autenticación
    tokenStorageKey: 'emocheck_token',
    refreshTokenStorageKey: 'emocheck_refreshToken',
    userStorageKey: 'emocheck_user',
    tokenExpirationWarning: 300000, // 5 minutos en ms


};
