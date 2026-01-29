import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmoButtonComponent } from 'app/shared/components';
import { AssessmentModuleDefinition, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentResult } from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';

@Component({
    selector: 'app-assessment-results',
    standalone: true,
    imports: [CommonModule, EmoButtonComponent],
    templateUrl: './assessment-results.component.html',
    styleUrls: ['./assessment-results.component.scss'],
})
export class AssessmentResultsComponent implements OnInit, OnDestroy {
    moduleId!: AssessmentModuleDefinition['id'];
    moduleDef!: AssessmentModuleDefinition;

    result?: AssessmentResult;

    private subscription?: Subscription;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly state: AssessmentStateService
    ) { }

    ngOnInit(): void {
        const moduleId = this.route.snapshot.data['moduleId'] as AssessmentModuleDefinition['id'] | undefined;
        if (!moduleId) {
            this.router.navigate(['/home']);
            return;
        }

        this.moduleId = moduleId;
        this.moduleDef = getAssessmentModuleDefinition(moduleId);

        this.subscription = this.state.results$.subscribe(() => {
            this.result = this.state.getResult(this.moduleId);
        });

        // If user refreshes on results and there is no state, go back to module.
        this.result = this.state.getResult(this.moduleId);
        if (!this.result) {
            this.router.navigate([this.moduleDef.route]);
        }
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    get evaluatedDateLabel(): string {
        if (!this.result?.evaluatedAt) return '';
        const date = new Date(this.result.evaluatedAt);
        const formatted = date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return `Evaluación realizada el ${formatted}`;
    }

    get outcomeClass(): string {
        switch (this.result?.outcome) {
            case 'adequate':
                return 'outcome-adequate';
            case 'mild':
                return 'outcome-mild';
            case 'high-risk':
                return 'outcome-high-risk';
            default:
                return 'outcome-adequate';
        }
    }

    get ringProgress(): number {
        return Math.max(0, Math.min(100, this.result?.score ?? 0));
    }

    get ringDasharray(): string {
        const radius = 68;
        const circumference = 2 * Math.PI * radius;
        const progress = (this.ringProgress / 100) * circumference;
        return `${progress} ${circumference}`;
    }

    get outcomeIcon(): 'check' | 'warn' | 'alert' {
        switch (this.result?.outcome) {
            case 'adequate':
                return 'check';
            case 'mild':
                return 'warn';
            case 'high-risk':
                return 'alert';
            default:
                return 'check';
        }
    }

    getBarTone(percent: number): 'good' | 'warn' | 'bad' {
        if (percent >= 70) return 'good';
        if (percent >= 50) return 'warn';
        return 'bad';
    }

    getDimensionLabel(dimension: { id: string; label: string }, index: number): string {
        const labelFromModule = this.moduleDef?.dimensionLabels?.[index]?.label;
        return labelFromModule ?? dimension.label;
    }
}
