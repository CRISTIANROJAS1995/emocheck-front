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

    /** Texto de bienvenida que aparece en el modal inicial del módulo */
    welcomeIntro: {
        lead: string;
        secondary: string;
    };

    /** If true, higher option index indicates worse state (e.g., anxiety frequency). */
    higherIsWorse: boolean;

    theme: {
        badgeGradient: string;
        badgeShadow: string;
        questionCardBackground: string;
    };

    /** instrumentCode must match the backend's instrumentCode field (e.g. GAD7, PHQ9). */
    dimensionLabels: Array<{ id: string; instrumentCode: string; label: string }>;
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
        welcomeIntro: {
            lead: 'La salud mental no solo se trata de "estar bien", sino de aprender a escucharte, reconocer tus pensamientos y cuidar de tu bienestar emocional día a día.',
            secondary: 'Este espacio te invita a hacer una pausa para ti. Aquí podrás encontrar pequeñas acciones que te ayuden a recuperar tu equilibrio y serenidad interior. Antes de ello vamos a realizar unas pruebas para ayudarte a comprender qué está pasando en este momento con tu yo interior:',
        },
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)',
            badgeShadow: '0 10px 22px rgba(37, 99, 235, 0.20)',
            questionCardBackground: '#EFF6FF',
        },
        dimensionLabels: [
            { id: 'dass21_anxiety',    instrumentCode: 'DASS21_ANXIETY',    label: 'Ansiedad' },
            { id: 'dass21_depression', instrumentCode: 'DASS21_DEPRESSION', label: 'Depresión' },
            { id: 'dass21_stress',     instrumentCode: 'DASS21_STRESS',     label: 'Estrés' },
            { id: 'anxiety',           instrumentCode: 'GAD7',              label: 'Ansiedad' },
            { id: 'depression',        instrumentCode: 'PHQ9',              label: 'Depresión' },
            { id: 'insomnia',          instrumentCode: 'ISI',               label: 'Insomnio' },
            { id: 'stress',            instrumentCode: 'PSS4',              label: 'Estrés Percibido' },
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
        welcomeIntro: {
            lead: 'La fatiga laboral aparece cuando el trabajo deja de ser solo una tarea y empieza a drenar nuestra energía, nuestras emociones y nuestra capacidad de disfrutar lo que hacemos y lo que somos.',
            secondary: 'Te invitamos a hacer consciente tu rutina laboral. Aquí encontrarás pequeñas acciones que te ayudarán a reconocer el cansancio acumulado, recuperar energía y restablecer tu equilibrio físico y emocional. Antes de comenzar, realizaremos unas pruebas que te permitirán comprender cómo el trabajo está influyendo en tu bienestar en este momento.',
        },
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #84CC16 0%, #65A30D 100%)',
            badgeShadow: '0 10px 22px rgba(132, 204, 22, 0.20)',
            questionCardBackground: '#F7FCE8',
        },
        dimensionLabels: [
            { id: 'fatiga_general',    instrumentCode: 'MFI20_FATIGA_GENERAL',    label: 'Fatiga General' },
            { id: 'fatiga_fisica',     instrumentCode: 'MFI20_FATIGA_FISICA',     label: 'Fatiga Física' },
            { id: 'fatiga_mental',     instrumentCode: 'MFI20_FATIGA_MENTAL',     label: 'Fatiga Mental' },
            { id: 'fatiga_emocional',  instrumentCode: 'MFI20_FATIGA_EMOCIONAL',  label: 'Fatiga Emocional' },
            { id: 'dinamismo',         instrumentCode: 'MFI20_DINAMISMO',         label: 'Dinamismo' },
            { id: 'motivacion',        instrumentCode: 'MFI20_MOTIVACION',        label: 'Motivación' },
            { id: 'actividad_reducida',instrumentCode: 'MFI20_ACTIVIDAD_REDUCIDA',label: 'Actividad Reducida' },
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
        welcomeIntro: {
            lead: 'En nombre de la organización, valoramos profundamente tu opinión y tu experiencia dentro de nuestro equipo. El objetivo de esta consulta es conocer tu nivel de identificación y vínculo con la organización para seguir construyendo un mejor lugar para trabajar.',
            secondary: 'Tu privacidad es prioridad: esta encuesta es 100% anónima. La información se usará exclusivamente para diagnóstico organizacional y planes de bienestar — nadie podrá identificar tus respuestas individuales. No hay respuestas correctas ni incorrectas: solo buscamos conocer tu percepción sincera. La escala va de 1 (Totalmente en desacuerdo) a 7 (Totalmente de acuerdo). El cuestionario tiene 18 preguntas y tomará aproximadamente 5 a 7 minutos.',
        },
        higherIsWorse: false,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #00BBA7 0%, #008F7F 100%)',
            badgeShadow: '0 10px 22px rgba(0, 187, 167, 0.20)',
            questionCardBackground: '#F0FDFA',
        },
        dimensionLabels: [
            { id: 'leadership',    instrumentCode: 'CLIMATE_LEADERSHIP',     label: 'Liderazgo y Dirección' },
            { id: 'teamwork',      instrumentCode: 'CLIMATE_TEAMWORK',        label: 'Trabajo en Equipo' },
            { id: 'communication', instrumentCode: 'CLIMATE_COMMUNICATION',   label: 'Comunicación' },
            { id: 'recognition',   instrumentCode: 'CLIMATE_RECOGNITION',     label: 'Reconocimiento' },
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
        welcomeIntro: {
            lead: '',
            secondary: '',
        },
        higherIsWorse: true,
        theme: {
            badgeGradient: 'linear-gradient(135deg, #FF6900 0%, #F54900 100%)',
            badgeShadow: '0 10px 22px rgba(249, 115, 22, 0.20)',
            questionCardBackground: '#FFF7ED',
        },
        dimensionLabels: [
            { id: 'demands',  instrumentCode: 'PSYCHO_DEMANDS',  label: 'Demandas del Trabajo' },
            { id: 'control',  instrumentCode: 'PSYCHO_CONTROL',  label: 'Control sobre el Trabajo' },
            { id: 'support',  instrumentCode: 'PSYCHO_SUPPORT',  label: 'Apoyo Social y Liderazgo' },
            { id: 'rewards',  instrumentCode: 'PSYCHO_REWARDS',  label: 'Recompensas' },
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
