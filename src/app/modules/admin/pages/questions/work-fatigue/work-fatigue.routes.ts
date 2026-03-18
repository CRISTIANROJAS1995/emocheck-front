import { Routes } from '@angular/router';
import { WorkFatigueComponent } from './work-fatigue.component';
import { AssessmentResultsComponent } from 'app/modules/admin/pages/assessment-results/assessment-results.component';
import { MfiQuestionnaireComponent } from 'app/shared/components/questionnaire/mfi-questionnaire/mfi-questionnaire.component';
import { MfiResultsComponent } from './mfi-results/mfi-results.component';

export default [
    {
        path: '',
        component: WorkFatigueComponent,
    },
    {
        path: 'mfi-20',
        component: MfiQuestionnaireComponent,
    },
    {
        path: 'mfi-results',
        component: MfiResultsComponent,
    },
    {
        path: 'results',
        component: AssessmentResultsComponent,
        data: { moduleId: 'work-fatigue' },
    },
] as Routes;
