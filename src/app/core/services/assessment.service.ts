import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
    AssessmentModuleId,
    AssessmentOutcome,
    AssessmentQuestion,
    AssessmentResult,
} from 'app/core/models/assessment.model';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';

const QUESTIONS_BY_MODULE: Record<AssessmentModuleId, AssessmentQuestion[]> = {
    'mental-health': [
        {
            id: 1,
            text: 'Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido nervioso/a, ansioso/a o muy tenso/a?',
            options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días', 'Todos los días'],
        },
        {
            id: 2,
            text: 'Durante las últimas 2 semanas, ¿con qué frecuencia te has sentido decaído/a, deprimido/a o sin esperanza?',
            options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días', 'Todos los días'],
        },
        {
            id: 3,
            text: 'Durante las últimas 2 semanas, ¿has tenido dificultad para conciliar el sueño, permanecer dormido/a o dormir demasiado?',
            options: ['Ninguna dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad considerable', 'Dificultad extrema'],
        },
        {
            id: 4,
            text: 'Durante las últimas 2 semanas, ¿te has sentido cansado/a o con poca energía?',
            options: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días', 'Todos los días'],
        },
        {
            id: 5,
            text: 'Durante las últimas 2 semanas, ¿has tenido dificultad para concentrarte en actividades como leer o ver televisión?',
            options: ['Ninguna dificultad', 'Dificultad leve', 'Dificultad moderada', 'Dificultad considerable', 'Dificultad extrema'],
        },
    ],
    'work-fatigue': [
        {
            id: 1,
            text: '¿Con qué frecuencia te sientes exhausto/a al final de tu jornada laboral?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 2,
            text: '¿Con qué frecuencia tienes dificultad para concentrarte en tus tareas laborales?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 3,
            text: '¿Con qué frecuencia sientes que tu trabajo te agota emocionalmente?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 4,
            text: '¿Con qué frecuencia experimentas tensión muscular o dolores físicos relacionados con el trabajo?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 5,
            text: '¿Con qué frecuencia te resulta difícil desconectar del trabajo en tu tiempo libre?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
    ],
    'organizational-climate': [
        {
            id: 1,
            text: '¿Cómo calificarías la comunicación entre tu equipo y la dirección?',
            options: ['Muy deficiente', 'Deficiente', 'Regular', 'Buena', 'Excelente'],
        },
        {
            id: 2,
            text: '¿Te sientes valorado/a por tus contribuciones en la organización?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 3,
            text: '¿Cómo percibes el ambiente de trabajo en tu organización?',
            options: ['Muy negativo', 'Negativo', 'Neutral', 'Positivo', 'Muy positivo'],
        },
        {
            id: 4,
            text: '¿Consideras que existe colaboración efectiva entre los equipos?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 5,
            text: '¿Sientes que la organización te brinda oportunidades de desarrollo profesional?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
    ],
    'psychosocial-risk': [
        {
            id: 1,
            text: '¿Con qué frecuencia experimentas estrés relacionado con las demandas de tu trabajo?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 2,
            text: '¿Sientes que tienes suficiente autonomía para tomar decisiones en tu trabajo?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 3,
            text: '¿Con qué frecuencia experimentas conflictos o tensiones con compañeros o superiores?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 4,
            text: '¿Te sientes inseguro/a respecto a la estabilidad de tu empleo?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
        {
            id: 5,
            text: '¿Percibes que tu carga de trabajo es excesiva o difícil de manejar?',
            options: ['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'],
        },
    ],
};

@Injectable({
    providedIn: 'root',
})
export class AssessmentService {
    getQuestions(moduleId: AssessmentModuleId): Observable<AssessmentQuestion[]> {
        return of(QUESTIONS_BY_MODULE[moduleId]).pipe(delay(150));
    }

    submit(moduleId: AssessmentModuleId, answers: number[]): Observable<AssessmentResult> {
        const moduleDef = getAssessmentModuleDefinition(moduleId);
        const score = this.computeScore(answers, moduleDef.higherIsWorse);
        const outcome = this.getOutcome(score);

        const headline = this.getHeadline(outcome);
        const message = this.getMessage(outcome, moduleId);

        const result: AssessmentResult = {
            moduleId,
            outcome,
            score,
            evaluatedAt: new Date().toISOString(),
            headline,
            message,
            dimensions: this.buildDimensions(moduleId, score, outcome),
            recommendations: this.getRecommendations(outcome, moduleId),
        };

        return of(result).pipe(delay(450));
    }

    private computeScore(answers: number[], higherIsWorse: boolean): number {
        // answers are 0..4
        const avg = answers.reduce((acc, v) => acc + v, 0) / Math.max(answers.length, 1);
        const normalized = higherIsWorse ? 1 - avg / 4 : avg / 4;
        const clamped = Math.min(1, Math.max(0, normalized));
        return Math.round(clamped * 100);
    }

    private getOutcome(score: number): AssessmentOutcome {
        if (score >= 70) return 'adequate';
        if (score >= 40) return 'mild';
        return 'high-risk';
    }

    private getHeadline(outcome: AssessmentOutcome): string {
        switch (outcome) {
            case 'adequate':
                return 'Bienestar Adecuado';
            case 'mild':
                return 'Alerta Leve';
            case 'high-risk':
                return 'Riesgo Alto';
        }
    }

    private getMessage(outcome: AssessmentOutcome, moduleId: AssessmentModuleId): string {
        switch (outcome) {
            case 'adequate':
                return 'Tu evaluación muestra un buen nivel de bienestar. Continúa con tus hábitos saludables y mantente atento/a a cualquier cambio.';
            case 'mild':
                return moduleId === 'organizational-climate'
                    ? 'Tu percepción del clima laboral muestra aspectos positivos y algunas áreas de mejora. Es importante comunicar tus necesidades a tu líder.'
                    : moduleId === 'work-fatigue'
                        ? 'Tu nivel de energía muestra signos de alerta leve. Es importante implementar estrategias de recuperación para evitar el agotamiento.'
                        : 'Se observan señales leves que vale la pena atender. Pequeños ajustes de hábitos y apoyo pueden marcar una gran diferencia.';
            case 'high-risk':
                return moduleId === 'psychosocial-risk'
                    ? 'Los resultados muestran factores de riesgo psicosocial significativos que requieren intervención inmediata de la organización.'
                    : 'Los resultados sugieren una situación que requiere atención prioritaria. Considera buscar apoyo y aplicar medidas de cuidado de forma inmediata.';
        }
    }

    private buildDimensions(moduleId: AssessmentModuleId, score: number, outcome: AssessmentOutcome) {
        const moduleDef = getAssessmentModuleDefinition(moduleId);

        // Create plausible per-dimension values so UI matches Figma patterns.
        const base = score;
        const swing = outcome === 'adequate' ? 10 : outcome === 'mild' ? 12 : 6;

        return moduleDef.dimensionLabels.map((d, idx) => {
            const direction = idx % 2 === 0 ? 1 : -1;
            let percent = Math.round(base + direction * (swing - idx * 2));

            if (outcome === 'high-risk') {
                // Force very low values (like screenshot) while keeping some variance.
                percent = Math.max(0, Math.min(8, Math.round((idx === 1 ? 4 : idx === 2 ? 1 : 0) + (base / 100) * 2)));
            }

            percent = Math.min(100, Math.max(0, percent));

            return {
                id: d.id,
                label: d.label,
                percent,
            };
        });
    }

    private getRecommendations(outcome: AssessmentOutcome, moduleId: AssessmentModuleId): string[] {
        if (outcome === 'adequate') {
            return [
                'Mantén tu rutina de sueño y ejercicio regular',
                'Practica técnicas de mindfulness o meditación 10 minutos diarios',
                'Continúa cultivando relaciones sociales positivas',
                'Realiza pausas activas durante tu jornada laboral',
            ];
        }

        if (outcome === 'mild') {
            if (moduleId === 'organizational-climate') {
                return [
                    'Comunica tus necesidades y expectativas a tu líder',
                    'Participa activamente en espacios de retroalimentación',
                    'Propón acuerdos claros sobre roles y prioridades',
                    'Refuerza prácticas de reconocimiento en el equipo',
                ];
            }

            if (moduleId === 'work-fatigue') {
                return [
                    'Programa neuropausas cada 90 minutos de trabajo',
                    'Asegura 7-8 horas de sueño de calidad cada noche',
                    'Practica ejercicios de estiramiento cada hora',
                    'Establece límites claros entre trabajo y tiempo personal',
                    'Comunica a tu líder si sientes sobrecarga',
                ];
            }

            return [
                'Ajusta tu rutina de descanso y hábitos de autocuidado',
                'Realiza pausas breves de respiración durante el día',
                'Identifica factores que disparan el malestar y regístralos',
                'Busca apoyo si los síntomas persisten',
            ];
        }

        // high-risk
        if (moduleId === 'psychosocial-risk') {
            return [
                '🚨 Reporta la situación a Recursos Humanos urgentemente',
                'Documenta factores de riesgo específicos',
                'Solicita intervención organizacional inmediata',
                'Conoce tus derechos según normativa laboral',
                'Busca asesoría legal si la situación no mejora',
            ];
        }

        return [
            'Solicita apoyo profesional lo antes posible',
            'Prioriza el descanso y reduce sobrecarga cuando sea posible',
            'Comunica a tu líder/HR la situación para activar soporte',
            'Evita aislarte; busca una red de apoyo cercana',
            'Documenta síntomas y detonantes para dar seguimiento',
        ];
    }
}
