import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CameraService } from 'app/core/services/camera.service';
import { EmotionalAnalysisService, EmotionalAnalysisResult } from 'app/core/services/emotional-analysis.service';
import { FaceEmotionDetectorService, FaceExpressionResult } from 'app/core/services/face-emotion-detector.service';
import { AuthService } from 'app/core/services/auth.service';
import { AdminAlertsService } from 'app/core/services/admin-alerts.service';

@Component({
    selector: 'app-emotional-analysis',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './emotional-analysis.component.html',
    styleUrls: ['./emotional-analysis.component.scss']
})
export class EmotionalAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

    userName: string = '';
    currentStep: number = 1;
    totalSteps: number = 5;
    progress: number = 0;
    isAnalyzing: boolean = true;
    showResults: boolean = false;
    cameraError: string = '';
    analysisError: string = '';

    steps = [
        { id: 1, name: 'Atención', status: 'pending', percentage: 0 },
        { id: 2, name: 'Concentración', status: 'pending', percentage: 0 },
        { id: 3, name: 'Equilibrio', status: 'pending', percentage: 0 },
        { id: 4, name: 'Positividad', status: 'pending', percentage: 0 },
        { id: 5, name: 'Calma', status: 'pending', percentage: 0 }
    ];

    // Propiedades dinámicas para los resultados
    resultType: 'alert' | 'emotional-load' | 'normal' = 'emotional-load';

    // Configuración dinámica según el tipo de resultado
    get resultConfig() {
        if (this.resultType === 'alert') {
            return {
                iconGradient: 'linear-gradient(135deg, #FF6467 0%, #E7000B 10%)',
                iconShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                title: 'Tu cuerpo está en alerta',
                titleSize: '20px',
                titleLineHeight: '30px',
                messageText: 'Vamos a bajarle el ritmo juntos. 🧘 Haz una pausa guiada de 2 minutos para estabilizar tu mente.',
                messageColor: '#364153',
                messageSize: '14px',
                messageLineHeight: '20px',
                containerBorder: '#FFA2A2',
                containerBorderWidth: '2px',
                containerBackground: 'linear-gradient(135deg, #FEF2F2 0%, #FEF2F2 50%)',
                containerPadding: '18px',
                containerGap: '19.862px',
                buttonGradient: 'linear-gradient(90deg, #FF6467 0%, #E7000B 100%)',
                buttonShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                buttonText: 'Iniciar pausa guiada de 2 min',
                buttonIcon: 'icons/Icon.svg',
                buttonEmoji: '🧘',
                buttonFontSize: '14px',
                buttonFontWeight: '600',
                buttonLineHeight: '20px',
                buttonPadding: '8.333px 152.882px 7.667px 152.882px'
            };
        } else if (this.resultType === 'normal') {
            return {
                iconGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                iconShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                title: '¡Excelente! Tu estado emocional es saludable',
                titleSize: '20px',
                titleLineHeight: '30px',
                messageText: '¡Vas muy bien! 🌟 Tu bienestar emocional está en un gran nivel. Sigue así y mantén tus buenos hábitos.',
                messageColor: '#364153',
                messageSize: '14px',
                messageLineHeight: '20px',
                containerBorder: '#6EE7B7',
                containerBorderWidth: '2px',
                containerBackground: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%)',
                containerPadding: '18px',
                containerGap: '19.862px',
                buttonGradient: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
                buttonShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                buttonText: 'Seguir con mis evaluaciones',
                buttonIcon: 'icons/Icon.svg',
                buttonEmoji: '🌟',
                buttonFontSize: '14px',
                buttonFontWeight: '600',
                buttonLineHeight: '20px',
                buttonPadding: '8.333px 20px 7.667px 20px'
            };
        } else {
            return {
                iconGradient: 'linear-gradient(135deg, #FF8A00 0%, #FF6B00 100%)',
                iconShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                title: 'Parece que hay algo de carga emocional',
                titleSize: '18px',
                titleLineHeight: '24px',
                messageText: 'Está bien no estar al 100%. 🌬️ Te propongo una respiración 4-7-8 para soltar tensión.',
                messageColor: '#364153',
                messageSize: '14px',
                messageLineHeight: '20px',
                containerBorder: '#FFB366',
                containerBorderWidth: '2px',
                containerBackground: 'rgba(255, 228, 204, 0.35)',
                containerPadding: '18px',
                containerGap: '19.862px',
                buttonGradient: 'linear-gradient(90deg, #FF8A00 0%, #FF6B00 100%)',
                buttonShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.10), 0 4px 6px -4px rgba(0, 0, 0, 0.10)',
                buttonText: 'Comenzar respiración 4-7-8',
                buttonIcon: 'icons/Icon.svg',
                buttonEmoji: '🌬️',
                buttonFontSize: '14px',
                buttonFontWeight: '600',
                buttonLineHeight: '20px',
                buttonPadding: '8.333px 20px 7.667px 20px'
            };
        }
    }

    analysisResult: EmotionalAnalysisResult | null = null;

    private captureInterval: any;
    private readonly detectEveryMs = 4000;  // Face++ API: 1 llamada cada 4s (optimiza consumo: ~5 calls/sesión)
    private readonly minDetections = 3;    // Mínimo 3 detecciones antes de enviar (~12 seg)
    private readonly maxDetections = 5;    // Máximo 5 detecciones (~20 seg) — suficiente con quality weighting
    private detections: FaceExpressionResult[] = [];
    private analysisStarted = false;
    modelLoadError: string = '';

    constructor(
        private _router: Router,
        private _cameraService: CameraService,
        private _emotionalAnalysisService: EmotionalAnalysisService,
        private _faceDetector: FaceEmotionDetectorService,
        private _authService: AuthService,
        private _alertsService: AdminAlertsService,
    ) { }

    ngOnInit(): void {
        // Cargar nombre real del usuario
        const cached = this._authService.getCurrentUser();
        if (cached?.name) {
            this.userName = cached.name;
        }

        this._authService
            .ensureCurrentUserLoaded()
            .pipe(take(1))
            .subscribe({
                next: (user) => {
                    if (user?.name) {
                        this.userName = user.name;
                    }
                },
                error: () => { /* Mantener nombre en caché o vacío */ },
            });

        // Verificar soporte de cámara
        if (!this._cameraService.isCameraSupported()) {
            this.cameraError = 'Tu navegador no soporta acceso a la cámara';
            this.isAnalyzing = false;
            return;
        }

        // Inicializar Face++ API (valida credenciales y prepara el canvas de captura)
        this._faceDetector.loadModels().then(() => {
        }).catch(() => {
            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
        });
    }

    ngAfterViewInit(): void {
        // Intentar iniciar cámara después de que la vista esté lista
        if (this._cameraService.isCameraSupported() && this.videoElement) {
            this.initializeCamera();
        }
    }

    ngOnDestroy(): void {
        this.cleanup();
    }

    private getCameraErrorMessage(error: unknown): string {
        const anyErr = error as any;
        const name: string | undefined = typeof anyErr?.name === 'string' ? anyErr.name : undefined;
        const message: string | undefined = typeof anyErr?.message === 'string' ? anyErr.message : undefined;

        // Errores estándar de getUserMedia / MediaDevices
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
            return 'No se encontró ninguna cámara en tu dispositivo.';
        }
        if (name === 'NotAllowedError' || name === 'SecurityError') {
            return 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
        }
        if (name === 'NotReadableError') {
            return 'La cámara está siendo utilizada por otra aplicación.';
        }

        // Mensajes lanzados manualmente (HTTPS/localhost, soporte, etc.)
        if (message && message.trim().length > 0) {
            return message;
        }

        return 'No se pudo acceder a la cámara.';
    }

    /**
     * Inicializa la cámara y comienza el análisis
     */
    async initializeCamera(): Promise<void> {
        try {
            const videoEl = this.videoElement.nativeElement;
            await this._cameraService.startCamera(videoEl);

            if (!this.analysisStarted) {
                this.analysisStarted = true;
                this.startAnalysis();
            }

        } catch (error) {
            this.cameraError = this.getCameraErrorMessage(error);
            this.isAnalyzing = false;
        }
    }

    /**
     * Inicia el proceso de análisis usando Face++ API (detección en la nube)
     */
    startAnalysis(): void {
        if (this.cameraError || this.modelLoadError) {
            this.isAnalyzing = false;
            return;
        }

        if (!this._faceDetector.isReady) {
            // Models still loading, retry in 500ms
            setTimeout(() => this.startAnalysis(), 500);
            return;
        }

        // Reset estado
        this.analysisError = '';
        this.showResults = false;
        this.isAnalyzing = true;
        this.currentStep = 1;
        this.progress = 0;
        this.detections = [];
        this._faceDetector.resetCalibration();
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });

        // Detectar expresiones faciales cada 4s
        const videoEl = this.videoElement?.nativeElement;
        if (!videoEl) return;

        this.captureInterval = setInterval(async () => {
            if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return;

            const result = await this._faceDetector.detectExpression(videoEl);
            if (!result) {
                // Si se agotó el límite diario, parar inmediatamente
                if (this._faceDetector.isDailyLimitExhausted) {
                    if (this.captureInterval) {
                        clearInterval(this.captureInterval);
                        this.captureInterval = null;
                    }
                    this.analysisError = 'Se agotaron las llamadas gratuitas de Face++ por hoy (1000/día). El análisis estará disponible mañana.';
                    this.isAnalyzing = false;
                    return;
                }
                return;
            }

            if (result.faceDetected) {
                this.detections.push(result);
            }

            // Progreso visual
            const got = Math.min(this.detections.length, this.minDetections);
            this.progress = Math.min(60, Math.round((got / this.minDetections) * 60));
            this.currentStep = 1 + Math.min(2, got);

            // Cuando tenemos suficientes detecciones, finalizar
            if (this.detections.length >= this.maxDetections ||
                (this.detections.length >= this.minDetections && this.detections.length > 0)) {
                this.finishAnalysis();
            }
        }, this.detectEveryMs);
    }

    /**
     * Finaliza el análisis: promedia las detecciones locales y envía al backend
     */
    async finishAnalysis(): Promise<void> {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }

        // Estado visual: "analizando"
        this.progress = 70;
        this.currentStep = 4;
        this.steps.forEach((s, idx) => {
            if (idx < 3) s.status = 'completed';
            else if (idx === 3) s.status = 'active';
            else s.status = 'pending';
        });

        // Promediar las detecciones de Face++ API
        const validDetections = this.detections.filter(d => d.faceDetected);
        if (validDetections.length === 0) {
            this.analysisError = 'No se detectó un rostro. Asegúrate de que tu cara esté visible y bien iluminada.';
            this.isAnalyzing = false;
            return;
        }

        // ================================================================
        // SCORING: Agregar scores ponderados de todas las detecciones
        // con boost para emociones no-neutrales y supresión de neutral.
        // ================================================================
        const EMOTION_TO_BACKEND: Record<string, string> = {
            happy: 'happiness', sad: 'sadness', angry: 'anger',
            disgusted: 'contempt', fearful: 'fear', surprised: 'surprise',
            neutral: 'neutral',
        };

        // 1. Sumar scores ponderados por calidad del frame + peso temporal
        const sumScores: Record<string, number> = {};
        const peakScores: Record<string, number> = {};
        let totalWeight = 0;
        for (let i = 0; i < validDetections.length; i++) {
            const d = validDetections[i];
            const qualityWeight = d.quality?.frameWeight ?? 1.0;
            const temporalWeight = 1.0 + 0.5 * (i / Math.max(1, validDetections.length - 1));
            const combinedWeight = qualityWeight * temporalWeight;
            totalWeight += combinedWeight;

            for (const [emo, score] of Object.entries(d.expressions)) {
                sumScores[emo] = (sumScores[emo] || 0) + score * combinedWeight;
                peakScores[emo] = Math.max(peakScores[emo] || 0, score);
            }
        }

        // 2. Promedio ponderado
        const avgScores: Record<string, number> = {};
        for (const emo of Object.keys(sumScores)) {
            avgScores[emo] = sumScores[emo] / totalWeight;
        }

        // 2b. Micro-expresiones: detectar picos breves de emoción
        const MICRO_SPIKE_THRESHOLD = 2.5;
        const MICRO_NOISE_FLOOR = 0.02;
        for (const [emo, avg] of Object.entries(avgScores)) {
            if (emo === 'neutral') continue;
            let spikeCount = 0;
            let spikeIntensity = 0;
            for (const d of validDetections) {
                const frameScore = d.expressions[emo] || 0;
                if (frameScore > avg * MICRO_SPIKE_THRESHOLD && frameScore > MICRO_NOISE_FLOOR) {
                    spikeCount++;
                    spikeIntensity += frameScore - avg;
                }
            }
            const maxSpikes = Math.ceil(validDetections.length * 0.3);
            if (spikeCount >= 1 && spikeCount <= maxSpikes) {
                avgScores[emo] += (spikeIntensity / spikeCount) * 0.25;
            }
        }

        // 2c. Variabilidad emocional
        let totalVariance = 0;
        for (const [emo, avg] of Object.entries(avgScores)) {
            let sumSqDiff = 0;
            for (const d of validDetections) {
                const diff = (d.expressions[emo] || 0) - avg;
                sumSqDiff += diff * diff;
            }
            totalVariance += sumSqDiff / validDetections.length;
        }

        // 3. Boost + supresión neutral
        const negativeIntense = (avgScores['angry'] || 0) + (avgScores['fearful'] || 0) + (avgScores['disgusted'] || 0);
        let neutralMultiplier = 1.0;
        if (negativeIntense > 0.005) {
            const suppressFactor = Math.min(0.85, negativeIntense * 40);
            neutralMultiplier = 1 - suppressFactor;
        }

        let dominantEmotion = 'neutral';
        let maxScore = 0;
        for (const [emo, avg] of Object.entries(avgScores)) {
            let boost: number;
            if (emo === 'neutral') {
                boost = neutralMultiplier;
            } else if (emo === 'angry' || emo === 'fearful' || emo === 'disgusted') {
                boost = 30;
            } else {
                boost = 5.0;
            }
            const score = avg * boost;
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emo;
            }
        }

        // 4. Mapear a nombre backend
        dominantEmotion = EMOTION_TO_BACKEND[dominantEmotion] || dominantEmotion;

        // 5. Confianza
        const rawKey = Object.entries(EMOTION_TO_BACKEND).find(([, v]) => v === dominantEmotion)?.[0] || dominantEmotion;
        const avgConfidence = dominantEmotion === 'neutral'
            ? (avgScores[rawKey] || 0.5)
            : Math.max(avgScores[rawKey] || 0, (peakScores[rawKey] || 0) * 0.85);

        // Enviar al backend para mapear a scores de bienestar
        this._emotionalAnalysisService.classifyEmotion(dominantEmotion, avgConfidence)
            .subscribe({
                next: (result) => {
                    this.analysisResult = result;

                    const fatigueThreshold = 0.75;
                    const state = this._emotionalAnalysisService.evaluateEmotionalState(result);
                    const isRed =
                        result.alertCreated === true ||
                        (typeof result.fatigueScore === 'number' && result.fatigueScore >= fatigueThreshold) ||
                        state === 'critical';
                    this.resultType = isRed ? 'alert' : (state === 'normal' ? 'normal' : 'emotional-load');

                    // Si el backend no creó la alerta pero el estado es crítico o de alerta,
                    // la creamos manualmente desde el frontend.
                    if (!result.alertCreated && (state === 'critical' || state === 'alert')) {
                        const severity = state === 'critical' ? 'HIGH' : 'MEDIUM';
                        const avg = Math.round(
                            (result.attention + result.concentration + result.balance + result.positivity + result.calm) / 5
                        );
                        const currentUser = this._authService.getCurrentUser();
                        console.log('[EmotionalAnalysis] Creando alerta manual. Usuario:', currentUser?.id, 'Roles:', currentUser?.roles, 'Estado:', state);
                        this._alertsService.create({
                            userID: currentUser?.id ? Number(currentUser.id) : undefined,
                            severity,
                            alertType: 'EMOTIONAL_ANALYSIS',
                            title: state === 'critical'
                                ? 'Estado emocional crítico detectado'
                                : 'Estado emocional de alerta detectado',
                            description: `Análisis emocional detectó estado ${state === 'critical' ? 'crítico' : 'de alerta'}. Emoción dominante: ${result.dominantEmotion ?? 'N/A'}. Promedio de bienestar: ${avg}%. Scores — Atención: ${result.attention}%, Concentración: ${result.concentration}%, Equilibrio: ${result.balance}%, Positividad: ${result.positivity}%, Calma: ${result.calm}%.`,
                        }).subscribe({
                            next: (alert) => {
                                if (alert) {
                                    console.log('[EmotionalAnalysis] ✅ Alerta creada en BD. ID:', alert.alertId);
                                } else {
                                    console.warn('[EmotionalAnalysis] ⚠️ POST /alert respondió null — posible 403 (rol insuficiente) o error de BD.');
                                }
                            },
                            error: (e) => console.error('[EmotionalAnalysis] ❌ Error al crear alerta. Status:', e?.status, e?.error),
                        });
                    }

                    // Actualizar porcentajes en los steps
                    this.steps[0].percentage = result.attention;
                    this.steps[1].percentage = result.concentration;
                    this.steps[2].percentage = result.balance;
                    this.steps[3].percentage = result.positivity;
                    this.steps[4].percentage = result.calm;

                    this.steps.forEach((s) => (s.status = 'completed'));
                    this.progress = 100;
                    this.currentStep = this.totalSteps;
                    this.isAnalyzing = false;

                    setTimeout(() => {
                        this.showResults = true;
                    }, 300);
                },
                error: (err) => {
                    const backendMsg: string =
                        err?.error?.Message ??
                        err?.error?.message ??
                        err?.error?.title ??
                        err?.error?.detail ??
                        err?.message ??
                        '';
                    this.analysisError = backendMsg.trim() || 'No se pudo analizar el rostro. Asegúrate de que tu cara esté visible y bien iluminada.';
                    this.isAnalyzing = false;
                },
            });
    }

    /**
     * Limpia recursos
     */
    cleanup(): void {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        this._cameraService.stopCamera();
    }

    /**
     * Reinicia el análisis después de un error de backend.
     */
    retryAnalysis(): void {
        this.analysisError = '';
        this.detections = [];
        this.analysisStarted = false;
        this.progress = 0;
        this.currentStep = 1;
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });
        this.startAnalysis();
    }

    /**
     * Reintenta acceder a la cámara después de un error de hardware/permisos.
     */
    retryCamera(): void {
        this.cameraError = '';
        this.analysisError = '';
        this.detections = [];
        this.analysisStarted = false;
        this.isAnalyzing = true;
        this.progress = 0;
        this.currentStep = 1;
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });
        // Liberar stream previo antes de reintentar
        this._cameraService.stopCamera();
        if (this.videoElement?.nativeElement) {
            this.initializeCamera();
        }
    }

    skipAnalysis(): void {
        this.cleanup();
        this._router.navigate(['/home']);
    }

    goToEvaluations(): void {
        this.cleanup();
        this._router.navigate(['/home']);
    }

    startGuidedPause(): void {
        this.cleanup();
        this._router.navigate(['/resources']);
    }

    /**
     * Obtiene el color de fondo según el índice de la emoción
     */
    getStepColor(index: number): string {
        const colors = [
            '#00BBA7', // Atención - turquesa
            '#9AE600', // Concentración - verde lima
            '#00D5BE', // Equilibrio - turquesa claro
            '#B8E600', // Positividad - verde amarillo
            '#00D1C1'  // Calma - turquesa
        ];
        return colors[index] || '#00BBA7';
    }

    /**
     * Obtiene el color del texto según el índice de la emoción
     */
    getStepTextColor(index: number): string {
        const colors = [
            '#00BBA7', // Atención
            '#9AE600', // Concentración
            '#00D5BE', // Equilibrio
            '#B8E600', // Positividad
            '#00D1C1'  // Calma
        ];
        return colors[index] || '#00BBA7';
    }

    /**
     * Obtiene el icono según el ID del paso
     */
    getStepIcon(id: number): string {
        const icons = {
            1: 'icons/Icon (17).svg',
            2: 'icons/Icon (18).svg',
            3: 'icons/Icon (19).svg',
            4: 'icons/Icon (20).svg',
            5: 'icons/Icon (21).svg'
        };
        return icons[id as keyof typeof icons] || 'icons/Icon (17).svg';
    }
}
