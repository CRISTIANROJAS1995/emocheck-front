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
    cameraErrorType: 'permission-denied' | 'in-use' | 'not-found' | 'not-supported' | 'https-required' | 'generic' | null = null;
    analysisError: string = '';

    // Estados de permiso de cámara
    // 'prompt'     → todavía no se ha pedido permiso (mostrar pantalla previa)
    // 'requesting' → esperando que el usuario acepte/rechace el diálogo del navegador
    // 'granted'    → cámara activa
    // 'denied'     → usuario rechazó o error irrecuperable
    cameraPermission: 'prompt' | 'requesting' | 'granted' | 'denied' = 'prompt';

    steps = [
        { id: 1, name: 'Atención', status: 'pending', percentage: 0 },
        { id: 2, name: 'Concentración', status: 'pending', percentage: 0 },
        { id: 3, name: 'Equilibrio', status: 'pending', percentage: 0 },
        { id: 4, name: 'Positividad', status: 'pending', percentage: 0 },
        { id: 5, name: 'Calma', status: 'pending', percentage: 0 }
    ];

    // Propiedades dinámicas para los resultados
    resultType: 'alert' | 'emotional-load' | 'normal' = 'emotional-load';

    // Contenido dinámico calculado al finalizar el análisis (emoción + estado)
    dynamicContent: {
        title: string;
        iconGradient: string;
        containerBorder: string;
        containerBackground: string;
        messageText: string;
        steps: Array<{ text: string; emoji?: string }>;
        finalMessage: string;
        buttonText: string;
        buttonEmoji: string;
        buttonGradient: string;
    } | null = null;

    // ─── Biblioteca de contenido por emoción × estado ───────────────────────
    private readonly CONTENT_LIBRARY: Record<string, Record<string, Array<{
        title: string;
        messageText: string;
        steps: Array<{ text: string; emoji?: string }>;
        finalMessage: string;
        buttonText: string;
        buttonEmoji: string;
    }>>> = {

        // ── VERDE (normal ≥70%) ─────────────────────────────────────────────
        normal: {
            happiness: [
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Tu estado emocional es saludable. Aprovechemos este momento para fortalecerlo.',
                    steps: [
                        { text: 'Respira profundo 4 segundos.' },
                        { text: 'Exhala lento 6 segundos. Repite 5 veces.' },
                        { text: '¿Qué estoy haciendo bien hoy? ¿Qué quiero repetir mañana?' },
                    ],
                    finalMessage: 'Sostener el bienestar también es autocuidado.',
                    buttonText: 'Continuar mi día',
                    buttonEmoji: '🌟',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Estás en un estado emocional saludable. Vamos a sostenerlo sin sobre-exigirte.',
                    steps: [
                        { text: 'Estira tus brazos hacia arriba.' },
                        { text: 'Sonríe conscientemente durante 10 segundos.' },
                    ],
                    finalMessage: 'Siente cómo tu cuerpo guarda esta emoción positiva.',
                    buttonText: 'Guardar bienestar',
                    buttonEmoji: '🎉',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Para cuidar este estado, elige una cosa y comprométete contigo.',
                    steps: [
                        { text: 'Repite hoy la misma acción que te hizo sentir bien.' },
                    ],
                    finalMessage: 'Consolida hábito emocional.',
                    buttonText: 'Definir límite',
                    buttonEmoji: '✔️',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Este es un buen momento para fortalecer tu estado emocional.',
                    steps: [
                        { text: 'Presiona tu pulgar con tu dedo índice durante 10 segundos.' },
                        { text: 'Mientras lo haces, piensa: "Puedo volver a este estado cuando lo necesite."' },
                    ],
                    finalMessage: 'Este gesto será tu ancla emocional.',
                    buttonText: 'Crea un ancla somática',
                    buttonEmoji: '⚓',
                },
            ],
            default: [
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: '¡Vas muy bien! 🌟 Tu bienestar emocional está en un gran nivel.',
                    steps: [
                        { text: 'Respira profundo y disfruta este momento.' },
                    ],
                    finalMessage: 'Sigue así y mantén tus buenos hábitos.',
                    buttonText: 'Seguir con mis evaluaciones',
                    buttonEmoji: '🌟',
                },
            ],
        },

        // ── NARANJA (emotional-load 50–69%) ────────────────────────────────
        'emotional-load': {
            neutral: [
                {
                    title: 'Estás en piloto automático',
                    messageText: 'Hagamos un ajuste pequeño. Activación consciente (2 minutos).',
                    steps: [
                        { text: 'Endereza tu postura.' },
                        { text: 'Inhala 3 segundos – exhala 5 segundos (5 veces).' },
                        { text: 'Elige una sola tarea y enfócate solo en esa por 2 minutos.' },
                    ],
                    finalMessage: 'Pequeños ajustes cambian tu energía.',
                    buttonText: 'Regular ahora',
                    buttonEmoji: '🔄',
                },
                {
                    title: 'Tu energía está estable, pero en modo automático',
                    messageText: 'Cambio de postura (1 minuto). Tu cuerpo influye en tu mente.',
                    steps: [
                        { text: 'Endereza la espalda.' },
                        { text: 'Apoya ambos pies firmes en el suelo.' },
                        { text: 'Lleva hombros ligeramente hacia atrás.' },
                        { text: 'Respira lento durante 60 segundos.' },
                    ],
                    finalMessage: 'Siente cómo cambia tu energía.',
                    buttonText: 'Sentí el cambio',
                    buttonEmoji: '✔️',
                },
                {
                    title: 'Micro-reto de foco (2 minutos)',
                    messageText: 'Vamos a recuperar claridad.',
                    steps: [
                        { text: 'Elige una sola tarea pequeña.' },
                        { text: 'Activa un cronómetro de 2 minutos.' },
                        { text: 'Haz únicamente esa tarea. Sin interrupciones.' },
                    ],
                    finalMessage: 'Cuando suene el tiempo, detente.',
                    buttonText: 'Iniciar 2 minutos',
                    buttonEmoji: '▶️',
                },
                {
                    title: 'La dirección cambia la energía',
                    messageText: 'Pregunta de intención (1 minuto).',
                    steps: [
                        { text: '¿Qué intención quiero ponerle a la próxima hora?' },
                        { text: 'Elige una palabra: Enfoque. Calma. Claridad. Productividad. Presencia.' },
                        { text: 'Repítela mentalmente 3 veces.' },
                    ],
                    finalMessage: '',
                    buttonText: 'Definir intención',
                    buttonEmoji: '🎯',
                },
                {
                    title: 'Sal del piloto automático',
                    messageText: 'Escaneo corporal rápido (1 minuto).',
                    steps: [
                        { text: 'Cierra los ojos si puedes.' },
                        { text: 'Recorre mentalmente tu cuerpo: Frente — Mandíbula — Hombros — Pecho — Abdomen.' },
                        { text: 'Si detectas tensión, suéltala.' },
                    ],
                    finalMessage: '',
                    buttonText: 'Más consciente',
                    buttonEmoji: '🧠',
                },
            ],
            surprise: [
                {
                    title: 'Tu sistema está activado por algo inesperado',
                    messageText: 'Exhalación prolongada para estabilizar (1–2 minutos).',
                    steps: [
                        { text: 'Inhala durante 4 segundos.' },
                        { text: 'Exhala lentamente durante 8 segundos.' },
                        { text: 'Repite 5 veces. La exhalación más larga que la inhalación.' },
                    ],
                    finalMessage: 'Este ejercicio baja activación simpática.',
                    buttonText: 'Más estable',
                    buttonEmoji: '✔️',
                },
                {
                    title: 'Reorganiza tu ritmo interno',
                    messageText: 'Movimiento lento (1 minuto).',
                    steps: [
                        { text: 'Ponte de pie.' },
                        { text: 'Camina lentamente y más consciente durante 1 minuto.' },
                        { text: 'Siente cada paso apoyarse en el suelo. No te apresures.' },
                    ],
                    finalMessage: 'Reorganiza ritmo fisiológico.',
                    buttonText: 'Regulé mi ritmo',
                    buttonEmoji: '✔️',
                },
                {
                    title: 'Nombrar la emoción reduce su intensidad',
                    messageText: 'Nombrar la emoción (30 segundos).',
                    steps: [
                        { text: 'Di internamente: "Estoy sorprendido, no en peligro."' },
                        { text: 'Repite 3 veces.' },
                    ],
                    finalMessage: 'Disminuye reactividad límbica.',
                    buttonText: 'Entendido',
                    buttonEmoji: '✔️',
                },
                {
                    title: 'Activa tu claridad mental',
                    messageText: 'Chequeo de evidencia (1 minuto).',
                    steps: [
                        { text: '¿Qué datos reales tengo?' },
                        { text: '¿Estoy interpretando o observando hechos?' },
                        { text: '¿Necesito más información antes de actuar?' },
                    ],
                    finalMessage: 'Este ejercicio activa la corteza prefrontal.',
                    buttonText: 'Más claridad',
                    buttonEmoji: '💡',
                },
                {
                    title: 'Antes de reaccionar, haz una pausa',
                    messageText: 'Autoinstrucción breve (30 segundos).',
                    steps: [
                        { text: 'Repite: "Primero observo, luego reacciono."' },
                        { text: 'Siente la pausa antes de cualquier respuesta.' },
                    ],
                    finalMessage: 'Este ejercicio reduce impulsividad.',
                    buttonText: 'Pausa aplicada',
                    buttonEmoji: '✔️',
                },
            ],
            default: [
                {
                    title: 'Parece que hay algo de carga emocional',
                    messageText: 'Está bien no estar al 100%. Te propongo una respiración 4-7-8 para soltar tensión.',
                    steps: [
                        { text: 'Inhala 4 segundos.' },
                        { text: 'Sostén 7 segundos.' },
                        { text: 'Exhala 8 segundos. Repite 3 veces.' },
                    ],
                    finalMessage: 'Tu cuerpo agradece este momento de pausa.',
                    buttonText: 'Comenzar respiración',
                    buttonEmoji: '�️',
                },
            ],
        },

        // ── ROJO (alert <50%) ───────────────────────────────────────────────
        alert: {
            anger: [
                {
                    title: 'Tu cuerpo está en alerta',
                    messageText: 'Vamos a bajarle el ritmo juntos. Pausa guiada de 2 minutos para estabilizar tu mente.',
                    steps: [
                        { text: 'Respira profundo 4 segundos.' },
                        { text: 'Exhala lento 6 segundos. Repite 5 veces.' },
                        { text: 'Apoya ambos pies en el suelo y siente tu peso.' },
                    ],
                    finalMessage: 'Tu cuerpo empieza a calmarse con cada exhalación.',
                    buttonText: 'Iniciar pausa guiada de 2 min',
                    buttonEmoji: '🧘',
                },
            ],
            sadness: [
                {
                    title: 'Tu cuerpo está en alerta',
                    messageText: 'Tus emociones tienen sentido. Vamos a acompañarlas con un ejercicio suave.',
                    steps: [
                        { text: 'Pon una mano en tu pecho.' },
                        { text: 'Respira lento: inhala 4s, exhala 6s. Repite 5 veces.' },
                        { text: 'Di internamente: "Esta emoción pasará. Me cuido."' },
                    ],
                    finalMessage: 'Reconocer lo que sientes es el primer paso para cuidarte.',
                    buttonText: 'Iniciar pausa guiada de 2 min',
                    buttonEmoji: '🧘',
                },
            ],
            fear: [
                {
                    title: 'Tu cuerpo está en alerta',
                    messageText: 'Vamos a activar tu sistema de calma. Grounding rápido (2 minutos).',
                    steps: [
                        { text: 'Nombra 5 cosas que puedes VER ahora.' },
                        { text: 'Nombra 4 cosas que puedes TOCAR.' },
                        { text: 'Nombra 3 cosas que puedes OÍR.' },
                        { text: 'Respira profundo 3 veces.' },
                    ],
                    finalMessage: 'Este ejercicio ancla tu mente al presente.',
                    buttonText: 'Iniciar pausa guiada de 2 min',
                    buttonEmoji: '🧘',
                },
            ],
            default: [
                {
                    title: 'Tu cuerpo está en alerta',
                    messageText: 'Vamos a bajarle el ritmo juntos. Haz una pausa guiada de 2 minutos para estabilizar tu mente.',
                    steps: [
                        { text: 'Respira profundo 4 segundos.' },
                        { text: 'Exhala lento 6 segundos. Repite 5 veces.' },
                    ],
                    finalMessage: 'Tu bienestar es la prioridad.',
                    buttonText: 'Iniciar pausa guiada de 2 min',
                    buttonEmoji: '🧘',
                },
            ],
        },
    };

    // ─── Estilos visuales por resultType ────────────────────────────────────
    get resultVisual(): {
        iconGradient: string;
        containerBorder: string;
        containerBackground: string;
        buttonGradient: string;
        titleColor: string;
    } {
        if (this.resultType === 'normal') {
            return {
                iconGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                containerBorder: '#6EE7B7',
                containerBackground: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%)',
                buttonGradient: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
                titleColor: '#059669',
            };
        } else if (this.resultType === 'alert') {
            return {
                iconGradient: 'linear-gradient(135deg, #FF6467 0%, #E7000B 100%)',
                containerBorder: '#FFA2A2',
                containerBackground: 'linear-gradient(135deg, #FEF2F2 0%, #FEF2F2 50%)',
                buttonGradient: 'linear-gradient(90deg, #FF6467 0%, #E7000B 100%)',
                titleColor: '#DC2626',
            };
        } else {
            return {
                iconGradient: 'linear-gradient(135deg, #FF8A00 0%, #FF6B00 100%)',
                containerBorder: '#FFB366',
                containerBackground: 'rgba(255, 228, 204, 0.35)',
                buttonGradient: 'linear-gradient(90deg, #FF8A00 0%, #FF6B00 100%)',
                titleColor: '#D97706',
            };
        }
    }

    analysisResult: EmotionalAnalysisResult | null = null;

    private captureInterval: any;
    private analysisTimeoutId: any;
    private readonly detectEveryMs = 4000;  // Face++ API: 1 llamada cada 4s (optimiza consumo: ~5 calls/sesión)
    private readonly minDetections = 3;    // Mínimo 3 detecciones antes de enviar (~12 seg)
    private readonly maxDetections = 5;    // Máximo 5 detecciones (~20 seg) — suficiente con quality weighting
    private readonly analysisTimeoutMs = 60000; // 60s máximo — si no hay detecciones, mostrar error
    private detections: FaceExpressionResult[] = [];
    private analysisStarted = false;
    private loadModelsRetryCount = 0;
    private readonly maxLoadModelsRetries = 10; // máx 5 seg esperando que loadModels termine
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
            this.cameraPermission = 'denied';
            this.cameraErrorType = 'not-supported';
            this.cameraError = 'Tu navegador no soporta acceso a la cámara. Usa Chrome, Firefox o Safari actualizado.';
            this.isAnalyzing = false;
            return;
        }

        // Consultar si ya hay permiso concedido previamente (solo en navegadores que soporten Permissions API)
        // IMPORTANTE: esta promesa resuelve de forma asíncrona, DESPUÉS de ngAfterViewInit.
        // Por eso, si el permiso ya estaba concedido, arrancamos la cámara directamente desde aquí.
        if (typeof navigator !== 'undefined' && navigator.permissions) {
            navigator.permissions.query({ name: 'camera' as PermissionName }).then((status) => {
                if (status.state === 'granted') {
                    // Ya tiene permiso — arrancar directo sin mostrar pantalla de solicitud.
                    // ngAfterViewInit ya pasó, así que iniciamos aquí mismo.
                    this.cameraPermission = 'granted';
                    this._faceDetector.loadModels()
                        .catch(() => {
                            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
                        })
                        .finally(() => {
                            this.initializeCamera();
                        });
                } else if (status.state === 'denied') {
                    this.cameraPermission = 'denied';
                    this.cameraErrorType = 'permission-denied';
                    this.cameraError = 'El permiso de cámara fue denegado anteriormente.';
                    this.isAnalyzing = false;
                }
                // Si 'prompt' → se queda en 'prompt' y espera el botón del usuario
            }).catch(() => {
                // Permissions API no disponible (p.ej. Safari antiguo) — quedarse en 'prompt'
            });
        }

        // Pre-cargar modelos en background (sin bloquear) para que estén listos cuando el usuario pulse el botón
        this._faceDetector.loadModels().catch(() => {
            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
        });
    }

    ngAfterViewInit(): void {
        // No arrancar cámara automáticamente — la lógica de arranque está en ngOnInit
        // para evitar la carrera entre la promesa de permissions y este hook.
    }

    ngOnDestroy(): void {
        this.cleanup();
    }
    private getCameraErrorMessage(error: unknown): string {
        const anyErr = error as any;
        const name: string | undefined = typeof anyErr?.name === 'string' ? anyErr.name : undefined;
        const message: string | undefined = typeof anyErr?.message === 'string' ? anyErr.message : undefined;

        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
            this.cameraErrorType = 'not-found';
            return 'No encontramos una cámara en tu dispositivo. Verifica que esté conectada y que no esté desactivada.';
        }
        if (name === 'NotAllowedError' || name === 'SecurityError') {
            this.cameraErrorType = 'permission-denied';
            return 'Permiso de cámara denegado. Toca el ícono de cámara en la barra de dirección de tu navegador y selecciona "Permitir".';
        }
        if (name === 'NotReadableError' || name === 'TrackStartError') {
            this.cameraErrorType = 'in-use';
            return 'La cámara está siendo usada por otra aplicación. Cierra videollamadas, Zoom, Teams u otras apps y vuelve a intentarlo.';
        }
        if (message?.toLowerCase().includes('https') || message?.toLowerCase().includes('secure')) {
            this.cameraErrorType = 'https-required';
            return 'Para usar la cámara se requiere una conexión segura (HTTPS). Accede a la app por HTTPS.';
        }
        if (message && message.trim().length > 0) {
            this.cameraErrorType = 'generic';
            return message;
        }

        this.cameraErrorType = 'generic';
        return 'No pudimos acceder a la cámara. Verifica los permisos e inténtalo de nuevo.';
    }

    /**
     * Pide permiso de cámara al usuario y arranca el análisis.
     * Llamado desde el botón "Permitir acceso a cámara" o automáticamente si ya hay permiso.
     */
    async initializeCamera(): Promise<void> {
        this.cameraPermission = 'requesting';
        this.cameraError = '';
        this.cameraErrorType = null;

        try {
            const videoEl = this.videoElement?.nativeElement;
            if (!videoEl) {
                throw new Error('El elemento de video no está disponible.');
            }
            await this._cameraService.startCamera(videoEl);

            this.cameraPermission = 'granted';

            if (!this.analysisStarted) {
                this.analysisStarted = true;
                this.startAnalysis();
            }

        } catch (error) {
            this.cameraError = this.getCameraErrorMessage(error);
            this.cameraPermission = 'denied';
            this.isAnalyzing = false;
        }
    }

    /**
     * Botón "Permitir acceso a cámara" — lanza el flujo completo desde cero.
     * CRÍTICO para iOS/Safari: getUserMedia DEBE ser llamado de forma síncrona
     * dentro del mismo event handler del gesto del usuario (click).
     * Por eso llamamos initializeCamera() PRIMERO sin await, y los modelos
     * se pre-cargan en parallel. Si los modelos aún no están listos cuando
     * el análisis arranca, startAnalysis() ya tiene el retry de hasta 10 veces.
     */
    requestCameraPermission(): void {
        // Arrancar cámara INMEDIATAMENTE (en el mismo tick del click — iOS/Safari requirement)
        this.initializeCamera();
        // Modelos: ya se pre-cargaron en ngOnInit en background, esto es seguro en parallel
        this._faceDetector.loadModels().catch(() => {
            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
        });
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
            // Models still loading — retry máx 10 veces (5 seg total) y luego mostrar error
            if (this.loadModelsRetryCount >= this.maxLoadModelsRetries) {
                this.analysisError = 'No se pudo inicializar el análisis facial. Por favor, recarga la página.';
                this.isAnalyzing = false;
                return;
            }
            this.loadModelsRetryCount++;
            setTimeout(() => this.startAnalysis(), 500);
            return;
        }

        this.loadModelsRetryCount = 0;

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

        // Timeout de seguridad: si tras 60s no hay detecciones suficientes, mostrar error claro
        this.analysisTimeoutId = setTimeout(() => {
            if (this.isAnalyzing && this.detections.length === 0) {
                if (this.captureInterval) {
                    clearInterval(this.captureInterval);
                    this.captureInterval = null;
                }
                this.analysisError = 'No se detectó un rostro durante el análisis. Verifica que tu cara esté bien iluminada y visible, y que la conexión a internet funcione correctamente.';
                this.isAnalyzing = false;
            } else if (this.isAnalyzing && this.detections.length >= 1) {
                // Hay algunas detecciones — finalizar con lo que tenemos
                this.finishAnalysis();
            }
        }, this.analysisTimeoutMs);

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
                // Si la llamada fue bloqueada por CORS (producción sin proxy en backend)
                if (this._faceDetector.isCorsBlocked) {
                    if (this.captureInterval) {
                        clearInterval(this.captureInterval);
                        this.captureInterval = null;
                    }
                    if (this.analysisTimeoutId) {
                        clearTimeout(this.analysisTimeoutId);
                        this.analysisTimeoutId = null;
                    }
                    this.analysisError = 'El análisis facial no está disponible en este momento por una restricción de seguridad del navegador (CORS). Por favor, contacta al soporte técnico.';
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
        if (this.analysisTimeoutId) {
            clearTimeout(this.analysisTimeoutId);
            this.analysisTimeoutId = null;
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

                    // El backend ya aplica scores correctos por emoción (ajustes verificados 05-mar-2026).
                    // Confiamos directamente en el estado calculado por evaluateEmotionalState()
                    // sin ninguna mitigación especial por emoción positiva.
                    const state = this._emotionalAnalysisService.evaluateEmotionalState(result);
                    const fatigueThreshold = 0.75;

                    const isRed =
                        result.alertCreated === true ||
                        (typeof result.fatigueScore === 'number' && result.fatigueScore >= fatigueThreshold) ||
                        state === 'critical';

                    let resolvedType: 'normal' | 'emotional-load' | 'alert';
                    if (isRed) {
                        resolvedType = 'alert';
                    } else if (state === 'normal') {
                        resolvedType = 'normal';
                    } else {
                        resolvedType = 'emotional-load';
                    }

                    this.resultType = resolvedType;
                    this.dynamicContent = this.buildDynamicContent(this.resultType, result.dominantEmotion ?? '');

                    // Crear alerta manual solo si el backend no la creó y el estado es crítico/alerta.
                    if (!result.alertCreated && (state === 'critical' || state === 'alert')) {
                        const severity = state === 'critical' ? 'HIGH' : 'MEDIUM';
                        const avg = Math.round(
                            (result.attention + result.concentration + result.balance + result.positivity + result.calm) / 5
                        );
                        const currentUser = this._authService.getCurrentUser();
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
                                if (!alert) {
                                    console.error('[EmotionalAnalysis] POST /alert respondió null — posible 403 o error de BD.');
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
            this.captureInterval = null;
        }
        if (this.analysisTimeoutId) {
            clearTimeout(this.analysisTimeoutId);
            this.analysisTimeoutId = null;
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
        this.cameraErrorType = null;
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
        // Si el error fue permiso denegado, volver a pantalla de solicitud
        if (this.cameraPermission === 'denied') {
            this.cameraPermission = 'prompt';
            return;
        }
        if (this.videoElement?.nativeElement) {
            this.requestCameraPermission();
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
     * Selecciona el contenido dinámico según resultType + dominantEmotion.
     * Elige aleatoriamente una variante de la lista disponible.
     */
    buildDynamicContent(
        resultType: 'normal' | 'emotional-load' | 'alert',
        dominantEmotion: string
    ): typeof this.dynamicContent {
        const typeKey = resultType === 'emotional-load' ? 'emotional-load' : resultType;
        const bank = this.CONTENT_LIBRARY[typeKey];
        if (!bank) return null;

        // Normalizar nombre de emoción del backend → clave interna
        const emotionMap: Record<string, string> = {
            happiness: 'happiness', happy: 'happiness',
            neutral: 'neutral',
            surprise: 'surprise', surprised: 'surprise',
            anger: 'anger', angry: 'anger',
            sadness: 'sadness', sad: 'sadness',
            fear: 'fear', fearful: 'fear',
            contempt: 'default', disgust: 'default', disgusted: 'default',
        };
        const key = emotionMap[dominantEmotion?.toLowerCase()] ?? 'default';
        const variants = bank[key] ?? bank['default'] ?? [];
        if (variants.length === 0) return null;

        const variant = variants[Math.floor(Math.random() * variants.length)];
        const visual = this.resultVisual;

        return {
            title: variant.title,
            iconGradient: visual.iconGradient,
            containerBorder: visual.containerBorder,
            containerBackground: visual.containerBackground,
            buttonGradient: visual.buttonGradient,
            messageText: variant.messageText,
            steps: variant.steps,
            finalMessage: variant.finalMessage,
            buttonText: variant.buttonText,
            buttonEmoji: variant.buttonEmoji,
        };
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
