import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AssessmentModuleId } from 'app/core/models/assessment.model';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
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
        private readonly hydration: AssessmentHydrationService,
        private readonly assessmentService: AssessmentService,
    ) {}

    ngOnInit(): void {
        this.isLoading = true;

        // Load the real instrument list AND the completed codes from the backend in parallel.
        // Using getCompletedInstrumentCodes (same as the selector) is more reliable than
        // reading local state, because state may only contain the last-completed instrument
        // when the user just finished one and navigated here.
        forkJoin({
            _hydrate: this.hydration.hydrateModuleResultFromCompletedEvaluations(MODULE_ID).pipe(catchError(() => of(undefined))),
            descriptors: this.assessmentService.getModuleInstruments(MODULE_ID),
            completedCodes: this.hydration.getCompletedInstrumentCodes(MODULE_ID).pipe(catchError(() => of(new Set<string>()))),
        })
        .pipe(finalize(() => { this.isLoading = false; }))
        .subscribe({
            next: ({ descriptors, completedCodes }) => this._buildCards(descriptors, completedCodes),
            error: () => {
                this.hasError = true;
            },
        });
    }

    private _buildCards(descriptors: InstrumentDescriptor[], completedCodes: Set<string>): void {
        // A descriptor is "completed" if any completed code exactly matches OR
        // starts with the descriptor code (covers DASS21_ANXIETY → DASS21).
        const isCompleted = (code: string): boolean => {
            const upper = code.toUpperCase();
            return completedCodes.has(upper) ||
                [...completedCodes].some(dc => dc.startsWith(upper + '_'));
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
