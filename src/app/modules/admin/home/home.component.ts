import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { ModuleCardComponent, ModuleCardData, EmoBadgeComponent } from 'app/shared/components';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentOutcome, AssessmentModuleId } from 'app/core/models/assessment.model';

interface Module extends ModuleCardData {
    route: string;
}

interface Resource {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconClass: string;
    buttonText: string;
    action: () => void;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, ModuleCardComponent, EmoBadgeComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    user: User;

    modules: Module[] = [
        {
            id: 'mental-health',
            title: 'Salud Mental',
            description: 'Tamizaje de ansiedad, depresión, trastorno del sueño y desgaste emocional',
            icon: 'icons/Icon (18).svg',
            colorClass: 'module-card--mental-health',
            iconClass: 'module-icon--blue',
            route: '/mental-health'
        },
        {
            id: 'work-fatigue',
            title: 'Fatiga Laboral',
            description: 'Evaluación rápida de energía cognitiva y emocional',
            icon: 'icons/Icon (27).svg',
            colorClass: 'module-card--work-fatigue',
            iconClass: 'module-icon--green',
            route: '/work-fatigue'
        },
        {
            id: 'organizational-climate',
            title: 'Clima Organizacional',
            description: 'Percepción del entorno, liderazgo y propósito',
            icon: 'icons/Icon (28).svg',
            colorClass: 'module-card--organizational-climate',
            iconClass: 'module-icon--teal',
            route: '/organizational-climate'
        },
        {
            id: 'psychosocial-risk',
            title: 'Riesgo Psicosocial',
            description: 'Factores intralaborales y extralaborales según Batería Ministerio del Trabajo',
            icon: 'icons/Icon (29).svg',
            colorClass: 'module-card--psychosocial-risk',
            iconClass: 'module-icon--orange',
            route: '/psychosocial-risk'
        }
    ];

    resources: Resource[] = [
        {
            id: 'emotional-calibration',
            title: 'Calibración Emocional',
            description: 'Analiza tu estado emocional cuando lo necesites',
            icon: 'heroicons_outline:heart',
            iconClass: 'resource-icon--teal',
            buttonText: 'Iniciar',
            action: () => this.navigateToResource('emotional-calibration')
        },
        {
            id: 'mindfulness',
            title: 'Mindfulness',
            description: 'Ejercicios de meditación y respiración consciente',
            icon: 'icons/Icon.svg',
            iconClass: 'resource-icon--purple',
            buttonText: 'Explorar',
            action: () => this.navigateToResource('mindfulness')
        },
        {
            id: 'neuropauses',
            title: 'Neuropausas',
            description: 'Pausas activas para recargar tu energía mental',
            icon: 'icons/Icon (27).svg',
            iconClass: 'resource-icon--pink',
            buttonText: 'Explorar',
            action: () => this.navigateToResource('neuropauses')
        },
        {
            id: 'professional-support',
            title: 'Apoyo Profesional',
            description: 'Conecta con especialistas en salud mental',
            icon: 'icons/Icon (30).svg',
            iconClass: 'resource-icon--cyan',
            buttonText: 'Solicitar',
            action: () => this.navigateToResource('professional-support')
        }
    ];

    constructor(
        private router: Router,
        private userService: UserService,
        private assessmentState: AssessmentStateService
    ) { }

    ngOnInit(): void {
        // Subscribe to user data
        this.userService.user$.subscribe((user) => {
            this.user = user;
        });

        // Subscribe to evaluation results and reflect completion state on cards
        this.assessmentState.results$.subscribe((results) => {
            this.modules = this.modules.map((module) => {
                const result = results[module.id as AssessmentModuleId];
                return {
                    ...module,
                    points: result?.score,
                    disabled: !!result,
                    status: result
                        ? {
                            label: this.getOutcomeLabel(result.outcome),
                            tone: this.getOutcomeTone(result.outcome),
                            icon: this.getOutcomeIcon(result.outcome),
                        }
                        : undefined,
                };
            });
        });
    }

    private getOutcomeIcon(outcome: AssessmentOutcome): 'check' | 'warn' | 'alert' {
        switch (outcome) {
            case 'adequate':
                return 'check';
            case 'mild':
                return 'warn';
            case 'high-risk':
                return 'alert';
        }
    }

    private getOutcomeLabel(outcome: AssessmentOutcome): string {
        switch (outcome) {
            case 'adequate':
                return 'Bienestar Adecuado';
            case 'mild':
                return 'Alerta Leve';
            case 'high-risk':
                return 'Riesgo Alto';
        }
    }

    private getOutcomeTone(outcome: AssessmentOutcome): 'success' | 'warning' | 'danger' {
        switch (outcome) {
            case 'adequate':
                return 'success';
            case 'mild':
                return 'warning';
            case 'high-risk':
                return 'danger';
        }
    }

    startEvaluation(moduleId: string): void {
        const module = this.modules.find(m => m.id === moduleId);
        if (module && !module.disabled) {
            this.router.navigate([module.route]);
        }
    }

    viewPlan(moduleId: string): void {
        this.router.navigate(['/plan', moduleId]);
    }

    navigateToResource(resourceId: string): void {
        this.router.navigate(['/resources', resourceId]);
    }

    get userName(): string {
        return this.user?.name || 'Usuario';
    }
}
