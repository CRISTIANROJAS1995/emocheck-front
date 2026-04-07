import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { UsersService } from 'app/core/services/users.service';
import { CompletedEvaluationWithResultDto, EvaluationsService, MyEvaluationDto } from 'app/core/services/evaluations.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { RecommendationsService } from 'app/core/services/recommendations.service';
import { AuthService } from 'app/core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

interface FaceIdSummary {
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    fatigueScore: number;
    dominantEmotion: string;
    totalReadings: number;
    lastReadingAt: string | null;
}

interface FaceIdHistoryItem {
    emotionReadingID: number;
    emotion: string;
    confidence: number;
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    fatigueScore: number;
    timestamp: string;
}

/** Promedio de todas las lecturas del día más reciente — se muestra en el panel izquierdo */
interface FaceIdDayAverage {
    date: string;          // dd/MM/yyyy
    attention: number;
    concentration: number;
    balance: number;
    positivity: number;
    calm: number;
    fatigueScore: number;
    dominantEmotion: string;
    readingsCount: number;
}

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
    plotOptions?: ApexPlotOptions;
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
    findingGroups: Array<{
        instrumentName: string;
        questionCount?: number;
        items: Array<{ label: string; value: number; score: number; maxScore: number; tone: RiskTone }>;
    }>;
    recommendations: string[];
}

interface PersonalizedCardVm {
    moduleId: ModuleProgressId;
    title: string;
    text: string;
    buttonLabel: string;
}

interface FollowUpVm {
    lastSessionDate: string | null;
    lastSessionDaysAgo: number | null;
    nextSessionDate: string | null;
    daysUntilNext: number | null;
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

    /** When set, the component shows data for this userId using admin endpoints */
    viewUserId: number | null = null;
    viewingAsAdmin = false;

    loading = true;
    loadError: string | null = null;

    /** True once applyCharts() has at least one real score to plot. */
    hasChartData = false;

    // Tiempo en EmoCheck — calculado desde createdAt del perfil
    memberSinceLabel = '—';

    // Comparación vs. promedio — el endpoint /dashboard/indicators es solo Admin/Psic/HRManager
    // Para empleados no hay dato disponible, mostramos '—'
    vsPromedioLabel = '—';
    vsPromedioSubtitle = 'Sin datos disponibles';

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
        this.loadFaceIdData(this.viewUserId ?? undefined);
    }

    get selectedTimeRangeLabel(): string {
        return this.timeRanges.find(r => r.id === this._selectedTimeRange)?.label ?? 'Último mes';
    }

    private timeRangeDays(): number {
        switch (this._selectedTimeRange) {
            case 'last-3-months': return 90;
            case 'last-6-months': return 180;
            case 'last-year':     return 365;
            default:              return 30;
        }
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
        if (v.includes('leve') || v === 'mild' || v.includes('mild') || v.includes('alerta') || v.includes('medio') || v.includes('moderate') || v.includes('medium') || v.includes('yellow')) return 'warn';
        if (v === 'severe' || v.includes('severe') || v.includes('alto') || v.includes('riesgo') || v.includes('high') || v.includes('red')) return 'bad';
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
        if (lc === 'mild' || lc.includes('mild'))
            return 'Leve';
        if (lc.includes('yellow') || lc.includes('medium') || lc.includes('medio') || lc.includes('moderate') || lc.includes('leve') || lc.includes('alerta'))
            return 'Alerta Moderada';
        if (lc === 'severe' || lc.includes('severe') || lc.includes('red') || lc.includes('high') || lc.includes('alto') || lc.includes('riesgo'))
            return 'Riesgo Alto';
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
            { name: 'Salud Mental', data: [] },
            { name: 'Fatiga Laboral', data: [] },
            { name: 'Clima Org.', data: [] },
            { name: 'Psicosocial', data: [] },
        ],
        colors: ['#A855F7', '#84CC16', '#06B6D4', '#F97316'],
        chart: {
            type: 'bar',
            height: 260,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            fontFamily: 'Montserrat, ui-sans-serif, system-ui',
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%',
                borderRadius: 4,
                borderRadiusApplication: 'end',
            },
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
        dataLabels: { enabled: false },
        markers: { size: 0 },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.35)',
            strokeDashArray: 4,
            padding: { left: 6, right: 6, top: 6, bottom: 0 },
        },
        xaxis: {
            categories: [],
            labels: {
                style: {
                    colors: [],
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
        tooltip: { enabled: true, shared: false, intersect: true },
        legend: { show: false },
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

    followUp: FollowUpVm = {
        lastSessionDate: null,
        lastSessionDaysAgo: null,
        nextSessionDate: null,
        daysUntilNext: null,
    };

    // ── Face ID / Emotional analysis state ──────────────────────────────
    /** Promedio del día más reciente — se muestra en el panel izquierdo */
    faceIdDayAverage: FaceIdDayAverage | null = null;
    /** Total de lecturas en los últimos 30 días (derivado del historial) */
    faceIdTotalReadings = 0;
    faceIdLoading = false;
    /** Metadata por día para el tooltip de la gráfica */
    private faceIdDayMeta: Array<{
        count: number;
        dominantEmotion: string;
        readings: Array<{ time: string; score: number; emotion: string }>;
    }> = [];

    readonly EMOTION_LABELS: Record<string, string> = {
        happiness: 'Felicidad',
        neutral: 'Neutral',
        surprise: 'Sorpresa',
        sadness: 'Tristeza',
        anger: 'Enojo',
        fear: 'Miedo',
        contempt: 'Disgusto',
        fatigue: 'Fatiga',
    };

    readonly EMOTION_ICONS: Record<string, string> = {
        happiness: '😊',
        neutral: '😐',
        surprise: '😲',
        sadness: '😢',
        anger: '😠',
        fear: '😨',
        contempt: '😒',
        fatigue: '😴',
    };

    readonly faceIdChart: TrackingLineChartOptions = {
        series: [{ name: 'Estado emocional', data: [] }],
        colors: ['#A855F7'],
        chart: {
            type: 'line',
            height: 150,
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            fontFamily: 'Montserrat, ui-sans-serif, system-ui',
        },
        stroke: { curve: 'straight', width: 3 },
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
            labels: { style: { colors: [], fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false },
        },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 4,
            labels: {
                style: { colors: ['#94A3B8'], fontSize: '11px' },
                formatter: (val) => `${Math.round(val)}`,
            },
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            style: { fontFamily: 'Montserrat, ui-sans-serif, system-ui', fontSize: '12px' },
            custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
                const meta = this.faceIdDayMeta[dataPointIndex];
                const score = (this.faceIdChart.series[0] as any).data[dataPointIndex] ?? 0;
                const date  = (this.faceIdChart.xaxis as any).categories[dataPointIndex] ?? '';
                if (!meta) return '';
                const dominantEmotion = (this.EMOTION_ICONS[meta.dominantEmotion] ?? '') + ' ' + (this.EMOTION_LABELS[meta.dominantEmotion] ?? meta.dominantEmotion);

                const readingRows = meta.readings.length > 1
                    ? `<div style="border-top:1px solid #E2E8F0;margin-top:6px;padding-top:6px">`
                      + meta.readings.map((r, i) => {
                          const icon = this.EMOTION_ICONS[r.emotion] ?? '';
                          return `<div style="color:#64748B;font-size:11px;margin-bottom:1px">`
                              + `<span style="color:#94A3B8">#${i + 1} ${r.time}</span>`
                              + `&nbsp;·&nbsp;<b style="color:#8200DB">${r.score}/100</b>`
                              + `&nbsp;${icon}</div>`;
                      }).join('')
                      + `</div>`
                    : '';

                const header = meta.count === 1
                    ? `<div style="color:#94A3B8;font-size:11px">${meta.readings[0]?.time ?? ''}</div>`
                    : `<div style="color:#94A3B8;font-size:11px">${meta.count} lecturas &nbsp;·&nbsp; promedio del día</div>`;

                return `<div style="padding:8px 12px;font-family:Montserrat,sans-serif;font-size:12px;line-height:1.6;min-width:180px">
                  <div style="font-weight:700;color:#7C3AED;margin-bottom:1px">${date}</div>
                  ${header}
                  <div style="margin-top:4px;color:#334155">Score: <b style="color:#8200DB">${score}/100</b></div>
                  <div style="color:#64748B">${dominantEmotion}</div>
                  ${readingRows}
                </div>`;
            },
        },
    };

    emotionLabel(emotion: string): string {
        return this.EMOTION_LABELS[emotion] ?? emotion;
    }

    emotionIcon(emotion: string): string {
        return this.EMOTION_ICONS[emotion] ?? '🙂';
    }

    fatiguePercent(fatigueScore: number): number {
        return Math.round(Math.max(0, Math.min(1, fatigueScore ?? 0)) * 100);
    }

    faceIdAvgScore(r: FaceIdDayAverage): number {
        return Math.round((r.attention + r.concentration + r.balance + r.positivity + r.calm) / 5);
    }
    // ────────────────────────────────────────────────────────────────────

    trackById = (_: number, item: { id: string }) => item.id;

    exportReport(): void {
        window.print();
    }

    goToEmotionalAnalysis(): void {
        this.router.navigate(['/emotional-analysis']);
    }

    scheduleFollowUp(): void {
        this.router.navigate(['/support']);
    }

    contactSupport(): void {
        this.router.navigate(['/support']);
    }

    constructor(
        private readonly userService: UserService,
        private readonly usersService: UsersService,
        private readonly evaluationsService: EvaluationsService,
        private readonly recommendationsService: RecommendationsService,
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly http: HttpClient
    ) { }

    openModuleResults(moduleId: ModuleProgressId): void {
        if (this.viewingAsAdmin) return;   // admin view — navegation not applicable
        const card = (this.moduleResults ?? []).find((c) => c.id === moduleId);
        if (!card?.isCompleted) return;

        // Multi-instrument modules show the instrument picker first.
        const multiInstrumentModules: ModuleProgressId[] = ['mental-health', 'psychosocial-risk'];
        if (multiInstrumentModules.includes(moduleId)) {
            this.router.navigate([`/${moduleId}/instrument-results`]);
        } else {
            const queryParams = card.evaluationId ? { evaluationId: card.evaluationId } : undefined;
            this.router.navigate([`/${moduleId}/results`], { queryParams });
        }
    }

    openPersonalizedAction(moduleId: ModuleProgressId): void {
        if (this.viewingAsAdmin) return;   // admin view — navegation not applicable
        this.router.navigate(['/resources'], { queryParams: { moduleId } });
    }

    ngOnInit(): void {
        // Read admin-view query params (set by company-tracking navigation)
        const qp = this.route.snapshot.queryParams;
        const rawId = Number(qp['viewUserId'] ?? 0);
        if (rawId > 0) {
            this.viewUserId = rawId;
            this.viewingAsAdmin = true;
            this.userFullName = String(qp['viewUserName'] ?? 'Usuario');
        }

        if (this.viewingAsAdmin) {
            this.loadAdminView(this.viewUserId!);
            this.loadFaceIdData(this.viewUserId!);
            this.loadFollowUps(this.viewUserId!);
            return;
        }

        this.userService.user$.subscribe((u) => {
            this.userFullName = u?.name || 'Usuario';
        });

        // Cargar "Tiempo en EmoCheck" desde el perfil del usuario
        this.usersService.getMyProfile().pipe(
            catchError(() => of(null))
        ).subscribe((profile) => {
            if (profile?.creationDate) {
                this.memberSinceLabel = this.computeMemberSince(profile.creationDate);
            }
        });

        this.loadFaceIdData();

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
                next: () => { this.loading = false; },
                error: () => { this.loading = false; },
            });

        this.loadFollowUps();
    }

    private loadAdminView(userId: number): void {
        this.loading = true;
        this.loadError = null;

        this.evaluationsService
            .getUserCompletedEvaluationsWithResult(userId)
            .pipe(
                tap((items) => {
                    this.completedEvaluations = items ?? [];
                    this.applyCompletedEvaluations(items ?? []);
                    this.applyCharts();
                }),
                switchMap(() => this.evaluationsService.getUserEvaluations(userId)),
                tap((evaluations) => this.applyEvaluationProgress(evaluations)),
                catchError((err) => {
                    this.loadError = err?.message || 'No fue posible cargar las evaluaciones del usuario';
                    return of([] as MyEvaluationDto[]);
                })
            )
            .subscribe({
                next: () => { this.loading = false; },
                error: () => { this.loading = false; },
            });
    }

    private loadFaceIdData(userId?: number): void {
        this.faceIdLoading = true;
        const url = userId
            ? `${environment.apiUrl}/evaluation/emotional-analysis/history/${userId}?days=${this.timeRangeDays()}`
            : `${environment.apiUrl}/evaluation/emotional-analysis/history?days=${this.timeRangeDays()}`;
        this.http
            .get<unknown>(url)
            .pipe(catchError(() => of([])))
            .subscribe((res) => {
                const items: FaceIdHistoryItem[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                this.faceIdTotalReadings = items.length;
                this.faceIdDayAverage = this.computeLatestDayAverage(items);
                this.applyFaceIdChart(items);
                this.faceIdLoading = false;
            });
    }

    private computeLatestDayAverage(history: FaceIdHistoryItem[]): FaceIdDayAverage | null {
        if (!history.length) return null;

        // Ordenar más reciente primero y obtener la fecha del día más reciente
        const sorted = [...history].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const latestDate = this.formatDateShort(sorted[0].timestamp);

        // Todas las lecturas de ese mismo día
        const dayItems = sorted.filter(r => this.formatDateShort(r.timestamp) === latestDate);

        const avg = (field: keyof Pick<FaceIdHistoryItem, 'attention'|'concentration'|'balance'|'positivity'|'calm'|'fatigueScore'>) =>
            Math.round(dayItems.reduce((sum, r) => sum + r[field], 0) / dayItems.length * 10) / 10;

        // Emoción dominante: la que más se repite en el día
        const freq = dayItems.reduce((acc, r) => { acc[r.emotion] = (acc[r.emotion] ?? 0) + 1; return acc; }, {} as Record<string, number>);
        const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';

        return {
            date: latestDate,
            attention:     Math.round(avg('attention')),
            concentration: Math.round(avg('concentration')),
            balance:       Math.round(avg('balance')),
            positivity:    Math.round(avg('positivity')),
            calm:          Math.round(avg('calm')),
            fatigueScore:  dayItems.reduce((sum, r) => sum + r.fatigueScore, 0) / dayItems.length,
            dominantEmotion: dominant,
            readingsCount: dayItems.length,
        };
    }

    private applyFaceIdChart(history: FaceIdHistoryItem[]): void {
        const sorted = [...history].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Agrupar por día: promediar scores y guardar emoción dominante + lecturas individuales
        const byDay = new Map<string, { scores: number[]; emotions: string[]; times: string[] }>();
        for (const r of sorted) {
            const key = this.formatDateShort(r.timestamp);
            const score = Math.round((r.attention + r.concentration + r.balance + r.positivity + r.calm) / 5);
            if (!byDay.has(key)) byDay.set(key, { scores: [], emotions: [], times: [] });
            byDay.get(key)!.scores.push(score);
            byDay.get(key)!.emotions.push(r.emotion);
            byDay.get(key)!.times.push(this.formatTime(r.timestamp));
        }

        const categories: string[] = [];
        const data: number[] = [];
        this.faceIdDayMeta = [];

        for (const [date, { scores, emotions, times }] of byDay) {
            categories.push(date);
            data.push(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
            // Emoción dominante del día: la que más se repite
            const freq = emotions.reduce((acc, e) => { acc[e] = (acc[e] ?? 0) + 1; return acc; }, {} as Record<string, number>);
            const dominant = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral';
            const readings = scores.map((s, i) => ({ time: times[i], score: s, emotion: emotions[i] }));
            this.faceIdDayMeta.push({ count: scores.length, dominantEmotion: dominant, readings });
        }

        // Adapt X-axis density to the number of data points
        const n = categories.length;
        const tickAmount = n <= 7 ? n : n <= 30 ? Math.min(n, 10) : Math.min(n, 8);
        const rotate    = n > 30 ? -45 : 0;
        const height    = n > 90 ? 180 : 150;

        this.faceIdChart.series = [{ name: 'Estado emocional', data }];
        (this.faceIdChart.chart as any).height = height;
        this.faceIdChart.xaxis = {
            ...this.faceIdChart.xaxis,
            categories,
            tickAmount,
            labels: {
                ...this.faceIdChart.xaxis.labels,
                rotate,
                rotateAlways: n > 30,
                style: {
                    colors: Array(categories.length).fill('#94A3B8'),
                    fontSize: n > 90 ? '10px' : '11px',
                },
            },
        };
    }

    private loadFollowUps(userId?: number): void {
        const url = userId
            ? `${environment.apiUrl}/support/user/${userId}`
            : `${environment.apiUrl}/support/my-requests`;
        this.http.get<unknown>(url).pipe(
            catchError(() => of([]))
        ).subscribe((res: unknown) => {
            const arr: any[] = Array.isArray(res) ? res
                : (res as any)?.success === true ? ((res as any).data ?? [])
                : [];

            const now = Date.now();

            // Última sesión: la solicitud RESOLVED más reciente
            const resolved = arr
                .filter((r) => String(r?.status ?? '').toUpperCase() === 'RESOLVED' && r?.updatedAt)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            // Próximo seguimiento: la solicitud IN_PROGRESS o OPEN más próxima con scheduledDate
            const upcoming = arr
                .filter((r) => {
                    const s = String(r?.status ?? '').toUpperCase();
                    return (s === 'OPEN' || s === 'IN_PROGRESS') && r?.scheduledDate;
                })
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

            const last = resolved[0] ?? null;
            const next = upcoming[0] ?? null;

            const lastDate = last ? new Date(last.updatedAt) : null;
            const nextDate = next ? new Date(next.scheduledDate) : null;

            this.followUp = {
                lastSessionDate: lastDate ? this.formatDateLong(lastDate.toISOString()) : null,
                lastSessionDaysAgo: lastDate ? Math.round((now - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
                nextSessionDate: nextDate ? this.formatDateLong(nextDate.toISOString()) : null,
                daysUntilNext: nextDate ? Math.max(0, Math.round((nextDate.getTime() - now) / (1000 * 60 * 60 * 24))) : null,
            };
        });
    }

    private applyCompletedEvaluations(items: CompletedEvaluationWithResultDto[]): void {
        const latestPerModule = new Map<ModuleProgressId, CompletedEvaluationWithResultDto>();
        // All evaluations grouped by module (for dimension merging)
        const allPerModule = new Map<ModuleProgressId, CompletedEvaluationWithResultDto[]>();

        const sorted = (items ?? [])
            .filter((i) => !!i?.completedAt)
            .filter((i) => Number((i as any)?.evaluationID ?? (i as any)?.evaluationId ?? 0) > 0)
            .slice()
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        for (const item of sorted) {
            const moduleId = this.mapModuleNameToProgressId(item.assessmentModuleName ?? undefined);
            if (!moduleId) continue;
            // Latest per module (for score/risk badges)
            if (!latestPerModule.has(moduleId)) {
                latestPerModule.set(moduleId, item);
            }
            // All per module (for dimension merging)
            if (!allPerModule.has(moduleId)) allPerModule.set(moduleId, []);
            allPerModule.get(moduleId)!.push(item);
        }

        const completedIds = new Set(Array.from(latestPerModule.keys()));
        this.stats.completedCount = completedIds.size;
        this.stats.pendingCount = Math.max(0, 4 - completedIds.size);

        // For stats avg — use the worst (highest) score per module across all instruments
        const worstScores = Array.from(allPerModule.entries()).map(([, evals]) =>
            this.worstScoreAcrossEvaluations(evals)
        ).filter((n) => Number.isFinite(n));

        const avg = worstScores.length ? worstScores.reduce((a, b) => a + b, 0) / worstScores.length : 0;
        this.stats.averageWellbeingPercent = Math.round(Math.max(0, Math.min(100, avg)));

        this.moduleProgress = this.moduleProgress.map((m) => {
            const latest = latestPerModule.get(m.id);
            const all = allPerModule.get(m.id) ?? [];
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

            // Use worst risk/score across all instruments of this module
            const { risk, score } = this.worstRiskAcrossEvaluations(all);

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
            const all = allPerModule.get(m.id) ?? [];
            if (!latest) {
                return {
                    id: m.id,
                    title: m.title,
                    completedAt: undefined,
                    evaluationId: undefined,
                    scorePercent: undefined,
                    riskLevel: undefined,
                    riskLabel: undefined,
                    isCompleted: false,
                    toneClass: 'disabled' as const,
                };
            }

            // Derive risk and score from worst instrument across all evaluations
            const { risk, score } = this.worstRiskAcrossEvaluations(all);
            const toneClass = this.toneClassForRisk(risk);
            const riskLabel = this.badgeLabelForRiskLevel(risk);

            return {
                id: m.id,
                title: m.title,
                completedAt: latest?.completedAt ? this.formatDateLong(latest.completedAt) : undefined,
                evaluationId: latest?.evaluationID,
                scorePercent: score,
                riskLevel: risk || undefined,
                riskLabel,
                isCompleted: true,
                toneClass,
            };
        });

        // Build the detailed section: one card per module, merging ALL instrument dimensions
        this.moduleDetailCards = this.buildModuleDetailCards(latestPerModule, allPerModule);

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

    private buildModuleDetailCards(
        latestPerModule: Map<ModuleProgressId, CompletedEvaluationWithResultDto>,
        allPerModule: Map<ModuleProgressId, CompletedEvaluationWithResultDto[]>
    ): ModuleDetailCardVm[] {
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];

        return order
            .map((moduleId) => ({ moduleId, latest: latestPerModule.get(moduleId) ?? null, all: allPerModule.get(moduleId) ?? [] }))
            .filter(({ latest }) => !!latest)
            .map(({ moduleId, latest, all }) => {
                const definition = getAssessmentModuleDefinition(moduleId);
                const title = definition?.title ?? this.moduleProgress.find((m) => m.id === moduleId)?.title ?? 'Evaluación';

                const evaluationResultId = Number((latest as any)?.result?.evaluationResultID ?? (latest as any)?.result?.evaluationResultId ?? 0);
                const safeEvaluationResultId = Number.isFinite(evaluationResultId) && evaluationResultId > 0 ? evaluationResultId : undefined;

                // Merge dimension scores from ALL evaluations for this module
                // so multi-instrument modules (DASS-21 + BAI + BDI) show every instrument
                type DimScore = NonNullable<CompletedEvaluationWithResultDto['result']['dimensionScores']>[number];
                const mergedDimsMap = new Map<string, DimScore>();
                // Process oldest-first so latest evaluation wins on conflicts
                for (const ev of [...all].reverse()) {
                    for (const d of ev.result?.dimensionScores ?? []) {
                        const code = String((d as any)?.instrumentCode ?? '').toUpperCase().trim();
                        const id   = String((d as any)?.dimensionScoreID ?? (d as any)?.dimensionScoreId ?? '');
                        const key  = code || id;
                        if (key) mergedDimsMap.set(key, d); // latest wins
                    }
                }
                const mergedDims = Array.from(mergedDimsMap.values());

                const rawFindings = mergedDims.map((d) => {
                    const tone = this.riskToneFor(d?.riskLevel);
                    const rawScore  = Number(d?.score ?? 0);
                    const rawMax    = Number(d?.maxScore ?? 0);
                    const pct = (d as any)?.percentageScore != null
                        ? Math.round(Math.max(0, Math.min(100, Number((d as any).percentageScore))))
                        : this.safePercent(rawScore, rawMax);
                    return {
                        label: this.resolveDimensionLabel(moduleId, (d as any)?.instrumentCode, d?.dimensionName ?? undefined),
                        value: pct,
                        score: rawScore,
                        maxScore: rawMax,
                        tone,
                        _group: this.resolveInstrumentGroupName((d as any)?.instrumentCode),
                    };
                });

                // Group findings by instrument
                const groupMap = new Map<string, Array<{ label: string; value: number; score: number; maxScore: number; tone: RiskTone }>>();
                for (const f of rawFindings) {
                    const key = f._group;
                    if (!groupMap.has(key)) groupMap.set(key, []);
                    groupMap.get(key)!.push({ label: f.label, value: f.value, score: f.score, maxScore: f.maxScore, tone: f.tone });
                }
                const findingGroups = Array.from(groupMap.entries()).map(([instrumentName, items]) => ({
                    instrumentName,
                    questionCount: MyTrackingComponent.INSTRUMENT_QUESTION_COUNTS[instrumentName] ?? undefined,
                    items,
                }));

                // Merge recommendations from all evaluations (union, no duplicates)
                const allRecs = new Set<string>();
                for (const ev of all) {
                    for (const r of ev.result?.recommendations ?? []) {
                        const text = (r?.recommendationText || r?.title || '').trim();
                        if (text) allRecs.add(text);
                    }
                }
                const recommendations = Array.from(allRecs);

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
                    findingGroups,
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
        const isEnglishFallback = interpretation.toLowerCase().startsWith('evaluation completed');

        this.stateCard = {
            badgeLabel: this.badgeForRisk(risk),
            headline: this.headlineForTone(tone),
            scoreOutOfTen: Number.isFinite(outOfTen) ? `${outOfTen.toFixed(1)}/10` : '—',
            description: (!interpretation || isEnglishFallback) ? fallbackDesc : interpretation,
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

        // ── Build one series per module using real evaluation dates ──────────
        const order: ModuleProgressId[] = ['mental-health', 'work-fatigue', 'organizational-climate', 'psychosocial-risk'];
        const moduleNames = ['Salud Mental', 'Fatiga Laboral', 'Clima Org.', 'Psicosocial'];

        const byModule: Record<ModuleProgressId, CompletedEvaluationWithResultDto[]> = {
            'mental-health': [],
            'work-fatigue': [],
            'organizational-climate': [],
            'psychosocial-risk': [],
        };

        for (const e of (this.completedEvaluations ?? [])) {
            const moduleId = this.mapModuleNameToProgressId(e?.assessmentModuleName ?? undefined);
            if (moduleId) byModule[moduleId].push(e);
        }

        // Collect all unique dates across all modules within the selected range, sorted asc
        const allDates = Array.from(
            new Set(
                order.flatMap(id =>
                    (byModule[id] ?? [])
                        .filter(e => !!e?.completedAt)
                        .filter(e => {
                            const t = new Date(e.completedAt).getTime();
                            return Number.isFinite(t) && t >= now - cutoffMs;
                        })
                        .map(e => this.formatDateShort(e.completedAt))
                )
            )
        ).sort((a, b) => {
            // Sort dd/MM/yyyy strings chronologically
            const parse = (s: string) => { const [d,m,y] = s.split('/'); return new Date(+y, +m-1, +d).getTime(); };
            return parse(a) - parse(b);
        });

        this.hasChartData = allDates.length > 0;

        const seriesData = order.map((id, i) => {
            const evals = (byModule[id] ?? [])
                .filter(e => !!e?.completedAt)
                .filter(e => {
                    const t = new Date(e.completedAt).getTime();
                    return Number.isFinite(t) && t >= now - cutoffMs;
                })
                .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

            // Map each category date to this module's score on that date (null if no eval that day).
            // When multiple evaluations exist for the same day, use the latest one (highest completedAt).
            const data: (number | null)[] = allDates.map(dateLabel => {
                const dayEvals = evals.filter(e => this.formatDateShort(e.completedAt) === dateLabel);
                if (!dayEvals.length) return null;
                // evals is sorted ascending, so last element = most recent of the day
                const latest = dayEvals[dayEvals.length - 1];
                return Math.round(Math.max(0, Math.min(100, Number(latest.result?.scorePercentage ?? 0))));
            });

            return { name: moduleNames[i], data };
        });

        this.moodTrackingChart.series = seriesData;
        this.moodTrackingChart.xaxis = {
            ...this.moodTrackingChart.xaxis,
            categories: allDates,
            labels: {
                ...this.moodTrackingChart.xaxis.labels,
                style: {
                    ...this.moodTrackingChart.xaxis.labels?.style,
                    colors: Array(allDates.length).fill('#94A3B8'),
                },
            },
        };

        // ── Radar chart (unchanged) ────────────────────────────────────────────
        const avgSeries: number[] = [];
        const latestSeries: number[] = [];

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
                    findingGroups: [],
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

    /**
     * Given all evaluations for a module, returns the worst (most severe) risk level
     * and its associated score percentage. For instruments where higher = worse (BAI, PHQ9, etc.)
     * the one with the highest scorePercentage is the most dangerous.
     * Priority order: bad > warn > good > none.
     */
    private worstRiskAcrossEvaluations(evals: CompletedEvaluationWithResultDto[]): { risk: string; score: number } {
        const SEVERITY: Record<string, number> = { bad: 3, warn: 2, good: 1, none: 0 };
        let worstRisk = '';
        let worstScore = 0;
        let worstSeverity = -1;

        for (const ev of evals) {
            // Check dimension-level risks first (most granular)
            for (const dim of ev.result?.dimensionScores ?? []) {
                const risk = String(dim?.riskLevel ?? '');
                const tone = this.badgeToneForRiskLabel(risk);
                const sev = SEVERITY[tone] ?? 0;
                const pct = (dim as any)?.percentageScore != null
                    ? Math.round(Math.max(0, Math.min(100, Number((dim as any).percentageScore))))
                    : this.safePercent(dim?.score ?? 0, dim?.maxScore ?? 0);
                if (sev > worstSeverity || (sev === worstSeverity && pct > worstScore)) {
                    worstSeverity = sev;
                    worstRisk = risk;
                    worstScore = pct;
                }
            }
            // Also consider the evaluation-level risk as fallback
            const evalRisk = String(ev.result?.riskLevel ?? '');
            const evalTone = this.badgeToneForRiskLabel(evalRisk);
            const evalSev = SEVERITY[evalTone] ?? 0;
            const evalScore = this.safePercent(ev.result?.scorePercentage ?? 0, 100);
            if (evalSev > worstSeverity || (worstSeverity === -1)) {
                worstSeverity = evalSev;
                worstRisk = evalRisk;
                worstScore = evalScore;
            }
        }

        return { risk: worstRisk, score: worstScore };
    }

    private worstScoreAcrossEvaluations(evals: CompletedEvaluationWithResultDto[]): number {
        return this.worstRiskAcrossEvaluations(evals).score;
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

    /**
     * Resolves a human-friendly dimension label.
     * Priority: instrumentCode match → backend dimensionName keyword match → dimensionName raw.
     */
    private resolveInstrumentGroupName(instrumentCode: string | undefined): string {
        if (!instrumentCode) return '';
        const code = instrumentCode.toUpperCase().trim();
        if (code.startsWith('DASS21')) return 'DASS-21';
        if (code.startsWith('TMMS24') || code.startsWith('TMMS-24')) return 'TMMS-24';
        if (code === 'GAD7' || code === 'GAD-7') return 'GAD-7';
        if (code === 'PHQ9' || code === 'PHQ-9') return 'PHQ-9';
        if (code === 'BAI') return 'BAI';
        if (code === 'BDI') return 'BDI';
        if (code === 'ISI') return 'ISI';
        if (code.startsWith('PSS')) return 'PSS-4';
        if (code.startsWith('DERS')) return 'DERS';
        if (code.startsWith('MFI20') || code.startsWith('MFI-20')) return 'MFI-20';
        // Single-family modules: no grouping label needed
        if (code.startsWith('CLIMATE_') || code.startsWith('PSYCHO_')) return '';
        if (code.startsWith('ECO_') || code.startsWith('MFI_')) return '';
        return code.replace(/([A-Z]+)(\d+)$/, '$1-$2');
    }

    private static readonly INSTRUMENT_PALETTE: Array<{ bg: string; border: string; color: string }> = [
        { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' }, // blue
        { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' }, // green
        { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' }, // orange
        { bg: '#FAF5FF', border: '#E9D5FF', color: '#7E22CE' }, // purple
        { bg: '#F0FDFA', border: '#99F6E4', color: '#0F766E' }, // teal
        { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }, // amber
        { bg: '#FFF1F2', border: '#FECDD3', color: '#9F1239' }, // rose
        { bg: '#ECFEFF', border: '#A5F3FC', color: '#0E7490' }, // cyan
    ];

    /** Known total question counts for standardized instruments. */
    private static readonly INSTRUMENT_QUESTION_COUNTS: Record<string, number> = {
        'DASS-21': 21,
        'BAI':     21,
        'BDI':     21,
        'TMMS-24': 24,
        'GAD-7':   7,
        'PHQ-9':   9,
        'MFI-20':  20,
        'ISI':     7,
        'PSS-4':   4,
        'DERS':    16,
    };

    instrumentGroupColor(index: number): { bg: string; border: string; color: string } {
        const palette = MyTrackingComponent.INSTRUMENT_PALETTE;
        return palette[index % palette.length];
    }

    goToInstrumentResults(moduleId: ModuleProgressId, instrumentName: string): void {
        const path = `/${moduleId}/results`;
        // Convert friendly name to raw instrument code (remove dashes/spaces): DASS-21 → DASS21
        const rawCode = instrumentName.replace(/[-\s]/g, '').toUpperCase();
        const queryParams = rawCode ? { instrumentCode: rawCode } : undefined;
        this.router.navigate([path], { queryParams });
    }

    private resolveDimensionLabel(moduleId: ModuleProgressId, instrumentCode: string | undefined, dimensionName: string | undefined): string {
        const labels = getAssessmentModuleDefinition(moduleId)?.dimensionLabels ?? [];

        // 1. Exact match by instrumentCode (e.g. "GAD7" → "Ansiedad")
        if (instrumentCode) {
            const code = String(instrumentCode).toUpperCase().replace(/[-\s]/g, '');
            const match = labels.find((l) => l.instrumentCode.toUpperCase().replace(/[-\s]/g, '') === code);
            if (match?.label) return match.label;
        }

        // 2. Match instrumentCode contained in the backend dimensionName
        //    e.g. "GAD-7 (Ansiedad Generalizada)" contains "GAD7"
        if (dimensionName) {
            const normalized = dimensionName.toUpperCase().replace(/[-\s]/g, '');
            const match = labels.find((l) => normalized.includes(l.instrumentCode.toUpperCase().replace(/[-\s]/g, '')));
            if (match?.label) return match.label;
        }

        // 3. Fallback to raw backend name
        return dimensionName?.trim() || 'Dimensión';
    }

    private formatDateLong(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    }

    private formatDateShort(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const day   = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year  = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    private formatTime(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    private computeMemberSince(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`;
        if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
        return `${days} ${days === 1 ? 'día' : 'días'}`;
    }
}
