export const environment = {
    production: false,
    // API principal (server) para que el resto de módulos sigan funcionando
    apiUrl: 'https://kratosconquer-001-site1.mtempurl.com/api',
    apiBaseUrl: 'https://kratosconquer-001-site1.mtempurl.com',

    // Override SOLO para análisis emocional (API local mientras se valida Azure)
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
