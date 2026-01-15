export const environment = {
    production: true,
    apiUrl: 'https://api.emocheck.com/api',
    apiBaseUrl: 'https://emocheck.com',
    appName: 'EmoCheck',
    version: '1.0.0',

    // Configuraciones adicionales
    defaultPageSize: 10,
    maxFileSize: 5242880, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],

    // Configuración de autenticación
    tokenStorageKey: 'emocheck_token',
    userStorageKey: 'emocheck_user',
    tokenExpirationWarning: 300000, // 5 minutos en ms

};
