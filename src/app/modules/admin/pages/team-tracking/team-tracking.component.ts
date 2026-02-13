import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { DashboardIndicatorsDto, DashboardService, ModuleStatisticsDto, RiskDistributionDto, TrendDataDto } from 'app/core/services/dashboard.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexDataLabels,
    ApexFill,
    ApexGrid,
    ApexLegend,
    ApexMarkers,
    ApexNonAxisChartSeries,
    ApexPlotOptions,
    ApexStroke,
    ApexTooltip,
    ApexXAxis,
    ApexYAxis,
    NgApexchartsModule,
} from 'ng-apexcharts';

type TimeRangeId = 'last-month' | 'last-3-months' | 'last-6-months' | 'last-year';
type GroupById = 'day' | 'week' | 'month';

export type TeamDonutChartOptions = {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    stroke: ApexStroke;
    tooltip: ApexTooltip;
};

export type TeamStackedAreaChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    fill: ApexFill;
    grid: ApexGrid;
    dataLabels: ApexDataLabels;
    markers: ApexMarkers;
    tooltip: ApexTooltip;
    colors: string[];
    legend: ApexLegend;
};

@Component({
    selector: 'app-team-tracking',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatSelectModule,
        NgApexchartsModule,
        BackgroundCirclesComponent,
    ],
    templateUrl: './team-tracking.component.html',
    styleUrls: ['./team-tracking.component.scss'],
})
export class TeamTrackingComponent implements OnInit {
    loading = true;
    error: string | null = null;

    indicators: DashboardIndicatorsDto | null = null;
    risk: RiskDistributionDto | null = null;
    trends: TrendDataDto[] = [];
    moduleStatistics: ModuleStatisticsDto[] = [];

    // Filters (UI + backend query)
    readonly timeRanges: Array<{ id: TimeRangeId; label: string }> = [
        { id: 'last-month', label: 'Último mes' },
        { id: 'last-3-months', label: 'Últimos 3 meses' },
        { id: 'last-6-months', label: 'Últimos 6 meses' },
        { id: 'last-year', label: 'Último año' },
    ];
    selectedTimeRange: TimeRangeId = 'last-6-months';

    readonly groupByOptions: Array<{ id: GroupById; label: string }> = [
        { id: 'day', label: 'Día' },
        { id: 'week', label: 'Semana' },
        { id: 'month', label: 'Mes' },
    ];
    selectedGroupBy: GroupById = 'week';

    // Charts
    riskDonutChart: TeamDonutChartOptions | null = null;
    riskTrendChart: TeamStackedAreaChartOptions | null = null;

    constructor(private readonly dashboard: DashboardService) { }

    ngOnInit(): void {
        this.load();
    }

    applyFilters(): void {
        this.load();
    }

    exportReport(): void {
        // UI only (no endpoint in backend doc yet)
        console.log('Export report (stub)', { timeRange: this.selectedTimeRange, groupBy: this.selectedGroupBy });
    }

    load(): void {
        this.loading = true;
        this.error = null;

        const { startDate, endDate } = this.getPeriodIsoRange(this.selectedTimeRange);
        const periodType = this.mapGroupByToPeriodType(this.selectedGroupBy);

        forkJoin({
            indicators: this.dashboard.getIndicators({ startDate, endDate }).pipe(catchError(() => of(null))),
            risk: this.dashboard.getRiskDistribution({ startDate, endDate }).pipe(catchError(() => of(null))),
            trends: this.dashboard
                .getTrends({
                    startDate,
                    endDate,
                    periodType,
                })
                .pipe(catchError(() => of([] as TrendDataDto[]))),
        })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: ({ indicators, risk, trends }) => {
                    this.indicators = indicators;
                    this.risk = risk;
                    this.trends = trends;
                    this.moduleStatistics = indicators?.moduleStatistics ?? [];

                    this.buildCharts();

                    if (!indicators && !risk && !trends?.length) {
                        this.error = 'No fue posible cargar datos del dashboard';
                    }
                },
                error: () => {
                    this.error = 'No fue posible cargar el dashboard';
                },
            });
    }

    riskLabel(riskLevel: string | null | undefined): string {
        const v = (riskLevel || '').toLowerCase();
        if (v.includes('green') || v.includes('verde')) return 'Verde';
        if (v.includes('yellow') || v.includes('amarillo')) return 'Amarillo';
        if (v.includes('red') || v.includes('rojo')) return 'Rojo';
        return 'N/D';
    }

    riskChipClass(riskLevel: string | null | undefined): string {
        const v = (riskLevel || '').toLowerCase();
        if (v.includes('green') || v.includes('verde')) return 'risk-chip--green';
        if (v.includes('yellow') || v.includes('amarillo')) return 'risk-chip--yellow';
        if (v.includes('red') || v.includes('rojo')) return 'risk-chip--red';
        return 'risk-chip--unknown';
    }

    private buildCharts(): void {
        this.riskDonutChart = null;
        this.riskTrendChart = null;

        const dist = this.risk ?? this.indicators?.riskDistribution;
        if (dist) {
            const green = dist.greenCount ?? 0;
            const yellow = dist.yellowCount ?? 0;
            const red = dist.redCount ?? 0;

            this.riskDonutChart = {
                series: [green, yellow, red],
                labels: ['Verde', 'Amarillo', 'Rojo'],
                colors: ['#00C950', '#F59E0B', '#EF4444'],
                chart: {
                    type: 'donut',
                    height: 260,
                    toolbar: { show: false },
                    fontFamily: 'Montserrat, ui-sans-serif, system-ui',
                },
                legend: {
                    position: 'bottom',
                    fontSize: '11px',
                    itemMargin: { horizontal: 12, vertical: 6 },
                },
                dataLabels: { enabled: false },
                stroke: { width: 0 },
                tooltip: { enabled: true },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '70%',
                        },
                    },
                },
            };
        }

        const points = this.trends || [];
        if (points.length) {
            const categories = points.map((p) => this.formatTrendLabel(p.period ?? ''));
            this.riskTrendChart = {
                series: [
                    { name: 'Verde', data: points.map((p) => p.greenCount ?? 0) },
                    { name: 'Amarillo', data: points.map((p) => p.yellowCount ?? 0) },
                    { name: 'Rojo', data: points.map((p) => p.redCount ?? 0) },
                ],
                colors: ['#00C950', '#F59E0B', '#EF4444'],
                chart: {
                    type: 'area',
                    height: 260,
                    stacked: true,
                    toolbar: { show: false },
                    zoom: { enabled: false },
                    fontFamily: 'Montserrat, ui-sans-serif, system-ui',
                },
                xaxis: {
                    categories,
                    labels: {
                        style: {
                            colors: categories.map(() => '#94A3B8'),
                            fontSize: '11px',
                        },
                    },
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                },
                yaxis: {
                    labels: {
                        style: { colors: ['#94A3B8'], fontSize: '11px' },
                    },
                },
                stroke: { curve: 'straight', width: 2 },
                fill: { type: 'solid', opacity: 0.20 },
                grid: {
                    borderColor: 'rgba(148, 163, 184, 0.35)',
                    strokeDashArray: 4,
                    padding: { left: 6, right: 6, top: 6, bottom: 0 },
                },
                dataLabels: { enabled: false },
                markers: { size: 0 },
                tooltip: { enabled: true },
                legend: {
                    position: 'bottom',
                    fontSize: '11px',
                    itemMargin: { horizontal: 12, vertical: 6 },
                },
            };
        }
    }

    private getPeriodIsoRange(timeRange: TimeRangeId): { startDate: string; endDate: string } {
        const now = new Date();
        const endDate = now.toISOString();
        const startDate = new Date(now);

        switch (timeRange) {
            case 'last-month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'last-3-months':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'last-6-months':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case 'last-year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        return { startDate: startDate.toISOString(), endDate };
    }

    private mapGroupByToPeriodType(groupBy: GroupById): string {
        switch (groupBy) {
            case 'day':
                return 'daily';
            case 'week':
                return 'weekly';
            case 'month':
                return 'monthly';
            default:
                return 'weekly';
        }
    }

    private formatTrendLabel(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mm}`;
    }
}
