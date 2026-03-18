import { Routes } from '@angular/router';
import { MentalHealthComponent } from './mental-health.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';
import { InstrumentResultsComponent } from './instrument-results/instrument-results.component';
import { SleepQuestionnaireComponent } from 'app/shared/components/questionnaire/sleep-questionnaire/sleep-questionnaire.component';
import { EmotionalIntelligenceQuestionnaireComponent } from 'app/shared/components/questionnaire/emotional-intelligence-questionnaire/emotional-intelligence-questionnaire.component';
import { MentalHealthResultsComponent } from './mental-health-results/mental-health-results.component';

export default [
    {
        path: '',
        component: MentalHealthComponent,
    },
    {
        path: 'sleep-habits',
        component: SleepQuestionnaireComponent,
    },
    {
        path: 'emotional-intelligence',
        component: EmotionalIntelligenceQuestionnaireComponent,
    },
    {
        path: 'specialized-results',
        component: MentalHealthResultsComponent,
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
