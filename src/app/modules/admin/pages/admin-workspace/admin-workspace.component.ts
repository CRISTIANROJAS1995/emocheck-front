import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminAlertsService, AlertStatisticsDto } from '../../../../core/services/admin-alerts.service';
import { AdminCaseTrackingService } from '../../../../core/services/admin-case-tracking.service';
import { AdminExportService } from '../../../../core/services/admin-export.service';
import { AdminModulesService } from '../../../../core/services/admin-modules.service';
import { AdminUsersService } from '../../../../core/services/admin-users.service';
import { DashboardService, DashboardIndicatorsDto } from '../../../../core/services/dashboard.service';
import { AdminOrganizationService } from '../../../../core/services/admin-organization.service';

interface AdminCard {
    title: string;
    description: string;
    icon: string;
    route: string;
    metric: string;
    color: string;
}

@Component({
    selector: 'app-admin-workspace',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
    templateUrl: './admin-workspace.component.html',
    styleUrls: ['./admin-workspace.component.scss'],
})
export class AdminWorkspaceComponent implements OnInit {
    loading = true;
    indicators: DashboardIndicatorsDto | null = null;
    alertStats: AlertStatisticsDto | null = null;

    cards: AdminCard[] = [
        {
            title: 'Alertas',
            description: 'Monitorea y gestiona alertas por nivel, estado y asignación.',
            icon: 'heroicons_outline:bell-alert',
            route: '/admin/alerts',
            metric: '-',
            color: 'rose',
        },
        {
            title: 'Casos Clínicos',
            description: 'Seguimiento de casos, intervenciones y resultados.',
            icon: 'heroicons_outline:clipboard-document-check',
            route: '/admin/cases',
            metric: '-',
            color: 'amber',
        },
        {
            title: 'Módulos & Instrumentos',
            description: 'Gestiona módulos de evaluación, instrumentos y preguntas.',
            icon: 'heroicons_outline:squares-2x2',
            route: '/admin/modules',
            metric: '-',
            color: 'indigo',
        },
        {
            title: 'Usuarios & Roles',
            description: 'Administra usuarios, roles, activación y segmentación.',
            icon: 'heroicons_outline:users',
            route: '/admin/users',
            metric: '-',
            color: 'emerald',
        },
        {
            title: 'Reportes & Exportes',
            description: 'Solicita y descarga reportes en múltiples formatos.',
            icon: 'heroicons_outline:document-arrow-down',
            route: '/admin/reports',
            metric: '-',
            color: 'sky',
        },
        {
            title: 'Auditoría & Logs',
            description: 'Revisa trazabilidad de acciones y errores del sistema.',
            icon: 'heroicons_outline:shield-check',
            route: '/admin/audit',
            metric: '-',
            color: 'violet',
        },
        {
            title: 'Configuración Org.',
            description: 'Empresas, sedes, áreas y tipos de cargo.',
            icon: 'heroicons_outline:cog-8-tooth',
            route: '/admin/config',
            metric: '-',
            color: 'teal',
        },
    ];

    constructor(
        private readonly alertsService: AdminAlertsService,
        private readonly casesService: AdminCaseTrackingService,
        private readonly exportService: AdminExportService,
        private readonly modulesService: AdminModulesService,
        private readonly usersService: AdminUsersService,
        private readonly dashboardService: DashboardService,
        private readonly orgService: AdminOrganizationService,
    ) { }

    ngOnInit(): void {
        forkJoin({
            indicators: this.dashboardService.getIndicators().pipe(catchError(() => of(null))),
            alertStats: this.alertsService.getStatistics().pipe(catchError(() => of(null))),
            cases: this.casesService.list().pipe(catchError(() => of([]))),
            exports: this.exportService.myExports().pipe(catchError(() => of([]))),
            modules: this.modulesService.listActive().pipe(catchError(() => of([]))),
            users: this.usersService.listUsers().pipe(catchError(() => of([]))),
            companies: this.orgService.getCompanies().pipe(catchError(() => of([]))),
        }).subscribe(({ indicators, alertStats, cases, exports, modules, users, companies }) => {
            this.indicators = indicators as DashboardIndicatorsDto;
            this.alertStats = alertStats as AlertStatisticsDto;

            this.cards = this.cards.map((card) => {
                if (card.route.endsWith('/alerts')) return { ...card, metric: String(alertStats?.totalAlerts ?? 0) };
                if (card.route.endsWith('/cases')) return { ...card, metric: String(cases.length) };
                if (card.route.endsWith('/modules')) return { ...card, metric: String(modules.length) };
                if (card.route.endsWith('/users')) return { ...card, metric: String(users.length) };
                if (card.route.endsWith('/reports')) return { ...card, metric: String(exports.length) };
                if (card.route.endsWith('/audit')) return { ...card, metric: '∞' };
                if (card.route.endsWith('/config')) return { ...card, metric: String(companies.length) };
                return card;
            });
            this.loading = false;
        });
    }
}
