import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, switchMap } from 'rxjs';
import { EmoButtonComponent } from 'app/shared/components';
import { AssessmentModuleDefinition, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentResult } from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';

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

    hydrationAttempted = false;
    isHydrating = false;

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly state: AssessmentStateService,
        private readonly assessmentHydration: AssessmentHydrationService
    ) { }

    ngOnInit(): void {
        const moduleId = this.route.snapshot.data['moduleId'] as AssessmentModuleDefinition['id'] | undefined;
        if (!moduleId) {
            this.router.navigate(['/home']);
            return;
        }

        this.moduleId = moduleId;
        this.moduleDef = getAssessmentModuleDefinition(moduleId);

        this.subscriptions.add(this.state.results$.subscribe(() => {
            this.result = this.state.getResult(this.moduleId);
        }));

        // If user refreshes on results and there is no state, hydrate from backend.
        // Supports deep-linking via `?evaluationId=123`.
        this.result = this.state.getResult(this.moduleId);
        if (!this.result) {
            const rawEvaluationId = this.route.snapshot.queryParamMap.get('evaluationId');
            const evaluationId = rawEvaluationId ? Number(rawEvaluationId) : undefined;
            const safeEvaluationId = Number.isFinite(evaluationId as any) && (evaluationId as any) > 0 ? (evaluationId as number) : undefined;

            this.isHydrating = true;
            this.hydrationAttempted = true;

            this.subscriptions.add(
                this.assessmentHydration
                    .hydrateModuleResultFromCompletedEvaluations(this.moduleId, safeEvaluationId)
                    .pipe(
                        finalize(() => {
                            this.isHydrating = false;
                        })
                    )
                    .subscribe({
                        next: () => {
                            this.result = this.state.getResult(this.moduleId);
                            if (!this.result) {
                                this.router.navigate([this.moduleDef.route]);
                            }
                        },
                        error: () => {
                            this.isHydrating = false;
                            this.router.navigate([this.moduleDef.route]);
                        },
                    })
            );

            return;
        }

        // If backend omitted recommendations/dimensions in the completion response,
        // hydrate from real API sources (no fallback/mock values).
        const shouldHydrate =
            (this.result.dimensions ?? []).length === 0 ||
            (this.result.recommendations ?? []).length === 0;

        this.hydrationAttempted = shouldHydrate;

        if (shouldHydrate) {
            this.isHydrating = true;
            this.subscriptions.add(
                this.assessmentHydration
                    .hydrateCurrentModuleResultIfMissing(this.moduleId)
                    .pipe(
                        switchMap(() => this.assessmentHydration.hydrateRecommendationsIfMissing(this.moduleId)),
                        finalize(() => {
                            this.isHydrating = false;
                        })
                    )
                    .subscribe({
                        error: () => {
                            this.isHydrating = false;
                        },
                    })
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    scheduleFollowUp(): void {
        this.router.navigate(['/my-tracking']);
    }

    requestSupport(): void {
        const evaluationResultId = this.result?.evaluationResultId;
        this.router.navigate(['/support'], {
            queryParams: evaluationResultId ? { evaluationResultId } : undefined,
        });
    }

    openResources(): void {
        this.router.navigate(['/resources']);
    }

    callEmergencyLine(): void {
        // Universal default as per UI copy.
        try {
            window.open('tel:123', '_self');
        } catch {
            // ignore
        }

        // Also offer in-app support center.
        const evaluationResultId = this.result?.evaluationResultId;
        this.router.navigate(['/support'], {
            queryParams: {
                ...(evaluationResultId ? { evaluationResultId } : {}),
                mode: 'emergency',
            },
        });
    }

    openSupportChat(): void {
        const evaluationResultId = this.result?.evaluationResultId;
        this.router.navigate(['/support'], {
            queryParams: {
                ...(evaluationResultId ? { evaluationResultId } : {}),
                mode: 'chat',
            },
        });
    }

    downloadResults(): void {
        // Simple, cross-browser way to let the user "download" the results as PDF.
        // Users can choose "Save as PDF" in the print dialog.
        window.print();
    }

    async shareResults(): Promise<void> {
        const url = window.location.href;
        const title = this.moduleDef?.resultsTitle ?? 'Resultados';

        try {
            const navAny = navigator as unknown as { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };

            if (typeof navAny.share === 'function') {
                await navAny.share({ title, url });
                return;
            }

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                // Minimal feedback without adding extra dependencies
                window.alert('Enlace copiado para compartir');
                return;
            }

            window.prompt('Copia este enlace para compartir:', url);
        } catch {
            // User cancelled or sharing not available
        }
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
