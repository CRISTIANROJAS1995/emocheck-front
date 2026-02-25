export const environment = {
    production: false,
    // DEV: API local para pruebas
    // apiUrl: 'https://kratosconquer-001-site1.mtempurl.com/api',
    apiUrl: 'http://localhost:5230/api',
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

    // 🎭 Face++ Emotion Recognition API
    // Regístrate gratis en https://www.faceplusplus.com/ para obtener tus claves
    facePlusPlusApiKey: '55ynZIJ3GFnbHY4JFWDfxiPfoEUWy_Js',      // <-- Pega tu API Key aquí
    facePlusPlusApiSecret: 'e5bIygczFiW8PON4yMLaiA5tK-RC8J42',   // <-- Pega tu API Secret aquí
    facePlusPlusApiUrl: '/facepp/v3/detect',

    // 📞 Soporte WhatsApp (número en formato internacional sin + ni espacios)
    whatsappNumber: '573244563035',
    whatsappMessage: '¡Hola! Necesito ayuda con EmoCheck.',
};
