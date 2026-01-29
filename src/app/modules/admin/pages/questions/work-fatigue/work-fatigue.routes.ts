import { Routes } from '@angular/router';
import { WorkFatigueComponent } from './work-fatigue.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';

export default [
    {
        path: '',
        component: WorkFatigueComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'work-fatigue' },
    },
] as Routes;
