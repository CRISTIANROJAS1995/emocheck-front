import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { PendingClosingService } from 'app/core/services/pending-closing.service';
import { PsychosocialConsentService, PsychosocialConsentDto, PsychologistInfoDto } from 'app/core/services/psychosocial-consent.service';
import { UsersService } from 'app/core/services/users.service';
import { PsychosocialDataSheetService } from 'app/core/services/psychosocial-data-sheet.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { ExamTimerComponent } from 'app/shared/components/ui/exam-timer/exam-timer.component';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components/questionnaire';
import { finalize, forkJoin, take } from 'rxjs';
import jsPDF from 'jspdf';

// ── Paleta de colores para instrumentos sin metadato explícito ───────────────
const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

// ── Metadatos por código de instrumento ──────────────────────────────────────
const INSTRUMENT_META: Record<string, { icon: string; description: string; color: string }> = {
    // Salud Mental
    GAD7: { icon: 'icons/Icon (37).svg', description: 'Trastorno de Ansiedad Generalizada', color: '#3b82f6' },
    PHQ9: { icon: 'icons/Icon (28).svg', description: 'Cuestionario de Salud del Paciente', color: '#8b5cf6' },
    ISI: { icon: 'icons/Icon (29).svg', description: 'Índice de Severidad del Insomnio', color: '#06b6d4' },
    PSS4: { icon: 'icons/Icon (30).svg', description: 'Escala de Estrés Percibido', color: '#f59e0b' },
    DASS21: { icon: 'icons/Icon (37).svg', description: 'Escala de Depresión, Ansiedad y Estrés', color: '#3b82f6' },
    BAI: { icon: 'icons/Icon (28).svg', description: 'Inventario de Ansiedad de Beck', color: '#8b5cf6' },
    BDI: { icon: 'icons/Icon (29).svg', description: 'Inventario de Depresión de Beck', color: '#06b6d4' },
    ICSP_VC: { icon: 'icons/icon-sleep.svg', description: 'Índice de Calidad del Sueño', color: '#f59e0b' },
    TMMS24: { icon: 'icons/Icon (31).svg', description: 'Escala de Inteligencia Emocional', color: '#10b981' },
    PSS10: { icon: 'icons/Icon (32).svg', description: 'Escala de Estrés Percibido (10 ítems)', color: '#ef4444' },
    // Fatiga Laboral
    FATIGUE_ENERGY: { icon: 'icons/Icon (38).svg', description: 'Nivel de energía física disponible', color: '#84cc16' },
    FATIGUE_COGNITIVE: { icon: 'icons/Icon (33).svg', description: 'Capacidad de concentración y foco', color: '#22c55e' },
    FATIGUE_EMOTIONAL: { icon: 'icons/Icon (34).svg', description: 'Reserva emocional y resiliencia', color: '#06b6d4' },
    FATIGUE_MOTIVATION: { icon: 'icons/Icon (35).svg', description: 'Motivación e impulso laboral', color: '#f59e0b' },
    // Clima Organizacional
    ECO: { icon: 'icons/Icon (39).svg', description: 'Escala de Compromiso Organizacional', color: '#3b82f6' },
    CLIMATE_LEADERSHIP: { icon: 'icons/Icon (39).svg', description: 'Liderazgo y dirección del equipo', color: '#00bba7' },
    CLIMATE_TEAMWORK: { icon: 'icons/Icon (36).svg', description: 'Colaboración y trabajo en equipo', color: '#3b82f6' },
    CLIMATE_COMMUNICATION: { icon: 'icons/Icon (25).svg', description: 'Canales y calidad de comunicación', color: '#8b5cf6' },
    CLIMATE_RECOGNITION: { icon: 'icons/Icon (26).svg', description: 'Reconocimiento y valoración', color: '#f59e0b' },
    // Riesgo Psicosocial
    INTRA_A: { icon: 'icons/Icon (40).svg', description: 'Factores de Riesgo Psicosocial Intralaboral – Forma A', color: '#f97316' },
    INTRA_B: { icon: 'icons/Icon (41).svg', description: 'Factores de Riesgo Psicosocial Intralaboral – Forma B', color: '#ef4444' },
    EXTRALABORAL: { icon: 'icons/Icon (42).svg', description: 'Factores de Riesgo Psicosocial Extralaboral', color: '#8b5cf6' },
    ESTRES: { icon: 'icons/Icon (43).svg', description: 'Síntomas de Estrés', color: '#ec4899' },
    PSYCHO_DEMANDS: { icon: 'icons/Icon (40).svg', description: 'Demandas y carga del trabajo', color: '#f97316' },
    PSYCHO_CONTROL: { icon: 'icons/Icon (41).svg', description: 'Autonomía y control sobre el trabajo', color: '#ef4444' },
    PSYCHO_SUPPORT: { icon: 'icons/Icon (42).svg', description: 'Apoyo social y liderazgo', color: '#8b5cf6' },
    PSYCHO_REWARDS: { icon: 'icons/Icon (43).svg', description: 'Recompensas y reconocimiento', color: '#f59e0b' },
};

// ── Instrucciones por instrumento (modal pre-cuestionario) ──────────────────
export interface InstrumentInstructions {
    /** Texto del encabezado, p.e. "Estado anímico" */
    heading: string;
    /** Párrafo principal de qué evalúa y cómo responder */
    body: string;
    /** Texto de la instrucción de tiempo / contexto de las preguntas */
    timeframe: string;
    /** Lista de instrucciones en viñetas para mostrar debajo de la tarjeta de stats */
    instructions?: string[];
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
    /** Si true, muestra el bloque de aviso legal con checkbox de aceptación antes del CTA */
    requiresDisclaimer?: boolean;
}

const INSTRUMENT_CLOSING: Record<string, InstrumentClosing> = {
    DASS21: {
        message: 'Reconocer cómo te sientes y cómo estás afrontando tu día a día es un paso fundamental hacia el bienestar. Tu percepción permite identificar áreas de cuidado y fortalece tu capacidad de adaptación.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para escuchar lo que dice tu cuerpo. Lo que has identificado puede ser el inicio de cambios significativos en tu bienestar.',
        visual: 'breathe',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    BAI: {
        message: 'Identificar señales de ansiedad te permite comprender cómo tu mente y cuerpo reaccionan ante diferentes situaciones. Este reconocimiento es esencial para el autocuidado.',
        preResultText: 'Antes de ver tus resultados, realiza una respiración lenta y profunda. Lo que has observado puede ayudarte a encontrar formas más equilibradas de afrontar el día a día.',
        visual: 'breathe',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    BDI: {
        message: 'Explorar tu estado emocional es un acto de valentía y autocuidado. Reconocer cambios en tu ánimo permite dar pasos hacia el bienestar.',
        preResultText: 'Antes de ver tus resultados, tómate un momento contigo. Comprender lo que sientes es clave para buscar apoyo y fortalecer tu equilibrio emocional.',
        visual: 'ripple',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    ICSP_VC: {
        message: 'Explorar tus hábitos de descanso te ayuda a comprender cómo tu cuerpo se recupera y responde a las demandas diarias. El sueño es un pilar esencial para tu salud integral.',
        preResultText: 'Antes de ver tus resultados, haz una pausa consciente. Pequeños ajustes en tu descanso pueden generar grandes cambios en tu energía.',
        visual: 'wave',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    TMMS24: {
        message: 'Reconocer y comprender tus emociones es clave para fortalecer tus relaciones y tu bienestar personal. Este ejercicio aporta claridad sobre cómo gestionas lo que sientes.',
        preResultText: 'Antes de ver tus resultados, respira profundamente. Tomar conciencia emocional es el primer paso hacia respuestas más saludables y conscientes.',
        visual: 'mosaic',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    FATIGUE_ENERGY: {
        message: 'Reconocer cómo te sientes y cómo estás afrontando tu día a día es un paso fundamental hacia el bienestar. Tu percepción permite identificar áreas de cuidado y fortalece tu capacidad de adaptación.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para escuchar lo que dice tu cuerpo. Lo que has identificado puede ser el inicio de cambios significativos en tu bienestar.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    FATIGUE_COGNITIVE: {
        message: 'Reconocer cómo te sientes y cómo estás afrontando tu día a día es un paso fundamental hacia el bienestar. Tu percepción permite identificar áreas de cuidado y fortalece tu capacidad de adaptación.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para escuchar lo que dice tu cuerpo. Lo que has identificado puede ser el inicio de cambios significativos en tu bienestar.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    FATIGUE_EMOTIONAL: {
        message: 'Reconocer cómo te sientes y cómo estás afrontando tu día a día es un paso fundamental hacia el bienestar. Tu percepción permite identificar áreas de cuidado y fortalece tu capacidad de adaptación.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para escuchar lo que dice tu cuerpo. Lo que has identificado puede ser el inicio de cambios significativos en tu bienestar.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    FATIGUE_MOTIVATION: {
        message: 'Reconocer cómo te sientes y cómo estás afrontando tu día a día es un paso fundamental hacia el bienestar. Tu percepción permite identificar áreas de cuidado y fortalece tu capacidad de adaptación.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para escuchar lo que dice tu cuerpo. Lo que has identificado puede ser el inicio de cambios significativos en tu bienestar.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    // Códigos alternativos del backend para instrumentos de fatiga (MFI-20)
    MFI20: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_FATIGA_GENERAL: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_FATIGA_FISICA: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_FATIGA_MENTAL: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_FATIGA_EMOCIONAL: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_DINAMISMO: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_MOTIVACION: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    MFI20_ACTIVIDAD_REDUCIDA: {
        message: 'Los niveles de fatiga laboral son fundamentales para comprender cómo las demandas del entorno están impactando tu energía, concentración y bienestar. Este ejercicio te permite identificar señales tempranas y áreas de cuidado.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para hacer una pausa consciente. Escuchar a tu cuerpo y mente es el primer paso para recuperar el equilibrio.',
        visual: 'stars',
        cta: 'Acepto',
        requiresDisclaimer: true,
    },
    // Clima Organizacional – ECO
    ECO: {
        message: 'Tu vínculo con la organización es único. Cada respuesta que diste refleja una parte de tu experiencia real, y eso tiene un valor enorme para construir un mejor lugar donde trabajar.',
        preResultText: 'Antes de ver tus resultados, recuerda: no hay respuestas correctas ni incorrectas. Solo tu percepción sincera.',
        visual: 'ripple',
        cta: 'Ver mis resultados',
    },
    // Riesgo Psicosocial
    INTRA_A: {
        message: 'Identificar los factores de riesgo en tu entorno laboral es un acto de valentía y autocuidado. Tu percepción honesta contribuye a construir ambientes de trabajo más saludables para todos.',
        preResultText: 'Antes de ver tus resultados, respira profundo. Lo que compartiste hoy puede generar cambios importantes.',
        visual: 'breathe',
        cta: 'Ver mis resultados',
    },
    INTRA_B: {
        message: 'Tu bienestar en el trabajo importa. Reconocer los factores que te afectan es el primer paso para mejorar tu experiencia laboral y la de quienes te rodean.',
        preResultText: 'Antes de ver tus resultados, respira profundo. Lo que compartiste hoy puede generar cambios importantes.',
        visual: 'breathe',
        cta: 'Ver mis resultados',
    },
    EXTRALABORAL: {
        message: 'Tu vida fuera del trabajo también forma parte de tu bienestar. Reconocer cómo el entorno extralaboral te afecta es clave para un equilibrio real.',
        preResultText: 'Antes de ver tus resultados, tómate un momento para ti.',
        visual: 'ripple',
        cta: 'Ver mis resultados',
    },
    ESTRES: {
        message: 'Nombrar el estrés es el primer paso para gestionarlo. Tu disposición a reflexionar sobre cómo te afecta habla de tu fortaleza y tu compromiso con tu bienestar.',
        preResultText: 'Antes de ver tus resultados, haz una respiración lenta y consciente.',
        visual: 'breathe',
        cta: 'Ver mis resultados',
    },
};

const INSTRUMENT_INSTRUCTIONS: Record<string, InstrumentInstructions> = {
    DASS21: {
        heading: 'Estado anímico',
        body: 'El DASS-21 es un cuestionario que busca comprender tu estado emocional y reconocer posibles síntomas relacionados con el estrés, la ansiedad o la depresión. Te invitamos a responder con sinceridad, ya que solo así nos permitirá entender cómo te sientes y orientarte de manera más efectiva.',
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
        heading: 'Calidad de sueño',
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
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_COGNITIVE: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_EMOTIONAL: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    FATIGUE_MOTIVATION: {
        heading: 'MFI – Fatiga Multidimensional',
        body: 'El MFI (Multidimensional Fatigue Inventory) es una herramienta de evaluación que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional. Tu participación honesta es fundamental, ya que permitirá reconocer posibles señales de desgaste y contribuir al diseño de estrategias orientadas a la promoción del bienestar y la salud en el trabajo.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    // MFI-20 – códigos del backend (principal y variantes por dimensión)
    MFI20: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_FATIGA_GENERAL: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_FATIGA_FISICA: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_FATIGA_MENTAL: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_FATIGA_EMOCIONAL: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_DINAMISMO: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_MOTIVACION: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
    },
    MFI20_ACTIVIDAD_REDUCIDA: {
        heading: 'MFI-20 (Inventario Multidimensional de Fatiga)',
        body: 'El MFI-20 es un instrumento que permite identificar y analizar los niveles de fatiga laboral desde una perspectiva multidimensional a través de 5 dimensiones: fatiga general, física, mental, reducción de motivación y reducción de actividad. Tu participación honesta es fundamental para reconocer posibles señales de desgaste y orientar estrategias de bienestar.',
        timeframe: 'A continuación, responde teniendo en cuenta la última semana (incluido hoy), seleccionando la opción que mejor describa tu estado en tu entorno laboral.',
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
    // Clima Organizacional – ECO
    ECO: {
        heading: 'Compromiso Organizacional',
        body: 'La ECO (Escala de Compromiso Organizacional) mide el grado de compromiso del trabajador con la organización en tres dimensiones: Afectivo (identificación emocional), de Continuidad (costo percibido de salida) y Normativo (sentido del deber). Basado en el modelo de Meyer y Allen.',
        timeframe: 'Selecciona la opción que mejor describa cómo te has sentido.',
    },
    // Riesgo Psicosocial – Batería Ministerio del Trabajo
    INTRA_A: {
        heading: 'Riesgo Psicosocial Intralaboral – Forma A',
        body: '',
        timeframe: 'Selecciona la opción que mejor describa cómo te has sentido.',
        instructions: [
            'Este cuestionario no te evalúa a ti como trabajador, sino que busca conocer tu opinión sobre algunos aspectos de tu trabajo.',
            'No hay respuestas buenas ni malas: Lo importante es que reflejen tu manera de pensar sobre tu trabajo.',
            'Lee cuidadosamente cada pregunta, luego piensa en cómo han sido las cosas en tu trabajo y selecciona la opción de respuesta que más se acerque a tu situación cotidiana.',
            'Si tiene duda sobre alguna pregunta, solicite mayor información al profesional encargado de la evaluación.',
        ],
    },
    INTRA_B: {
        heading: 'Riesgo Psicosocial Intralaboral – Forma B',
        body: '',
        timeframe: 'Selecciona la opción que mejor describa cómo te has sentido.',
        instructions: [
            'Este cuestionario no te evalúa a ti como trabajador, sino que busca conocer tu opinión sobre algunos aspectos de tu trabajo.',
            'No hay respuestas buenas ni malas: Lo importante es que reflejen tu manera de pensar sobre tu trabajo.',
            'Lee cuidadosamente cada pregunta, luego piensa en cómo han sido las cosas en tu trabajo y selecciona la opción de respuesta que más se acerque a tu situación cotidiana.',
            'Si tiene duda sobre alguna pregunta, solicite mayor información al profesional encargado de la evaluación.',
        ],
    },
    EXTRALABORAL: {
        heading: 'Factores de Riesgo Extralaboral',
        body: '',
        timeframe: 'Selecciona la opción que mejor describa tu situación fuera del trabajo.',
        instructions: [
            'Este cuestionario de factores psicosociales busca conocer tu opinión sobre algunos aspectos de tu vida familiar y personal.',
            'Responde con total sinceridad: Tus respuestas serán manejadas de forma absolutamente confidencial.',
            'Lee cuidadosamente cada pregunta y selecciona la opción de respuesta que mejor se ajuste a tu modo de pensar.',
            'Si tiene duda sobre alguna pregunta, solicite mayor información al profesional encargado de la evaluación.',
        ],
    },
    ESTRES: {
        heading: 'Síntomas de Estrés',
        body: '',
        timeframe: 'Selecciona la opción que mejor describa cómo te has sentido en el último mes.',
        instructions: [
            'Señale la casilla que indique la frecuencia con que se le han presentado los siguientes malestares en los últimos tres meses.',
        ],
    },
};

// ── Datos visuales / "vibe" por instrumento (modal de instrucciones) ─────────
export interface InstrumentVibeData {
    /** Emoji grande y temático */
    emoji: string;
    /** Etiqueta corta que resume el foco del instrumento */
    focus: string;
    /** Frase motivadora de 1 línea */
    tagline: string;
    /** Estadísticas rápidas: [ { label, value } ] — máx. 3 */
    stats: { label: string; value: string }[];
}

const INSTRUMENT_VIBE: Record<string, InstrumentVibeData> = {
    DASS21: {
        emoji: '🧠',
        focus: 'Estado anímico',
        tagline: 'Conocerte es el primer paso para cuidarte.',
        stats: [
            { label: 'Duración', value: '~5 min' },
            { label: 'Dimensiones', value: '3' },
            { label: 'Preguntas', value: '21' },
        ],
    },
    BAI: {
        emoji: '🌬️',
        focus: 'Ansiedad',
        tagline: 'Respirar es también un acto de valentía.',
        stats: [
            { label: 'Duración', value: '~4 min' },
            { label: 'Área', value: 'Ansiedad' },
            { label: 'Preguntas', value: '21' },
        ],
    },
    BDI: {
        emoji: '🌱',
        focus: 'Bienestar emocional',
        tagline: 'Escucharte es el inicio del cambio.',
        stats: [
            { label: 'Duración', value: '~5 min' },
            { label: 'Área', value: 'Depresión' },
            { label: 'Preguntas', value: '21' },
        ],
    },
    ICSP_VC: {
        emoji: '🌙',
        focus: 'Calidad de sueño',
        tagline: 'Un buen descanso transforma tu día.',
        stats: [
            { label: 'Duración', value: '~3 min' },
            { label: 'Subescalas', value: '7' },
            { label: 'Preguntas', value: '10' },
        ],
    },
    TMMS24: {
        emoji: '❤️',
        focus: 'Inteligencia emocional',
        tagline: 'Tus emociones son tu mayor fortaleza.',
        stats: [
            { label: 'Duración', value: '~6 min' },
            { label: 'Subescalas', value: '3' },
            { label: 'Preguntas', value: '24' },
        ],
    },
    GAD7: {
        emoji: '🌿',
        focus: 'Ansiedad generalizada',
        tagline: 'Identificar es avanzar hacia el equilibrio.',
        stats: [
            { label: 'Duración', value: '~2 min' },
            { label: 'Período', value: '2 semanas' },
            { label: 'Preguntas', value: '7' },
        ],
    },
    PHQ9: {
        emoji: '☀️',
        focus: 'Estado de ánimo',
        tagline: 'Tu bienestar merece atención y cuidado.',
        stats: [
            { label: 'Duración', value: '~3 min' },
            { label: 'Período', value: '2 semanas' },
            { label: 'Preguntas', value: '9' },
        ],
    },
    ISI: {
        emoji: '😴',
        focus: 'Calidad del sueño',
        tagline: 'Descansar bien es un derecho, no un lujo.',
        stats: [
            { label: 'Duración', value: '~3 min' },
            { label: 'Período', value: 'Último mes' },
            { label: 'Preguntas', value: '7' },
        ],
    },
    PSS4: {
        emoji: '🧘',
        focus: 'Estrés percibido',
        tagline: 'Medir el estrés es el primer paso para reducirlo.',
        stats: [
            { label: 'Duración', value: '~2 min' },
            { label: 'Período', value: 'Último mes' },
            { label: 'Preguntas', value: '4' },
        ],
    },
    PSS10: {
        emoji: '🧘',
        focus: 'Estrés percibido',
        tagline: 'Conocer tu nivel de estrés te da el control.',
        stats: [
            { label: 'Duración', value: '~3 min' },
            { label: 'Período', value: 'Último mes' },
            { label: 'Preguntas', value: '10' },
        ],
    },
    FATIGUE_ENERGY: { emoji: '⚡', focus: 'Energía física', tagline: 'Tu energía importa — escúchala.', stats: [{ label: 'Duración', value: '~2 min' }, { label: 'Área', value: 'Fatiga' }, { label: 'Período', value: 'Última semana' }] },
    FATIGUE_COGNITIVE: { emoji: '🔍', focus: 'Concentración', tagline: 'Un foco claro lleva a mejores resultados.', stats: [{ label: 'Duración', value: '~2 min' }, { label: 'Área', value: 'Fatiga' }, { label: 'Período', value: 'Última semana' }] },
    FATIGUE_EMOTIONAL: { emoji: '🫀', focus: 'Reserva emocional', tagline: 'Cuidar tus emociones es también rendimiento.', stats: [{ label: 'Duración', value: '~2 min' }, { label: 'Área', value: 'Fatiga' }, { label: 'Período', value: 'Última semana' }] },
    FATIGUE_MOTIVATION: { emoji: '🚀', focus: 'Motivación', tagline: 'La motivación se cultiva, no se fuerza.', stats: [{ label: 'Duración', value: '~2 min' }, { label: 'Área', value: 'Fatiga' }, { label: 'Período', value: 'Última semana' }] },
    // MFI-20 (Inventario Multidimensional de Fatiga) – código principal y variantes del backend
    MFI20: {
        emoji: '🔋',
        focus: 'Fatiga Multidimensional',
        tagline: 'Identifica y gestiona tu fatiga laboral.',
        stats: [
            { label: 'Duración', value: '~5 min' },
            { label: 'Dimensiones', value: '5' },
            { label: 'Preguntas', value: '20' },
        ],
    },
    MFI20_FATIGA_GENERAL: { emoji: '🔋', focus: 'Fatiga General', tagline: 'Reconocer el cansancio es el primer paso.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_FATIGA_FISICA: { emoji: '💪', focus: 'Fatiga Física', tagline: 'Tu cuerpo habla — aprende a escucharlo.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_FATIGA_MENTAL: { emoji: '🧠', focus: 'Fatiga Mental', tagline: 'La mente también necesita descanso.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_FATIGA_EMOCIONAL: { emoji: '🫀', focus: 'Fatiga Emocional', tagline: 'Cuidar tus emociones es también rendimiento.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_DINAMISMO: { emoji: '⚡', focus: 'Dinamismo', tagline: 'Tu energía importa — escúchala.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_MOTIVACION: { emoji: '🚀', focus: 'Motivación', tagline: 'La motivación se cultiva, no se fuerza.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    MFI20_ACTIVIDAD_REDUCIDA: { emoji: '📉', focus: 'Actividad Reducida', tagline: 'Identificar el límite es saber hasta dónde puedes llegar.', stats: [{ label: 'Duración', value: '~5 min' }, { label: 'Dimensiones', value: '5' }, { label: 'Preguntas', value: '20' }] },
    CLIMATE_LEADERSHIP: { emoji: '🏆', focus: 'Liderazgo', tagline: 'Un buen líder cambia todo el ambiente.', stats: [{ label: 'Duración', value: '~3 min' }, { label: 'Área', value: 'Clima' }, { label: 'Preguntas', value: '10' }] },
    CLIMATE_TEAMWORK: { emoji: '🤝', focus: 'Trabajo en equipo', tagline: 'Juntos siempre llegan más lejos.', stats: [{ label: 'Duración', value: '~3 min' }, { label: 'Área', value: 'Clima' }, { label: 'Preguntas', value: '10' }] },
    CLIMATE_COMMUNICATION: { emoji: '💬', focus: 'Comunicación', tagline: 'Comunicar bien es construir puentes.', stats: [{ label: 'Duración', value: '~3 min' }, { label: 'Área', value: 'Clima' }, { label: 'Preguntas', value: '10' }] },
    CLIMATE_RECOGNITION: { emoji: '⭐', focus: 'Reconocimiento', tagline: 'Ser valorado/a impulsa a dar lo mejor.', stats: [{ label: 'Duración', value: '~3 min' }, { label: 'Área', value: 'Clima' }, { label: 'Preguntas', value: '10' }] },
    ECO: {
        emoji: '🏢',
        focus: 'Compromiso Organizacional',
        tagline: 'Tu vínculo con la organización construye el futuro de todos.',
        stats: [
            { label: 'Duración', value: '~7 min' },
            { label: 'Dimensiones', value: '3' },
            { label: 'Preguntas', value: '18' },
        ],
    },
    PSYCHO_DEMANDS: { emoji: '⚖️', focus: 'Carga laboral', tagline: 'Identificar la carga es empezar a equilibrarla.', stats: [{ label: 'Duración', value: '~4 min' }, { label: 'Área', value: 'Psicosocial' }, { label: 'Período', value: 'Situación actual' }] },
    PSYCHO_CONTROL: { emoji: '🎛️', focus: 'Autonomía', tagline: 'Tener control hace la diferencia.', stats: [{ label: 'Duración', value: '~4 min' }, { label: 'Área', value: 'Psicosocial' }, { label: 'Período', value: 'Situación actual' }] },
    PSYCHO_SUPPORT: { emoji: '🫂', focus: 'Apoyo social', tagline: 'Apoyarse es fortaleza, no debilidad.', stats: [{ label: 'Duración', value: '~4 min' }, { label: 'Área', value: 'Psicosocial' }, { label: 'Período', value: 'Situación actual' }] },
    PSYCHO_REWARDS: { emoji: '🎁', focus: 'Recompensas', tagline: 'Tu esfuerzo merece ser reconocido.', stats: [{ label: 'Duración', value: '~4 min' }, { label: 'Área', value: 'Psicosocial' }, { label: 'Período', value: 'Situación actual' }] },
    // Riesgo Psicosocial – Batería real del backend
    INTRA_A: {
        emoji: '🏗️',
        focus: 'Riesgo Intralaboral – Forma A',
        tagline: 'Tu percepción transforma los entornos de trabajo.',
        stats: [
            { label: 'Duración', value: '60 minutos aprox' },
            { label: 'Preguntas', value: '123' },
        ],
    },
    INTRA_B: {
        emoji: '🔧',
        focus: 'Riesgo Intralaboral – Forma B',
        tagline: 'Tu opinión construye espacios de trabajo más sanos.',
        stats: [
            { label: 'Duración', value: '60 minutos aprox' },
            { label: 'Preguntas', value: '97' },
        ],
    },
    EXTRALABORAL: {
        emoji: '🏡',
        focus: 'Factores Extralaborales',
        tagline: 'El bienestar fuera del trabajo también cuenta.',
        stats: [
            { label: 'Duración', value: '10 minutos aprox' },
            { label: 'Preguntas', value: '31' },
        ],
    },
    ESTRES: {
        emoji: '🧘',
        focus: 'Síntomas de Estrés',
        tagline: 'Reconocer el estrés es el primer paso para gestionarlo.',
        stats: [
            { label: 'Duración', value: '10 minutos aprox' },
            { label: 'Preguntas', value: '31' },
        ],
    },
};

export interface InstrumentCard extends InstrumentDescriptor {
    icon: string;
    description: string;
    color: string;
    /** true si el usuario ya completó este instrumento en la evaluación más reciente */
    completed?: boolean;
    /** true si el instrumento aún no está disponible (requiere cumplir criterios de score) */
    locked?: boolean;
    /** Razón por la que está bloqueado, para mostrar al usuario */
    lockReason?: string;
    /** true si esta tarjeta es el consentimiento informado psicosocial (tarjeta sintética) */
    isConsentCard?: boolean;
    /** Estado del consentimiento psicosocial para mostrar el badge correcto */
    consentStatus?: 'accepted' | 'rejected';
    /** true si esta tarjeta corresponde a la Ficha de Datos Generales */
    isFichaCard?: boolean;
}

@Component({
    selector: 'app-instrument-selector',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
    /** Controls the wider psychosocial-specific informed consent modal */
    showPsychosocialConsentModal = false;
    /** Controls the rejection informational modal (shown after user chooses "No acepto") */
    showPsychosocialRejectionModal = false;
    /** Tracks whether the user has responded to the psychosocial informed consent */
    psychosocialConsentStatus: 'pending' | 'accepted' | 'rejected' = 'pending';
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
    /** Whether the user has checked the disclaimer checkbox in the closing modal */
    disclaimerAccepted = false;

    /** Controls the psychosocial legal disclaimer modal (shown after closing modal for psicosocial-risk) */
    showPsychosocialDisclaimerModal = false;
    /** Whether the user has accepted the psychosocial legal clause */
    psychosocialDisclaimerAccepted = false;
    /** Whether the collapsible clause text is expanded */
    psychosocialDisclaimerExpanded = false;
    /** ISO timestamp logged when user accepts the psychosocial clause */
    psychosocialDisclaimerAcceptedAt: string | null = null;
    /** Rich answers held until user dismisses closing modal */
    private pendingRichAnswers: RichAnswer[] | null = null;
    /** True when answers were already submitted by a specialized component (ICSP_VC, TMMS24, MFI20) — prevents double submit */
    private alreadySubmitted = false;

    /** First name of the current user for the welcome modal greeting */
    userName = '';
    /** Full name of the current user for the psychosocial consent form */
    userFullName = '';
    /** Document number of the current user for the psychosocial consent form */
    userDocumentNumber = '';
    /** Signed consent record returned by the API */
    psychosocialConsentRecord: PsychosocialConsentDto | null = null;
    /** True while the sign API call is in-flight (prevents double submission) */
    consentSigning = false;

    /** List of available psychologists fetched from the API */
    psychologists: PsychologistInfoDto[] = [];
    /** True while loading the psychologist list */
    loadingPsychologists = false;
    /** The psychologist selected by the user before signing */
    selectedPsychologist: PsychologistInfoDto | null = null;
    /** True if user tried to sign without selecting a psychologist */
    psychologistRequired = false;
    /** Search text for filtering the psychologist table */
    psychologistSearch = '';
    /** Current page (0-based) of the psychologist table */
    psychologistPage = 0;
    /** Items per page in the psychologist table */
    readonly psychologistPageSize = 5;

    get filteredPsychologists(): PsychologistInfoDto[] {
        const q = this.psychologistSearch.toLowerCase().trim();
        if (!q) return this.psychologists;
        return this.psychologists.filter(p =>
            p.fullName.toLowerCase().includes(q) ||
            (p.documentNumber ?? '').toLowerCase().includes(q) ||
            (p.graduateDegree ?? '').toLowerCase().includes(q) ||
            (p.professionalCard ?? '').toLowerCase().includes(q) ||
            (p.profession ?? '').toLowerCase().includes(q)
        );
    }

    get pagedPsychologists(): PsychologistInfoDto[] {
        const start = this.psychologistPage * this.psychologistPageSize;
        return this.filteredPsychologists.slice(start, start + this.psychologistPageSize);
    }

    get totalPsychologistPages(): number {
        return Math.ceil(this.filteredPsychologists.length / this.psychologistPageSize);
    }

    psychologistPrevPage(): void {
        if (this.psychologistPage > 0) this.psychologistPage--;
    }

    psychologistNextPage(): void {
        if (this.psychologistPage < this.totalPsychologistPages - 1) this.psychologistPage++;
    }

    onPsychologistSearchChange(): void {
        this.psychologistPage = 0;
    }

    /** Selects or deselects a psychologist (toggle behavior) */
    togglePsychologist(psych: PsychologistInfoDto): void {
        if (this.selectedPsychologist?.userID === psych.userID) {
            this.selectedPsychologist = null;
        } else {
            this.selectedPsychologist = psych;
            this.psychologistRequired = false;
        }
    }

    /** Progress info for displaying next available instruments */
    progressInfo: {
        completedCoreCount: number;
        nextUnlockCount: number;
        nextUnlockInstruments: string[];
        allCoreCompleted: boolean;
        baiUnlocked: boolean;
        bdiUnlocked: boolean;
    } | null = null;

    moduleDef = getAssessmentModuleDefinition('mental-health'); // sobrescrito en ngOnInit
    heroGradient = '';

    /** true si el usuario ya registró su Ficha de Datos Generales para el período actual */
    dataSheetCompleted = false;

    /** 'A' | 'B' según la Q21 de la ficha guardada; null si aún no hay ficha */
    psychosocialForm: 'A' | 'B' | null = null;

    private isSubmitting = false;

    /** Devuelve los datos visuales ("vibe") del instrumento pendiente */
    get currentVibe(): InstrumentVibeData | null {
        if (!this.pendingInstrument) return null;
        return INSTRUMENT_VIBE[this.pendingInstrument.code] ?? null;
    }

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService,
        private readonly hydration: AssessmentHydrationService,
        private readonly alert: AlertService,
        private readonly authService: AuthService,
        private readonly pendingClosing: PendingClosingService,
        private readonly consentService: PsychosocialConsentService,
        private readonly usersService: UsersService,
        private readonly dataSheetService: PsychosocialDataSheetService,
    ) { }

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
            error: () => { },
        });

        // Load full name and document number for psychosocial consent modal
        if (this.moduleId === 'psychosocial-risk') {
            this.usersService.getMyProfile().pipe(take(1)).subscribe({
                next: (profile) => {
                    if (profile.fullName) this.userFullName = profile.fullName;
                    this.userDocumentNumber = profile.documentNumber ?? '';
                },
                error: () => { },
            });
        }

        // ── Consumir closing pendiente de cuestionarios especializados ──
        // (ICSP_VC, TMMS24, MFI20 guardan las respuestas aquí antes de navegar de vuelta)
        const pending = this.pendingClosing.consume();
        if (pending) {
            this.showWelcomeModal = false;
            // Answers already submitted by the specialized component — do NOT re-submit
            this.pendingRichAnswers = null;
            this.alreadySubmitted = true;
            // selectedInstrument still needed for closing lookup
            this.selectedInstrument = {
                code: pending.instrumentCode,
                instrumentId: pending.instrumentId,
            } as any;
            const code = pending.instrumentCode.toUpperCase();
            const closing = INSTRUMENT_CLOSING[code]
                ?? (code.startsWith('MFI') ? INSTRUMENT_CLOSING['MFI20'] : null)
                ?? (code.startsWith('FATIGUE') ? INSTRUMENT_CLOSING['FATIGUE_ENERGY'] : null)
                ?? null;
            this.currentClosing = closing ?? {
                message: 'Gracias por tu tiempo y sinceridad. Tu bienestar es lo más importante.',
                visual: 'default',
                cta: 'Ver mis resultados',
            };
            this.disclaimerAccepted = false;
            this.showClosingModal = true;
            return; // no cargar instrumentos ni mostrar welcome modal
        }

        // Show welcome modal every time the module page loads
        this.showWelcomeModal = true;

        // For psychosocial-risk, fetch consent status from API before loading instruments
        if (this.moduleId === 'psychosocial-risk') {
            this.consentService.getStatus().pipe(take(1)).subscribe({
                next: (dto) => {
                    if (dto.hasResponded) {
                        this.psychosocialConsentStatus = dto.isAccepted ? 'accepted' : 'rejected';
                        this.psychosocialConsentRecord = dto;
                    }
                    this._loadInstruments();
                },
                error: () => this._loadInstruments(),
            });
        } else {
            this._loadInstruments();
        }
    }

    private _loadInstruments(): void {
        // Always hydrate from the backend first so that completed instruments are
        // correctly disabled even on a fresh session (state not yet in memory).
        // getCompletedInstrumentCodes() uses both the direct `instrumentCode` field
        // (for simple instruments like BAI, BDI) and dimensionScores (for sub-scale
        // instruments like DASS-21) so no instrument is ever missed.
        forkJoin({
            completedCodes: this.hydration.getCompletedInstrumentCodes(this.moduleId),
            descriptors: this.assessmentService.getModuleInstruments(this.moduleId),
            completedEvals: this.assessmentService.getMyCompletedEvaluationsWithResult(),
        }).subscribe({
            next: ({ completedCodes, descriptors, completedEvals }) => {
                // completedCodes contains both exact codes (e.g. "BAI") and sub-scale
                // codes (e.g. "DASS21_ANXIETY"). Match by exact code OR by prefix so
                // that DASS21 is marked completed when DASS21_* dimensions exist.
                const isCompleted = (code: string): boolean => {
                    const upper = code.toUpperCase();
                    return completedCodes.has(upper) ||
                        [...completedCodes].some(dc => dc.startsWith(upper + '_'));
                };

                // Extract DASS-21 dimension scores for score-based BAI/BDI activation
                const dass21Scores = this._extractDass21Scores(completedEvals);

                // Calculate progress info for UI (only for mental-health module)
                this.progressInfo = this.moduleId === 'mental-health' ? this._calculateProgressInfo(completedCodes, dass21Scores) : null;

                // Filter instruments based on progressive activation rules (only for mental-health module)
                const availableDescriptors = this.moduleId === 'mental-health'
                    ? this._getProgressivelyAvailableInstruments(descriptors, completedCodes, dass21Scores)
                    : descriptors; // Other modules show all instruments immediately

                this.instruments = availableDescriptors.map((d, i) => {
                    const meta = INSTRUMENT_META[d.code];
                    const isCurrentlyCompleted = isCompleted(d.code);
                    const lockInfo = this.moduleId === 'mental-health'
                        ? this._isInstrumentLocked(d.code, dass21Scores)
                        : { locked: false };

                    return {
                        ...d,
                        label: d.label || d.backendName || d.code,
                        description: d.backendDescription || meta?.description || '',
                        icon: meta?.icon ?? this.moduleDef.icon,
                        color: meta?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        completed: isCurrentlyCompleted,
                        locked: lockInfo.locked,
                        lockReason: lockInfo.lockReason,
                    };
                });

                // For psychosocial-risk, prepend the informed consent card and lock
                // all other instruments until the consent is accepted.
                // After injecting the consent card, also load + inject the ficha card.
                if (this.moduleId === 'psychosocial-risk') {
                    this._injectConsentCard();
                    this._loadAndInjectFichaCard();
                }
            },
            error: (e) => {
                this.loadError = true;
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar los instrumentos';
                this.alert.error(msg);
            },
        });
    }

    selectInstrument(card: InstrumentCard): void {
        // Ficha card navegates to the dedicated ficha form page
        if (card.isFichaCard) {
            this.router.navigate(['/psychosocial-risk/ficha']);
            return;
        }

        // Consent card is always tappable — routes to the right modal depending on status
        if (card.isConsentCard) {
            if (this.psychosocialConsentStatus === 'rejected') {
                this.showPsychosocialRejectionModal = true;
            } else {
                this.showPsychosocialConsentModal = true;
                // Load psychologists list if not yet loaded
                if (this.psychologists.length === 0 && !this.loadingPsychologists) {
                    this.loadingPsychologists = true;
                    this.consentService.getPsychologists().pipe(take(1)).subscribe({
                        next: (list) => { this.psychologists = list; this.loadingPsychologists = false; },
                        error: () => { this.loadingPsychologists = false; },
                    });
                }
            }
            return;
        }

        if (this.loadingQuestions || card.completed || card.locked) return;

        // Si el usuario ya firmó el consentimiento psicosocial, saltar el modal antiguo
        // de privacidad e ir directamente a las instrucciones del instrumento
        if (this.psychosocialConsentStatus === 'accepted') {
            this.pendingInstrument = card;
            this.currentInstructions =
                INSTRUMENT_INSTRUCTIONS[card.code] ?? {
                    heading: card.label,
                    body: card.description || 'Responde con sinceridad cada pregunta.',
                    timeframe: 'Selecciona la opción que mejor describa cómo te has sentido.',
                };
            this.showInstructionsModal = true;
            return;
        }

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

    /** Llamado cuando el usuario toca "Comenzar cuestionario" en el modal de instrucciones */
    onInstructionsStart(): void {
        this.showInstructionsModal = false;
        this.currentInstructions = null;
        const card = this.pendingInstrument;
        this.pendingInstrument = null;
        if (!card) return;

        // Marcar el inicio del timer ANTES de navegar/cargar el cuestionario.
        // Esto escribe el timestamp en localStorage solo cuando el usuario confirma que quiere comenzar.
        ExamTimerComponent.markStart(this._timerKeyForCode(card.code));

        this._loadInstrumentQuestions(card);
    }

    /** Llamado cuando el usuario cierra el modal de instrucciones sin comenzar */
    onInstructionsDismiss(): void {
        this.showInstructionsModal = false;
        this.currentInstructions = null;
        this.pendingInstrument = null;
    }

    private _loadInstrumentQuestions(card: InstrumentCard): void {
        // Check if this instrument needs special handling
        if (this._shouldUseSpecializedQuestionnaire(card.code)) {
            this._navigateToSpecializedQuestionnaire(card.code);
            return;
        }

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
        this.router.navigate(['/home']);
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
            ?? (code.startsWith('MFI') ? INSTRUMENT_CLOSING['MFI20'] : null)
            ?? (code.startsWith('FATIGUE') ? INSTRUMENT_CLOSING['FATIGUE_ENERGY'] : null)
            ?? (code.startsWith('CLIMATE') ? INSTRUMENT_CLOSING['CLIMATE_DEFAULT'] : null)
            ?? (code.startsWith('PSYCHO') ? INSTRUMENT_CLOSING['PSYCHO_DEFAULT'] : null)
            ?? null;

        this.currentClosing = closing ?? {
            message: 'Gracias por tu tiempo y sinceridad. Tu bienestar es lo más importante.',
            visual: 'default',
            cta: 'Ver mis resultados',
        };
        this.disclaimerAccepted = false;
        this.showClosingModal = true;
    }

    /** Llamado cuando el usuario toca "Ver mis resultados" en el modal de cierre */
    onClosingContinue(): void {
        this.showClosingModal = false;
        this.currentClosing = null;

        // If answers were already submitted by a specialized component, just navigate to results
        if (this.alreadySubmitted) {
            this.alreadySubmitted = false;
            const multiInstrumentModules: string[] = ['mental-health', 'psychosocial-risk'];
            if (multiInstrumentModules.includes(this.moduleId)) {
                this.router.navigate([`/${this.moduleId}/instrument-results`]);
            } else {
                // For single-instrument modules, navigate to results page so the module
                // is shown as completed (same behaviour as organizational-climate, etc.)
                this.router.navigate([`/${this.moduleId}/results`]);
            }
            return;
        }

        const richAnswers = this.pendingRichAnswers;
        this.pendingRichAnswers = null;
        if (!richAnswers) return;
        this._submitRichAnswers(richAnswers);
    }

    /** Called when "Continuar" is clicked in the closing modal for psychosocial-risk instruments */
    onClosingToDisclaimer(): void {
        this.showClosingModal = false;
        this.psychosocialDisclaimerAccepted = false;
        this.psychosocialDisclaimerExpanded = false;
        this.showPsychosocialDisclaimerModal = true;
    }

    /** Called when user accepts the psychosocial legal clause and clicks "Ver mis resultados" */
    onPsychosocialDisclaimerAccept(): void {
        this.psychosocialDisclaimerAcceptedAt = new Date().toISOString();
        console.log('[EmoCheck] Cláusula de exoneración de responsabilidad médica aceptada:', this.psychosocialDisclaimerAcceptedAt);
        this.showPsychosocialDisclaimerModal = false;
        this.psychosocialDisclaimerAccepted = false;
        this.currentClosing = null;
        this.onClosingContinue();
    }

    private _submitRichAnswers(richAnswers: RichAnswer[]): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        // Pass instrument code AND id so the backend can create a per-instrument
        // evaluation (avoids 409 when the module already has a completed evaluation).
        const instrumentCode = this.selectedInstrument?.code;
        const instrumentId = this.selectedInstrument?.instrumentId;

        this.assessmentService.submitRich(this.moduleId, richAnswers, instrumentCode, instrumentId).pipe(
            finalize(() => { this.isSubmitting = false; })
        ).subscribe({
            next: (result) => {
                this.assessmentState.mergeResult(result);
                // Limpiar el timer persistido del instrumento activo
                ExamTimerComponent.clearKey(this._timerKeyForCode(this.selectedInstrument?.code ?? ''));
                // Multi-instrument modules go to the instrument picker page so the
                // user can select which individual result to review.
                // Single-instrument modules go straight to the results page.
                const multiInstrumentModules: string[] = ['mental-health', 'psychosocial-risk'];
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
                    const multiInstrumentModules: string[] = ['mental-health', 'psychosocial-risk'];
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

    // ── Psychosocial Informed Consent ────────────────────────────────────────

    /** Builds the synthetic consent card and injects it as the first item in the grid */
    private _injectConsentCard(): void {
        const status = this.psychosocialConsentStatus;
        const consentCard: InstrumentCard = {
            code: 'PSYCHOSOCIAL_CONSENT',
            label: 'Consentimiento Informado',
            backendName: 'Consentimiento Informado',
            backendDescription:
                status === 'accepted'
                    ? 'Has aceptado participar en la Evaluación de Factores de Riesgo Psicosocial.'
                    : status === 'rejected'
                        ? 'No aceptaste participar. Los cuestionarios permanecen bloqueados.'
                        : 'Antes de comenzar debes leer y firmar el consentimiento informado para la evaluación de Riesgo Psicosocial.',
            instrumentId: 0,
            index: -1,
            questionCount: 0,
            icon: 'icons/Icon (44).svg',
            description:
                status === 'accepted'
                    ? 'Has aceptado participar en la Evaluación de Factores de Riesgo Psicosocial.'
                    : status === 'rejected'
                        ? 'No aceptaste participar. Los cuestionarios permanecen bloqueados.'
                        : 'Antes de comenzar debes leer y firmar el consentimiento informado para la evaluación de Riesgo Psicosocial.',
            color: '#374151',
            completed: status !== 'pending',
            locked: false,
            isConsentCard: true,
            consentStatus: status !== 'pending' ? status : undefined,
        };

        const consentAccepted = status === 'accepted';
        const instrumentsWithLock = (this.instruments ?? []).map(card => ({
            ...card,
            locked: !consentAccepted ? true : card.locked,
            lockReason: !consentAccepted ? 'Acepta el consentimiento informado para continuar' : card.lockReason,
        }));
        this.instruments = [consentCard, ...instrumentsWithLock];
    }

    /** Fetches the data sheet status for the current period and injects the data sheet card */
    private _loadAndInjectFichaCard(): void {
        const period = this.dataSheetService.getCurrentPeriod();
        this.dataSheetService.getDataSheet(period).pipe(take(1)).subscribe({
            next: (dataSheet) => {
                this.dataSheetCompleted = true;
                const forma = dataSheet?.psicosocialForma?.toUpperCase();
                this.psychosocialForm = forma === 'A' ? 'A' : forma === 'B' ? 'B' : null;
                this._injectFichaCard(true);
            },
            error: () => {
                this.dataSheetCompleted = false;
                this.psychosocialForm = null;
                this._injectFichaCard(false);
            },
        });
    }

    /** Inserts the General Data Sheet card at position 1 (after consent card) */
    private _injectFichaCard(dataSheetExists: boolean): void {
        if (!this.instruments) return;
        const consentAccepted = this.psychosocialConsentStatus === 'accepted';
        const dataSheetCard: InstrumentCard = {
            code: 'FICHA_GENERALES',
            label: 'Ficha de Datos Generales',
            backendName: 'Ficha de Datos Generales',
            backendDescription: dataSheetExists
                ? 'Ya registraste tu ficha de datos para este período. Puedes editarla si lo necesitas.'
                : 'Antes de responder los cuestionarios, completa tu ficha de datos personales y ocupacionales.',
            instrumentId: 0,
            index: -2,
            questionCount: 26,
            icon: 'icons/Icon (44).svg',
            description: dataSheetExists
                ? 'Ya registraste tu ficha de datos para este período. Puedes editarla si lo necesitas.'
                : 'Antes de responder los cuestionarios, completa tu ficha de datos personales y ocupacionales.',
            color: '#0891b2',
            completed: dataSheetExists,
            locked: !consentAccepted,
            lockReason: !consentAccepted ? 'Acepta el consentimiento informado para continuar' : undefined,
            isFichaCard: true,
        };

        // Find consent card index (position 0)
        const consentIdx = this.instruments.findIndex(c => c.isConsentCard);
        const insertAt = consentIdx >= 0 ? consentIdx + 1 : 0;

        // Remove existing data sheet card if present (re-injection case)
        // Also hide the INTRA form that does NOT correspond to the saved data sheet:
        //   psicosocialForma = 'A' → hide INTRA_B
        //   psicosocialForma = 'B' → hide INTRA_A
        //   null (no data sheet yet) → show both so the user sees what awaits
        const formToHide = this.psychosocialForm === 'A' ? 'INTRA_B'
            : this.psychosocialForm === 'B' ? 'INTRA_A'
                : null;

        const withoutDataSheet = this.instruments.filter(
            c => !c.isFichaCard && !(formToHide && c.code === formToHide)
        );

        // Lock real instrument cards if consent is accepted but data sheet is not done
        const updatedInstruments = withoutDataSheet.map((card, idx) => {
            if (card.isConsentCard) return card;
            if (!consentAccepted) return card; // already locked by _injectConsentCard
            if (!dataSheetExists) {
                return {
                    ...card,
                    locked: true,
                    lockReason: 'Completa la Ficha de Datos Generales para continuar',
                };
            }
            return card;
        });

        // Insert data sheet card after consent
        updatedInstruments.splice(insertAt, 0, dataSheetCard);
        this.instruments = updatedInstruments;
    }

    /** Refreshes the consent card state and the lock state of the other cards in-place */
    private _updateConsentCardState(): void {
        if (!this.instruments) return;
        const status = this.psychosocialConsentStatus;
        const consentAccepted = status === 'accepted';
        this.instruments = this.instruments.map(card => {
            if (card.isConsentCard) {
                return {
                    ...card,
                    completed: status !== 'pending',
                    consentStatus: status !== 'pending' ? status : undefined,
                    description:
                        status === 'accepted'
                            ? 'Has aceptado participar en la Evaluación de Factores de Riesgo Psicosocial.'
                            : 'No aceptaste participar. Los cuestionarios permanecen bloqueados.',
                    backendDescription:
                        status === 'accepted'
                            ? 'Has aceptado participar en la Evaluación de Factores de Riesgo Psicosocial.'
                            : 'No aceptaste participar. Los cuestionarios permanecen bloqueados.',
                };
            }
            if (card.isFichaCard) {
                return {
                    ...card,
                    locked: !consentAccepted,
                    lockReason: !consentAccepted ? 'Acepta el consentimiento informado para continuar' : undefined,
                };
            }
            // Real instrument cards: locked by consent or ficha status
            const lockedByConsent = !consentAccepted;
            const lockedByDataSheet = consentAccepted && !this.dataSheetCompleted;
            return {
                ...card,
                locked: lockedByConsent || lockedByDataSheet,
                lockReason: lockedByConsent
                    ? 'Acepta el consentimiento informado para continuar'
                    : lockedByDataSheet
                        ? 'Completa la Ficha de Datos Generales para continuar'
                        : undefined,
            };
        });
    }

    /** User tapped "Sí acepto" in the psychosocial consent modal */
    onPsychosocialConsentAccepted(): void {
        if (!this.selectedPsychologist) {
            this.psychologistRequired = true;
            return;
        }
        this.psychologistRequired = false;
        if (this.consentSigning) return;
        this.consentSigning = true;
        this.consentService.sign('ACCEPTED', this.selectedPsychologist.userID).pipe(take(1)).subscribe({
            next: (dto) => {
                this.consentSigning = false;
                this.psychosocialConsentStatus = 'accepted';
                this.psychosocialConsentRecord = dto;
                // Stay in modal to show confirmation + PDF download; modal closes via "Continuar"
                this._updateConsentCardState();
            },
            error: () => {
                this.consentSigning = false;
                this.alert.error('No fue posible registrar el consentimiento. Por favor intenta de nuevo.');
            },
        });
    }

    /** User tapped "No acepto" in the psychosocial consent modal */
    onPsychosocialConsentDenied(): void {
        if (!this.selectedPsychologist) {
            this.psychologistRequired = true;
            return;
        }
        this.psychologistRequired = false;
        if (this.consentSigning) return;
        this.consentSigning = true;
        this.consentService.sign('REJECTED', this.selectedPsychologist.userID).pipe(take(1)).subscribe({
            next: (dto) => {
                this.consentSigning = false;
                this.psychosocialConsentStatus = 'rejected';
                this.psychosocialConsentRecord = dto;
                this._updateConsentCardState();
                this._openRejectionModal();
            },
            error: (err) => {
                this.consentSigning = false;
                // 409 = already signed — fetch the existing record and show the modal
                if (err?.status === 409) {
                    this.consentService.getStatus().pipe(take(1)).subscribe({
                        next: (dto) => {
                            this.psychosocialConsentStatus = dto.isAccepted ? 'accepted' : 'rejected';
                            this.psychosocialConsentRecord = dto;
                            this._updateConsentCardState();
                            this._openRejectionModal();
                        },
                        error: () => this._openRejectionModal(),
                    });
                    return;
                }
                // Any other error: still open the rejection modal (informational text
                // is shown regardless; only the record details section will be absent)
                this.psychosocialConsentStatus = 'rejected';
                this._updateConsentCardState();
                this._openRejectionModal();
            },
        });
    }

    /** Opens the rejection informational modal and closes the consent modal */
    private _openRejectionModal(): void {
        this.showPsychosocialConsentModal = false;
        this.showPsychosocialRejectionModal = true;
    }

    /** Closes the psychosocial consent modal */
    closePsychosocialConsentModal(): void {
        this.showPsychosocialConsentModal = false;
    }

    /** Closes the rejection informational modal */
    closePsychosocialRejectionModal(): void {
        this.showPsychosocialRejectionModal = false;
    }

    /** Generates and downloads the signed consent as a PDF using jsPDF */
    downloadConsentPdf(): void {
        const dto = this.psychosocialConsentRecord;
        if (!dto) return;

        const isAccepted = dto.isAccepted;
        const decisionText = isAccepted
            ? 'SÍ ACEPTA participar voluntariamente en la evaluación'
            : 'NO ACEPTA participar en la evaluación';
        const signedDate = dto.signedAt
            ? new Date(dto.signedAt).toLocaleString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            })
            : new Date().toLocaleString('es-CO');

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentW = pageW - margin * 2;
        let y = 20;

        const addLine = (h: number = 6) => { y += h; };
        const checkPage = (needed: number = 10) => {
            if (y + needed > 270) { doc.addPage(); y = 20; }
        };

        // ── Header bar ──────────────────────────────────────────────────────
        doc.setFillColor(249, 115, 22); // orange-500
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text('PRIVACIDAD Y PROTECCIÓN DE DATOS', pageW / 2, 11, { align: 'center' });
        doc.setFontSize(13);
        doc.text('Consentimiento Informado', pageW / 2, 20, { align: 'center' });
        y = 38;

        // ── Helper: wrapped text block ───────────────────────────────────
        const addText = (text: string, size = 9, color = [30, 41, 59] as [number, number, number], bold = false) => {
            checkPage(10);
            doc.setFontSize(size);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text, contentW);
            for (const line of lines) {
                checkPage(6);
                doc.text(line, margin, y);
                y += 5.5;
            }
        };

        // ── Helper: inline mixed bold/normal text ─────────────────────────
        const printMixed = (segments: { text: string; bold?: boolean }[]) => {
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            const lineH = 5.5;
            let curX = margin;
            for (const seg of segments) {
                doc.setFont('helvetica', seg.bold ? 'bold' : 'normal');
                const tokens = seg.text.match(/\S+|\s+/g) ?? [];
                for (const token of tokens) {
                    const tw = doc.getTextWidth(token);
                    if (token.trim() === '') {
                        if (curX + tw <= margin + contentW) curX += tw;
                    } else {
                        if (curX + tw > margin + contentW && curX > margin) {
                            y += lineH;
                            checkPage(lineH);
                            curX = margin;
                        }
                        doc.text(token, curX, y);
                        curX += tw;
                    }
                }
            }
            y += lineH;
        };

        // ── Legal body ──────────────────────────────────────────────────────
        const name = dto.fullName || '_______________';
        const cedula = dto.documentNumber || '_______________';

        printMixed([
            { text: 'Yo, ' },
            { text: name, bold: true },
            { text: ', identificado/a con cédula de ciudadanía No. ' },
            { text: cedula, bold: true },
            { text: ', manifiesto de manera libre y voluntaria que he sido informado(a) que el objetivo de esta evaluación es identificar, evaluar y monitorear los factores de riesgo psicosocial (intralaborales, extralaborales y niveles de estrés), así mismo entiendo que esta información es fundamental para el diseño de actividades de promoción y prevención dentro del Sistema de Vigilancia Epidemiológica de la organización según Resolución 2646 de 2008 y 2764 de 2022.' },
        ]);
        addLine(3);

        addText(
            'Acepto participar en el diligenciamiento de la Batería de Instrumentos para la Evaluación de Factores de Riesgo ' +
            'Psicosocial (Forma A o B según corresponda), a través de la plataforma tecnológica Emocheck, entendiendo que mis ' +
            'datos serán incorporados a una base de datos con la finalidad exclusiva de gestión de salud ocupacional, manejando ' +
            'un estricto cumplimiento de la Ley 1581 de 2012 de protección de datos personales y seguridad de la información. ' +
            'Comprendo que los informes entregados al empleador serán de carácter global y estadístico, asegurando que no se ' +
            'pueda identificar mi identidad en los resultados grupales. Comprendo que el proceso incluye:'
        );
        addLine(2);

        const items = [
            'Ficha de datos generales (sociodemográficos y ocupacionales).',
            'Cuestionario de factores de riesgo psicosocial intralaboral A o B.',
            'Cuestionario de factores de riesgo psicosocial extralaboral.',
            'Cuestionario para la evaluación del estrés.',
        ];
        for (const item of items) {
            checkPage(7);
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'normal');
            doc.text(`• ${item}`, margin + 4, y);
            y += 5.5;
        }
        addLine(2);

        addText(
            'Comprendo que mi participación es voluntaria y que tengo derecho a no responder o retirarme del proceso en ' +
            'cualquier momento sin que esto afecte mi vínculo laboral. Dado el carácter confidencial de esta evaluación, ' +
            'esta información será incluida en la historia clínica de cada colaborador.'
        );
        addLine(6);

        // ── Decision section ─────────────────────────────────────────────────
        addText('Diligenciamiento del consentimiento informado', 9, [100, 116, 139], true);
        addLine(1);
        addText('Decisión marcada con (X):', 9, [30, 41, 59], true);
        addLine(4);

        checkPage(30);
        const boxY = y;
        const decColor: [number, number, number] = isAccepted ? [22, 101, 52] : [153, 27, 27];
        const decBg: [number, number, number] = isAccepted ? [220, 252, 231] : [254, 226, 226];
        doc.setFillColor(decBg[0], decBg[1], decBg[2]);
        doc.setDrawColor(decColor[0], decColor[1], decColor[2]);
        doc.roundedRect(margin, boxY, contentW, 14, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(decColor[0], decColor[1], decColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`[X]  ${decisionText}`, margin + 5, boxY + 9);
        y = boxY + 20;

        // ── Signature block ──────────────────────────────────────────────────
        addLine(4);
        checkPage(45);
        const psychDocExists = !!(dto.psychologistName && this.selectedPsychologist?.documentNumber);
        const psychLicExists = !!(dto.psychologistName && this.selectedPsychologist?.professionalCard);
        const psychProfessionExists = !!(dto.psychologistName && this.selectedPsychologist?.profession);
        const psychLicIssueDateExists = !!(dto.psychologistName && this.selectedPsychologist?.occupationalLicenseIssueDate);
        const sigRows = 4 + (dto.psychologistName ? 1 : 0) + (psychDocExists ? 1 : 0) + (psychLicExists ? 1 : 0) + (psychProfessionExists ? 1 : 0) + (psychLicIssueDateExists ? 1 : 0);
        const sigHeight = 8 + sigRows * 7 + 4;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        const sigY = y;
        doc.roundedRect(margin, sigY, contentW, sigHeight, 3, 3, 'FD');
        y = sigY + 8;

        const sigRow = (label: string, value: string) => {
            checkPage(8);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(label, margin + 5, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text(value, margin + 55, y);
            y += 7;
        };

        sigRow('Nombre completo:', dto.fullName || '');
        sigRow('Número de cédula:', dto.documentNumber || '');
        sigRow('Decisión:', decisionText);
        sigRow('Fecha y hora:', signedDate);
        if (dto.psychologistName) {
            sigRow('Psicólogo/a evaluador:', dto.psychologistName);
            if (this.selectedPsychologist?.documentNumber) {
                sigRow('Cédula del evaluador:', `${this.selectedPsychologist.documentType || 'CC'} ${this.selectedPsychologist.documentNumber}`);
            }
            if (this.selectedPsychologist?.professionalCard) {
                sigRow('No. Licencia salud ocup.:', this.selectedPsychologist.professionalCard);
            }
            if (this.selectedPsychologist?.profession) {
                sigRow('Profesión:', this.selectedPsychologist.profession);
            }
            if (this.selectedPsychologist?.occupationalLicenseIssueDate) {
                const d = new Date(this.selectedPsychologist.occupationalLicenseIssueDate);
                sigRow('Fecha exp. licencia:', d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }));
            }
        }
        sigRow('Firma:', 'Firmado digitalmente por el sistema EmoCheck');

        // ── Footer ───────────────────────────────────────────────────────────
        const footerY = doc.internal.pageSize.getHeight() - 12;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Documento generado por EmoCheck con fines de custodia legal — Versión ${dto.consentVersion || '1.0'}`,
            pageW / 2, footerY, { align: 'center' }
        );

        const filename = isAccepted
            ? `ConsentimientoAceptado_${(dto.fullName || 'usuario').replace(/\s+/g, '_')}.pdf`
            : `ConsentimientoRechazado_${(dto.fullName || 'usuario').replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
    }

    // ── End Psychosocial Informed Consent ─────────────────────────────────────

    /**
     * Formats an instrument code for display, adding hyphens where needed.
     * e.g. DASS21 → DASS-21, PHQ9 → PHQ-9, GAD7 → GAD-7
     */
    formatCode(code: string): string {
        const map: Record<string, string> = {
            DASS21: 'DASS-21',
            PHQ9: 'PHQ-9',
            GAD7: 'GAD-7',
            PSS4: 'PSS-4',
            PSS10: 'PSS-10',
            TMMS24: 'TMMS-24',
            ICSP_VC: 'ICSP-VC',
        };
        return map[code] ?? code;
    }

    /**
     * Extracts the DASS-21 anxiety and depression scores from the completed evaluations.
     * These are used to determine whether BAI and BDI should be unlocked.
     */
    private _extractDass21Scores(completedEvals: any[]): { anxietyScore: number; depressionScore: number } {
        let anxietyScore = 0;
        let depressionScore = 0;
        for (const ev of (completedEvals ?? [])) {
            for (const dim of (ev?.result?.dimensionScores ?? [])) {
                const code = String(dim?.instrumentCode ?? '').toUpperCase();
                if (code === 'DASS21_ANXIETY' || (code.startsWith('DASS') && code.includes('ANXIETY'))) {
                    anxietyScore = Math.max(anxietyScore, dim.score ?? 0);
                }
                if (code === 'DASS21_DEPRESSION' || (code.startsWith('DASS') && code.includes('DEPRESSION'))) {
                    depressionScore = Math.max(depressionScore, dim.score ?? 0);
                }
            }
        }
        return { anxietyScore, depressionScore };
    }

    /**
     * Calculates progress information for displaying to the user.
     * BAI/BDI unlock info is now shown based on DASS-21 score thresholds.
     */
    private _calculateProgressInfo(
        completedCodes: Set<string>,
        dass21Scores: { anxietyScore: number; depressionScore: number }
    ) {
        const coreInstruments = ['TMMS24', 'ICSP_VC', 'DASS21'];

        const completedCoreCount = coreInstruments.filter(code => {
            const upper = code.toUpperCase();
            return completedCodes.has(upper) ||
                [...completedCodes].some(dc => dc.startsWith(upper + '_'));
        }).length;

        const allCoreCompleted = completedCoreCount >= 3;
        const baiUnlocked = dass21Scores.anxietyScore >= 5;   // Ansiedad moderada, severa o extremadamente severa
        const bdiUnlocked = dass21Scores.depressionScore >= 7; // Depresión moderada, severa o extremadamente severa

        const nextUnlockInstruments: string[] = [];
        if (!baiUnlocked) nextUnlockInstruments.push('Inventario de Ansiedad de Beck (requiere resultados DASS-21)');
        if (!bdiUnlocked) nextUnlockInstruments.push('Inventario de Depresión de Beck (requiere resultados DASS-21)');

        return {
            completedCoreCount,
            nextUnlockCount: nextUnlockInstruments.length,
            nextUnlockInstruments,
            allCoreCompleted,
            baiUnlocked,
            bdiUnlocked,
        };
    }

    /**
     * Builds the list of instruments for the mental-health module.
     * All 5 instruments are always included, but BAI and BDI are marked as
     * `locked` when the DASS-21 scores do not meet the required thresholds.
     *
     * Unlock rules:
     *   - BAI: DASS-21 Ansiedad score >= 5  (moderada 5-7, severa 8-9, extremadamente severa 10-21)
     *   - BDI: DASS-21 Depresión score >= 7  (moderada 7-10, severa 11-13, extremadamente severa 14-21)
     */
    private _getProgressivelyAvailableInstruments(
        allDescriptors: InstrumentDescriptor[],
        completedCodes: Set<string>,
        dass21Scores: { anxietyScore: number; depressionScore: number }
    ): InstrumentDescriptor[] {
        const coreInstruments = ['TMMS24', 'ICSP_VC', 'DASS21'];
        const conditionalInstruments = ['BAI', 'BDI'];

        // Return core + conditional instruments (always show all 5)
        return allDescriptors.filter(descriptor => {
            const code = descriptor.code.toUpperCase();
            return coreInstruments.some(c => c === code) ||
                conditionalInstruments.some(c => c === code);
        });
    }

    /**
     * Returns whether a given instrument should be locked (visible but not clickable)
     * based on DASS-21 dimension scores.
     */
    private _isInstrumentLocked(
        code: string,
        dass21Scores: { anxietyScore: number; depressionScore: number }
    ): { locked: boolean; lockReason?: string } {
        const upper = code.toUpperCase();
        if (upper === 'BAI') {
            const locked = dass21Scores.anxietyScore < 5;
            return {
                locked,
                lockReason: locked ? 'Se activa cuando el DASS-21 detecta ansiedad moderada o superior' : undefined,
            };
        }
        if (upper === 'BDI') {
            const locked = dass21Scores.depressionScore < 7;
            return {
                locked,
                lockReason: locked ? 'Se activa cuando el DASS-21 detecta depresión moderada o superior' : undefined,
            };
        }
        return { locked: false };
    }

    private _shouldUseSpecializedQuestionnaire(instrumentCode: string): boolean {
        // Based on the document specifications, these instruments need specialized questionnaires
        const specializedInstruments = ['ICSP_VC', 'TMMS24', 'MFI20'];
        return specializedInstruments.includes(instrumentCode);
    }

    private _navigateToSpecializedQuestionnaire(instrumentCode: string): void {
        let route = '';

        switch (instrumentCode) {
            case 'ICSP_VC':
                route = '/mental-health/sleep-habits';
                break;
            case 'TMMS24':
                route = '/mental-health/emotional-intelligence';
                break;
            case 'MFI20':
                route = '/work-fatigue/mfi-20';
                break;
            default:
                console.warn(`No specialized route found for instrument: ${instrumentCode}`);
                return;
        }

        this.router.navigate([route]);
    }

    private _buildGradient(): string {
        // Usa el badgeGradient del módulo como base para el hero banner
        const g = this.moduleDef.theme.badgeGradient;
        // Si ya es un linear-gradient lo usamos directamente
        if (g?.startsWith('linear-gradient')) return g;
        return 'linear-gradient(135deg, #2B7FFF 0%, #155DFC 100%)';
    }

    /**
     * Returns the localStorage key used by ExamTimerComponent for a given instrument code.
     * Must match exactly what each questionnaire component passes as [storageKey].
     */
    private _timerKeyForCode(code: string): string {
        switch (code) {
            case 'ICSP_VC': return 'exam-timer:sleep-questionnaire';
            case 'TMMS24': return 'exam-timer:emotional-intelligence';
            case 'MFI20': return 'exam-timer:mfi-questionnaire';
            default: return `exam-timer:questionnaire:${code}`;
        }
    }
}
