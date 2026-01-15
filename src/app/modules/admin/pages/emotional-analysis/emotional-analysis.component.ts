import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CameraService } from 'app/core/services/camera.service';
import { EmotionalAnalysisService, EmotionalAnalysisResult } from 'app/core/services/emotional-analysis.service';

@Component({
    selector: 'app-emotional-analysis',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './emotional-analysis.component.html',
    styleUrls: ['./emotional-analysis.component.scss']
})
export class EmotionalAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

    userName: string = 'María Gómez';
    currentStep: number = 1;
    totalSteps: number = 5;
    progress: number = 0;
    isAnalyzing: boolean = true;
    showResults: boolean = false;
    cameraError: string = '';
    capturedFrames: string[] = [];

    steps = [
        { id: 1, name: 'Atención', status: 'active', percentage: 67 },
        { id: 2, name: 'Concentración', status: 'pending', percentage: 70 },
        { id: 3, name: 'Equilibrio', status: 'pending', percentage: 79 },
        { id: 4, name: 'Positividad', status: 'pending', percentage: 68 },
        { id: 5, name: 'Calma', status: 'pending', percentage: 63 }
    ];

    // Propiedades dinámicas para los resultados
    resultType: 'alert' | 'emotional-load' = 'alert'; // Por defecto alerta roja

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

    private progressInterval: any;
    private captureInterval: any;

    constructor(
        private _router: Router,
        private _cameraService: CameraService,
        private _emotionalAnalysisService: EmotionalAnalysisService
    ) { }

    ngOnInit(): void {
        // Verificar soporte de cámara
        if (!this._cameraService.isCameraSupported()) {
            this.cameraError = 'Tu navegador no soporta acceso a la cámara';
        }

        // Iniciar progreso mock inmediatamente para ver el diseño
        setTimeout(() => {
            this.startAnalysis();
        }, 500);
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

    /**
     * Inicializa la cámara y comienza el análisis
     */
    async initializeCamera(): Promise<void> {
        try {
            const videoEl = this.videoElement.nativeElement;
            await this._cameraService.startCamera(videoEl);
            console.log('Cámara iniciada correctamente');

        } catch (error) {
            console.error('Error al inicializar cámara:', error);
            this.cameraError = 'No se pudo acceder a la cámara';
            // El progreso continúa aunque falle la cámara
        }
    }

    /**
     * Inicia el proceso de análisis
     */
    startAnalysis(): void {
        // Capturar frames cada 2 segundos (solo si hay cámara)
        if (this._cameraService.isCameraSupported() && this.videoElement) {
            this.captureInterval = setInterval(() => {
                const frame = this._cameraService.captureFrame(this.videoElement.nativeElement);
                if (frame) {
                    this.capturedFrames.push(frame);
                }
            }, 2000);
        }

        // Progreso de pasos
        this.progressInterval = setInterval(() => {
            if (this.currentStep <= this.totalSteps) {
                // Incrementar progreso en cada paso (20% por paso)
                this.progress = (this.currentStep / this.totalSteps) * 100;

                // Marcar el paso anterior como completado
                if (this.currentStep > 1) {
                    this.steps[this.currentStep - 2].status = 'completed';
                }

                // Activar el paso actual
                if (this.currentStep <= this.totalSteps) {
                    this.steps[this.currentStep - 1].status = 'active';
                }

                // Incrementar al siguiente paso
                this.currentStep++;

                // Si ya completamos todos los pasos
                if (this.currentStep > this.totalSteps) {
                    this.finishAnalysis();
                }
            }
        }, 3000); // Cada paso toma 3 segundos para que se vea bien
    }

    /**
     * Finaliza el análisis y procesa resultados
     */
    async finishAnalysis(): Promise<void> {
        // Marcar el último paso como completado
        this.steps[this.totalSteps - 1].status = 'completed';
        this.progress = 100;
        this.isAnalyzing = false;

        // Detener captura de frames
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        // Procesar análisis con los frames capturados
        if (this.capturedFrames.length > 0) {
            this._emotionalAnalysisService.performFullAnalysis(this.capturedFrames)
                .subscribe(result => {
                    this.analysisResult = result;

                    // Actualizar porcentajes en los steps
                    this.steps[0].percentage = result.attention;
                    this.steps[1].percentage = result.concentration;
                    this.steps[2].percentage = result.balance;
                    this.steps[3].percentage = result.positivity;
                    this.steps[4].percentage = result.calm;

                    // Mostrar resultados después de 1 segundo
                    setTimeout(() => {
                        this.showResults = true;
                    }, 1000);
                });
        } else {
            // Si no hay frames, mostrar resultados de todos modos
            setTimeout(() => {
                this.showResults = true;
            }, 1000);
        }
    }

    /**
     * Limpia recursos
     */
    cleanup(): void {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        if (this.captureInterval) {
            clearInterval(this.captureInterval);
        }

        this._cameraService.stopCamera();
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
        console.log('Iniciando pausa guiada...');
        // Aquí se implementaría la lógica de la pausa guiada
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
