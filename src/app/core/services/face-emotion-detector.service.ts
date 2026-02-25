import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

/**
 * Metadatos de calidad del frame para ponderacion inteligente.
 * Face++ provee datos de calidad facial, pose y blur que permiten
 * dar mayor peso a frames de mejor calidad en la agregacion final.
 */
export interface FrameQuality {
    /** Face quality score de Face++ (0-100, mayor = mejor) */
    faceQuality: number;
    /** Angulos de pose de la cabeza en grados */
    headPose: { yaw: number; pitch: number; roll: number };
    /** Nivel de motion blur (0-100, menor = mas nitido) */
    motionBlur: number;
    /** Nivel de gaussian blur (0-100, menor = mas nitido) */
    gaussianBlur: number;
    /** Peso combinado calculado para este frame (0-1, mayor = mas confiable) */
    frameWeight: number;
}

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
    /** Metadatos de calidad del frame para ponderacion inteligente */
    quality?: FrameQuality;
    /** Timestamp de esta deteccion (ms epoch) para analisis temporal */
    timestamp?: number;
}

/**
 * Mapeo de nombres internos -> nombres backend.
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
    private _dailyLimitExhausted = false; // Si Face++ devolvio FREE_CALL_COUNT_LIMIT

    // -- Canvas reutilizable para captura de frames --
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // Resolucion mas alta para captar expresiones sutiles
    private static readonly CAPTURE_WIDTH = 720;
    private static readonly JPEG_QUALITY = 0.85;

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

            this.modelsLoaded = true;
            this.loading = false;
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

    /** True si se agoto el limite diario de Face++ (1000 calls/dia free tier) */
    get isDailyLimitExhausted(): boolean {
        return this._dailyLimitExhausted;
    }

    /**
     * No-op: Face++ no necesita calibracion (es red neuronal cloud).
     * Se mantiene para compatibilidad con el componente.
     */
    resetCalibration(): void { }

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

        // Limite diario agotado: no hacer mas llamadas
        if (this._dailyLimitExhausted) {
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
            //    maxRetries=1 para minimizar consumo de llamadas
            const data = await this.callFacePlusPlusWithRetry(base64Image, 1);
            if (!data) {
                return null;
            }

            // 3. Verificar que se detecto un rostro
            if (!data.faces || data.faces.length === 0) {
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

            // Calcular calidad del frame para ponderacion inteligente
            const quality = this.calculateFrameQuality(data.faces[0]);

            const result = this.buildResult(scores);
            result.quality = quality;
            result.timestamp = Date.now();
            return result;

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
            formData.append('return_attributes', 'emotion,headpose,facequality,blur');

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

                // CONCURRENCY_LIMIT_EXCEEDED: retry con backoff (max 1 retry para ahorrar calls)
                if (data?.error_message === 'CONCURRENCY_LIMIT_EXCEEDED') {
                    const waitMs = 2000 * (attempt + 1);
                    await new Promise(resolve => setTimeout(resolve, waitMs));
                    continue;
                }

                // AUTHENTICATION_ERROR: no tiene sentido reintentar
                if (data?.error_message === 'AUTHENTICATION_ERROR') {
                    return null;
                }

                // FREE_CALL_COUNT_LIMIT: limite diario agotado, NO reintentar
                if (data?.error_message === 'FREE_CALL_COUNT_LIMIT') {
                    this._dailyLimitExhausted = true;
                    return null;
                }

                return null;

            } catch (networkErr) {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                return null;
            }
        }

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

        // Preprocesamiento: mejora leve de contraste y brillo
        // para compensar webcams con poca luz y mejorar deteccion de expresiones sutiles
        this.ctx.filter = 'contrast(1.15) brightness(1.05)';
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.filter = 'none';

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


        return {
            emotion: backendEmotion,
            confidence: maxConf,
            expressions: scores,
            faceDetected: true,
        };
    }

    /**
     * Calcula un peso de calidad para el frame basado en datos de Face++.
     * Frames con mejor calidad facial, pose frontal y menos blur
     * obtienen mayor peso en la agregacion final.
     *
     * Factores:
     *   - headpose: rostros girados >30° o inclinados >25° reducen peso
     *   - facequality: score directo de Face++ (0-100)
     *   - blur: frames borrosos (motion o gaussian) reducen peso
     */
    private calculateFrameQuality(face: any): FrameQuality {
        const hp = face.attributes?.headpose || {};
        const fq = face.attributes?.facequality?.value ?? 50;
        const blur = face.attributes?.blur || {};

        const yaw = hp.yaw_angle || 0;
        const pitch = hp.pitch_angle || 0;
        const roll = hp.roll_angle || 0;
        const motionBlur = blur.motionblur?.value || 0;
        const gaussianBlur = blur.gaussianblur?.value || 0;

        // Pose factor: penalizar rostros girados/inclinados
        const poseFactor = Math.max(0.2, 1 - Math.abs(yaw) / 45)
                         * Math.max(0.3, 1 - Math.abs(pitch) / 35);

        // Quality factor: score normalizado de Face++ (0-1)
        const qualityFactor = Math.max(0.3, fq / 100);

        // Blur factor: frames borrosos = menor confianza
        const maxBlur = Math.max(motionBlur, gaussianBlur);
        const blurFactor = Math.max(0.2, 1 - maxBlur / 80);

        return {
            faceQuality: fq,
            headPose: { yaw, pitch, roll },
            motionBlur,
            gaussianBlur,
            frameWeight: Math.max(0.1, poseFactor * qualityFactor * blurFactor),
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
