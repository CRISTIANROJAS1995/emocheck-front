import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CameraService {
    private stream: MediaStream | null = null;
    private cameraStatus$ = new BehaviorSubject<'idle' | 'requesting' | 'active' | 'error'>('idle');
    private errorMessage$ = new BehaviorSubject<string>('');

    constructor() { }

    /**
     * Obtiene el estado actual de la cámara
     */
    getCameraStatus(): Observable<'idle' | 'requesting' | 'active' | 'error'> {
        return this.cameraStatus$.asObservable();
    }

    /**
     * Obtiene el mensaje de error si existe
     */
    getErrorMessage(): Observable<string> {
        return this.errorMessage$.asObservable();
    }

    /**
     * Inicia la cámara y retorna el stream
     */
    async startCamera(videoElement: HTMLVideoElement): Promise<void> {
        try {
            this.cameraStatus$.next('requesting');

            // Solicitar acceso a la cámara
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: false
            });


            videoElement.srcObject = this.stream;

            await videoElement.play();

            this.cameraStatus$.next('active');
            this.errorMessage$.next('');

        } catch (error) {
            this.cameraStatus$.next('error');

            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    this.errorMessage$.next('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
                } else if (error.name === 'NotFoundError') {
                    this.errorMessage$.next('No se encontró ninguna cámara en tu dispositivo.');
                } else if (error.name === 'NotReadableError') {
                    this.errorMessage$.next('La cámara está siendo utilizada por otra aplicación.');
                } else {
                    this.errorMessage$.next('Error al acceder a la cámara: ' + error.message);
                }
            } else {
                this.errorMessage$.next('Error desconocido al acceder a la cámara.');
            }

            throw error;
        }
    }

    /**
     * Detiene la cámara y libera recursos
     */
    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.cameraStatus$.next('idle');
        }
    }

    /**
     * Captura un frame del video como imagen base64
     */
    captureFrame(videoElement: HTMLVideoElement): string | null {
        if (!this.stream) {
            return null;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.8);
            }

            return null;
        } catch (error) {
            console.error('Error al capturar frame:', error);
            return null;
        }
    }

    /**
     * Verifica si el navegador soporta acceso a la cámara
     */
    isCameraSupported(): boolean {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Obtiene el stream actual
     */
    getCurrentStream(): MediaStream | null {
        return this.stream;
    }
}
