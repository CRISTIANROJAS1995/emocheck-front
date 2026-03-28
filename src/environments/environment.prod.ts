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
    facePlusPlusApiUrl: 'https://api-us.faceplusplus.com/facepp/v3/detect',

    // Soporte WhatsApp (numero en formato internacional sin + ni espacios)
    whatsappNumber: '573122503928',
    whatsappMessage: 'Hola! Necesito ayuda con EmoCheck.',

    // ☁️ AWS S3 — almacenamiento de recursos de bienestar
    // Las credenciales se leen desde .env.local (NG_APP_AWS_KEY_ID / NG_APP_AWS_SECRET)
    awsBucket: 'emocheck-storage',
    awsRegion: 'us-east-2',
    awsS3BaseUrl: 'https://emocheck-storage.s3.us-east-2.amazonaws.com',
    awsAccessKeyId: import.meta.env['NG_APP_AWS_KEY_ID'] ?? '',
    awsSecretAccessKey: import.meta.env['NG_APP_AWS_SECRET'] ?? '',
};
