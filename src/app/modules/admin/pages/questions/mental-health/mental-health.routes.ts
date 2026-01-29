import { Routes } from '@angular/router';
import { MentalHealthComponent } from './mental-health.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';

export default [
    {
        path: '',
        component: MentalHealthComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'mental-health' },
    },
] as Routes;
