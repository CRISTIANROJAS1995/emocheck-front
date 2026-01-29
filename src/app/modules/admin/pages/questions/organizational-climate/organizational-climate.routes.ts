import { Routes } from '@angular/router';
import { OrganizationalClimateComponent } from './organizational-climate.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';

export default [
    {
        path: '',
        component: OrganizationalClimateComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'organizational-climate' },
    },
] as Routes;
