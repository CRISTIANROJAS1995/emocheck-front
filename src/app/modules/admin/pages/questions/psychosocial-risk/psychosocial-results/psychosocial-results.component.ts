import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { AssessmentModuleDefinition, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentDimensionBreakdown } from 'app/core/models/assessment.model';
import {
    PsychosocialDataSheetService,
    PsychosocialReport,
    PsychosocialWorkerReport,
    PsychosocialEvaluadorReport,
} from 'app/core/services/psychosocial-data-sheet.service';

// ── Domain map für INTRA_A ────────────────────────────────────────────────────
export interface PsychoDimension {
    code: string;
    label: string;
    domain: string;
}

export const INTRA_A_DIMENSIONS: PsychoDimension[] = [
    // Dominio: Liderazgo y Relaciones Sociales en el Trabajo
    { code: 'CL', label: 'Características del Liderazgo', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    { code: 'RCO', label: 'Relaciones Sociales en el Trabajo', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    { code: 'RDP', label: 'Retroalimentación del Desempeño', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    { code: 'RCP', label: 'Relación con los Colaboradores (Subordinados)', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    // Dominio: Control sobre el Trabajo
    { code: 'CLR', label: 'Claridad de Rol', domain: 'Control sobre el Trabajo' },
    { code: 'CAP', label: 'Capacitación', domain: 'Control sobre el Trabajo' },
    { code: 'PMC', label: 'Participación y Manejo del Cambio', domain: 'Control sobre el Trabajo' },
    { code: 'OUH', label: 'Oportunidades para el Uso y Desarrollo de Habilidades', domain: 'Control sobre el Trabajo' },
    { code: 'CAT', label: 'Control y Autonomía sobre el Trabajo', domain: 'Control sobre el Trabajo' },
    // Dominio: Demandas del Trabajo
    { code: 'DAE', label: 'Demandas Ambientales y de Esfuerzo Físico', domain: 'Demandas del Trabajo' },
    { code: 'DEM', label: 'Demandas Emocionales', domain: 'Demandas del Trabajo' },
    { code: 'DCU', label: 'Demandas Cuantitativas', domain: 'Demandas del Trabajo' },
    { code: 'ITE', label: 'Influencia del Trabajo sobre el Entorno Extralaboral', domain: 'Demandas del Trabajo' },
    { code: 'ERC', label: 'Exigencias de Responsabilidad del Cargo', domain: 'Demandas del Trabajo' },
    { code: 'DCM', label: 'Demandas de Carga Mental', domain: 'Demandas del Trabajo' },
    { code: 'DJT', label: 'Demandas de la Jornada de Trabajo', domain: 'Demandas del Trabajo' },
    // Dominio: Recompensas
    { code: 'RST', label: 'Recompensas Derivadas de la Pertenencia y del Trabajo', domain: 'Recompensas' },
    { code: 'CR', label: 'Reconocimiento y Compensación', domain: 'Recompensas' },
];

export const INTRA_B_DIMENSIONS: PsychoDimension[] = [
    // Dominio: Liderazgo y Relaciones Sociales en el Trabajo (3)
    { code: 'CL', label: 'Características del Liderazgo', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    { code: 'RCO', label: 'Relaciones Sociales en el Trabajo', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    { code: 'RDP', label: 'Retroalimentación del Desempeño', domain: 'Liderazgo y Relaciones Sociales en el Trabajo' },
    // Dominio: Control sobre el Trabajo (5)
    { code: 'CLR', label: 'Claridad de Rol', domain: 'Control sobre el Trabajo' },
    { code: 'CAP', label: 'Capacitación', domain: 'Control sobre el Trabajo' },
    { code: 'PMC', label: 'Participación y Manejo del Cambio', domain: 'Control sobre el Trabajo' },
    { code: 'OUH', label: 'Oportunidades para el Uso y Desarrollo de Habilidades y Conocimientos', domain: 'Control sobre el Trabajo' },
    { code: 'CAT', label: 'Control y Autonomía sobre el Trabajo', domain: 'Control sobre el Trabajo' },
    // Dominio: Demandas del Trabajo (6)
    { code: 'DAE', label: 'Demandas Ambientales y de Esfuerzo Físico', domain: 'Demandas del Trabajo' },
    { code: 'DEM', label: 'Demandas Emocionales', domain: 'Demandas del Trabajo' },
    { code: 'DCU', label: 'Demandas Cuantitativas', domain: 'Demandas del Trabajo' },
    { code: 'ITE', label: 'Influencia del Trabajo sobre el Entorno Extralaboral', domain: 'Demandas del Trabajo' },
    { code: 'DCM', label: 'Demandas de Carga Mental', domain: 'Demandas del Trabajo' },
    { code: 'DJT', label: 'Demandas de la Jornada de Trabajo', domain: 'Demandas del Trabajo' },
    // Dominio: Recompensas (2)
    { code: 'RST', label: 'Recompensas Derivadas de la Pertenencia a la Organización y del Trabajo', domain: 'Recompensas' },
    { code: 'CR', label: 'Reconocimiento y Compensación', domain: 'Recompensas' },
];

export const EXTRALABORAL_DIMENSIONS: PsychoDimension[] = [
    { code: 'TF', label: 'Tiempo Fuera del Trabajo', domain: 'Factores Extralaborales' },
    { code: 'REL', label: 'Relaciones Familiares', domain: 'Factores Extralaborales' },
    { code: 'COM', label: 'Comunicación y Relaciones Interpersonales', domain: 'Factores Extralaborales' },
    { code: 'SIT', label: 'Situación Económica del Grupo Familiar', domain: 'Factores Extralaborales' },
    { code: 'CAR', label: 'Características de la Vivienda y de su Entorno', domain: 'Factores Extralaborales' },
    { code: 'INF', label: 'Influencia del Entorno Extralaboral sobre el Trabajo', domain: 'Factores Extralaborales' },
    { code: 'DES', label: 'Desplazamiento Vivienda – Trabajo – Vivienda', domain: 'Factores Extralaborales' },
];

export const ESTRES_DIMENSIONS: PsychoDimension[] = [
    { code: 'FS', label: 'Síntomas Fisiológicos', domain: 'Síntomas de Estrés' },
    { code: 'CS', label: 'Síntomas de Comportamiento Social', domain: 'Síntomas de Estrés' },
    { code: 'II', label: 'Síntomas Intelectuales y Laborales', domain: 'Síntomas de Estrés' },
    { code: 'SP', label: 'Síntomas Psicoemocionales', domain: 'Síntomas de Estrés' },
];

export interface EnrichedDimension extends AssessmentDimensionBreakdown {
    domainLabel: string;
    friendlyLabel: string;
    tone: 'sin-riesgo' | 'bajo' | 'medio' | 'alto' | 'muy-alto';
    interpretacion?: string;
    recomendacion?: string;
}

export interface DomainGroup {
    domain: string;
    dimensions: EnrichedDimension[];
    domainTone: 'sin-riesgo' | 'bajo' | 'medio' | 'alto' | 'muy-alto';
    domainScore?: number;
    domainRiskLevel?: string;
}

const INSTRUMENT_DIMENSION_MAP: Record<string, PsychoDimension[]> = {
    INTRA_A: INTRA_A_DIMENSIONS,
    INTRA_B: INTRA_B_DIMENSIONS,
    EXTRALABORAL: EXTRALABORAL_DIMENSIONS,
    ESTRES: ESTRES_DIMENSIONS,
};

const INSTRUMENT_COLORS: Record<string, string> = {
    INTRA_A: '#f97316',
    INTRA_B: '#ef4444',
    EXTRALABORAL: '#8b5cf6',
    ESTRES: '#ec4899',
};

const INSTRUMENT_TITLES: Record<string, string> = {
    INTRA_A: 'Cuestionario de Factores de Riesgo Psicosocial Intralaboral Forma A',
    INTRA_B: 'Cuestionario de Factores de Riesgo Psicosocial Intralaboral Forma B',
    EXTRALABORAL: 'Cuestionario de Factores de Riesgo Psicosocial Extralaboral',
    ESTRES: 'Cuestionario para la Evaluación del Estrés',
};

@Component({
    selector: 'app-psychosocial-results',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './psychosocial-results.component.html',
    styleUrl: './psychosocial-results.component.scss',
})
export class PsychosocialResultsComponent implements OnInit, OnDestroy {
    moduleId: AssessmentModuleDefinition['id'] = 'psychosocial-risk';
    moduleDef = getAssessmentModuleDefinition(this.moduleId);

    instrumentCode = '';
    instrumentColor = '#f97316';
    instrumentTitle = '';
    period = '';

    report?: PsychosocialReport;
    trabajador?: PsychosocialWorkerReport;
    evaluador?: PsychosocialEvaluadorReport;

    /** Minimal result object so the template `@if (result)` guard passes. */
    result?: { evaluatedAt: string };
    domainGroups: DomainGroup[] = [];
    totalDimension?: EnrichedDimension;

    /** Recomendaciones generales del Excel (columna D), según condición + nivel de riesgo total. */
    recomendacion?: string;

    /** Local date when the report is viewed/printed — used in the footer. */
    readonly today = new Date();

    isHydrating = false;
    hasError = false;

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly dataSheetService: PsychosocialDataSheetService,
    ) { }

    ngOnInit(): void {
        const rawCode = this.route.snapshot.queryParamMap.get('instrumentCode');
        this.instrumentCode = rawCode?.trim().toUpperCase() || 'INTRA_A';
        this.instrumentColor = INSTRUMENT_COLORS[this.instrumentCode] ?? '#f97316';
        this.instrumentTitle = INSTRUMENT_TITLES[this.instrumentCode] ?? '';

        const rawPeriod = this.route.snapshot.queryParamMap.get('period');
        this.period = rawPeriod?.trim() || this.dataSheetService.getCurrentPeriod();

        this.isHydrating = true;
        this.subscriptions.add(
            this.dataSheetService.getReport(this.period).pipe(
                finalize(() => { this.isHydrating = false; })
            ).subscribe({
                next: (rpt) => {
                    this.report = rpt;
                    this.trabajador = rpt.trabajador;
                    this.evaluador = rpt.evaluador;
                    this._buildFromReport(rpt);
                },
                error: () => {
                    this.hasError = true;
                },
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private _buildFromReport(rpt: PsychosocialReport): void {
        const cuestionario = rpt.cuestionarios.find(
            c => c.instrumentCode.toUpperCase() === this.instrumentCode
        );
        if (!cuestionario || cuestionario.status !== 'COMPLETED') {
            // Show the shell so the user sees the "pending" state
            this.result = { evaluatedAt: new Date().toISOString() };
            return;
        }

        this.result = { evaluatedAt: cuestionario.completedAt ?? new Date().toISOString() };

        // ── Total row ────────────────────────────────────────────────────────
        if (cuestionario.totalGeneral) {
            const t = cuestionario.totalGeneral;
            this.totalDimension = {
                id: `${this.instrumentCode}_TOTAL`,
                label: 'Total General',
                instrumentCode: this.instrumentCode,
                percent: t.puntajeTransformado,
                score: t.puntajeTransformado,
                maxScore: 100,
                riskLevel: t.nivelRiesgo,
                scoreRangeLabel: t.nivelRiesgo,
                scoreRangeColor: t.colorHex ?? '',
                scoreRangeDescription: t.interpretacion ?? '',
                domainLabel: 'Total',
                friendlyLabel: 'Total General',
                tone: this._getTone(t.nivelRiesgo),
            }; this.recomendacion = t.recomendacion ?? undefined;
        }

        // ── INTRA_A / INTRA_B: domains ────────────────────────────────────
        if (cuestionario.dominios && cuestionario.dominios.length > 0) {
            this.domainGroups = cuestionario.dominios.map(dom => {
                const dims: EnrichedDimension[] = dom.dimensiones.map(dim => ({
                    id: dim.dimensionCode,
                    label: dim.label,
                    instrumentCode: `${this.instrumentCode}_${dim.dimensionCode}`,
                    percent: dim.puntajeTransformado ?? (undefined as unknown as number),
                    score: dim.puntajeTransformado ?? 0,
                    maxScore: 100,
                    riskLevel: dim.nivelRiesgo ?? '',
                    scoreRangeLabel: dim.nivelRiesgo ?? '',
                    scoreRangeColor: dim.colorHex ?? '',
                    scoreRangeDescription: '',
                    domainLabel: dom.dominio,
                    friendlyLabel: dim.label,
                    tone: this._getTone(dim.nivelRiesgo),
                    interpretacion: dim.interpretacion ?? undefined,
                    recomendacion: dim.recomendacion ?? undefined,
                }));
                return {
                    domain: dom.dominio,
                    dimensions: dims,
                    domainTone: this._getTone(dom.nivelRiesgo),
                    domainScore: dom.puntajeTransformado ?? undefined,
                    domainRiskLevel: dom.nivelRiesgo ?? '',
                };
            });
            return;
        }

        // ── EXTRALABORAL / ESTRES: flat dimensions ────────────────────────
        if (cuestionario.dimensiones && cuestionario.dimensiones.length > 0) {
            const dims: EnrichedDimension[] = cuestionario.dimensiones.map(dim => ({
                id: dim.dimensionCode,
                label: dim.label,
                instrumentCode: `${this.instrumentCode}_${dim.dimensionCode}`,
                percent: dim.puntajeTransformado ?? (undefined as unknown as number),
                score: dim.puntajeTransformado ?? 0,
                maxScore: 100,
                riskLevel: dim.nivelRiesgo ?? '',
                scoreRangeLabel: dim.nivelRiesgo ?? '',
                scoreRangeColor: dim.colorHex ?? '',
                scoreRangeDescription: '',
                domainLabel: 'General',
                friendlyLabel: dim.label,
                tone: this._getTone(dim.nivelRiesgo),
                interpretacion: dim.interpretacion ?? undefined,
                recomendacion: dim.recomendacion ?? undefined,
            }));
            this.domainGroups = [{ domain: 'General', dimensions: dims, domainTone: 'sin-riesgo' }];
        }
    }

    private _getTone(riskLevel?: string | null): 'sin-riesgo' | 'bajo' | 'medio' | 'alto' | 'muy-alto' {
        if (riskLevel) {
            const v = riskLevel.toLowerCase();
            if (v.includes('sin riesgo') || v.includes('sin_riesgo') || v.includes('no risk') || v.includes('sin-riesgo')) return 'sin-riesgo';
            if (v.includes('muy alto') || v.includes('muy_alto') || v.includes('very high') || v.includes('muy-alto')) return 'muy-alto';
            if (v.includes('alto') || v.includes('high') || v.includes('severo') || v.includes('severe')) return 'alto';
            if (v.includes('medio') || v.includes('moderado') || v.includes('moderate') || v.includes('medium')) return 'medio';
            if (v.includes('bajo') || v.includes('low') || v.includes('leve')) return 'bajo';
        }
        return 'sin-riesgo';
    }

    private _toneWeight(tone: string): number {
        const map: Record<string, number> = { 'sin-riesgo': 0, 'bajo': 1, 'medio': 2, 'alto': 3, 'muy-alto': 4 };
        return map[tone] ?? 0;
    }

    getToneLabel(tone: string): string {
        const map: Record<string, string> = {
            'sin-riesgo': 'Sin Riesgo',
            'bajo': 'Riesgo Bajo',
            'medio': 'Riesgo Medio',
            'alto': 'Riesgo Alto',
            'muy-alto': 'Riesgo Muy Alto',
        };
        return map[tone] ?? tone;
    }

    /**
     * Returns domain groups for the template.
     * When real backend data is available, uses it directly (codes come from the backend).
     * In preview mode (no data yet), falls back to the hardcoded frontend map so the
     * table still renders with expected dimension labels and — placeholders.
     */
    get displayGroups(): DomainGroup[] {
        if (!this.isPreview) {
            return this.domainGroups;
        }

        // Preview: build placeholder rows from hardcoded frontend constants
        const dimMap = INSTRUMENT_DIMENSION_MAP[this.instrumentCode] ?? [];
        const domainOrder = [...new Set(dimMap.map(d => d.domain))];
        return domainOrder.map(domain => {
            const dimensions = dimMap
                .filter(d => d.domain === domain)
                .map(d => ({
                    id: d.code,
                    label: d.label,
                    instrumentCode: `${this.instrumentCode}_${d.code}`,
                    percent: undefined as unknown as number,
                    score: 0,
                    maxScore: 0,
                    riskLevel: '',
                    scoreRangeLabel: '',
                    scoreRangeColor: '',
                    scoreRangeDescription: '',
                    domainLabel: domain,
                    friendlyLabel: d.label,
                    tone: 'sin-riesgo' as const,
                }));
            return { domain, dimensions, domainTone: 'sin-riesgo' as const, domainScore: undefined, domainRiskLevel: '' };
        });
    }

    get isPreview(): boolean {
        return this.domainGroups.length === 0;
    }

    /** Whether the results table should show the "Dominios" column (INTRA_A / INTRA_B only). */
    get hasDomainColumn(): boolean {
        return this.instrumentCode === 'INTRA_A' || this.instrumentCode === 'INTRA_B';
    }

    /** ESTRES has a completely different layout: no banner, no Datos sections, table only with TOTAL row. */
    get isEstres(): boolean {
        return this.instrumentCode === 'ESTRES';
    }

    /** All dimensions flattened in map order — used when hasDomainColumn is false. */
    get flatDisplayDimensions(): EnrichedDimension[] {
        return this.displayGroups.flatMap(g => g.dimensions);
    }

    get interpretationTitle(): string {
        if (this.instrumentCode === 'ESTRES') return 'INTERPRETACIÓN DE LOS NIVELES DE ESTRÉS...TERCERA VERSIÓN';
        return this.hasDomainColumn
            ? 'INTERPRETACIÓN GENÉRICA DE LOS NIVELES DE RIESGO'
            : 'INTERPRETACIÓN DE LOS NIVELES DE RIESGO';
    }

    get pageTitle(): string {
        const titles: Record<string, string> = {
            INTRA_A: 'Resultados: Intralaboral Forma A',
            INTRA_B: 'Resultados: Intralaboral Forma B',
            EXTRALABORAL: 'Resultados: Factores Extralaborales',
            ESTRES: 'Resultados: Síntomas de Estrés',
        };
        return titles[this.instrumentCode] ?? 'Resultados';
    }

    get instrumentReportTitle(): string {
        const map: Record<string, string> = {
            INTRA_A: 'DEL CUESTIONARIO DE FACTORES DE RIESGO PSICOSOCIAL INTRALABORAL – FORMA A',
            INTRA_B: 'DEL CUESTIONARIO DE FACTORES DE RIESGO PSICOSOCIAL INTRALABORAL – FORMA B',
            EXTRALABORAL: 'DEL CUESTIONARIO DE FACTORES DE RIESGO PSICOSOCIAL EXTRALABORAL',
            ESTRES: 'DEL CUESTIONARIO PARA LA EVALUACIÓN DEL ESTRÉS',
        };
        return map[this.instrumentCode] ?? '';
    }

    get totalLabel(): string {
        const map: Record<string, string> = {
            INTRA_A: 'TOTAL GENERAL FACTORES DE RIESGO PSICOSOCIAL INTRALABORAL',
            INTRA_B: 'TOTAL GENERAL FACTORES DE RIESGO PSICOSOCIAL INTRALABORAL',
            EXTRALABORAL: 'TOTAL GENERAL FACTORES DE RIESGO PSICOSOCIAL EXTRALABORAL',
            ESTRES: 'TOTAL GENERAL SÍNTOMAS DE ESTRÉS',
        };
        return map[this.instrumentCode] ?? 'TOTAL GENERAL';
    }

    get heroGradient(): string {
        return this.moduleDef.theme.badgeGradient;
    }

    /** Displays 'Masculino' / 'Femenino' / raw value / '—' from the single-char code stored in DB. */
    get sexoLabel(): string {
        const s = this.trabajador?.sexo?.toUpperCase();
        if (!s) return '—';
        if (s === 'M') return 'Masculino';
        if (s === 'F') return 'Femenino';
        return this.trabajador!.sexo;
    }

    /** Column header for the flat results table dimension column. */
    get dimensionColumnLabel(): string {
        return this.instrumentCode === 'ESTRES' ? 'Categorías de síntomas' : 'Dimensiones';
    }

    /** Column header for the flat results table risk level column. */
    get riskColumnLabel(): string {
        return this.instrumentCode === 'ESTRES' ? 'Nivel de estrés' : 'Nivel de riesgo';
    }

    goBack(): void {
        this.router.navigate(['/psychosocial-risk/instrument-results']);
    }
}
