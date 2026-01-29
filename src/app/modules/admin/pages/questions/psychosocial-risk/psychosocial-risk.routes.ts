import { Routes } from '@angular/router';
import { PsychosocialRiskComponent } from './psychosocial-risk.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';

export default [
    {
        path: '',
        component: PsychosocialRiskComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'psychosocial-risk' },
    },
] as Routes;
