import { Routes } from '@angular/router';
import { PsychosocialRiskComponent } from './psychosocial-risk.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';
import { InstrumentResultsComponent } from '../mental-health/instrument-results/instrument-results.component';

export default [
    {
        path: '',
        component: PsychosocialRiskComponent,
    },
    {
        path: 'ficha',
        loadComponent: () => import('./general-data/general-data.component').then(m => m.GeneralDataComponent),
    },
    {
        path: 'instrument-results',
        component: InstrumentResultsComponent,
        data: { moduleId: 'psychosocial-risk' },
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'psychosocial-risk' },
    },
] as Routes;
