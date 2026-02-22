import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CameraService } from 'app/core/services/camera.service';
import { EmotionalAnalysisService, EmotionalAnalysisResult } from 'app/core/services/emotional-analysis.service';
import { AuthService } from 'app/core/services/auth.service';

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
    capturedFrames: string[] = [];
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
    private readonly captureEveryMs = 2000;
    private readonly maxCapturedFrames = 8;
    private readonly framesToSend = 3;
    private analysisStarted = false;

    constructor(
        private _router: Router,
        private _cameraService: CameraService,
        private _emotionalAnalysisService: EmotionalAnalysisService,
        private _authService: AuthService
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
        }
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
            console.log('Cámara iniciada correctamente');

            // Solo iniciamos el análisis cuando la cámara está realmente activa.
            if (!this.analysisStarted) {
                this.analysisStarted = true;
                this.startAnalysis();
            }

        } catch (error) {
            console.error('Error al inicializar cámara:', error);
            this.cameraError = this.getCameraErrorMessage(error);
            this.isAnalyzing = false;
        }
    }

    /**
     * Inicia el proceso de análisis
     */
    startAnalysis(): void {
        if (this.cameraError) {
            this.isAnalyzing = false;
            return;
        }

        // Reset estado
        this.analysisError = '';
        this.showResults = false;
        this.isAnalyzing = true;
        this.currentStep = 1;
        this.progress = 0;
        this.capturedFrames = [];
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });

        // Capturar frames (solo si hay cámara y video listo)
        if (this._cameraService.isCameraSupported() && this.videoElement) {
            this.captureInterval = setInterval(() => {
                const videoEl = this.videoElement?.nativeElement;
                if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return;

                const frame = this._cameraService.captureFrame(videoEl, { maxWidth: 640, quality: 0.65 });
                if (!frame) return;

                this.capturedFrames.push(frame);
                if (this.capturedFrames.length > this.maxCapturedFrames) {
                    this.capturedFrames = this.capturedFrames.slice(-this.maxCapturedFrames);
                }

                // Progreso real: cuando ya tenemos suficientes frames, paramos y analizamos.
                const needed = this.framesToSend;
                const got = Math.min(this.capturedFrames.length, needed);
                this.progress = Math.min(60, Math.round((got / needed) * 60));
                this.currentStep = 1 + Math.min(2, got); // 2-3 pasos visuales mientras captura

                if (this.capturedFrames.length >= needed) {
                    this.finishAnalysis();
                }
            }, this.captureEveryMs);
        }
    }

    /**
     * Finaliza el análisis y procesa resultados
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

        // Procesar análisis con los frames capturados
        const frames = this.capturedFrames.slice(-this.framesToSend);
        if (frames.length === 0) {
            this.analysisError = 'No se pudieron capturar frames de cámara.';
            this.isAnalyzing = false;
            return;
        }

        this._emotionalAnalysisService.performFullAnalysis(frames)
            .subscribe({
                next: (result) => {
                    this.analysisResult = result;

                    // Cambiar el tipo de resultado (naranja vs rojo) basado en datos reales.
                    // 1) Si backend creó alerta, UI debe mostrar rojo.
                    // 2) Si hay fatigueScore (0..1) y supera el umbral default del backend (0.75), UI debe mostrar rojo.
                    // 3) Si no, usamos la regla de promedio (misma del servicio front).
                    const fatigueThreshold = 0.75;
                    const state = this._emotionalAnalysisService.evaluateEmotionalState(result);
                    const isRed =
                        result.alertCreated === true ||
                        (typeof result.fatigueScore === 'number' && result.fatigueScore >= fatigueThreshold) ||
                        state === 'critical';
                    this.resultType = isRed ? 'alert' : (state === 'normal' ? 'normal' : 'emotional-load');

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
                    console.error('Error al analizar emociones:', err);
                    // Extraer mensaje del backend (400, 422, etc.) o fallback genérico
                    const backendMsg: string =
                        err?.error?.Message ??
                        err?.error?.message ??
                        err?.error?.title ??
                        err?.error?.detail ??
                        err?.message ??
                        '';
                    this.analysisError = backendMsg.trim() || 'No se pudo analizar el rostro. Asegúrate de que tu cara esté visible y bien iluminada.';
                    this.isAnalyzing = false;
                    // No mostramos resultados si falló: se queda en la pantalla con el error.
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
        this.capturedFrames = [];
        this.analysisStarted = false;
        this.progress = 0;
        this.currentStep = 1;
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });
        this.startAnalysis();
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
