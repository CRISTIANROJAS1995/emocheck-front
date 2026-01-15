import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface EmotionalAnalysisResult {
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    timestamp: Date;
}

export interface AnalysisProgress {
    currentStep: number;
    totalSteps: number;
    progress: number;
    stepName: string;
}

@Injectable({
    providedIn: 'root'
})
export class EmotionalAnalysisService {

    constructor() { }

    /**
     * Analiza una imagen y retorna los resultados emocionales (MOCK)
     */
    analyzeFrame(imageBase64: string): Observable<EmotionalAnalysisResult> {
        // Simulamos valores aleatorios para el mock
        const mockResult: EmotionalAnalysisResult = {
            attention: this.getRandomScore(60, 90),
            concentration: this.getRandomScore(65, 85),
            balance: this.getRandomScore(70, 95),
            positivity: this.getRandomScore(60, 85),
            calm: this.getRandomScore(55, 75),
            timestamp: new Date()
        };

        // Simulamos un delay como si fuera una llamada real
        return of(mockResult).pipe(delay(500));
    }

    /**
     * Realiza un análisis completo con múltiples capturas (MOCK)
     *
     */
    performFullAnalysis(frames: string[]): Observable<EmotionalAnalysisResult> {

        // Por ahora retornamos promedios simulados

        const mockResult: EmotionalAnalysisResult = {
            attention: this.getRandomScore(67, 75),
            concentration: this.getRandomScore(68, 78),
            balance: this.getRandomScore(75, 85),
            positivity: this.getRandomScore(65, 75),
            calm: this.getRandomScore(60, 70),
            timestamp: new Date()
        };

        return of(mockResult).pipe(delay(1000));
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

    /**
     * Genera un score aleatorio en un rango (para el mock)
     */
    private getRandomScore(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
