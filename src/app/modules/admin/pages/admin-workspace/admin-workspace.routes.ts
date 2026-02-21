import { Routes } from '@angular/router';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { AdminWorkspaceComponent } from './admin-workspace.component';
import { AdminAlertsComponent } from './features/alerts/admin-alerts.component';
import { AdminCasesComponent } from './features/cases/admin-cases.component';
import { AdminReportsComponent } from './features/reports/admin-reports.component';
import { AdminModulesComponent } from './features/modules/admin-modules.component';
import { AdminAuditComponent } from './features/audit/admin-audit.component';
import { AdminConfigComponent } from './features/config/admin-config.component';

export default [
    {
        path: '',
        component: AdminWorkspaceComponent,
    },
    {
        path: 'alerts',
        component: AdminAlertsComponent,
    },
    {
        path: 'cases',
        component: AdminCasesComponent,
    },
    {
        path: 'reports',
        component: AdminReportsComponent,
    },
    {
        path: 'modules',
        component: AdminModulesComponent,
    },
    {
        path: 'users',
        component: AdminPanelComponent,
    },
    {
        path: 'audit',
        component: AdminAuditComponent,
    },
    {
        path: 'config',
        component: AdminConfigComponent,
    },
] as Routes;
