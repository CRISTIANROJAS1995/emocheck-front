import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminAlertsService } from '../../../../core/services/admin-alerts.service';
import { AdminCaseTrackingService } from '../../../../core/services/admin-case-tracking.service';
import { AdminExportService } from '../../../../core/services/admin-export.service';
import { AdminModulesService } from '../../../../core/services/admin-modules.service';
import { AdminUsersService } from '../../../../core/services/admin-users.service';
import { AdminFeatureCardComponent } from './components/admin-feature-card/admin-feature-card.component';

interface AdminCard {
    title: string;
    description: string;
    icon: string;
    route: string;
    metric: string;
}

@Component({
    selector: 'app-admin-workspace',
    standalone: true,
    imports: [CommonModule, RouterModule, AdminFeatureCardComponent],
    templateUrl: './admin-workspace.component.html',
    styleUrls: ['./admin-workspace.component.scss'],
})
export class AdminWorkspaceComponent implements OnInit {
    loading = true;

    cards: AdminCard[] = [
        {
            title: 'Alertas Críticas',
            description: 'Monitorea y atiende alertas por nivel y estado.',
            icon: 'heroicons_outline:bell-alert',
            route: '/admin/alerts',
            metric: '-',
        },
        {
            title: 'Gestión de Casos',
            description: 'Seguimiento clínico y cierre de casos en riesgo.',
            icon: 'heroicons_outline:clipboard-document-check',
            route: '/admin/cases',
            metric: '-',
        },
        {
            title: 'Reportes y Exportes',
            description: 'Solicita y descarga reportes administrativos.',
            icon: 'heroicons_outline:document-arrow-down',
            route: '/admin/reports',
            metric: '-',
        },
        {
            title: 'Módulos de Evaluación',
            description: 'Consulta módulos activos y su configuración.',
            icon: 'heroicons_outline:squares-2x2',
            route: '/admin/modules',
            metric: '-',
        },
        {
            title: 'Usuarios y Roles',
            description: 'Administra usuarios, roles y segmentación.',
            icon: 'heroicons_outline:users',
            route: '/admin/users',
            metric: '-',
        },
    ];

    constructor(
        private readonly alertsService: AdminAlertsService,
        private readonly casesService: AdminCaseTrackingService,
        private readonly exportService: AdminExportService,
        private readonly modulesService: AdminModulesService,
        private readonly usersService: AdminUsersService
    ) { }

    ngOnInit(): void {
        forkJoin({
            criticalAlerts: this.alertsService.listCritical().pipe(catchError(() => of([]))),
            cases: this.casesService.list().pipe(catchError(() => of([]))),
            exports: this.exportService.myExports().pipe(catchError(() => of([]))),
            modules: this.modulesService.listActive().pipe(catchError(() => of([]))),
            users: this.usersService.listUsers().pipe(catchError(() => of([]))),
        }).subscribe(({ criticalAlerts, cases, exports, modules, users }) => {
            this.cards = this.cards.map((card) => {
                if (card.route.endsWith('/alerts')) return { ...card, metric: String(criticalAlerts.length) };
                if (card.route.endsWith('/cases')) return { ...card, metric: String(cases.length) };
                if (card.route.endsWith('/reports')) return { ...card, metric: String(exports.length) };
                if (card.route.endsWith('/modules')) return { ...card, metric: String(modules.length) };
                if (card.route.endsWith('/users')) return { ...card, metric: String(users.length) };
                return card;
            });
            this.loading = false;
        });
    }
}
