import { AssessmentModuleId } from 'app/core/models/assessment.model';

export interface AssessmentModuleDefinition {
    id: AssessmentModuleId;
    title: string;
    description: string;
    icon: string;
    colorClass: string;
    iconClass: string;
    route: string;

    questionnaireTitle: string;
    resultsTitle: string;

    /** If true, higher option index indicates worse state (e.g., anxiety frequency). */
    higherIsWorse: boolean;

    theme: {
        badgeGradient: string;
        badgeShadow: string;
        questionCardBackground: string;
    };

    dimensionLabels: Array<{ id: string; label: string }>;
}

export const ASSESSMENT_MODULES: AssessmentModuleDefinition[] = [
    {
        id: 'mental-health',
        title: 'Salud Mental',
        description: 'Tamizaje de ansiedad, depresión, trastorno del sueño y desgaste emocional',
        icon: 'icons/Icon (37).svg',
        colorClass: 'module-card--mental-health',
        iconClass: 'module-icon--blue',
        route: '/mental-health',
        questionnaireTitle: 'Evaluación de Salud Mental',
        resultsTitle: 'Resultados de Salud Mental',
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)',
            badgeShadow: '0 10px 22px rgba(37, 99, 235, 0.20)',
            questionCardBackground: '#EFF6FF',
        },
        dimensionLabels: [
            { id: 'anxiety', label: 'Ansiedad (GAD-7)' },
            { id: 'depression', label: 'Depresión (PHQ-9)' },
            { id: 'insomnia', label: 'Insomnio (ISI)' },
            { id: 'stress', label: 'Estrés Percibido' },
        ],
    },
    {
        id: 'work-fatigue',
        title: 'Fatiga Laboral',
        description: 'Evaluación rápida de energía cognitiva y emocional',
        icon: 'icons/Icon (38).svg',
        colorClass: 'module-card--work-fatigue',
        iconClass: 'module-icon--green',
        route: '/work-fatigue',
        questionnaireTitle: 'Evaluación de Fatiga Laboral',
        resultsTitle: 'Resultados de Fatiga Laboral',
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)',
            badgeShadow: '0 10px 22px rgba(132, 204, 22, 0.20)',
            questionCardBackground: '#F7FCE8',
        },
        dimensionLabels: [
            { id: 'energy', label: 'Energía Física' },
            { id: 'focus', label: 'Energía Cognitiva' },
            { id: 'emotional', label: 'Energía Emocional' },
            { id: 'recovery', label: 'Motivación Laboral' },
        ],
    },
    {
        id: 'organizational-climate',
        title: 'Clima Organizacional',
        description: 'Percepción del entorno, liderazgo y propósito',
        icon: 'icons/Icon (39).svg',
        colorClass: 'module-card--organizational-climate',
        iconClass: 'module-icon--teal',
        route: '/organizational-climate',
        questionnaireTitle: 'Evaluación de Clima Organizacional',
        resultsTitle: 'Resultados de Clima Organizacional',
        higherIsWorse: false,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #00BBA7 0%, #008F7F 100%)',
            badgeShadow: '0 10px 22px rgba(0, 187, 167, 0.20)',
            questionCardBackground: '#F0FDFA',
        },
        dimensionLabels: [
            { id: 'leadership', label: 'Liderazgo y Dirección' },
            { id: 'teamwork', label: 'Trabajo en Equipo' },
            { id: 'communication', label: 'Comunicación Organizacional' },
            { id: 'recognition', label: 'Reconocimiento' },
        ],
    },
    {
        id: 'psychosocial-risk',
        title: 'Riesgo Psicosocial',
        description: 'Factores intralaborales y extralaborales según Batería Ministerio del Trabajo',
        icon: 'icons/Icon (40).svg',
        colorClass: 'module-card--psychosocial-risk',
        iconClass: 'module-icon--orange',
        route: '/psychosocial-risk',
        questionnaireTitle: 'Evaluación de Riesgo Psicosocial',
        resultsTitle: 'Resultados de Riesgo Psicosocial',
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #FF6900 0%, #F54900 100%)',
            badgeShadow: '0 10px 22px rgba(249, 115, 22, 0.20)',
            questionCardBackground: '#FFF7ED',
        },
        dimensionLabels: [
            { id: 'demands', label: 'Demandas del Trabajo' },
            { id: 'control', label: 'Control sobre el Trabajo' },
            { id: 'support', label: 'Apoyo Social y Liderazgo' },
            { id: 'rewards', label: 'Recompensas' },
        ],
    },
];

export function getAssessmentModuleDefinition(moduleId: AssessmentModuleId): AssessmentModuleDefinition {
    const moduleDef = ASSESSMENT_MODULES.find((m) => m.id === moduleId);
    if (!moduleDef) {
        throw new Error(`Unknown assessment module: ${moduleId}`);
    }
    return moduleDef;
}
