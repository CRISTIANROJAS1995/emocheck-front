import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
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
    ],
    templateUrl: './my-tracking.component.html',
    styleUrls: ['./my-tracking.component.scss'],
})
export class MyTrackingComponent {
    readonly userFullName = 'María Gómez';

    // Filters (UI only for now)
    readonly timeRanges: Array<{ id: TimeRangeId; label: string }> = [
        { id: 'last-month', label: 'Último mes' },
        { id: 'last-3-months', label: 'Últimos 3 meses' },
        { id: 'last-6-months', label: 'Últimos 6 meses' },
        { id: 'last-year', label: 'Último año' },
    ];

    selectedTimeRange: TimeRangeId = 'last-month';

    readonly moduleProgress: ModuleProgressItem[] = [
        {
            id: 'mental-health',
            title: 'Salud Mental',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'blue',
        },
        {
            id: 'work-fatigue',
            title: 'Fatiga Laboral',
            statusText: 'Evaluación completada',
            percent: 100,
            tone: 'green',
        },
        {
            id: 'organizational-climate',
            title: 'Clima Organizacional',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'teal',
        },
        {
            id: 'psychosocial-risk',
            title: 'Riesgo Psicosocial',
            statusText: 'Evaluación pendiente',
            percent: 0,
            tone: 'orange',
        },
    ];

    // Charts
    readonly moodTrackingChart: TrackingLineChartOptions = {
        series: [
            {
                name: 'Seguimiento',
                data: [70, 72, 74, 76],
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
            strokeWidth: 0,
            hover: { size: 6 },
        },
        grid: {
            borderColor: 'rgba(148, 163, 184, 0.35)',
            strokeDashArray: 4,
            padding: { left: 6, right: 6, top: 6, bottom: 0 },
        },
        xaxis: {
            categories: ['S1', 'S2', 'S3', 'S4'],
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
            tickAmount: 2,
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
                name: 'Promedio Org.',
                data: [70, 78, 68, 72],
            },
            {
                name: 'Tu Puntaje',
                data: [78, 86, 72, 76],
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
        answered: 5,
        missing: 0,
        progressPercent: 100,
        completedLabel: 'Completado',
    };

    readonly findings = [
        { label: 'Energía Física', value: 96, tone: 'success' as const, badge: 'Bienestar Adecuado' },
        { label: 'Energía Cognitiva', value: 100, tone: 'success' as const, badge: 'Bienestar Adecuado' },
        { label: 'Energía Emocional', value: 98, tone: 'success' as const, badge: 'Bienestar Adecuado' },
        { label: 'Motivación', value: 100, tone: 'success' as const, badge: 'Bienestar Adecuado' },
    ];

    readonly recommendations = [
        'Tu nivel de energía física, cognitiva y emocional es adecuado.',
        'Mantienes un buen equilibrio entre esfuerzo y recuperación.',
        'Tu motivación laboral se encuentra en niveles saludables.',
    ];

    readonly personalized = [
        {
            title: 'Salud Mental',
            text: 'Tus niveles de ansiedad están mejorando. Te recomendamos continuar con prácticas de mindfulness y respiración consciente.',
            button: 'Ver Recursos',
            icon: 'heroicons_outline:heart',
            tone: 'blue',
        },
        {
            title: 'Fatiga Laboral',
            text: 'Considera tomar pausas activas cada 2 horas. Tu energía cognitiva ha mostrado mejora constante.',
            button: 'Programar Pausas',
            icon: 'heroicons_outline:clock',
            tone: 'green',
        },
        {
            title: 'Clima Organizacional',
            text: 'Excelente percepción del ambiente laboral. Comparte tu experiencia en las sesiones de team building.',
            button: 'Ver Eventos',
            icon: 'heroicons_outline:user-group',
            tone: 'teal',
        },
    ];

    trackById = (_: number, item: { id: string }) => item.id;

    exportReport(): void {
        // TODO: hook to API when available
        console.log('Export report (stub)', this.selectedTimeRange);
    }
}
