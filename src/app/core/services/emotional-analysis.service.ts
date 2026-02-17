import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EmotionalAnalysisResult {
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    fatigueScore?: number;
    dominantEmotion?: string;
    alertCreated?: boolean;
    timestamp: Date;
}

export interface AnalysisProgress {
    currentStep: number;
    totalSteps: number;
    progress: number;
    stepName: string;
}

interface EmotionalAnalysisApiRequest {
    evaluationID?: number;
    framesBase64: string[];
    audioBase64?: string;
    createAlertOnFatigue: boolean;
}

interface EmotionalAnalysisApiResponse {
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    fatigueScore?: number;
    dominantEmotion?: string;
    alertCreated?: boolean;
    timestamp?: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmotionalAnalysisService {
    private readonly apiUrl = (environment as any).emotionalAnalysisApiUrl || environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    /**
     * Analiza una imagen y retorna los resultados emocionales
     */
    analyzeFrame(imageBase64: string): Observable<EmotionalAnalysisResult> {
        return this.performFullAnalysis([imageBase64]);
    }

    /**
     * Realiza un análisis completo con múltiples capturas
     *
     */
    performFullAnalysis(frames: string[]): Observable<EmotionalAnalysisResult> {
        const payload: EmotionalAnalysisApiRequest = {
            framesBase64: frames,
            createAlertOnFatigue: true,
        };

        return this.http
            .post<EmotionalAnalysisApiResponse>(`${this.apiUrl}/evaluation/emotional-analysis`, payload)
            .pipe(
                map((res) => ({
                    attention: this.clampScore(res.attention),
                    concentration: this.clampScore(res.concentration),
                    balance: this.clampScore(res.balance),
                    positivity: this.clampScore(res.positivity),
                    calm: this.clampScore(res.calm),
                    fatigueScore: typeof res.fatigueScore === 'number' ? res.fatigueScore : undefined,
                    dominantEmotion: typeof res.dominantEmotion === 'string' ? res.dominantEmotion : undefined,
                    alertCreated: typeof res.alertCreated === 'boolean' ? res.alertCreated : undefined,
                    timestamp: res.timestamp ? new Date(res.timestamp) : new Date(),
                }))
            );
    }

    /**
     * Evalúa el estado emocional general basado en los resultados
     */
    evaluateEmotionalState(result: EmotionalAnalysisResult): 'normal' | 'alert' | 'critical' {
        const average = (
            result.attention +
            result.concentration +
            result.balance +
            result.positivity +
            result.calm
        ) / 5;

        if (average >= 70) {
            return 'normal';
        } else if (average >= 50) {
            return 'alert';
        } else {
            return 'critical';
        }
    }

    private clampScore(value: number | null | undefined): number {
        if (typeof value !== 'number' || Number.isNaN(value)) return 0;
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    /**
     * Obtiene recomendaciones basadas en el análisis
     */
    getRecommendations(result: EmotionalAnalysisResult): string[] {
        const recommendations: string[] = [];
        const state = this.evaluateEmotionalState(result);

        if (state === 'alert' || state === 'critical') {
            recommendations.push('Considera tomar una pausa guiada de 2 minutos');
            recommendations.push('Realiza ejercicios de respiración profunda');
        }

        if (result.calm < 60) {
            recommendations.push('Practica técnicas de relajación');
        }

        if (result.attention < 65) {
            recommendations.push('Toma un descanso de 5-10 minutos');
        }

        if (result.balance < 70) {
            recommendations.push('Realiza ejercicios de equilibrio mental');
        }

        return recommendations;
    }
}
