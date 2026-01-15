export const environment = {
    production: false,
    apiUrl: 'http://localhost:5220/api',
    apiBaseUrl: 'http://localhost:5220',
    appName: 'EmoCheck',
    version: '1.0.0',

    // 🔧 Configuraciones adicionales
    defaultPageSize: 10,
    maxFileSize: 5242880, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],

    // 🔐 Configuración de autenticación
    tokenStorageKey: 'emoCheck_token',
    userStorageKey: 'emocheck_user',
    tokenExpirationWarning: 300000, // 5 minutos en ms


};
