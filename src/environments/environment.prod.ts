export const environment = {
    production: true,
    apiUrl: 'https://kratosconquer-001-site1.mtempurl.com/api',
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

    // Face++ Emotion Recognition API
    facePlusPlusApiKey: 'fQpCTQEhbqvNqQqahwQPLei9kH5SIEcs',      // <-- Pega tu API Key aquí
    facePlusPlusApiSecret: 'xAAxS5CiLPAmqNZ4Al2iuN8TVuSPyJ26',   // <-- Pega tu API Secret aquí
    facePlusPlusApiUrl: '/facepp/v3/detect',

    // Soporte WhatsApp (numero en formato internacional sin + ni espacios)
    whatsappNumber: '573244563035',
    whatsappMessage: 'Hola! Necesito ayuda con EmoCheck.',
};
