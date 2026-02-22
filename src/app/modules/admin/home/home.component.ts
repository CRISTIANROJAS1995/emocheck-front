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
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';
import { AssessmentService } from 'app/core/services/assessment.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';

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

    loadingModules = true;
    modulesError: string | null = null;

    private baseModules: Module[] = [];
    private latestResults: Partial<Record<AssessmentModuleId, import('app/core/models/assessment.model').AssessmentResult>> = {};

    modules: Module[] = [];

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
        private assessmentState: AssessmentStateService,
        private assessmentHydration: AssessmentHydrationService,
        private assessmentService: AssessmentService
    ) { }

    ngOnInit(): void {
        // Rehydrate module statuses from backend so they persist across reloads.
        this.assessmentHydration.hydrateLatestCompletedResults().subscribe();

        this.assessmentService.getActiveModuleIds().subscribe({
            next: (ids) => {
                this.baseModules = ids.map((id) => {
                    const def = getAssessmentModuleDefinition(id);
                    return {
                        id: def.id,
                        title: def.title,
                        description: def.description,
                        icon: def.icon,
                        colorClass: def.colorClass,
                        iconClass: def.iconClass,
                        route: def.route,
                    };
                });
                this.loadingModules = false;
                this.modulesError = null;
                this.applyResultsToModules();
            },
            error: () => {
                this.baseModules = [];
                this.modules = [];
                this.loadingModules = false;
                this.modulesError = 'No fue posible cargar los módulos disponibles';
            },
        });

        // Subscribe to user data
        this.userService.user$.subscribe((user) => {
            this.user = user;
        });

        // Subscribe to evaluation results and reflect completion state on cards
        this.assessmentState.results$.subscribe((results) => {
            this.latestResults = results as any;
            this.applyResultsToModules();
        });
    }

    private applyResultsToModules(): void {
        this.modules = this.baseModules.map((module) => {
            const result = this.latestResults[module.id as AssessmentModuleId];
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
        // Navigate to the results page of the completed module.
        // The results page (/{moduleId}/results) will hydrate the last result from the backend.
        this.router.navigate([`/${moduleId}/results`]);
    }

    navigateToResource(resourceId: string): void {
        switch ((resourceId ?? '').toLowerCase()) {
            case 'emotional-calibration':
                this.router.navigate(['/emotional-analysis']);
                return;
            case 'professional-support':
                this.router.navigate(['/support']);
                return;
            default:
                this.router.navigate(['/resources']);
                return;
        }
    }

    get userName(): string {
        return this.user?.name || 'Usuario';
    }
}
