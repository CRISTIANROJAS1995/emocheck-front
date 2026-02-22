export const environment = {
    production: true,
    apiUrl: 'https://api.emocheck.com/api',
    apiTimeout: 30000,
    appName: 'EmoCheck',
    version: '1.0.0',
    defaultPageSize: 10,
    maxFileSize: 5242880,
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    tokenStorageKey: 'emocheck_token',
    refreshTokenStorageKey: 'emocheck_refreshToken',
    userStorageKey: 'emocheck_user',
    tokenExpirationWarning: 300000,

    // Soporte WhatsApp (numero en formato internacional sin + ni espacios)
    whatsappNumber: '573244563035',
    whatsappMessage: 'Hola! Necesito ayuda con EmoCheck.',
};
