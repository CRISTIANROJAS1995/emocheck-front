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
    async startCamera(
        videoElement: HTMLVideoElement,
        options?: {
            facingMode?: 'user' | 'environment';
            widthIdeal?: number;
            heightIdeal?: number;
            deviceId?: string;
        }
    ): Promise<void> {
        try {
            this.cameraStatus$.next('requesting');

            if (!this.isCameraSupported()) {
                throw new Error('El navegador no soporta acceso a la cámara');
            }

            // En la mayoría de navegadores la cámara solo funciona en contextos seguros (HTTPS) o localhost.
            const isLocalhost = typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '[::1]');
            const secure = (typeof window !== 'undefined' && (window.isSecureContext === true)) || isLocalhost;
            if (!secure) {
                throw new Error('Para usar la cámara, abre la app en HTTPS o en localhost.');
            }

            // iOS/Safari: ayuda a evitar que el video se abra en fullscreen y mejora autoplay.
            videoElement.setAttribute('playsinline', 'true');
            videoElement.muted = true;
            videoElement.autoplay = true;

            // Solicitar acceso a la cámara
            const facingMode = options?.facingMode ?? 'user';
            const widthIdeal = options?.widthIdeal ?? 1280;
            const heightIdeal = options?.heightIdeal ?? 720;

            const videoConstraints: MediaTrackConstraints = {
                width: { ideal: widthIdeal },
                height: { ideal: heightIdeal },
                facingMode,
            };

            if (options?.deviceId) {
                videoConstraints.deviceId = { exact: options.deviceId };
            }

            this.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });


            videoElement.srcObject = this.stream;

            await this.waitForVideoReady(videoElement);
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
                } else if (error.message) {
                    this.errorMessage$.next(error.message);
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
            this.errorMessage$.next('');
        }
    }

    /**
     * Captura un frame del video como imagen base64
     */
    captureFrame(
        videoElement: HTMLVideoElement,
        options?: {
            maxWidth?: number;
            quality?: number;
        }
    ): string | null {
        if (!this.stream) {
            return null;
        }

        try {
            if (!videoElement.videoWidth || !videoElement.videoHeight) {
                return null;
            }

            const maxWidth = options?.maxWidth;
            const quality = typeof options?.quality === 'number' ? options.quality : 0.8;

            const canvas = document.createElement('canvas');
            const srcW = videoElement.videoWidth;
            const srcH = videoElement.videoHeight;

            if (maxWidth && srcW > maxWidth) {
                const ratio = maxWidth / srcW;
                canvas.width = Math.round(srcW * ratio);
                canvas.height = Math.round(srcH * ratio);
            } else {
                canvas.width = srcW;
                canvas.height = srcH;
            }

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', quality);
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

    private waitForVideoReady(videoElement: HTMLVideoElement): Promise<void> {
        // Si ya tiene metadata, seguimos.
        if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA && videoElement.videoWidth > 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const onReady = () => {
                videoElement.removeEventListener('loadedmetadata', onReady);
                videoElement.removeEventListener('canplay', onReady);
                resolve();
            };
            videoElement.addEventListener('loadedmetadata', onReady, { once: true });
            videoElement.addEventListener('canplay', onReady, { once: true });
        });
    }
}
