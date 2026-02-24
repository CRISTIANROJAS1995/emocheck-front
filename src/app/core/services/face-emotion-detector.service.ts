import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

/**
 * Resultado de deteccion de expresion facial.
 * Compatible con el componente emotional-analysis existente.
 */
export interface FaceExpressionResult {
    /** Emocion dominante detectada (nombre backend: happiness, sadness, anger, etc.) */
    emotion: string;
    /** Confianza de la clasificacion (0-1) */
    confidence: number;
    /** Todas las expresiones con sus probabilidades */
    expressions: Record<string, number>;
    /** Si se detecto un rostro */
    faceDetected: boolean;
}

/**
 * Mapeo de nombres internos (estilo face-api) -> nombres backend.
 * Usamos los mismos keys internos para mantener compatibilidad con el componente.
 */
const EMOTION_MAP: Record<string, string> = {
    happy: 'happiness',
    sad: 'sadness',
    angry: 'anger',
    disgusted: 'contempt',
    fearful: 'fear',
    surprised: 'surprise',
    neutral: 'neutral',
};

/**
 * Servicio de deteccion de emociones faciales usando Face++ API.
 *
 * Arquitectura:
 *   Webcam frame (JPEG) -> Face++ Detect API -> 7 emotion scores
 *
 * Face++ es un servicio profesional de reconocimiento facial (Megvii)
 * con modelos de IA continuamente actualizados. Detecta las 7 emociones
 * basicas con alta precision: happiness, sadness, anger, disgust, fear,
 * surprise, neutral.
 *
 * Free tier: 1000 API calls/dia (suficiente para ~16 sesiones diarias).
 *
 * Requiere API Key y API Secret de https://www.faceplusplus.com/
 * Configurar en environment.ts: facePlusPlusApiKey, facePlusPlusApiSecret
 */
@Injectable({
    providedIn: 'root',
})
export class FaceEmotionDetectorService {
    // -- Face++ API --
    private readonly apiKey = environment.facePlusPlusApiKey;
    private readonly apiSecret = environment.facePlusPlusApiSecret;
    private readonly apiUrl = environment.facePlusPlusApiUrl;

    // -- Estado --
    private modelsLoaded = false;
    private loading = false;
    private loadPromise: Promise<void> | null = null;
    private pendingRequest = false; // Throttle: evita requests simultaneos

    // -- Canvas reutilizable para captura de frames --
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // -- Resolucion de captura (menor = mas rapido, Face++ acepta min 48x48) --
    private static readonly CAPTURE_WIDTH = 640;
    private static readonly JPEG_QUALITY = 0.80;

    /**
     * Inicializa el servicio. Valida que las API keys esten configuradas.
     * No necesita descargar modelos pesados (Face++ es cloud).
     */
    async loadModels(): Promise<void> {
        if (this.modelsLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loading = true;
        this.loadPromise = this._doInit();
        return this.loadPromise;
    }

    private async _doInit(): Promise<void> {
        try {
            if (!this.apiKey || !this.apiSecret) {
                throw new Error(
                    '[FaceEmotionDetector] Face++ API keys no configuradas. ' +
                    'Agrega facePlusPlusApiKey y facePlusPlusApiSecret en environment.ts. ' +
                    'Registrate gratis en https://www.faceplusplus.com/'
                );
            }

            // Crear canvas reutilizable para captura
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');

            // Test rapido de conectividad (opcional, se puede quitar en produccion)
            console.log('[FaceEmotionDetector] Face++ API configurada correctamente');
            console.log('[FaceEmotionDetector] Endpoint: ' + this.apiUrl);

            this.modelsLoaded = true;
            this.loading = false;
            console.log('[FaceEmotionDetector] Face++ system ready - sin modelos locales, deteccion en la nube');
        } catch (err) {
            this.loading = false;
            this.loadPromise = null;
            console.error('[FaceEmotionDetector] Init failed:', err);
            throw err;
        }
    }

    get isReady(): boolean {
        return this.modelsLoaded;
    }

    get isLoading(): boolean {
        return this.loading;
    }

    /**
     * No-op: Face++ no necesita calibracion (es red neuronal cloud).
     * Se mantiene para compatibilidad con el componente.
     */
    resetCalibration(): void {
        console.log('[FaceEmotionDetector] resetCalibration() - no calibration needed (Face++ cloud)');
    }

    /**
     * Detecta expresion facial usando Face++ Detect API.
     *
     * Flujo:
     *   1. Captura frame del video como JPEG base64
     *   2. Envia a Face++ /detect con return_attributes=emotion
     *   3. Recibe 7 scores de emociones (0-100)
     *   4. Normaliza a 0-1 y retorna FaceExpressionResult
     *
     * Throttling: si hay un request en vuelo, retorna null (skip frame).
     */
    async detectExpression(video: HTMLVideoElement): Promise<FaceExpressionResult | null> {
        if (!this.modelsLoaded) {
            throw new Error('Service not initialized. Call loadModels() first.');
        }

        if (!video || video.readyState < 2 || !video.videoWidth) {
            return null;
        }

        // Throttle: evitar requests simultaneos (Face++ tarda ~300-500ms)
        if (this.pendingRequest) {
            return null;
        }

        this.pendingRequest = true;

        try {
            // 1. Capturar frame como base64 JPEG
            const base64Image = this.captureFrame(video);
            if (!base64Image) {
                return null;
            }

            // 2. Llamar Face++ API con retry (free tier: 1 QPS)
            const data = await this.callFacePlusPlusWithRetry(base64Image, 3);
            if (!data) {
                return null;
            }

            // 3. Verificar que se detecto un rostro
            if (!data.faces || data.faces.length === 0) {
                console.log('[FaceEmotionDetector] No face detected by Face++');
                return { emotion: 'neutral', confidence: 0, expressions: {}, faceDetected: false };
            }

            // 4. Extraer emociones y normalizar de 0-100 a 0-1
            const emotions = data.faces[0].attributes.emotion;
            const scores: Record<string, number> = {
                neutral: (emotions.neutral || 0) / 100,
                happy: (emotions.happiness || 0) / 100,
                sad: (emotions.sadness || 0) / 100,
                angry: (emotions.anger || 0) / 100,
                surprised: (emotions.surprise || 0) / 100,
                fearful: (emotions.fear || 0) / 100,
                disgusted: (emotions.disgust || 0) / 100,
            };

            // Log para debugging
            console.log('[Face++] ' +
                'neutral:' + (scores.neutral * 100).toFixed(1) + '% ' +
                'happy:' + (scores.happy * 100).toFixed(1) + '% ' +
                'sad:' + (scores.sad * 100).toFixed(1) + '% ' +
                'angry:' + (scores.angry * 100).toFixed(1) + '% ' +
                'surprised:' + (scores.surprised * 100).toFixed(1) + '% ' +
                'fearful:' + (scores.fearful * 100).toFixed(1) + '% ' +
                'disgusted:' + (scores.disgusted * 100).toFixed(1) + '%');

            return this.buildResult(scores);

        } catch (err) {
            console.error('[FaceEmotionDetector] Detection error:', err);
            return null;
        } finally {
            this.pendingRequest = false;
        }
    }

    /**
     * Llama a Face++ API con retry automatico para manejar CONCURRENCY_LIMIT_EXCEEDED.
     * El free tier solo permite 1 request por segundo; si llega otro mientras uno
     * esta en vuelo, Face++ responde 403. Reintentamos con backoff exponencial.
     */
    private async callFacePlusPlusWithRetry(base64Image: string, maxRetries: number): Promise<any | null> {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const formData = new FormData();
            formData.append('api_key', this.apiKey);
            formData.append('api_secret', this.apiSecret);
            formData.append('image_base64', base64Image);
            formData.append('return_attributes', 'emotion');

            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    body: formData,
                });

                // Parse response body (Face++ siempre devuelve JSON, incluso en errores)
                const data = await response.json().catch(() => null);

                // Exito
                if (response.ok && data && !data.error_message) {
                    return data;
                }

                // CONCURRENCY_LIMIT_EXCEEDED: retry con backoff
                if (data?.error_message === 'CONCURRENCY_LIMIT_EXCEEDED') {
                    const waitMs = 1500 * (attempt + 1); // 1.5s, 3s, 4.5s
                    console.warn('[Face++] Rate limited, retrying in ' + waitMs + 'ms (attempt ' + (attempt + 1) + '/' + maxRetries + ')');
                    await new Promise(resolve => setTimeout(resolve, waitMs));
                    continue;
                }

                // AUTHENTICATION_ERROR: no tiene sentido reintentar
                if (data?.error_message === 'AUTHENTICATION_ERROR') {
                    console.error('[Face++] AUTHENTICATION_ERROR - verifica tus API keys en environment.ts');
                    return null;
                }

                // Otro error de API
                console.error('[Face++] API error ' + response.status + ':', data?.error_message || 'unknown');
                return null;

            } catch (networkErr) {
                console.error('[Face++] Network error (attempt ' + (attempt + 1) + '):', networkErr);
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                return null;
            }
        }

        console.error('[Face++] Max retries exceeded');
        return null;
    }

    /**
     * Captura un frame del video y lo convierte a base64 JPEG.
     * Usa un canvas reutilizable con resolucion reducida para minimizar
     * el tamano del upload (~20-40KB por frame).
     */
    private captureFrame(video: HTMLVideoElement): string | null {
        if (!this.canvas || !this.ctx) return null;

        // Calcular tamano proporcional
        const scale = FaceEmotionDetectorService.CAPTURE_WIDTH / video.videoWidth;
        this.canvas.width = FaceEmotionDetectorService.CAPTURE_WIDTH;
        this.canvas.height = Math.round(video.videoHeight * scale);

        // Dibujar frame en canvas
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        // Convertir a base64 JPEG (sin el prefijo data:image/jpeg;base64,)
        const dataUrl = this.canvas.toDataURL('image/jpeg', FaceEmotionDetectorService.JPEG_QUALITY);
        const base64 = dataUrl.split(',')[1];

        return base64 || null;
    }

    /**
     * Construye el resultado final desde un mapa de scores (0-1).
     * Encuentra la emocion dominante y la mapea al nombre del backend.
     */
    private buildResult(scores: Record<string, number>): FaceExpressionResult {
        let maxEmotion = 'neutral';
        let maxConf = 0;

        for (const [emotion, conf] of Object.entries(scores)) {
            if (conf > maxConf) {
                maxConf = conf;
                maxEmotion = emotion;
            }
        }

        const backendEmotion = EMOTION_MAP[maxEmotion] || maxEmotion;

        console.log('[FaceEmotionDetector] Result: ' + backendEmotion +
            ' (' + (maxConf * 100).toFixed(1) + '%)');

        return {
            emotion: backendEmotion,
            confidence: maxConf,
            expressions: scores,
            faceDetected: true,
        };
    }

    /**
     * Detecta multiples veces y promedia los resultados.
     * Util para obtener una lectura mas estable.
     */
    async detectWithAveraging(
        video: HTMLVideoElement,
        samples: number = 5,
        intervalMs: number = 400,
    ): Promise<FaceExpressionResult | null> {
        const results: FaceExpressionResult[] = [];

        for (let i = 0; i < samples; i++) {
            const result = await this.detectExpression(video);
            if (result?.faceDetected) {
                results.push(result);
            }
            if (i < samples - 1) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs));
            }
        }

        if (results.length === 0) return null;

        const avgExpressions: Record<string, number> = {};
        for (const r of results) {
            for (const [emotion, conf] of Object.entries(r.expressions)) {
                avgExpressions[emotion] = (avgExpressions[emotion] || 0) + conf;
            }
        }
        for (const emotion of Object.keys(avgExpressions)) {
            avgExpressions[emotion] /= results.length;
        }

        return this.buildResult(avgExpressions);
    }
}
