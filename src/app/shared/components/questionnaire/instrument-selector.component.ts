import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AssessmentService, InstrumentDescriptor, RichAnswer } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AssessmentHydrationService } from 'app/core/services/assessment-hydration.service';
import { AssessmentModuleId } from 'app/core/models/assessment.model';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { AuthService } from 'app/core/services/auth.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components/questionnaire';
import { finalize, forkJoin, take } from 'rxjs';

// ── Paleta de colores para instrumentos sin metadato explícito ───────────────
const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

// ── Metadatos por código de instrumento ──────────────────────────────────────
const INSTRUMENT_META: Record<string, { icon: string; description: string; color: string }> = {
    // Salud Mental
    GAD7:    { icon: 'icons/Icon (37).svg', description: 'Trastorno de Ansiedad Generalizada',      color: '#3b82f6' },
    PHQ9:    { icon: 'icons/Icon (28).svg', description: 'Cuestionario de Salud del Paciente',      color: '#8b5cf6' },
    ISI:     { icon: 'icons/Icon (29).svg', description: 'Índice de Severidad del Insomnio',        color: '#06b6d4' },
    PSS4:    { icon: 'icons/Icon (30).svg', description: 'Escala de Estrés Percibido',              color: '#f59e0b' },
    DASS21:  { icon: 'icons/Icon (37).svg', description: 'Escala de Depresión, Ansiedad y Estrés',  color: '#3b82f6' },
    BAI:     { icon: 'icons/Icon (28).svg', description: 'Inventario de Ansiedad de Beck',          color: '#8b5cf6' },
    BDI:     { icon: 'icons/Icon (29).svg', description: 'Inventario de Depresión de Beck',         color: '#06b6d4' },
    ICSP_VC: { icon: 'icons/Icon (30).svg', description: 'Índice de Calidad del Sueño',             color: '#f59e0b' },
    TMMS24:  { icon: 'icons/Icon (31).svg', description: 'Escala de Inteligencia Emocional',        color: '#10b981' },
    PSS10:   { icon: 'icons/Icon (32).svg', description: 'Escala de Estrés Percibido (10 ítems)',   color: '#ef4444' },
    // Fatiga Laboral
    FATIGUE_ENERGY:     { icon: 'icons/Icon (38).svg', description: 'Nivel de energía física disponible',      color: '#84cc16' },
    FATIGUE_COGNITIVE:  { icon: 'icons/Icon (33).svg', description: 'Capacidad de concentración y foco',       color: '#22c55e' },
    FATIGUE_EMOTIONAL:  { icon: 'icons/Icon (34).svg', description: 'Reserva emocional y resiliencia',         color: '#06b6d4' },
    FATIGUE_MOTIVATION: { icon: 'icons/Icon (35).svg', description: 'Motivación e impulso laboral',            color: '#f59e0b' },
    // Clima Organizacional
    CLIMATE_LEADERSHIP:    { icon: 'icons/Icon (39).svg', description: 'Liderazgo y dirección del equipo',     color: '#00bba7' },
    CLIMATE_TEAMWORK:      { icon: 'icons/Icon (36).svg', description: 'Colaboración y trabajo en equipo',     color: '#3b82f6' },
    CLIMATE_COMMUNICATION: { icon: 'icons/Icon (25).svg', description: 'Canales y calidad de comunicación',    color: '#8b5cf6' },
    CLIMATE_RECOGNITION:   { icon: 'icons/Icon (26).svg', description: 'Reconocimiento y valoración',          color: '#f59e0b' },
    // Riesgo Psicosocial
    PSYCHO_DEMANDS:  { icon: 'icons/Icon (40).svg', description: 'Demandas y carga del trabajo',               color: '#f97316' },
    PSYCHO_CONTROL:  { icon: 'icons/Icon (41).svg', description: 'Autonomía y control sobre el trabajo',       color: '#ef4444' },
    PSYCHO_SUPPORT:  { icon: 'icons/Icon (42).svg', description: 'Apoyo social y liderazgo',                   color: '#8b5cf6' },
    PSYCHO_REWARDS:  { icon: 'icons/Icon (43).svg', description: 'Recompensas y reconocimiento',               color: '#f59e0b' },
};

// ── Instrucciones por instrumento (modal pre-cuestionario) ──────────────────
export interface InstrumentInstructions {
    /** Texto del encabezado, p.e. "Estado anímico" */
    heading: string;
    /** Párrafo principal de qué evalúa y cómo responder */
    body: string;
    /** Texto de la instrucción de tiempo / contexto de las preguntas */
    timeframe: string;
}

// ── Cierre por instrumento (modal post-cuestionario) ─────────────────────────
export interface InstrumentClosing {
    /** Mensaje de cierre afectivo */
    message: string;
    /** Texto secundario antes del CTA, p.e. "Antes de ver tu resultado..." */
    preResultText?: string;
    /** Tipo de elemento visual/interactivo a mostrar */
    visual: 'breathe' | 'stars' | 'ripple' | 'mosaic' | 'wave' | 'default';
    /** Texto del botón CTA */
    cta: string;
}

const INSTRUMENT_CLOSING: Record<string, InstrumentClosing> = {
    DASS21: {
        message: 'Recuerda que cuidar tu salud mental no siempre implica grandes cambios, sino pequeños gestos de atención hacia ti mismo/a. Detenerte, respirar, leer algo que te conecte o expresar cómo te sientes es también una forma de sanar. Permítete estar presente, sin exigencias, sin juicios.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para respirar y observar cómo te sientes ahora mismo.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    BAI: {
        message: 'Cuidar tu salud mental no siempre implica grandes cambios, sino pequeños gestos de atención hacia ti mismo/a. Detenerte, respirar, leer algo que te conecte o expresar cómo te sientes es también una forma de sanar. Permítete estar presente, sin exigencias, sin juicios.',
        preResultText: 'Antes de ver tus resultados, haz una respiración profunda. Inhala lentamente, sostén el aire un momento y suéltalo despacio.',
        visual: 'breathe',
        cta: 'Ver mis resultados',
    },
    BDI: {
        message: 'Atender tu salud mental no requiere hacerlo todo a la vez; comenzar por escucharte, respetar tus límites y permitirte apoyo es ya un acto de cuidado.',
        preResultText: 'Antes de ver tus resultados, recuerda que lo que sientes es válido y que buscar comprensión es un paso valioso.',
        visual: 'ripple',
        cta: 'Ver mis resultados',
    },
    ICSP_VC: {
        message: 'Cuidar tu salud mental no siempre implica grandes cambios, sino pequeños gestos de atención hacia ti mismo/a. Detenerte, respirar, leer algo que te conecte o expresar cómo te sientes es también una forma de sanar. Permítete estar presente, sin exigencias, sin juicios.',
        preResultText: 'Antes de ver tus resultados, cierra los ojos un instante e imagina que tu cuerpo se prepara para un descanso profundo y reparador.',
        visual: 'wave',
        cta: 'Ver mis resultados',
    },
    TMMS24: {
        message: 'Identificar lo que sentimos, comprender por qué ocurre y responder de manera más consciente y equilibrada ante distintas situaciones hace que reforcemos nuestra inteligencia emocional. Este proceso permite reflexionar sobre la forma en que se gestionan las emociones y abre un espacio para reconocer fortalezas, así como aspectos que pueden seguir desarrollándose.',
        preResultText: 'Estos son tus resultados. Recuerda que no hay perfiles buenos ni malos — cada dimensión es una oportunidad de crecimiento.',
        visual: 'mosaic',
        cta: 'Ver mis resultados',
    },
    FATIGUE_ENERGY: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        preResultText: 'Antes de ver tus resultados, recuerda que reconocer cómo te sientes es el primer paso para mejorar tu bienestar laboral.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    FATIGUE_COGNITIVE: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        preResultText: 'Antes de ver tus resultados, recuerda que reconocer cómo te sientes es el primer paso para mejorar tu bienestar laboral.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    FATIGUE_EMOTIONAL: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        preResultText: 'Antes de ver tus resultados, recuerda que reconocer cómo te sientes es el primer paso para mejorar tu bienestar laboral.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    FATIGUE_MOTIVATION: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        preResultText: 'Antes de ver tus resultados, recuerda que reconocer cómo te sientes es el primer paso para mejorar tu bienestar laboral.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    // Códigos alternativos del backend para instrumentos de fatiga (MFI-20)
    MFI20: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_FATIGA_GENERAL: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_FATIGA_FISICA: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_FATIGA_MENTAL: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_FATIGA_EMOCIONAL: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_DINAMISMO: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_MOTIVACION: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
    MFI20_ACTIVIDAD_REDUCIDA: {
        message: 'Reconocer la importancia de tu rol como trabajador es fundamental, pero cuando se pierden los límites personales, el equilibrio y el bienestar pueden verse afectados. Reconocer y respetar esos límites es una forma esencial de cuidarse.',
        visual: 'stars',
        cta: 'Ver mis resultados',
    },
};

const INSTRUMENT_INSTRUCTIONS: Record<string, InstrumentInstructions> = {
    DASS21: {
        heading: 'Estado anímico',
        body: 'El DASS-21 es una prueba que busca comprender tu estado emocional y reconocer posibles síntomas relacionados con el estrés, la ansiedad o la depresión. Te invitamos a responder con sinceridad, ya que solo así nos permitirá entender cómo te sientes y orientarte de manera más efectiva.',
        timeframe: 'Piensa en la última semana (incluido hoy) y marca la opción que mejor describa lo que has sentido.',
    },
    GAD7: {
        heading: 'Ansiedad generalizada',
        body: 'El GAD-7 es una escala breve que ayuda a identificar la presencia e intensidad de síntomas de ansiedad. Responde con honestidad; no hay respuestas correctas o incorrectas.',
        timeframe: 'Considera las últimas dos semanas y selecciona con qué frecuencia has experimentado cada situación.',
    },
    PHQ9: {
        heading: 'Estado de ánimo y depresión',
        body: 'El PHQ-9 evalúa la presencia y severidad de síntomas depresivos. Tu bienestar emocional importa; responde con calma y sinceridad.',
        timeframe: 'Piensa en las últimas dos semanas y elige la opción que mejor describe con qué frecuencia te has sentido así.',
    },
    ISI: {
        heading: 'Calidad del sueño',
        body: 'El ISI mide la severidad de los problemas de insomnio y el impacto que tienen en tu vida diaria. Un buen descanso es esencial para tu bienestar.',
        timeframe: 'Reflexiona sobre el último mes y selecciona la opción que mejor describe tu experiencia.',
    },
    PSS4: {
        heading: 'Estrés percibido',
        body: 'El PSS-4 evalúa tu nivel de estrés percibido en el último mes. Responde según cómo te has sentido realmente.',
        timeframe: 'Piensa en el último mes y elige la frecuencia con que has experimentado cada situación.',
    },
    BAI: {
        heading: 'Inventario de Beck para Ansiedad',
        body: 'El BAI (Beck Anxiety Inventory) es un instrumento diseñado para identificar la presencia e intensidad de síntomas asociados a la ansiedad. Te invitamos a responder con sinceridad, ya que la información proporcionada permitirá comprender cómo se manifiestan estos síntomas y orientar de manera adecuada las acciones de acompañamiento e intervención.',
        timeframe: 'Piensa en la última semana (incluido hoy) y marca la opción que mejor describa lo que has sentido.',
    },
    BDI: {
        heading: 'Inventario de Beck para Depresión',
        body: 'El BDI (Beck Depression Inventory) es un instrumento que permite identificar la presencia e intensidad de síntomas asociados a la depresión, los cuales pueden influir en el bienestar personal, emocional y laboral. Te invitamos a responder con sinceridad, ya que la información proporcionada facilitará una mejor comprensión de tu estado actual y permitirá orientar de manera adecuada las acciones de acompañamiento e intervención.',
        timeframe: 'Piensa en la última semana (incluido hoy) y marca la opción que mejor describa lo que has sentido.',
    },
    ICSP_VC: {
        heading: 'Hábitos de sueño',
        body: 'El ICSP-VC evalúa la calidad del sueño y sus posibles alteraciones. Recuerda responder con sinceridad, ya que la información proporcionada facilitará la comprensión de tus hábitos de descanso, orientando acciones de acompañamiento y mejora del bienestar.',
        timeframe: 'Responde considerando cómo ha sido tu descanso durante el último mes y marca la opción que mejor describa lo que has sentido.',
    },
    TMMS24: {
        heading: 'Inteligencia Emocional',
        body: 'El TMMS-24 busca comprender tu estado emocional y reconocer posibles síntomas relacionados con el estrés, la ansiedad o la depresión. Te invitamos a responder con sinceridad, ya que solo así nos permitirá entender cómo te sientes y orientarte de manera más efectiva.',
        timeframe: 'Piensa en la última semana (incluido hoy) y marca la opción que mejor describa lo que has sentido.',
    },
    PSS10: {
        heading: 'Estrés percibido',
        body: 'El PSS-10 mide tu nivel de estrés percibido con mayor detalle. Responde considerando cómo te has sentido realmente en el último mes.',
        timeframe: 'Piensa en el último mes y elige la frecuencia con que has experimentado cada situación.',
    },
    FATIGUE_ENERGY: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'Responde teniendo en cuenta la última semana (incluido hoy) y selecciona la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_COGNITIVE: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'Responde teniendo en cuenta la última semana (incluido hoy) y selecciona la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_EMOTIONAL: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'Responde teniendo en cuenta la última semana (incluido hoy) y selecciona la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_MOTIVATION: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'Responde teniendo en cuenta la última semana (incluido hoy) y selecciona la opción que mejor describa tu estado en tu entorno laboral.',
    },
    CLIMATE_LEADERSHIP: {
        heading: 'Liderazgo y dirección',
        body: 'Esta sección evalúa tu percepción sobre el liderazgo y la dirección dentro de tu equipo. No hay respuestas correctas o incorrectas — solo buscamos tu opinión sincera.',
        timeframe: 'Responde según tu experiencia reciente en el trabajo.',
    },
    CLIMATE_TEAMWORK: {
        heading: 'Trabajo en equipo',
        body: 'Esta sección evalúa la calidad de la colaboración y el trabajo en equipo en tu organización.',
        timeframe: 'Responde según tu experiencia reciente en el trabajo.',
    },
    CLIMATE_COMMUNICATION: {
        heading: 'Comunicación',
        body: 'Esta sección evalúa la calidad y efectividad de los canales de comunicación dentro de tu organización.',
        timeframe: 'Responde según tu experiencia reciente en el trabajo.',
    },
    CLIMATE_RECOGNITION: {
        heading: 'Reconocimiento',
        body: 'Esta sección evalúa cómo se reconoce y valora el trabajo y los logros dentro de tu organización.',
        timeframe: 'Responde según tu experiencia reciente en el trabajo.',
    },
    PSYCHO_DEMANDS: {
        heading: 'Demandas del trabajo',
        body: 'Esta sección evalúa las demandas y la carga de trabajo a la que estás expuesto/a.',
        timeframe: 'Responde considerando tu situación laboral actual.',
    },
    PSYCHO_CONTROL: {
        heading: 'Control sobre el trabajo',
        body: 'Esta sección evalúa tu autonomía y control sobre las actividades y decisiones en tu trabajo.',
        timeframe: 'Responde considerando tu situación laboral actual.',
    },
    PSYCHO_SUPPORT: {
        heading: 'Apoyo social y liderazgo',
        body: 'Esta sección evalúa el apoyo social que recibes de compañeros y superiores en tu entorno laboral.',
        timeframe: 'Responde considerando tu situación laboral actual.',
    },
    PSYCHO_REWARDS: {
        heading: 'Recompensas',
        body: 'Esta sección evalúa las recompensas y el reconocimiento que recibes a cambio de tu esfuerzo y desempeño.',
        timeframe: 'Responde considerando tu situación laboral actual.',
    },
};

export interface InstrumentCard extends InstrumentDescriptor {
    icon: string;
    description: string;
    color: string;
    /** true si el usuario ya completó este instrumento en la evaluación más reciente */
    completed?: boolean;
}

@Component({
    selector: 'app-instrument-selector',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        EmoQuestionnaireComponent,
        BackgroundCirclesComponent,
    ],
    templateUrl: './instrument-selector.component.html',
    styleUrl: './instrument-selector.component.scss',
})
export class InstrumentSelectorComponent implements OnInit {
    @Input({ required: true }) moduleId!: AssessmentModuleId;

    instruments: InstrumentCard[] | null = null;
    selectedInstrument: InstrumentCard | null = null;
    config?: QuestionnaireConfig;
    loadingQuestions = false;
    loadError = false;

    /** Controls the welcome modal visibility */
    showWelcomeModal = false;
    /** Controls the consent modal visibility (shown when user picks an instrument) */
    showConsentModal = false;
    /** Controls the instructions modal visibility (shown after consent accepted) */
    showInstructionsModal = false;
    /** Instructions for the pending instrument */
    currentInstructions: InstrumentInstructions | null = null;
    /** Instrument pending confirmation — set when consent modal opens */
    pendingInstrument: InstrumentCard | null = null;

    /** Controls the closing modal visibility (shown after questionnaire completes) */
    showClosingModal = false;
    /** Closing content for the current instrument */
    currentClosing: InstrumentClosing | null = null;
    /** Rich answers held until user dismisses closing modal */
    private pendingRichAnswers: RichAnswer[] | null = null;

    /** First name of the current user for the welcome modal greeting */
    userName = '';

    moduleDef = getAssessmentModuleDefinition('mental-health'); // sobrescrito en ngOnInit
    heroGradient = '';

    private isSubmitting = false;

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService,
        private readonly hydration: AssessmentHydrationService,
        private readonly alert: AlertService,
        private readonly authService: AuthService,
    ) {}

    ngOnInit(): void {
        this.moduleDef = getAssessmentModuleDefinition(this.moduleId);
        this.heroGradient = this._buildGradient();

        // Resolve current user's first name for the welcome modal greeting
        const cached = this.authService.getCurrentUser();
        if (cached?.name) {
            this.userName = cached.name.split(' ')[0];
        }
        this.authService.ensureCurrentUserLoaded().pipe(take(1)).subscribe({
            next: (u) => { if (u?.name) this.userName = u.name.split(' ')[0]; },
            error: () => {},
        });

        // Show welcome modal every time the module page loads
        this.showWelcomeModal = true;

        // Always hydrate from the backend first so that completed instruments are
        // correctly disabled even on a fresh session (state not yet in memory).
        // getCompletedInstrumentCodes() uses both the direct `instrumentCode` field
        // (for simple instruments like BAI, BDI) and dimensionScores (for sub-scale
        // instruments like DASS-21) so no instrument is ever missed.
        forkJoin({
            completedCodes: this.hydration.getCompletedInstrumentCodes(this.moduleId),
            descriptors: this.assessmentService.getModuleInstruments(this.moduleId),
        }).subscribe({
            next: ({ completedCodes, descriptors }) => {
                // completedCodes contains both exact codes (e.g. "BAI") and sub-scale
                // codes (e.g. "DASS21_ANXIETY"). Match by exact code OR by prefix so
                // that DASS21 is marked completed when DASS21_* dimensions exist.
                const isCompleted = (code: string): boolean => {
                    const upper = code.toUpperCase();
                    return completedCodes.has(upper) ||
                        [...completedCodes].some(dc => dc.startsWith(upper + '_'));
                };

                this.instruments = descriptors.map((d, i) => {
                    const meta = INSTRUMENT_META[d.code];
                    return {
                        ...d,
                        label: d.label || d.backendName || d.code,
                        description: d.backendDescription || meta?.description || '',
                        icon:  meta?.icon  ?? this.moduleDef.icon,
                        color: meta?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        completed: isCompleted(d.code),
                    };
                });
            },
            error: (e) => {
                this.loadError = true;
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar los instrumentos';
                this.alert.error(msg);
            },
        });
    }

    selectInstrument(card: InstrumentCard): void {
        if (this.loadingQuestions || card.completed) return;
        // Abrir modal de consentimiento primero — el usuario debe autorizar antes de continuar
        this.pendingInstrument = card;
        this.showConsentModal = true;
    }

    /** Llamado cuando el usuario toca "Autorizo" en el modal de consentimiento */
    onConsentAccepted(): void {
        this.showConsentModal = false;
        if (!this.pendingInstrument) return;
        // Mostrar instrucciones específicas del instrumento antes de lanzar el cuestionario
        this.currentInstructions =
            INSTRUMENT_INSTRUCTIONS[this.pendingInstrument.code] ?? {
                heading: this.pendingInstrument.label,
                body: this.pendingInstrument.description || 'Responde con sinceridad cada pregunta.',
                timeframe: 'Selecciona la opción que mejor describa cómo te has sentido.',
            };
        this.showInstructionsModal = true;
    }

    /** Llamado cuando el usuario toca "No autorizo" */
    onConsentDenied(): void {
        this.showConsentModal = false;
        this.pendingInstrument = null;
    }

    /** Llamado cuando el usuario toca "Comenzar prueba" en el modal de instrucciones */
    onInstructionsStart(): void {
        this.showInstructionsModal = false;
        this.currentInstructions = null;
        const card = this.pendingInstrument;
        this.pendingInstrument = null;
        if (!card) return;
        this._loadInstrumentQuestions(card);
    }

    /** Llamado cuando el usuario cierra el modal de instrucciones sin comenzar */
    onInstructionsDismiss(): void {
        this.showInstructionsModal = false;
        this.currentInstructions = null;
        this.pendingInstrument = null;
    }

    private _loadInstrumentQuestions(card: InstrumentCard): void {
        this.loadingQuestions = true;
        this.selectedInstrument = card;

        this.assessmentService.getInstrumentQuestions(this.moduleId, card.index).subscribe({
            next: (questions) => {
                this.loadingQuestions = false;
                this.config = {
                    title: card.label,
                    icon: card.icon,
                    theme: this.moduleDef.theme,
                    questions,
                };
            },
            error: (e) => {
                this.loadingQuestions = false;
                this.selectedInstrument = null;
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar el cuestionario';
                this.alert.error(msg);
            },
        });
    }

    goBack(): void {
        if (this.config) {
            this.config = undefined;
            this.selectedInstrument = null;
        } else {
            this.router.navigate(['/home']);
        }
    }

    onCompleted(answers: number[]): void {
        // Legacy: not used when completedRich is available
    }

    onCompletedRich(richAnswers: RichAnswer[]): void {
        // Guardar respuestas y mostrar modal de cierre antes de enviar
        this.pendingRichAnswers = richAnswers;
        const code = (this.selectedInstrument?.code ?? '').toUpperCase();

        // Busca coincidencia exacta primero, luego por prefijo conocido
        const closing = INSTRUMENT_CLOSING[code]
            ?? (code.startsWith('MFI')      ? INSTRUMENT_CLOSING['MFI20'] : null)
            ?? (code.startsWith('FATIGUE')  ? INSTRUMENT_CLOSING['FATIGUE_ENERGY'] : null)
            ?? (code.startsWith('CLIMATE')  ? INSTRUMENT_CLOSING['CLIMATE_DEFAULT'] : null)
            ?? (code.startsWith('PSYCHO')   ? INSTRUMENT_CLOSING['PSYCHO_DEFAULT'] : null)
            ?? null;

        this.currentClosing = closing ?? {
            message: 'Gracias por tu tiempo y sinceridad. Tu bienestar es lo más importante.',
            visual: 'default',
            cta: 'Ver mis resultados',
        };
        this.showClosingModal = true;
    }

    /** Llamado cuando el usuario toca "Ver mis resultados" en el modal de cierre */
    onClosingContinue(): void {
        this.showClosingModal = false;
        this.currentClosing = null;
        const richAnswers = this.pendingRichAnswers;
        this.pendingRichAnswers = null;
        if (!richAnswers) return;
        this._submitRichAnswers(richAnswers);
    }

    private _submitRichAnswers(richAnswers: RichAnswer[]): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        // Pass instrument code AND id so the backend can create a per-instrument
        // evaluation (avoids 409 when the module already has a completed evaluation).
        const instrumentCode = this.selectedInstrument?.code;
        const instrumentId   = this.selectedInstrument?.instrumentId;

        this.assessmentService.submitRich(this.moduleId, richAnswers, instrumentCode, instrumentId).pipe(
            finalize(() => { this.isSubmitting = false; })
        ).subscribe({
            next: (result) => {
                this.assessmentState.mergeResult(result);
                // Multi-instrument modules go to the instrument picker page so the
                // user can select which individual result to review.
                // Single-instrument modules go straight to the results page.
                const multiInstrumentModules: string[] = ['mental-health'];
                if (multiInstrumentModules.includes(this.moduleId)) {
                    this.router.navigate([`/${this.moduleId}/instrument-results`]);
                } else {
                    this.router.navigate([`/${this.moduleId}/results`]);
                }
            },
            error: (e) => {
                if (e?.code === 'CONSENT_REQUIRED') {
                    this.alert.confirm(
                        'Debes aceptar el consentimiento informado para continuar.',
                        'Consentimiento requerido',
                        'Ir a consentimiento',
                        'Cancelar',
                    ).then((go) => {
                        if (go) this.router.navigate(['/informed-consent']);
                    });
                    return;
                }
                if (e?.code === 'ALREADY_COMPLETED') {
                    this.alert.info(
                        'Este instrumento ya fue completado. Cada instrumento solo puede presentarse una vez.',
                        'Instrumento ya completado',
                    );
                    // Redirect to results so the user can review their outcome
                    const multiInstrumentModules: string[] = ['mental-health'];
                    if (multiInstrumentModules.includes(this.moduleId)) {
                        this.router.navigate([`/${this.moduleId}/instrument-results`]);
                    } else {
                        this.router.navigate([`/${this.moduleId}/results`]);
                    }
                    return;
                }
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible completar la evaluación';
                this.alert.error(msg);
            },
        });
    }

    closeWelcomeModal(): void {
        this.showWelcomeModal = false;
    }

    private _buildGradient(): string {
        // Usa el badgeGradient del módulo como base para el hero banner
        const g = this.moduleDef.theme.badgeGradient;
        // Si ya es un linear-gradient lo usamos directamente
        if (g?.startsWith('linear-gradient')) return g;
        return 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)';
    }
}
