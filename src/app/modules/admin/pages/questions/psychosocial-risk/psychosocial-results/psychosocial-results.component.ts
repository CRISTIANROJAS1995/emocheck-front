import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, switchMap } from 'rxjs';
import { AssessmentModuleDefinition, getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AssessmentDimensionBreakdown, AssessmentResult } from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';

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

    result?: AssessmentResult;
    domainGroups: DomainGroup[] = [];
    totalDimension?: EnrichedDimension;

    isHydrating = false;
    hydrationAttempted = false;

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly state: AssessmentStateService,
        private readonly assessmentHydration: AssessmentHydrationService,
    ) { }

    ngOnInit(): void {
        const rawCode = this.route.snapshot.queryParamMap.get('instrumentCode');
        this.instrumentCode = rawCode?.trim().toUpperCase() || 'INTRA_A';
        this.instrumentColor = INSTRUMENT_COLORS[this.instrumentCode] ?? '#f97316';
        this.instrumentTitle = INSTRUMENT_TITLES[this.instrumentCode] ?? '';

        this.subscriptions.add(
            this.state.results$.subscribe(() => {
                this._processResult();
            })
        );
        this._processResult();

        this.isHydrating = true;
        this.hydrationAttempted = true;
        this.subscriptions.add(
            this.assessmentHydration
                .hydrateModuleResultFromCompletedEvaluations(this.moduleId)
                .pipe(
                    switchMap(() => this.assessmentHydration.hydrateRecommendationsIfMissing(this.moduleId)),
                    finalize(() => { this.isHydrating = false; })
                )
                .subscribe({
                    next: () => this._processResult(),
                    error: () => {
                        this.isHydrating = false;
                        if (!this.result) this.router.navigate(['/psychosocial-risk/instrument-results']);
                    },
                })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private _processResult(): void {
        const raw = this.state.getResult(this.moduleId);
        if (!raw) return;

        const code = this.instrumentCode;
        const filtered = raw.dimensions.filter(
            d => (d.instrumentCode ?? '').toUpperCase() === code ||
                (d.instrumentCode ?? '').toUpperCase().startsWith(code + '_')
        );

        this.result = { ...raw, dimensions: filtered };

        const dimMap = INSTRUMENT_DIMENSION_MAP[code] ?? [];

        // Enrich dimensions
        const enriched: EnrichedDimension[] = filtered
            .filter(d => (d.instrumentCode ?? '').toUpperCase() !== code) // exclude global score row
            .map(d => {
                const dimCode = (d.instrumentCode ?? '').toUpperCase().replace(code + '_', '');
                const meta = dimMap.find(m => m.code === dimCode);
                return {
                    ...d,
                    domainLabel: meta?.domain ?? 'General',
                    friendlyLabel: meta?.label ?? d.label,
                    tone: this._getTone(d.riskLevel, d.percent),
                };
            });

        // Find global/total row
        const globalDim = filtered.find(d =>
            (d.instrumentCode ?? '').toUpperCase() === code ||
            d.label?.toLowerCase().includes('total') ||
            d.label?.toLowerCase().includes('general')
        );
        if (globalDim) {
            this.totalDimension = {
                ...globalDim,
                domainLabel: 'Total',
                friendlyLabel: 'Total General Factores de Riesgo',
                tone: this._getTone(globalDim.riskLevel, globalDim.percent),
            };
        }

        // Group by domain
        const domainOrder = [...new Set(dimMap.map(d => d.domain))];
        const groups = new Map<string, EnrichedDimension[]>();
        for (const d of enriched) {
            const existing = groups.get(d.domainLabel) ?? [];
            existing.push(d);
            groups.set(d.domainLabel, existing);
        }

        this.domainGroups = domainOrder
            .filter(domain => groups.has(domain))
            .map(domain => {
                const dims = groups.get(domain)!;
                const worst = dims.reduce((prev, cur) =>
                    this._toneWeight(cur.tone) > this._toneWeight(prev.tone) ? cur : prev
                );
                return {
                    domain,
                    dimensions: dims,
                    domainTone: worst.tone,
                    domainScore: worst.percent,
                    domainRiskLevel: worst.riskLevel,
                };
            });
    }

    private _getTone(riskLevel?: string, percent?: number): 'sin-riesgo' | 'bajo' | 'medio' | 'alto' | 'muy-alto' {
        if (riskLevel) {
            const v = riskLevel.toLowerCase();
            if (v.includes('sin riesgo') || v.includes('sin_riesgo') || v.includes('no risk') || v.includes('sin-riesgo')) return 'sin-riesgo';
            if (v.includes('muy alto') || v.includes('muy_alto') || v.includes('very high') || v.includes('muy-alto')) return 'muy-alto';
            if (v.includes('alto') || v.includes('high') || v.includes('severo') || v.includes('severe')) return 'alto';
            if (v.includes('medio') || v.includes('moderado') || v.includes('moderate') || v.includes('medium')) return 'medio';
            if (v.includes('bajo') || v.includes('low') || v.includes('leve')) return 'bajo';
        }
        const p = percent ?? 0;
        if (p >= 80) return 'muy-alto';
        if (p >= 60) return 'alto';
        if (p >= 40) return 'medio';
        if (p >= 20) return 'bajo';
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
     * Always builds from the full dimension map, merging real backend data where available.
     * Dimensions missing from the backend show as empty (—) placeholders.
     */
    get displayGroups(): DomainGroup[] {
        const dimMap = INSTRUMENT_DIMENSION_MAP[this.instrumentCode] ?? [];
        if (dimMap.length === 0) return this.domainGroups;

        // Build lookup of real enriched dimensions by short code (e.g. "CL", "RST")
        const realByCode = new Map<string, EnrichedDimension>();
        const prefix = this.instrumentCode + '_';
        for (const group of this.domainGroups) {
            for (const dim of group.dimensions) {
                const raw = (dim.instrumentCode ?? '').toUpperCase();
                const code = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
                realByCode.set(code, dim);
            }
        }

        // Build lookup of real domain groups by domain name
        const realGroupByDomain = new Map<string, DomainGroup>();
        for (const g of this.domainGroups) {
            realGroupByDomain.set(g.domain, g);
        }

        const domainOrder = [...new Set(dimMap.map(d => d.domain))];
        return domainOrder.map(domain => {
            const mapDims = dimMap.filter(d => d.domain === domain);
            const realGroup = realGroupByDomain.get(domain);

            const dimensions = mapDims.map(d => {
                const real = realByCode.get(d.code);
                if (real) return real;
                return {
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
                };
            });

            return {
                domain,
                dimensions,
                domainTone: realGroup?.domainTone ?? ('sin-riesgo' as const),
                domainScore: realGroup?.domainScore,
                domainRiskLevel: realGroup?.domainRiskLevel ?? '',
            };
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

    goBack(): void {
        this.router.navigate(['/psychosocial-risk/instrument-results']);
    }
}
