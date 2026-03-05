import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AssessmentModuleId } from 'app/core/models/assessment.model';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';
import { AssessmentService, InstrumentDescriptor } from 'app/core/services/assessment.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

const MODULE_ID: AssessmentModuleId = 'mental-health';

const INSTRUMENT_META: Record<string, { icon: string; description: string; color: string }> = {
    GAD7:    { icon: 'icons/Icon (37).svg', description: 'Trastorno de Ansiedad Generalizada',        color: '#3b82f6' },
    PHQ9:    { icon: 'icons/Icon (28).svg', description: 'Cuestionario de Salud del Paciente',        color: '#8b5cf6' },
    ISI:     { icon: 'icons/Icon (29).svg', description: 'Índice de Severidad del Insomnio',          color: '#06b6d4' },
    PSS4:    { icon: 'icons/Icon (30).svg', description: 'Escala de Estrés Percibido',                color: '#f59e0b' },
    DASS21:  { icon: 'icons/Icon (37).svg', description: 'Escala de Depresión, Ansiedad y Estrés',    color: '#3b82f6' },
    BAI:     { icon: 'icons/Icon (28).svg', description: 'Inventario de Ansiedad de Beck',            color: '#8b5cf6' },
    BDI:     { icon: 'icons/Icon (29).svg', description: 'Inventario de Depresión de Beck',           color: '#06b6d4' },
    ICSP_VC: { icon: 'icons/Icon (30).svg', description: 'Índice de Calidad del Sueño de Pittsburgh', color: '#f59e0b' },
    TMMS24:  { icon: 'icons/Icon (31).svg', description: 'Trait Meta-Mood Scale',                     color: '#10b981' },
};

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

export interface InstrumentResultCard extends InstrumentDescriptor {
    icon: string;
    description: string;
    color: string;
    completed: boolean;
}

@Component({
    selector: 'app-instrument-results',
    standalone: true,
    imports: [CommonModule, RouterModule, BackgroundCirclesComponent],
    templateUrl: './instrument-results.component.html',
    styleUrl: './instrument-results.component.scss',
})
export class InstrumentResultsComponent implements OnInit {
    readonly moduleDef = getAssessmentModuleDefinition(MODULE_ID);

    cards: InstrumentResultCard[] = [];
    isLoading = true;
    hasError = false;

    get heroGradient(): string {
        return this.moduleDef.theme.badgeGradient;
    }

    constructor(
        private readonly router: Router,
        private readonly state: AssessmentStateService,
        private readonly hydration: AssessmentHydrationService,
        private readonly assessmentService: AssessmentService,
    ) {}

    ngOnInit(): void {
        this.isLoading = true;

        // Hydrate latest results first, then load the real instrument list from the backend
        forkJoin({
            _hydrate: this.hydration.hydrateModuleResultFromCompletedEvaluations(MODULE_ID).pipe(catchError(() => of(undefined))),
            descriptors: this.assessmentService.getModuleInstruments(MODULE_ID),
        })
        .pipe(finalize(() => { this.isLoading = false; }))
        .subscribe({
            next: ({ descriptors }) => this._buildCards(descriptors),
            error: () => {
                this.hasError = true;
            },
        });
    }

    private _buildCards(descriptors: InstrumentDescriptor[]): void {
        // Build the set of completed instrument codes from local state.
        // The backend may return sub-scale codes (e.g. DASS21_ANXIETY) instead of
        // the top-level code (DASS21), so we keep the full list for prefix matching.
        const completedResult = this.state.getResult(MODULE_ID);
        const allDimensionCodes: string[] = (completedResult?.dimensions ?? [])
            .map(d => (d.instrumentCode ?? '').toUpperCase().trim())
            .filter(Boolean);

        // A descriptor is "completed" if any dimension code exactly matches OR
        // starts with the descriptor code (covers DASS21_ANXIETY → DASS21).
        const isCompleted = (code: string): boolean => {
            const upper = code.toUpperCase();
            return allDimensionCodes.some(dc => dc === upper || dc.startsWith(upper + '_'));
        };

        this.cards = descriptors.map((d, i) => {
            const meta = INSTRUMENT_META[d.code];
            return {
                ...d,
                label: d.label || d.backendName || d.code,
                description: d.backendDescription || meta?.description || '',
                icon:  meta?.icon  ?? this.moduleDef.icon,
                color: meta?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                completed: isCompleted(d.code),
            };
        });
    }

    openResult(card: InstrumentResultCard): void {
        if (!card.completed) return;
        this.router.navigate([`/${MODULE_ID}/results`], {
            queryParams: { instrumentCode: card.code },
        });
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }
}
