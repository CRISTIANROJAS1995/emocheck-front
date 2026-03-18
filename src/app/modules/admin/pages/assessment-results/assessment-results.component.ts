import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, switchMap } from 'rxjs';
import { EmoButtonComponent } from 'app/shared/components';
import { AssessmentModuleDefinition, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentOutcome, AssessmentResult } from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';
import { environment } from 'environments/environment';

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

    /** When set, only this instrument's dimensions are shown (from ?instrumentCode=). */
    instrumentCode?: string;

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

        // Read optional instrumentCode filter from query params
        const rawCode = this.route.snapshot.queryParamMap.get('instrumentCode');
        this.instrumentCode = rawCode?.trim().toUpperCase() || undefined;
        // Always keep the view in sync with state changes triggered by hydration
        this.subscriptions.add(this.state.results$.subscribe(() => {
            this.result = this._applyInstrumentFilter(this.state.getResult(this.moduleId));
        }));

        // Seed the view immediately from whatever is already in local state (avoids blank flash)
        this.result = this._applyInstrumentFilter(this.state.getResult(this.moduleId));

        // Always re-hydrate from backend to ensure the latest completed instruments
        // are reflected (e.g. after submitting BDI, the local state only has the partial
        // submission result; the backend my-completed has the authoritative merged data).
        const rawEvaluationId = this.route.snapshot.queryParamMap.get('evaluationId');
        const evaluationId = rawEvaluationId ? Number(rawEvaluationId) : undefined;
        const safeEvaluationId = Number.isFinite(evaluationId as any) && (evaluationId as any) > 0 ? (evaluationId as number) : undefined;

        this.isHydrating = true;
        this.hydrationAttempted = true;

        this.subscriptions.add(
            this.assessmentHydration
                .hydrateModuleResultFromCompletedEvaluations(this.moduleId, safeEvaluationId)
                .pipe(
                    switchMap(() => this.assessmentHydration.hydrateRecommendationsIfMissing(this.moduleId)),
                    finalize(() => {
                        this.isHydrating = false;
                    })
                )
                .subscribe({
                    next: () => {
                        this.result = this._applyInstrumentFilter(this.state.getResult(this.moduleId));
                        // Redirect if no result at all, OR if instrumentCode was given but
                        // doesn't match any dimension in the result (invalid / fabricated code).
                        if (!this.result) {
                            const destination = this.instrumentCode
                                ? [`/${this.moduleId}/instrument-results`]
                                : [this.moduleDef.route];
                            this.router.navigate(destination);
                        }
                    },
                    error: () => {
                        this.isHydrating = false;
                        // If hydration fails but we already have local state, stay on page
                        if (!this.result) {
                            this.router.navigate([this.moduleDef.route]);
                        }
                    },
                })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    goBack(): void {
        if (this.instrumentCode) {
            // Return to the instrument picker for this module
            this.router.navigate([`/${this.moduleId}/instrument-results`]);
        } else {
            this.router.navigate(['/home']);
        }
    }

    /** Page title: instrument-specific when filtered, otherwise the module results title. */
    get pageTitle(): string {
        if (!this.instrumentCode) return this.moduleDef?.resultsTitle ?? '';
        const labels = this.moduleDef?.dimensionLabels ?? [];
        const match = labels.find(l => l.instrumentCode.toUpperCase() === this.instrumentCode);
        return match ? `Resultados: ${match.label}` : `Resultados: ${this.instrumentCode}`;
    }

    /**
     * When an instrumentCode filter is active, returns a shallow copy of the result
     * with only the dimensions belonging to that instrument.
     * Returns undefined if the code doesn't match any dimension (invalid/fabricated code)
     * so the caller can redirect. Returns the result as-is when no filter is active.
     */
    private _applyInstrumentFilter(result: AssessmentResult | undefined): AssessmentResult | undefined {
        if (!result) return undefined;
        if (!this.instrumentCode) return result;

        const code = this.instrumentCode.toUpperCase();
        const filtered = result.dimensions.filter(
            d => (d.instrumentCode ?? '').toUpperCase() === code ||
                 (d.instrumentCode ?? '').toUpperCase().startsWith(code + '_')
        );

        // No matching dimensions → code is invalid/fabricated → return undefined so
        // the caller redirects instead of showing a page with wrong/empty content.
        if (!filtered.length) return undefined;

        return { ...result, dimensions: filtered };
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

    openSupportChat(): void {
        const number = environment.whatsappNumber;
        const message = encodeURIComponent('¡Hola! Acabo de completar una evaluación en EmoCheck y me gustaría recibir orientación y acompañamiento.');
        window.open(`https://wa.me/${number}?text=${message}`, '_blank');
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
        switch (this.effectiveOutcome) {
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
        const raw = Math.max(0, Math.min(100, this.result?.score ?? 0));
        // For modules where higher score = worse (e.g. anxiety, depression),
        // invert the ring so a low score (healthy) shows as mostly full.
        if (this.moduleDef?.higherIsWorse) {
            return 100 - raw;
        }
        return raw;
    }

    get ringDasharray(): string {
        const radius = 68;
        const circumference = 2 * Math.PI * radius;
        const progress = (this.ringProgress / 100) * circumference;
        return `${progress} ${circumference}`;
    }

    get outcomeIcon(): 'check' | 'warn' | 'alert' {
        switch (this.effectiveOutcome) {
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

    /**
     * Returns the effective outcome, deriving it from the worst dimension when the
     * top-level riskLevel from the backend was unresolvable (headline = 'Resultado disponible').
     */
    get effectiveOutcome(): AssessmentOutcome {
        if (!this.result) return 'mild';

        // If the backend resolved a proper risk level, trust it
        if (this.result.headline && this.result.headline !== 'Resultado disponible') {
            return this.result.outcome;
        }

        // Derive from worst dimension
        return this.deriveOutcomeFromDimensions();
    }

    /** Effective headline derived from effectiveOutcome when backend label is generic. */
    get effectiveHeadline(): string {
        if (!this.result) return '';
        if (this.result.headline && this.result.headline !== 'Resultado disponible') {
            return this.result.headline;
        }
        switch (this.effectiveOutcome) {
            case 'adequate':   return 'Riesgo Bajo';
            case 'mild':       return 'Riesgo Moderado';
            case 'high-risk':  return 'Riesgo Alto';
        }
    }

    /** Effective message: uses backend interpretation directly, falls back to derived text. */
    get effectiveMessage(): string {
        if (!this.result) return '';
        // Backend interpretation always wins — only skip if it's the generic placeholder
        const backendMsg = this.result.message?.trim() ?? '';
        const isGenericBackend = !backendMsg ||
            backendMsg.toLowerCase().includes("módulo 'salud mental'") ||
            backendMsg.toLowerCase().includes("módulo 'work") ||
            backendMsg.toLowerCase().includes("módulo 'psico") ||
            backendMsg.toLowerCase().includes("módulo 'organ");
        if (backendMsg && !isGenericBackend) return backendMsg;

        // Build a contextual message from dimension data
        const dims = this.result.dimensions ?? [];
        const higherIsWorse = this.moduleDef?.higherIsWorse ?? false;

        // Find worst-performing dimensions to name them explicitly
        const flagged = dims
            .filter(d => {
                const tone = this.getBarTone(d.percent, d.riskLevel);
                return tone === 'bad' || tone === 'warn';
            })
            .map(d => this.getDimensionLabel(d, dims.indexOf(d)))
            .filter(Boolean);

        const dimText = flagged.length
            ? `Se identificaron niveles elevados en: ${flagged.join(', ')}.`
            : '';

        const outcome = this.effectiveOutcome;
        const closing = higherIsWorse
            ? (outcome === 'adequate'
                ? 'Los indicadores se encuentran dentro del rango normal.'
                : outcome === 'mild'
                    ? 'Te recomendamos revisar las sugerencias y dar seguimiento a estas áreas.'
                    : 'Te recomendamos buscar orientación o apoyo profesional para estas áreas.')
            : (outcome === 'adequate'
                ? 'Los indicadores se encuentran en un rango saludable.'
                : outcome === 'mild'
                    ? 'Hay oportunidades de mejora en algunas áreas.'
                    : 'Se recomienda intervención en las áreas indicadas.');

        return [dimText, closing].filter(Boolean).join(' ');
    }

    private deriveOutcomeFromDimensions(): AssessmentOutcome {
        const dims = this.result?.dimensions ?? [];
        if (!dims.length) return this.result?.outcome ?? 'mild';

        let worst: AssessmentOutcome = 'adequate';
        for (const d of dims) {
            const tone = this.getBarTone(d.percent, d.riskLevel);
            if (tone === 'bad') return 'high-risk'; // can't get worse
            if (tone === 'warn' && worst === 'adequate') worst = 'mild';
        }
        return worst;
    }

    getRiskLabel(riskLevel: string | undefined, percent: number): string {
        const v = (riskLevel ?? '').toLowerCase();
        if (v.includes('green') || v.includes('low') || v.includes('bajo'))    return 'Bajo';
        if (v.includes('yellow') || v.includes('medium') || v.includes('moderate') || v.includes('moderado')) return 'Moderado';
        if (v.includes('severe') || v.includes('severo')) return 'Severo';
        if (v.includes('red') || v.includes('high') || v.includes('alto'))     return 'Alto';
        // Fallback por percent si no hay riskLevel
        const tone = this.getBarTone(percent, riskLevel);
        if (tone === 'good')  return 'Bajo';
        if (tone === 'warn')  return 'Moderado';
        return 'Alto';
    }

    /**
     * Maps a percent + optional riskLevel to a visual tone.
     *
     * Priority: if the backend provides a `riskLevel` on the dimension, use it directly
     * (e.g. TMMS-24 sends riskLevel "Bajo" even though percentageScore is 100%).
     * Only fall back to percent-based thresholds when riskLevel is absent.
     */
    getBarTone(percent: number, riskLevel?: string): 'good' | 'warn' | 'bad' {
        // --- Backend riskLevel takes priority ---
        if (riskLevel) {
            const v = riskLevel.toLowerCase();
            if (v.includes('low') || v.includes('green') || v.includes('bajo')) return 'good';
            if (v.includes('moderate') || v.includes('medium') || v.includes('yellow') || v.includes('moderado')) return 'warn';
            if (v.includes('high') || v.includes('severe') || v.includes('red') || v.includes('alto') || v.includes('severo')) return 'bad';
        }

        // --- Fallback: percent-based thresholds ---
        const higherIsWorse = this.moduleDef?.higherIsWorse ?? false;
        if (higherIsWorse) {
            if (percent >= 70) return 'bad';
            if (percent >= 40) return 'warn';
            return 'good';
        }
        if (percent >= 70) return 'good';
        if (percent >= 50) return 'warn';
        return 'bad';
    }

    getDimensionLabel(dimension: { id: string; label: string; instrumentCode?: string }, index: number): string {
        const labels = this.moduleDef?.dimensionLabels ?? [];

        // 1. Match exacto por instrumentCode (e.g. "DASS21_ANXIETY" → "Ansiedad")
        if (dimension.instrumentCode) {
            const code = dimension.instrumentCode.toUpperCase();
            const byCode = labels.find((dl) => dl.instrumentCode.toUpperCase() === code);
            if (byCode?.label) return byCode.label;
        }

        // 2. Match por instrumentCode contenido en el label del backend
        //    e.g. "GAD-7 (Ansiedad Generalizada)" contiene "GAD7" o "GAD-7"
        if (dimension.label?.trim()) {
            const backendLabel = dimension.label.toUpperCase().replace(/[-\s]/g, '');
            const byLabelCode = labels.find((dl) => {
                const normalized = dl.instrumentCode.toUpperCase().replace(/[-\s]/g, '');
                return backendLabel.includes(normalized);
            });
            if (byLabelCode?.label) return byLabelCode.label;
        }

        // 3. Usar directamente el dimensionName que viene del backend
        //    (dinámico — no requiere entrada estática en dimensionLabels)
        return dimension.label?.trim() ?? '';
    }

    getDimensionDisplayLabel(dimension: { id: string; label: string; instrumentCode?: string }, index: number): string {
        const rawCode = (dimension.instrumentCode ?? '').toUpperCase().trim();

        // DASS-21 combinado
        if (rawCode === 'DASS21') return 'DASS-21 (Depresión, Ansiedad y Estrés)';

        // DASS-21 sub-escalas → solo el nombre limpio (sin sufijo de código)
        if (['DASS21_ANXIETY', 'DASS21_DEPRESSION', 'DASS21_STRESS'].includes(rawCode)) {
            return this.getDimensionLabel(dimension, index);
        }

        // Otros: "Ansiedad (GAD-7)", "Depresión (PHQ-9)", etc.
        const friendlyLabel = this.getDimensionLabel(dimension, index);
        if (!rawCode) return friendlyLabel;
        const formattedCode = rawCode.replace(/([A-Z]+)(\d+)$/, '$1-$2');
        if (friendlyLabel.toUpperCase().includes(rawCode) || friendlyLabel.toUpperCase().includes(formattedCode)) {
            return friendlyLabel;
        }
        return `${friendlyLabel} (${formattedCode})`;
    }
}
