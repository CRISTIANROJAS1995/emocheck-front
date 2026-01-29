import { AssessmentQuestion } from 'app/core/models/assessment.model';

export interface QuestionnaireTheme {
    badgeGradient: string;
    badgeShadow: string;
    questionCardBackground: string;
}

export interface QuestionnaireConfig {
    title: string;
    icon: string;
    theme: QuestionnaireTheme;
    questions: AssessmentQuestion[];
}
