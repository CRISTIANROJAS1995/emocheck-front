import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AssessmentService, InstrumentDescriptor, RichAnswer } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentModuleId } from 'app/core/models/assessment.model';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components/questionnaire';
import { finalize } from 'rxjs';

// ── Paleta de colores para instrumentos sin metadato explícito ───────────────
const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

// ── Metadatos por código de instrumento ──────────────────────────────────────
const INSTRUMENT_META: Record<string, { icon: string; description: string; color: string }> = {
    // Salud Mental
    GAD7:    { icon: 'icons/Icon (37).svg', description: 'Trastorno de Ansiedad Generalizada',      color: '#3b82f6' },
    PHQ9:    { icon: 'icons/Icon (28).svg', description: 'Cuestionario de Salud del Paciente',      color: '#8b5cf6' },
    ISI:     { icon: 'icons/Icon (29).svg', description: 'Índice de Severidad del Insomnio',        color: '#06b6d4' },
    PSS4:    { icon: 'icons/Icon (30).svg', description: 'Escala de Estrés Percibido',              color: '#f59e0b' },
    DASS21:  { icon: 'icons/Icon (37).svg', description: 'Escala de Depresión, Ansiedad y Estrés',  color: '#3b82f6' },
    BAI:     { icon: 'icons/Icon (28).svg', description: 'Inventario de Ansiedad de Beck',          color: '#8b5cf6' },
    BDI:     { icon: 'icons/Icon (29).svg', description: 'Inventario de Depresión de Beck',         color: '#06b6d4' },
    ICSP_VC: { icon: 'icons/Icon (30).svg', description: 'Índice de Calidad del Sueño',             color: '#f59e0b' },
    TMMS24:  { icon: 'icons/Icon (31).svg', description: 'Escala de Inteligencia Emocional',        color: '#10b981' },
    PSS10:   { icon: 'icons/Icon (32).svg', description: 'Escala de Estrés Percibido (10 ítems)',   color: '#ef4444' },
    // Fatiga Laboral
    FATIGUE_ENERGY:     { icon: 'icons/Icon (38).svg', description: 'Nivel de energía física disponible',      color: '#84cc16' },
    FATIGUE_COGNITIVE:  { icon: 'icons/Icon (33).svg', description: 'Capacidad de concentración y foco',       color: '#22c55e' },
    FATIGUE_EMOTIONAL:  { icon: 'icons/Icon (34).svg', description: 'Reserva emocional y resiliencia',         color: '#06b6d4' },
    FATIGUE_MOTIVATION: { icon: 'icons/Icon (35).svg', description: 'Motivación e impulso laboral',            color: '#f59e0b' },
    // Clima Organizacional
    CLIMATE_LEADERSHIP:    { icon: 'icons/Icon (39).svg', description: 'Liderazgo y dirección del equipo',     color: '#00bba7' },
    CLIMATE_TEAMWORK:      { icon: 'icons/Icon (36).svg', description: 'Colaboración y trabajo en equipo',     color: '#3b82f6' },
    CLIMATE_COMMUNICATION: { icon: 'icons/Icon (25).svg', description: 'Canales y calidad de comunicación',    color: '#8b5cf6' },
    CLIMATE_RECOGNITION:   { icon: 'icons/Icon (26).svg', description: 'Reconocimiento y valoración',          color: '#f59e0b' },
    // Riesgo Psicosocial
    PSYCHO_DEMANDS:  { icon: 'icons/Icon (40).svg', description: 'Demandas y carga del trabajo',               color: '#f97316' },
    PSYCHO_CONTROL:  { icon: 'icons/Icon (41).svg', description: 'Autonomía y control sobre el trabajo',       color: '#ef4444' },
    PSYCHO_SUPPORT:  { icon: 'icons/Icon (42).svg', description: 'Apoyo social y liderazgo',                   color: '#8b5cf6' },
    PSYCHO_REWARDS:  { icon: 'icons/Icon (43).svg', description: 'Recompensas y reconocimiento',               color: '#f59e0b' },
};

export interface InstrumentCard extends InstrumentDescriptor {
    icon: string;
    description: string;
    color: string;
    /** true si el usuario ya completó este instrumento en la evaluación más reciente */
    completed?: boolean;
}

@Component({
    selector: 'app-instrument-selector',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        EmoQuestionnaireComponent,
        BackgroundCirclesComponent,
    ],
    templateUrl: './instrument-selector.component.html',
    styleUrl: './instrument-selector.component.scss',
})
export class InstrumentSelectorComponent implements OnInit {
    @Input({ required: true }) moduleId!: AssessmentModuleId;

    instruments: InstrumentCard[] | null = null;
    selectedInstrument: InstrumentCard | null = null;
    config?: QuestionnaireConfig;
    loadingQuestions = false;
    loadError = false;

    moduleDef = getAssessmentModuleDefinition('mental-health'); // sobrescrito en ngOnInit
    heroGradient = '';

    private isSubmitting = false;

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService,
        private readonly alert: AlertService,
    ) {}

    ngOnInit(): void {
        this.moduleDef = getAssessmentModuleDefinition(this.moduleId);
        this.heroGradient = this._buildGradient();

        this.assessmentService.getModuleInstruments(this.moduleId).subscribe({
            next: (descriptors) => {
                // Códigos de instrumentos ya presentados (del estado local)
                const completedResult = this.assessmentState.getResult(this.moduleId);
                const completedCodes = new Set(
                    (completedResult?.dimensions ?? [])
                        .map(d => (d.instrumentCode ?? '').toUpperCase().trim())
                        .filter(Boolean)
                );

                this.instruments = descriptors.map((d, i) => {
                    const meta = INSTRUMENT_META[d.code];
                    return {
                        ...d,
                        label: d.label || d.backendName || d.code,
                        description: d.backendDescription || meta?.description || '',
                        icon:  meta?.icon  ?? this.moduleDef.icon,
                        color: meta?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        completed: completedCodes.has(d.code.toUpperCase()),
                    };
                });
            },
            error: (e) => {
                this.loadError = true;
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar los instrumentos';
                this.alert.error(msg);
            },
        });
    }

    selectInstrument(card: InstrumentCard): void {
        if (this.loadingQuestions || card.completed) return;
        this.loadingQuestions = true;
        this.selectedInstrument = card;

        this.assessmentService.getInstrumentQuestions(this.moduleId, card.index).subscribe({
            next: (questions) => {
                this.loadingQuestions = false;
                this.config = {
                    title: card.label,
                    icon: card.icon,
                    theme: this.moduleDef.theme,
                    questions,
                };
            },
            error: (e) => {
                this.loadingQuestions = false;
                this.selectedInstrument = null;
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar el cuestionario';
                this.alert.error(msg);
            },
        });
    }

    goBack(): void {
        if (this.config) {
            this.config = undefined;
            this.selectedInstrument = null;
        } else {
            this.router.navigate(['/home']);
        }
    }

    onCompleted(answers: number[]): void {
        // Legacy: not used when completedRich is available
    }

    onCompletedRich(richAnswers: RichAnswer[]): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        this.assessmentService.submitRich(this.moduleId, richAnswers).pipe(
            finalize(() => { this.isSubmitting = false; })
        ).subscribe({
            next: (result) => {
                // Use mergeResult so previously completed instrument dimensions are
                // preserved (e.g. DASS-21 stays "completado" after submitting BAI).
                this.assessmentState.mergeResult(result);
                this.router.navigate([`/${this.moduleId}/results`]);
            },
            error: (e) => {
                if (e?.code === 'CONSENT_REQUIRED') {
                    this.alert.confirm(
                        'Debes aceptar el consentimiento informado para continuar.',
                        'Consentimiento requerido',
                        'Ir a consentimiento',
                        'Cancelar',
                    ).then((go) => {
                        if (go) this.router.navigate(['/informed-consent']);
                    });
                    return;
                }
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible completar la evaluación';
                this.alert.error(msg);
            },
        });
    }

    private _buildGradient(): string {
        // Usa el badgeGradient del módulo como base para el hero banner
        const g = this.moduleDef.theme.badgeGradient;
        // Si ya es un linear-gradient lo usamos directamente
        if (g?.startsWith('linear-gradient')) return g;
        return 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)';
    }
}
