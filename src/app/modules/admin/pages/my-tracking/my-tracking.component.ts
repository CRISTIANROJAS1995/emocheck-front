import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterModule } from '@angular/router';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexFill,
    ApexGrid,
    ApexLegend,
    ApexMarkers,
    ApexPlotOptions,
    ApexStroke,
    ApexTooltip,
    ApexXAxis,
    ApexYAxis,
    NgApexchartsModule,
} from 'ng-apexcharts';
import { UserService } from 'app/core/user/user.service';
import { CompletedEvaluationWithResultDto, EvaluationsService, MyEvaluationDto } from 'app/core/services/evaluations.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { RecommendationsService } from 'app/core/services/recommendations.service';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

export type TrackingLineChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis?: ApexYAxis | ApexYAxis[];
    stroke: ApexStroke;
    grid: ApexGrid;
    dataLabels: ApexDataLabels;
    markers: ApexMarkers;
    tooltip: ApexTooltip;
    fill?: ApexFill;
    colors?: string[];
    legend?: ApexLegend;
};

export type TrackingRadarChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis?: ApexYAxis | ApexYAxis[];
    stroke: ApexStroke;
    fill: ApexFill;
    markers: ApexMarkers;
    dataLabels: ApexDataLabels;
    tooltip: ApexTooltip;
    colors?: string[];
    legend?: ApexLegend;
    plotOptions?: ApexPlotOptions;
};

type TimeRangeId = 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year';

type ModuleProgressId = 'mental-health' | 'work-fatigue' | 'organizational-climate' | 'psychosocial-risk';

interface ModuleProgressItem {
    id: ModuleProgressId;
    title: string;
    statusText: string;
    percent: number;
    tone: 'blue' | 'green' | 'teal' | 'orange';
    icon: string;
    isCompleted: boolean;
    badgeLabel: string;
    badgeTone: 'good' | 'warn' | 'bad' | 'none';
}

type RiskTone = 'good' | 'warn' | 'bad' | 'none';

interface ModuleDetailCardVm {
    moduleId: ModuleProgressId;
    title: string;
    completedAtLabel: string;
    evaluationId: number;
    evaluationResultId?: number;
    interpretation?: string;
    progress: {
        answered: number;
        missing: number;
        progressPercent: number;
        completedLabel: string;
    };
    findings: Array<{ label: string; value: number; badge: string; tone: RiskTone }>;
    recommendations: string[];
}

interface PersonalizedCardVm {
    moduleId: ModuleProgressId;
    title: string;
    text: string;
    buttonLabel: string;
}

@Component({
    selector: 'app-my-tracking',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        NgApexchartsModule,
        BackgroundCirclesComponent,
    ],
    templateUrl: './my-tracking.component.html',
    styleUrls: ['./my-tracking.component.scss'],
})
export class MyTrackingComponent implements OnInit {
    userFullName = 'Usuario';

    loading = true;
    loadError: string | null = null;

    // Filters (UI only for now)
    readonly timeRanges: Array<{ id: TimeRangeId; label: string }> = [
        { id: 'last-month', label: 'Último mes' },
        { id: 'last-3-months', label: 'Últimos 3 meses' },
        { id: 'last-6-months', label: 'Últimos 6 meses' },
        { id: 'last-year', label: 'Último año' },
    ];

    private _selectedTimeRange: TimeRangeId = 'last-month';
    get selectedTimeRange(): TimeRangeId {
        return this._selectedTimeRange;
    }
    set selectedTimeRange(value: TimeRangeId) {
        this._selectedTimeRange = value;
        this.applyCharts();
    }

    moduleProgress: ModuleProgressItem[] = [
        {
            id: 'mental-health',
            title: 'Salud Mental',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'blue',
            icon: this.assetUrl(getAssessmentModuleDefinition('mental-health').icon),
            isCompleted: false,
            badgeLabel: '',
            badgeTone: 'none',
        },
        {
            id: 'work-fatigue',
            title: 'Fatiga Laboral',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'green',
            icon: this.assetUrl(getAssessmentModuleDefinition('work-fatigue').icon),
            isCompleted: false,
            badgeLabel: '',
            badgeTone: 'none',
        },
        {
            id: 'organizational-climate',
            title: 'Clima Organizacional',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'teal',
            icon: this.assetUrl(getAssessmentModuleDefinition('organizational-climate').icon),
            isCompleted: false,
            badgeLabel: '',
            badgeTone: 'none',
        },
        {
            id: 'psychosocial-risk',
            title: 'Riesgo Psicosocial',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'orange',
            icon: this.assetUrl(getAssessmentModuleDefinition('psychosocial-risk').icon),
            isCompleted: false,
            badgeLabel: '',
            badgeTone: 'none',
        },
    ];

    private assetUrl(path: string): string {
        const p = String(path ?? '').trim();
        if (!p) return '';
        if (p.startsWith('http://') || p.startsWith('https://')) return p;
        const absolute = p.startsWith('/') ? p : `/${p}`;
        return absolute;
    }

    private badgeToneForRiskLabel(riskLevel: unknown): 'good' | 'warn' | 'bad' | 'none' {
        const v = String(riskLevel ?? '').toLowerCase();
        if (!v) return 'none';
        if (
            v.includes('bienestar') ||
            v.includes('adecu') ||
            v.includes('positivo') ||
            v.includes('bajo') ||
            v.includes('low') ||
            v.includes('green')
        )
            return 'good';
        if (v.includes('leve') || v.includes('alerta') || v.includes('medio') || v.includes('medium') || v.includes('yellow')) return 'warn';
        if (v.includes('alto') || v.includes('riesgo') || v.includes('high') || v.includes('red')) return 'bad';
        return 'none';
    }

    private badgeLabelForRiskLevel(riskLevel: unknown): string {
        const v = String(riskLevel ?? '').trim();
        if (!v) return '';

        const lc = v.toLowerCase();
        if (
            lc.includes('green') ||
            lc.includes('low') ||
            lc.includes('bajo') ||
            lc.includes('adecu') ||
            lc.includes('bienestar')
        )
            return 'Bienestar Adecuado';
        if (lc.includes('yellow') || lc.includes('medium') || lc.includes('medio') || lc.includes('leve') || lc.includes('alerta')) return 'Alerta Leve';
        if (lc.includes('red') || lc.includes('high') || lc.includes('alto') || lc.includes('riesgo')) return 'Riesgo Alto';
        return v;
    }

    moduleResults: Array<{
        id: ModuleProgressId;
        title: string;
        completedAt?: string;
        evaluationId?: number;
        scorePercent?: number;
        riskLevel?: string;
        riskLabel?: string;
        isCompleted: boolean;
        toneClass: 'good' | 'warn' | 'bad' | 'disabled';
    }> = [];

    moduleIcon(moduleId: ModuleProgressId): string {
        return this.assetUrl(getAssessmentModuleDefinition(moduleId).icon);
    }

    riskPillIcon(tone: 'good' | 'warn' | 'bad' | 'disabled'): string {
        if (tone === 'good') return this.assetUrl('icons/Icon (46).svg');
        if (tone === 'warn') return this.assetUrl('icons/Icon (47).svg');
        if (tone === 'bad') return this.assetUrl('icons/Icon (48).svg');
        return '';
    }

    stats = {
        completedCount: 0,
        pendingCount: 4,
        averageWellbeingPercent: 0,
    };

    stateCard: {
        badgeLabel: string;
        headline: string;
        scoreOutOfTen: string;
        description: string;
        tone: 'adequate' | 'confusing' | 'alert' | 'unknown';
    } = {
            badgeLabel: '—',
            headline: '—',
            scoreOutOfTen: '—',
            description: '',
            tone: 'unknown',
        };

    // Charts
    readonly moodTrackingChart: TrackingLineChartOptions = {
        series: [
            {
                name: 'Seguimiento',
                data: [],
            },
        ],
        colors: ['#A855F7'],
        chart: {
            type: 'line',
            height: 150,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            fontFamily: 'Montserrat, ui-sans-serif, system-ui',
        },
        stroke: {
            curve: 'straight',
            width: 3,
        },
        dataLabels: { enabled: false },
        markers: {
            size: 4,
            colors: ['#A855F7'],
            strokeColors: '#A855F7',
            strokeWidth: 0,
            hover: { size: 6 },
        },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.35)',
            strokeDashArray: 4,
            padding: { left: 6, right: 6, top: 6, bottom: 0 },
        },
        xaxis: {
            categories: [],
            labels: {
                style: {
                    colors: ['#94A3B8', '#94A3B8', '#94A3B8', '#94A3B8'],
                    fontSize: '11px',
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false },
        },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 4,
            labels: {
                style: {
                    colors: ['#94A3B8'],
                    fontSize: '11px',
                },
                formatter: (val) => `${Math.round(val)}`,
            },
        },
        tooltip: { enabled: false },
    };

    readonly radarComparisonChart: TrackingRadarChartOptions = {
        series: [
            {
                name: 'Promedio personal',
                data: [],
            },
            {
                name: 'Último puntaje',
                data: [],
            },
        ],
        colors: ['#84CC16', '#06B6D4'],
        chart: {
            type: 'radar',
            height: 240,
            toolbar: { show: false },
            fontFamily: 'Montserrat, ui-sans-serif, system-ui',
        },
        xaxis: {
            categories: ['Salud Mental', 'Fatiga Laboral', 'Clima Org.', 'Riesgo Psico.'],
            labels: {
                style: {
                    colors: ['#64748B', '#64748B', '#64748B', '#64748B'],
                    fontSize: '11px',
                },
            },
        },
        yaxis: {
            show: false,
            min: 0,
            max: 100,
        },
        stroke: { width: 2 },
        fill: { opacity: 0.25 },
        markers: { size: 3 },
        dataLabels: { enabled: false },
        tooltip: { enabled: false },
        legend: {
            position: 'bottom',
            fontSize: '11px',
            itemMargin: { horizontal: 12, vertical: 6 },
        },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: 'rgba(148, 163, 184, 0.35)',
                    connectorColors: 'rgba(148, 163, 184, 0.35)',
                    fill: {
                        colors: ['rgba(148, 163, 184, 0.06)', 'rgba(148, 163, 184, 0.02)'],
                    },
                },
            },
        },
    };

    readonly progressDetails = {
        answered: 0,
        missing: 0,
        progressPercent: 0,
        completedLabel: '—',
    };

    // Detailed module cards (render only modules completed by the user)
    moduleDetailCards: ModuleDetailCardVm[] = [];

    personalizedCards: PersonalizedCardVm[] = [];

    private completedEvaluations: CompletedEvaluationWithResultDto[] = [];
    private latestCompletedEvaluationsFromMyEvaluations = new Map<ModuleProgressId, MyEvaluationDto>();

    trackById = (_: number, item: { id: string }) => item.id;

    exportReport(): void {
        console.log('Export report', this.selectedTimeRange);
    }

    constructor(
        private readonly userService: UserService,
        private readonly evaluationsService: EvaluationsService,
        private readonly recommendationsService: RecommendationsService,
        private readonly router: Router
    ) { }

    openModuleResults(moduleId: ModuleProgressId): void {
        const card = (this.moduleResults ?? []).find((c) => c.id === moduleId);
        if (!card?.isCompleted) return;

        const queryParams = card.evaluationId ? { evaluationId: card.evaluationId } : undefined;
        this.router.navigate([`/${moduleId}/results`], { queryParams });
    }

    openPersonalizedAction(moduleId: ModuleProgressId): void {
        // Figma shows module-specific labels; route can be refined later.
        // Keep behavior minimal: take user to resources.
        this.router.navigate(['/resources'], { queryParams: { moduleId } });
    }

    ngOnInit(): void {
        this.userService.user$.subscribe((u) => {
            this.userFullName = u?.name || 'Usuario';
        });

        this.loading = true;
        this.loadError = null;

        this.evaluationsService
            .getMyCompletedEvaluationsWithResult()
            .pipe(
                tap((items) => {
                    this.completedEvaluations = items ?? [];
                    this.applyCompletedEvaluations(items ?? []);
                    this.applyCharts();
                }),
                switchMap(() => this.evaluationsService.getMyEvaluations()),
                tap((evaluations) => this.applyEvaluationProgress(evaluations)),
                catchError((err) => {
                    this.loadError = err?.message || 'No fue posible cargar tus evaluaciones';
                    return of([] as MyEvaluationDto[]);
                })
            )
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                },
            });
    }

    private applyCompletedEvaluations(items: CompletedEvaluationWithResultDto[]): void {
        const latestPerModule = new Map<ModuleProgressId, CompletedEvaluationWithResultDto>();

        const sorted = (items ?? [])
            .filter((i) => !!i?.completedAt)
            .filter((i) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) > 0)
            .slice()
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        for (const item of sorted) {
            const moduleId = this.mapModuleNameToProgressId(item.assessmentModuleName ?? undefined);
            if (!moduleId) continue;
            if (!latestPerModule.has(moduleId)) {
                latestPerModule.set(moduleId, item);
            }
        }

        const completedIds = new Set(Array.from(latestPerModule.keys()));
        this.stats.completedCount = completedIds.size;
        this.stats.pendingCount = Math.max(0, 4 - completedIds.size);

        const latestScores = Array.from(latestPerModule.values())
            .map((i) => Number(i?.result?.scorePercentage ?? 0))
            .filter((n) => Number.isFinite(n));

        const avg = latestScores.length ? latestScores.reduce((a, b) => a + b, 0) / latestScores.length : 0;
        this.stats.averageWellbeingPercent = Math.round(Math.max(0, Math.min(100, avg)));

        this.moduleProgress = this.moduleProgress.map((m) => {
            const latest = latestPerModule.get(m.id);
            if (!latest) {
                return {
                    ...m,
                    isCompleted: false,
                    statusText: 'Evaluación pendiente',
                    percent: 0,
                    badgeLabel: '',
                    badgeTone: 'none',
                };
            }

            const risk = latest?.result?.riskLevel ? String(latest.result.riskLevel) : '';
            const score = this.safePercent(latest?.result?.scorePercentage ?? 0, 100);

            return {
                ...m,
                isCompleted: true,
                statusText: 'Evaluación completada',
                percent: score,
                badgeLabel: this.badgeLabelForRiskLevel(risk),
                badgeTone: this.badgeToneForRiskLabel(risk),
            };
        });

        this.moduleResults = this.moduleProgress.map((m) => {
            const latest = latestPerModule.get(m.id);
            const score = latest ? this.safePercent(latest.result.scorePercentage, 100) : undefined;
            const risk = latest?.result?.riskLevel ? String(latest.result.riskLevel) : undefined;
            const toneClass = latest ? this.toneClassForRisk(risk) : 'disabled';
            const riskLabel = latest ? this.badgeLabelForRiskLevel(risk) : undefined;

            return {
                id: m.id,
                title: m.title,
                completedAt: latest?.completedAt ? this.formatDateLong(latest.completedAt) : undefined,
                evaluationId: latest?.evaluationID,
                scorePercent: typeof score === 'number' ? score : undefined,
                riskLevel: risk,
                riskLabel,
                isCompleted: !!latest,
                toneClass,
            };
        });

        // Build the detailed section as a list: one card per completed module (latest evaluation per module).
        this.moduleDetailCards = this.buildModuleDetailCards(latestPerModule);

        // Fallback: if backend doesn't return completed-evaluation details (or sends incomplete payload),
        // still render the section from `/evaluation/my-evaluations` so the user can at least see Progress.
        if ((this.moduleDetailCards ?? []).length === 0 && (this.latestCompletedEvaluationsFromMyEvaluations?.size ?? 0) > 0) {
            this.moduleDetailCards = this.buildFallbackDetailCardsFromMyEvaluations(this.latestCompletedEvaluationsFromMyEvaluations);
        }

        this.recomputePersonalizedCards();

        this.loadResponsesCountForDetailCards();
        this.loadRecommendationsForDetailCards();

        const latestOverall = sorted[0] ?? null;
        if (latestOverall) {
            this.applyStateCard(latestOverall);
        } else {
            this.stateCard = {
                badgeLabel: '—',
                headline: 'Estado actual',
                scoreOutOfTen: '—',
                description: '',
                tone: 'unknown',
            };
        }
    }

    private buildModuleDetailCards(latestPerModule: Map<ModuleProgressId, CompletedEvaluationWithResultDto>): ModuleDetailCardVm[] {
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];

        return order
            .map((moduleId) => ({ moduleId, latest: latestPerModule.get(moduleId) ?? null }))
            .filter(({ latest }) => !!latest)
            .map(({ moduleId, latest }) => {
                const definition = getAssessmentModuleDefinition(moduleId);
                const title = definition?.title ?? this.moduleProgress.find((m) => m.id === moduleId)?.title ?? 'Evaluación';

                const evaluationResultId = Number((latest as any)?.result?.evaluationResultID ?? (latest as any)?.result?.evaluationResultId ?? 0);
                const safeEvaluationResultId = Number.isFinite(evaluationResultId) && evaluationResultId > 0 ? evaluationResultId : undefined;

                const dims = latest!.result?.dimensionScores ?? [];
                const findings = (dims ?? []).map((d) => {
                    const tone = this.riskToneFor(d?.riskLevel);
                    return {
                        label: d?.dimensionName ?? 'Dimensión',
                        value: this.safePercent(d?.score ?? 0, d?.maxScore ?? 0),
                        badge: this.badgeLabelForRiskLevel(d?.riskLevel),
                        tone,
                    };
                });

                const recs = latest!.result?.recommendations ?? [];
                const recommendations = (recs ?? [])
                    .map((r) => (r?.recommendationText || r?.title || '').trim())
                    .filter(Boolean);

                const interpretation = String(latest!.result?.interpretation ?? '').trim() || undefined;

                return {
                    moduleId,
                    title,
                    completedAtLabel: this.formatDateLong(latest!.completedAt),
                    evaluationId: latest!.evaluationID,
                    evaluationResultId: safeEvaluationResultId,
                    interpretation,
                    progress: {
                        answered: 0,
                        missing: 0,
                        progressPercent: 100,
                        completedLabel: 'Completado',
                    },
                    findings,
                    recommendations,
                };
            });
    }

    private loadResponsesCountForDetailCards(): void {
        const cards = this.moduleDetailCards ?? [];
        if (!cards.length) return;

        const requests = cards.map((c) =>
            this.evaluationsService.getEvaluationResponsesCount(c.evaluationId).pipe(catchError(() => of(0)))
        );

        forkJoin(requests).subscribe((counts) => {
            this.moduleDetailCards = (this.moduleDetailCards ?? []).map((c, idx) => ({
                ...c,
                progress: {
                    ...c.progress,
                    answered: Number(counts[idx] ?? 0) || 0,
                },
            }));
        });
    }

    private loadRecommendationsForDetailCards(): void {
        const cards = this.moduleDetailCards ?? [];
        if (!cards.length) return;

        const targets = cards
            .map((c, idx) => ({ idx, evaluationResultId: c.evaluationResultId, hasRecs: (c.recommendations ?? []).length > 0 }))
            .filter((t) => !t.hasRecs)
            .filter((t) => Number(t.evaluationResultId ?? 0) > 0);

        if (!targets.length) return;

        const requests = targets.map((t) =>
            this.recommendationsService
                .getByResult(t.evaluationResultId as number)
                .pipe(
                    tap(() => void 0),
                    switchMap((items) =>
                        of(
                            (items ?? [])
                                .map((x) => String(x?.description ?? x?.title ?? '').trim())
                                .filter(Boolean)
                        )
                    ),
                    catchError(() => of([] as string[]))
                )
        );

        forkJoin(requests).subscribe((allRecs) => {
            const recsByIdx = new Map<number, string[]>();
            for (let i = 0; i < targets.length; i++) {
                recsByIdx.set(targets[i].idx, allRecs[i] ?? []);
            }

            this.moduleDetailCards = (this.moduleDetailCards ?? []).map((c, idx) => {
                const next = recsByIdx.get(idx);
                if (!next || !next.length) return c;
                if ((c.recommendations ?? []).length) return c;
                return {
                    ...c,
                    recommendations: next,
                };
            });

            this.recomputePersonalizedCards();
        });
    }

    private recomputePersonalizedCards(): void {
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];
        const byModule = new Map<ModuleProgressId, ModuleDetailCardVm>();

        for (const c of this.moduleDetailCards ?? []) {
            byModule.set(c.moduleId, c);
        }

        const cards: PersonalizedCardVm[] = [];

        for (const moduleId of order) {
            const detail = byModule.get(moduleId);
            if (!detail) continue;

            const text = String((detail.recommendations ?? [])[0] ?? detail.interpretation ?? '').trim();
            if (!text) continue;

            cards.push({
                moduleId,
                title: detail.title,
                text,
                buttonLabel: this.personalizedButtonLabelForModule(moduleId),
            });
        }

        this.personalizedCards = cards;
    }

    private personalizedButtonLabelForModule(moduleId: ModuleProgressId): string {
        switch (moduleId) {
            case 'mental-health':
                return 'Ver Recursos';
            case 'work-fatigue':
                return 'Programar Pausas';
            case 'organizational-climate':
                return 'Ver Eventos';
            case 'psychosocial-risk':
                return 'Ver Recursos';
        }
    }

    private applyStateCard(item: CompletedEvaluationWithResultDto): void {
        const scorePercent = Number(item?.result?.scorePercentage ?? 0);
        const outOfTen = Number.isFinite(scorePercent) ? Math.round((Math.max(0, Math.min(100, scorePercent)) / 100) * 100) / 10 : 0;
        const risk = item?.result?.riskLevel ? String(item.result.riskLevel) : '';
        const tone = this.toneForRisk(risk);

        const fallbackDesc = 'No encuentras respuestas a lo que estás sintiendo, podemos conversarlo y hallar soluciones.';
        const interpretation = String(item?.result?.interpretation ?? '').trim();

        this.stateCard = {
            badgeLabel: this.badgeForRisk(risk),
            headline: this.headlineForTone(tone),
            scoreOutOfTen: Number.isFinite(outOfTen) ? `${outOfTen.toFixed(1)}/10` : '—',
            description: interpretation || fallbackDesc,
            tone,
        };
    }

    private toneForRisk(riskLevel: unknown): 'adequate' | 'confusing' | 'alert' | 'unknown' {
        const v = String(riskLevel ?? '').toLowerCase();
        if (!v) return 'unknown';
        if (v.includes('green') || v.includes('low') || v.includes('adecu')) return 'adequate';
        if (v.includes('yellow') || v.includes('medium') || v.includes('confus') || v.includes('atenci')) return 'confusing';
        if (v.includes('red') || v.includes('high') || v.includes('alert') || v.includes('riesgo')) return 'alert';
        return 'unknown';
    }

    private headlineForTone(tone: 'adequate' | 'confusing' | 'alert' | 'unknown'): string {
        switch (tone) {
            case 'adequate':
                return 'Estado en Positivo';
            case 'confusing':
                return 'Estado Confuso';
            case 'alert':
                return 'Estado en Alerta';
            default:
                return 'Estado actual';
        }
    }

    private applyCharts(): void {
        const range = this.selectedTimeRange;
        const now = Date.now();
        const cutoffMs = (() => {
            switch (range) {
                case 'last-month':
                    return 30 * 24 * 60 * 60 * 1000;
                case 'last-3-months':
                    return 90 * 24 * 60 * 60 * 1000;
                case 'last-6-months':
                    return 180 * 24 * 60 * 60 * 1000;
                case 'last-year':
                    return 365 * 24 * 60 * 60 * 1000;
            }
        })();

        const within = (this.completedEvaluations ?? [])
            .filter((e) => !!e?.completedAt)
            .filter((e) => {
                const t = new Date(e.completedAt).getTime();
                return Number.isFinite(t) && t >= now - cutoffMs;
            })
            .slice()
            .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

        const valueFor = (e: CompletedEvaluationWithResultDto): number =>
            Math.round(Math.max(0, Math.min(100, Number(e?.result?.scorePercentage ?? 0))));

        // Figma shows a simple weekly line (S1..S4). When there isn't enough
        // data in the selected range to draw a meaningful line, render a
        // placeholder using the latest known score so the chart doesn't look empty.
        const shouldUseWeeklyPlaceholder = within.length < 2;

        const lastKnown = (this.completedEvaluations ?? [])
            .slice()
            .filter((e) => !!e?.completedAt)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

        const placeholderValue = within.length === 1 ? valueFor(within[0]) : lastKnown ? valueFor(lastKnown) : 0;

        const categories = shouldUseWeeklyPlaceholder
            ? ['S1', 'S2', 'S3', 'S4']
            : within.map((e) => this.formatDateShort(e.completedAt));

        const data = shouldUseWeeklyPlaceholder
            ? [placeholderValue, placeholderValue, placeholderValue, placeholderValue]
            : within.map((e) => valueFor(e));

        this.moodTrackingChart.series = [{ name: 'Seguimiento', data }];
        this.moodTrackingChart.xaxis = {
            ...this.moodTrackingChart.xaxis,
            categories,
            labels: {
                ...this.moodTrackingChart.xaxis.labels,
                style: {
                    ...this.moodTrackingChart.xaxis.labels?.style,
                    colors: Array(categories.length).fill('#94A3B8'),
                },
            },
        };

        const byModule: Record<ModuleProgressId, CompletedEvaluationWithResultDto[]> = {
            'mental-health': [],
            'work-fatigue': [],
            'organizational-climate': [],
            'psychosocial-risk': [],
        };

        for (const e of this.completedEvaluations ?? []) {
            const moduleId = this.mapModuleNameToProgressId(e?.assessmentModuleName ?? undefined);
            if (!moduleId) continue;
            byModule[moduleId].push(e);
        }

        const avgSeries: number[] = [];
        const latestSeries: number[] = [];
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];

        for (const id of order) {
            const list = (byModule[id] ?? []).slice().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            const scores = list.map((x) => Number(x?.result?.scorePercentage ?? 0)).filter((n) => Number.isFinite(n));
            const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const latest = scores.length ? scores[0] : 0;
            avgSeries.push(Math.round(Math.max(0, Math.min(100, avg))));
            latestSeries.push(Math.round(Math.max(0, Math.min(100, latest))));
        }

        this.radarComparisonChart.series = [
            { name: 'Promedio personal', data: avgSeries },
            { name: 'Último puntaje', data: latestSeries },
        ];
    }

    private applyEvaluationProgress(evaluations: MyEvaluationDto[]): void {
        const normalized = evaluations.map((e) => ({
            moduleId: this.mapModuleNameToProgressId(e.moduleName),
            evaluation: e,
        }));

        // Keep latest completed evaluation per module as a fallback source for the detailed section.
        const completed = normalized
            .filter((x) => !!x.moduleId)
            .filter(({ evaluation }) => {
                if (evaluation?.hasResult) return true;
                if (evaluation?.completedAt) return true;
                return String(evaluation?.status ?? '').toLowerCase() === 'completed';
            })
            .slice()
            .sort((a, b) => new Date(b.evaluation.completedAt ?? b.evaluation.startedAt).getTime() - new Date(a.evaluation.completedAt ?? a.evaluation.startedAt).getTime());

        this.latestCompletedEvaluationsFromMyEvaluations = new Map<ModuleProgressId, MyEvaluationDto>();
        for (const item of completed) {
            const moduleId = item.moduleId as ModuleProgressId;
            if (!this.latestCompletedEvaluationsFromMyEvaluations.has(moduleId)) {
                this.latestCompletedEvaluationsFromMyEvaluations.set(moduleId, item.evaluation);
            }
        }

        const completedSet = new Set(
            normalized
                .filter((x) => !!x.moduleId)
                .filter(({ evaluation }) => {
                    if (evaluation?.hasResult) return true;
                    if (evaluation?.completedAt) return true;
                    return String(evaluation?.status ?? '').toLowerCase() === 'completed';
                })
                .map((x) => x.moduleId!)
        );

        this.moduleProgress = this.moduleProgress.map((m) => {
            // If we already computed completion + score/risk from completed results,
            // don't clobber it with a generic 0/100 progress.
            if (m.isCompleted) {
                return m;
            }

            return completedSet.has(m.id)
                ? { ...m, isCompleted: true, statusText: 'Evaluación completada' }
                : { ...m, isCompleted: false, statusText: 'Evaluación pendiente', percent: 0, badgeLabel: '', badgeTone: 'none' };
        });
    }

    private buildFallbackDetailCardsFromMyEvaluations(map: Map<ModuleProgressId, MyEvaluationDto>): ModuleDetailCardVm[] {
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];
        return order
            .map((moduleId) => ({ moduleId, evaluation: map.get(moduleId) ?? null }))
            .filter((x) => !!x.evaluation)
            .map(({ moduleId, evaluation }) => {
                const definition = getAssessmentModuleDefinition(moduleId);
                const title = definition?.title ?? this.moduleProgress.find((m) => m.id === moduleId)?.title ?? 'Evaluación';
                const completedAtIso = evaluation!.completedAt ?? evaluation!.startedAt;

                return {
                    moduleId,
                    title,
                    completedAtLabel: completedAtIso ? this.formatDateLong(completedAtIso) : '',
                    evaluationId: evaluation!.evaluationId,
                    evaluationResultId: undefined,
                    progress: {
                        answered: 0,
                        missing: 0,
                        progressPercent: 100,
                        completedLabel: 'Completado',
                    },
                    findings: [],
                    recommendations: [],
                };
            });
    }

    private mapModuleNameToProgressId(moduleName: string | undefined): ModuleProgressId | null {
        const name = (moduleName ?? '').toLowerCase();
        if (!name) return null;
        if (name.includes('mental') || name.includes('salud')) return 'mental-health';
        if (name.includes('fatiga') || name.includes('fatigue')) return 'work-fatigue';
        if (name.includes('clima') || name.includes('climate')) return 'organizational-climate';
        if (name.includes('psicosocial')) return 'psychosocial-risk';
        return null;
    }

    private toneClassForRisk(riskLevel?: string): 'good' | 'warn' | 'bad' | 'disabled' {
        const v = String(riskLevel ?? '').toLowerCase();
        if (!v) return 'disabled';
        if (
            v.includes('green') ||
            v.includes('low') ||
            v.includes('bajo') ||
            v.includes('adecu') ||
            v.includes('bienestar')
        )
            return 'good';
        if (
            v.includes('yellow') ||
            v.includes('medium') ||
            v.includes('medio') ||
            v.includes('leve') ||
            v.includes('alerta')
        )
            return 'warn';
        if (v.includes('red') || v.includes('high') || v.includes('alto') || v.includes('riesgo')) return 'bad';
        return 'warn';
    }

    private riskToneFor(riskLevel: unknown): RiskTone {
        const tone = this.badgeToneForRiskLabel(riskLevel);
        if (tone === 'good' || tone === 'warn' || tone === 'bad') return tone;
        return 'none';
    }

    private badgeForRisk(riskLevel: unknown): string {
        const v = String(riskLevel ?? '').toLowerCase();
        if (v.includes('green') || v.includes('low')) return 'Bienestar Adecuado';
        if (v.includes('yellow') || v.includes('medium')) return 'Atención';
        if (v.includes('red') || v.includes('high')) return 'Riesgo Alto';
        return '—';
    }

    private safePercent(score: number, maxScore: number): number {
        const s = Number(score ?? 0);
        const max = Number(maxScore ?? 0);
        if (!max || Number.isNaN(s) || Number.isNaN(max)) return 0;
        return Math.round(Math.max(0, Math.min(100, (s / max) * 100)));
    }

    private formatDateLong(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    }

    private formatDateShort(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(d);
    }
}
