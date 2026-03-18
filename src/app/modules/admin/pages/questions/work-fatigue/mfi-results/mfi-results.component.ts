import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentResult } from 'app/core/models/assessment.model';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

interface MFIDimensionResult {
    id: string;
    label: string;
    score: number;
    maxScore: number;
    percent: number;
    riskLevel: 'Green' | 'Yellow' | 'Red';
    description: string;
}

@Component({
    selector: 'app-mfi-results',
    standalone: true,
    imports: [CommonModule, BackgroundCirclesComponent],
    templateUrl: './mfi-results.component.html',
    styleUrl: './mfi-results.component.scss'
})
export class MfiResultsComponent implements OnInit {
    
    result: AssessmentResult | null = null;
    dimensionResults: MFIDimensionResult[] = [];
    overallRisk: 'Green' | 'Yellow' | 'Red' = 'Green';
    
    constructor(
        private router: Router,
        private assessmentState: AssessmentStateService
    ) {}

    ngOnInit(): void {
        this.result = this.assessmentState.getResult('work-fatigue');
        
        if (!this.result) {
            this.router.navigate(['/work-fatigue']);
            return;
        }

        this.processResults();
    }

    private processResults(): void {
        if (!this.result) return;

        // Mapear las dimensiones del resultado a nuestro formato
        this.dimensionResults = this.result.dimensions.map(dim => ({
            id: dim.id,
            label: dim.label,
            score: dim.score,
            maxScore: dim.maxScore,
            percent: dim.percent,
            riskLevel: this.mapRiskLevel(dim.riskLevel),
            description: this.getDimensionDescription(dim.id, dim.riskLevel)
        }));

        // Calcular riesgo general
        this.overallRisk = this.calculateOverallRisk();
    }

    private mapRiskLevel(riskLevel: string | undefined): 'Green' | 'Yellow' | 'Red' {
        if (!riskLevel) return 'Green';
        const level = riskLevel.toLowerCase();
        if (level.includes('high') || level.includes('red') || level.includes('alto')) return 'Red';
        if (level.includes('medium') || level.includes('yellow') || level.includes('moderado')) return 'Yellow';
        return 'Green';
    }

    private calculateOverallRisk(): 'Green' | 'Yellow' | 'Red' {
        const redCount = this.dimensionResults.filter(d => d.riskLevel === 'Red').length;
        const yellowCount = this.dimensionResults.filter(d => d.riskLevel === 'Yellow').length;

        if (redCount >= 2) return 'Red';
        if (redCount >= 1 || yellowCount >= 3) return 'Yellow';
        return 'Green';
    }

    private getDimensionDescription(dimensionId: string, riskLevel: string | undefined): string {
        const risk = this.mapRiskLevel(riskLevel);
        
        const descriptions = {
            'fatiga_general': {
                'Green': 'Cuentas con niveles adecuados de energía general para realizar tus actividades diarias.',
                'Yellow': 'Presentas algunos signos de fatiga general que pueden estar afectando tu rendimiento.',
                'Red': 'Los niveles de fatiga general son elevados y requieren atención para prevenir el agotamiento.'
            },
            'fatiga_fisica': {
                'Green': 'Tu condición física te permite realizar las tareas laborales sin dificultad.',
                'Yellow': 'Experimentas cierto cansancio físico que podría requerir ajustes en tu rutina.',
                'Red': 'El cansancio físico es significativo y puede estar impactando tu bienestar laboral.'
            },
            'actividad_reducida': {
                'Green': 'Mantienes un buen nivel de actividad y productividad en tu trabajo.',
                'Yellow': 'Has experimentado algunas reducciones en tu nivel de actividad habitual.',
                'Red': 'Tu nivel de actividad se ha visto considerablemente reducido, lo que requiere atención.'
            },
            'motivacion': {
                'Green': 'Conservas una buena motivación y entusiasmo por tus actividades laborales.',
                'Yellow': 'Tu motivación ha disminuido parcialmente, lo que podría afectar tu desempeño.',
                'Red': 'Los niveles de motivación son bajos y pueden estar impactando significativamente tu trabajo.'
            },
            'dinamismo': {
                'Green': 'Mantienes buenos niveles de dinamismo y capacidad de acción en el trabajo.',
                'Yellow': 'Has experimentado cierta reducción en tu dinamismo y energía para la acción.',
                'Red': 'Los niveles de dinamismo son bajos, lo que puede estar limitando tu capacidad de acción.'
            }
        };

        return descriptions[dimensionId]?.[risk] || 'Descripción no disponible.';
    }

    getOverallMessage(): string {
        switch (this.overallRisk) {
            case 'Green':
                return 'Tus niveles de fatiga laboral se encuentran en rangos adecuados. Continúa con tus buenas prácticas de autocuidado y mantén un equilibrio saludable entre el trabajo y el descanso.';
            case 'Yellow':
                return 'Presentas algunos signos de fatiga laboral que requieren atención. Es recomendable revisar tus hábitos de descanso, manejo del estrés y equilibrio trabajo-vida personal.';
            case 'Red':
                return 'Los niveles de fatiga laboral son elevados y requieren atención prioritaria. Te recomendamos buscar apoyo profesional y evaluar estrategias para reducir el agotamiento.';
            default:
                return '';
        }
    }

    getOverallTitle(): string {
        switch (this.overallRisk) {
            case 'Green':
                return 'Fatiga Controlada';
            case 'Yellow':
                return 'Fatiga Moderada';
            case 'Red':
                return 'Fatiga Elevada';
            default:
                return 'Resultados de Fatiga';
        }
    }

    getRiskIcon(risk: 'Green' | 'Yellow' | 'Red'): string {
        switch (risk) {
            case 'Green': return '✅';
            case 'Yellow': return '⚠️';
            case 'Red': return '🚨';
        }
    }

    getRiskColorClass(risk: 'Green' | 'Yellow' | 'Red'): string {
        switch (risk) {
            case 'Green': return 'mfi-risk--green';
            case 'Yellow': return 'mfi-risk--yellow';
            case 'Red': return 'mfi-risk--red';
        }
    }

    goBack(): void {
        this.router.navigate(['/work-fatigue']);
    }

    goToAllResults(): void {
        this.router.navigate(['/work-fatigue/results']);
    }
}