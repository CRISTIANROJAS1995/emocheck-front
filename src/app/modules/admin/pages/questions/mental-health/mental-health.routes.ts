import { Routes } from '@angular/router';
import { MentalHealthComponent } from './mental-health.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';
import { InstrumentResultsComponent } from './instrument-results/instrument-results.component';

export default [
    {
        path: '',
        component: MentalHealthComponent,
    },
    {
        path: 'instrument-results',
        component: InstrumentResultsComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'mental-health' },
    },
] as Routes;
