import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { UserService } from 'app/core/user/user.service';
import { ActionPlanService, ActionPlanStepDto } from 'app/core/services/action-plan.service';

// â”€â”€ Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PlanSubSection {
    id: string;
    title: string;
    completed?: boolean;
    actionPlanStepID?: number;
}

export interface IntroRichSection {
    heading?: string;
    icon?: string;
    text?: string;
    bullets?: string[];
}

export interface IntroRich {
    title: string;
    subtitle?: string;
    body?: string;
    sections: IntroRichSection[];
    footer?: string;
}

export interface PlanSection {
    id: string;
    title: string;
    icon?: string;
    completed?: boolean;
    children?: PlanSubSection[];   // weekly sub-steps
    childExpanded?: boolean;        // sidebar expand state
    // API fields
    actionPlanStepID?: number;
    stepKey?: string;
    isCompleted?: boolean;
    completedAt?: string | null;
}

export interface PlanModule {
    id: string;
    title: string;
    color: string;
    gradient: string;
    icon: string;
    emoji: string;
    description: string;
    introTexts: string[];
    image: string;
    duration: string;
    topicsCount: number;
    resourcesCount: number;
    hasCertification: boolean;
    materials: string[];
    introRich?: IntroRich;           // structured rich intro (overrides introTexts when present)
    sections: PlanSection[];
    expanded?: boolean;
    disabled?: boolean;             // click does nothing
    // API fields
    moduleID?: number;
    moduleCode?: string;
    programCode?: string;   // for RP sub-programs (e.g. 'RP_PRO_ACTIVO'); moduleCode stays 'RIESGO_PSICOSOCIAL'
    progressPercent?: number;
}

// â”€â”€ Static visual config per moduleCode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ModuleVisualConfig = Omit<PlanModule, 'title' | 'sections' | 'moduleID' | 'moduleCode' | 'progressPercent'>;

const MODULE_VISUAL: Record<string, ModuleVisualConfig> = {
    SALUD_MENTAL: {
        id: 'mental-health',
        color: '#155DFC',
        gradient: 'linear-gradient(135deg, #155DFC 0%, #0040c8 100%)',
        icon: 'heroicons_outline:heart',
        emoji: 'ðŸ§ ',
        description: 'Herramientas para fortalecer tu bienestar emocional',
        introTexts: [
            'La salud mental es un proceso dinámico que integra cómo pensamos, sentimos y actuamos, influido por nuestros hábitos y relaciones. Factores como el sueño, la alimentación, el descanso, la motivación y la socialización son clave para el bienestar diario.',
            'Este módulo busca fortalecer el bienestar emocional, abordando temas como la ansiedad, la depresión, el estrés, el sueño y la inteligencia emocional, promoviendo mayor conciencia sobre su impacto en tu vida.',
            'Aquí encontrarás herramientas prácticas, como ejercicios de psicoeducación, técnicas de regulación emocional y estrategias motivacionales, para comprender cómo estás y aprender a actuar de forma más consciente ante lo que estás viviendo.',
        ],
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        duration: '12 semanas',
        topicsCount: 5,
        resourcesCount: 12,
        hasCertification: true,
        materials: ['Neuropausas', 'Apoyo Psicosocial', 'Calibración Emocional', 'Psicoeducación'],
        expanded: false,
    },
    FATIGA: {
        id: 'work-fatigue',
        color: '#00BBA7',
        gradient: 'linear-gradient(135deg, #00BBA7 0%, #009689 100%)',
        icon: 'heroicons_outline:bolt',
        emoji: '⚡',
        description: 'Reconoce y gestiona el agotamiento en el trabajo',
        introTexts: [
            'La fatiga laboral empezó a ser un concepto reconocido en los inicios del siglo XX en diferentes estudios que evidenciaban a trabajadores con estados de desgaste físico y mental asociado a las demandas prolongadas del trabajo. Se manifiesta a través de cansancio persistente, disminución de la concentración y afectación del rendimiento, impactando tanto el bienestar como la calidad de vida.',
            'Este módulo aborda la fatiga laboral desde sus causas, efectos y señales de alerta, promoviendo la comprensión de cómo influye en el funcionamiento diario y en el equilibrio personal.',
            'Aquí encontrarás herramientas prácticas como ejercicios de psicoeducación, técnicas de recuperación, regulación emocional y estrategias de autocuidado, orientadas a identificar la fatiga y desarrollar acciones concretas para gestionarla de manera consciente y sostenible.',
        ],
        image: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&q=80',
        duration: '12 semanas',
        topicsCount: 5,
        resourcesCount: 12,
        hasCertification: true,
        materials: ['Neuropausas', 'Apoyo Psicosocial', 'Calibración Emocional'],
        expanded: false,
    },
    RIESGO_PSICOSOCIAL: {
        id: 'psychosocial-risk',
        color: '#DC2626',
        gradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        icon: 'heroicons_outline:shield-exclamation',
        emoji: '⚠️',
        description: 'Identifica y gestiona los factores de riesgo en tu entorno laboral',
        introTexts: [],
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: Co-Gestores de Bienestar',
            subtitle: 'Un programa de 12 semanas basado en evidencia para la autogestión del riesgo psicosocial.',
            body: 'Este módulo ha sido diseñado para responder a los desafíos que enfrentas cada día: la toma de decisiones bajo presión, la gestión de cambios constantes, las conversaciones difíciles, la alta carga mental y la necesidad de un equilibrio real entre tu éxito profesional y tu vida personal.\n\nSer un Co-Gestor de Bienestar significa entender que el alto desempeño solo es posible cuando existe un equilibrio real.',
            sections: [
                {
                    heading: '¿Cómo funciona?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Cada semana desactivaremos una microcápsula, con recursos (videos animados, audios para relajarte, flyers con resúmenes).',
                        'Después de ver el video, el flyer o escuchar el audio, encontrarás un Reto Semanal para aplicar lo aprendido en tu día a día.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Aprenderás a:',
                    bullets: [
                        'Regular tu respuesta biológica al estrés para mantener el pensamiento estratégico.',
                        'Desarrollar perspectiva, entendiendo que los desafíos son eventos de gestión, no definiciones personales.',
                        'Expresar necesidades y negociar prioridades con asertividad y criterio.',
                        'Establecer límites inteligentes que protejan tu capacidad de ejecución y tu energía mental.',
                        'Fortalecer la colaboración y el reconocimiento mutuo con tus pares.',
                        'Implementar rituales de cierre para recuperar tu bienestar personal y llegar con presencia plena a tu hogar.',
                    ],
                },
            ],
        },
        image: 'https://images.unsplash.com/photo-1573496774426-fe3db3dd1731?auto=format&fit=crop&w=800&q=80',
        duration: '12 semanas',
        topicsCount: 5,
        resourcesCount: 10,
        hasCertification: true,
        materials: ['Psicoeducación', 'Apoyo Psicosocial', 'Estrategias de afrontamiento'],
        expanded: false,
    },
    CLIMA_ORGANIZACIONAL: {
        id: 'clima-org',
        color: '#7C3AED',
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
        icon: 'heroicons_outline:building-office-2',
        emoji: '🏢',
        description: 'Fortalece el ambiente y la cultura de tu organización',
        introTexts: [],
        introRich: {
            title: 'Bienvenido a Transformadores del Clima Laboral',
            subtitle: 'Un programa de 3 meses para construir un entorno de trabajo que te haga querer llegar los lunes.',
            body: '¿Alguna vez te has preguntado qué hace que un lunes sea motivador y no agotador? La respuesta es el Clima Laboral.\n\nEl clima laboral es el conjunto de percepciones, emociones y dinámicas que viven las personas en un equipo de trabajo. No es un lujo — es el factor que determina si las personas dan lo mejor de sí o simplemente dan lo justo para sobrevivir la jornada.\n\nUn buen clima laboral es tu mejor aliado: reduce el ausentismo, dispara la motivación y convierte cada interacción en una oportunidad de crecer juntos.',
            sections: [
                {
                    heading: '¿Qué encontrarás aquí?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Tres programas diseñados para abordar el clima desde diferentes ángulos: propósito, confianza y liderazgo.',
                        'Contenido práctico organizado por meses, con aprendizajes y retos aplicables desde el primer día.',
                        'Herramientas para construir equipos más cohesionados y entornos laborales más saludables.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Al finalizar este módulo podrás:',
                    bullets: [
                        'Conectar con el propósito de tu trabajo y el de tu equipo.',
                        'Construir relaciones de confianza genuina con tus compañeros y líderes.',
                        'Aplicar estrategias concretas de liderazgo que transformen el ambiente laboral.',
                    ],
                },
            ],
        },
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
        duration: '3 meses',
        topicsCount: 9,
        resourcesCount: 12,
        hasCertification: true,
        materials: ['Psicoeducación', 'Dinámicas de equipo', 'Estrategias de liderazgo'],
        expanded: false,
    },
};

/** introRich + title overrides injected at runtime onto the RIESGO_PSICOSOCIAL tile */
const RP_PROGRAM_VISUAL: Record<string, { title: string; introRich: { title: string; subtitle: string; body: string; sections: { heading: string; icon: string; text?: string; bullets: string[] }[] } }> = {
    RP_PRO_ACTIVO: {
        title: 'PRO-Activo de Bienestar',
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: PRO-Activo de Bienestar',
            subtitle: 'Un programa de 12 semanas basado en evidencia para la autogestión del riesgo psicosocial.',
            body: 'Este programa está diseñado para dotarte de herramientas prácticas que te permitan gestionar el estrés, fortalecer tu resiliencia y mantener un equilibrio saludable entre tu vida personal y laboral.',
            sections: [
                {
                    heading: '¿Cómo funciona?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Cada semana desactivaremos una microcápsula con recursos (videos animados, audios para relajarte, flyers con resúmenes).',
                        'Después de ver el video, el flyer o escuchar el audio, encontrarás un Reto Semanal para aplicar lo aprendido en tu día a día.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Aprenderás a:',
                    bullets: [
                        'Regular tu respuesta al estrés y mantener la calma bajo presión.',
                        'Cuestionar pensamientos automáticos y ver la realidad con más claridad.',
                        'Fortalecer tu identidad más allá del rol de trabajo.',
                        'Aplicar estrategias prácticas de organización y comunicación asertiva.',
                    ],
                },
            ],
        },
    },
    RP_CO_GESTORES: {
        title: 'Co-Gestores de Bienestar',
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: Co-Gestores de Bienestar',
            subtitle: 'Un programa de 12 semanas basado en evidencia para la autogestión del riesgo psicosocial.',
            body: 'Este módulo ha sido diseñado para responder a los desafíos que enfrentas cada día: la toma de decisiones bajo presión, la gestión de cambios constantes, las conversaciones difíciles, la alta carga mental y la necesidad de un equilibrio real entre tu éxito profesional y tu vida personal.\n\nSer un Co-Gestor de Bienestar significa entender que el alto desempeño solo es posible cuando existe un equilibrio real.',
            sections: [
                {
                    heading: '¿Cómo funciona?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Cada semana desactivaremos una microcápsula, con recursos (videos animados, audios para relajarte, flyers con resúmenes).',
                        'Después de ver el video, el flyer o escuchar el audio, encontrarás un Reto Semanal para aplicar lo aprendido en tu día a día.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Aprenderás a:',
                    bullets: [
                        'Regular tu respuesta biológica al estrés para mantener el pensamiento estratégico.',
                        'Desarrollar perspectiva, entendiendo que los desafíos son eventos de gestión, no definiciones personales.',
                        'Expresar necesidades y negociar prioridades con asertividad y criterio.',
                        'Establecer límites inteligentes que protejan tu capacidad de ejecución y tu energía mental.',
                        'Fortalecer la colaboración y el reconocimiento mutuo con tus pares.',
                        'Implementar rituales de cierre para recuperar tu bienestar personal y llegar con presencia plena a tu hogar.',
                    ],
                },
            ],
        },
    },
    RP_ARQUITECTOS: {
        title: 'Arquitectos de Bienestar',
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: Arquitectos de Bienestar',
            subtitle: 'Un programa de 12 semanas para líderes y jefaturas.',
            body: 'Como líder, tu bienestar impacta directamente el de tu equipo. Este programa te entrega herramientas de neurociencia aplicada, gestión estratégica y liderazgo consciente para sostenerte a ti mismo mientras sostienes a otros.',
            sections: [
                {
                    heading: '¿Cómo funciona?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Cada semana desactivaremos una microcápsula, con recursos (videos animados, audios para relajarte, flyers con resúmenes).',
                        'Después de ver el video, el flyer o escuchar el audio, encontrarás un Reto Semanal para aplicar lo aprendido en tu día a día.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Aprenderás a:',
                    bullets: [
                        'Comprender la neurobiología del liderazgo bajo presión.',
                        'Tomar decisiones estratégicas desde la claridad, no desde la urgencia.',
                        'Gestionar equipos con integridad y foco en resultados sostenibles.',
                        'Crear ecosistemas de trabajo equilibrados y de alto rendimiento.',
                    ],
                },
            ],
        },
    },
    RP_CULTURA: {
        title: 'Cultura de Bienestar',
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: Cultura de Bienestar',
            subtitle: 'Un programa de 12 semanas para directivos y alta dirección.',
            body: 'Como directivo, eres el arquitecto de la cultura organizacional. Este programa te da las herramientas para construir entornos de alto rendimiento sostenible, donde el bienestar y los resultados no se contraponen, sino que se potencian mutuamente.',
            sections: [
                {
                    heading: '¿Cómo funciona?',
                    icon: 'heroicons_outline:play-circle',
                    bullets: [
                        'Cada semana desactivaremos una microcápsula, con recursos (videos animados, audios para relajarte, flyers con resúmenes).',
                        'Después de ver el video, el flyer o escuchar el audio, encontrarás un Reto Semanal para aplicar lo aprendido en tu día a día.',
                    ],
                },
                {
                    heading: '¿Qué lograrás?',
                    icon: 'heroicons_outline:trophy',
                    text: 'Aprenderás a:',
                    bullets: [
                        'Diseñar entornos laborales que promuevan el bienestar y la productividad.',
                        'Liderar con inteligencia financiera y visión estratégica de largo plazo.',
                        'Construir equipos sinérgicos y culturas de reconocimiento.',
                        'Implementar sistemas de feedback que impulsen la excelencia.',
                    ],
                },
            ],
        },
    },
    RP_ECOSISTEMA: {
        title: 'Ecosistema Inclusivo',
        introRich: {
            title: 'Bienvenido a tu Ruta de aprendizaje: Ecosistema Inclusivo',
            subtitle: 'Un programa sobre diversidad, inclusión y bienestar.',
            body: 'Este programa está diseñado para construir entornos de trabajo donde todas las personas puedan desarrollarse plenamente, reconociendo la diversidad como una fortaleza y el cuidado mutuo como base del bienestar colectivo.',
            sections: [
                {
                    heading: '¿Qué encontrarás?',
                    icon: 'heroicons_outline:heart',
                    bullets: [
                        'Estrategias para crear espacios accesibles y adaptados a la diversidad.',
                        'Herramientas para fortalecer el cuidado emocional propio y de los demás.',
                        'Recursos para expresar autenticidad sin barreras en el entorno laboral.',
                        'Prácticas para integrar bienestar en el trabajo remoto o híbrido.',
                    ],
                },
            ],
        },
    },
};

const MODULE_TITLE: Record<string, string> = {
    SALUD_MENTAL: 'Salud Mental',
    FATIGA: 'Fatiga Laboral',
    RIESGO_PSICOSOCIAL: 'Riesgo Psicosocial',
    RP_PRO_ACTIVO: 'PRO-Activo de Bienestar',
    RP_CO_GESTORES: 'Co-Gestores de Bienestar',
    RP_ARQUITECTOS: 'Arquitectos de Bienestar',
    RP_CULTURA: 'Cultura de Bienestar',
    RP_ECOSISTEMA: 'Ecosistema Inclusivo',
    CLIMA_ORGANIZACIONAL: 'Clima Organizacional',
};

/** Prefix for section IDs per moduleCode — maps to existing HTML @if blocks */
const STEP_PREFIX: Record<string, string> = {
    SALUD_MENTAL: 'mh',
    FATIGA: 'fl',
    RIESGO_PSICOSOCIAL: 'rp',
    RP_PRO_ACTIVO: 'pa',
    RP_CO_GESTORES: 'rp',
    RP_ARQUITECTOS: 'lb',
    RP_CULTURA: 've',
    RP_ECOSISTEMA: 'ei',
    CLIMA_ORGANIZACIONAL: 'co',
};

/** Maps stepKey â†’ section id suffix */
const STEP_KEY_SUFFIX: Record<string, string> = {
    BIENVENIDA: 'bienvenida',
    APRENDE: 'aprende',
    CONECTA: 'conecta',
    ACTUA: 'actua',
    CIERRE: 'cierre',
    // Weekly steps (SALUD_MENTAL + RP programs)
    SEMANA_1: 's1',
    SEMANA_2: 's2',
    SEMANA_3: 's3',
    SEMANA_4: 's4',
    SEMANA_5: 's5',
    SEMANA_6: 's6',
    SEMANA_7: 's7',
    SEMANA_8: 's8',
    SEMANA_9: 's9',
    SEMANA_10: 's10',
    SEMANA_11: 's11',
    SEMANA_12: 's12',
    // Themes (RP_ECOSISTEMA)
    TEMA_1: 'h1',
    TEMA_2: 'h2',
    TEMA_3: 'h3',
    TEMA_4: 'h4',
};

type StaticSectionCfg = { id: string; title: string; children?: { id: string; title: string }[] };

/** Secciones estáticas por moduleCode — fallback cuando la API no tiene datos para este usuario */
const STATIC_SECTIONS: Record<string, StaticSectionCfg[]> = {
    SALUD_MENTAL: [
        { id: 'mh-bienvenida', title: 'Bienvenida' },
        { id: 'mh-s1', title: 'Semana #1: El universo del ánimo' },
        { id: 'mh-s2', title: 'Semana #2: Decodificación' },
        { id: 'mh-s3', title: 'Semana #3: El bucle del ánimo' },
        { id: 'mh-s4', title: 'Semana #4: Tres pasos para el descanso' },
        { id: 'mh-s5', title: 'Semana #5: P.A.C.O.' },
        { id: 'mh-s6', title: 'Semana #6: Descarga 180°' },
        { id: 'mh-s7', title: 'Semana #7: La habitación' },
        { id: 'mh-s8', title: 'Semana #8: Pirámide de logros' },
        { id: 'mh-s9', title: 'Semana #9: Y tú emoción habla ¿La escuchas?' },
        { id: 'mh-s10', title: 'Semana #10: Interruptores del sueño' },
        { id: 'mh-s11', title: 'Semana #11: Ruta hacia el buen dormir' },
        { id: 'mh-s12', title: 'Semana #12: La frecuencia de la ansiedad' },
        { id: 'mh-cierre', title: 'Cierre y certificado' },
    ],
    FATIGA: [
        { id: 'fl-bienvenida', title: 'Bienvenida' },
        {
            id: 'fl-aprende', title: 'Aprende', children: [
                { id: 'fl-aprende-s1', title: 'Semana 1' },
                { id: 'fl-aprende-s2', title: 'Semana 2' },
                { id: 'fl-aprende-s3', title: 'Semana 3' },
            ]
        },
        {
            id: 'fl-conecta', title: 'Conecta', children: [
                { id: 'fl-conecta-s1', title: 'Semana 4' },
                { id: 'fl-conecta-s2', title: 'Semana 5' },
                { id: 'fl-conecta-s3', title: 'Semana 6' },
            ]
        },
        {
            id: 'fl-actua', title: 'Actúa', children: [
                { id: 'fl-actua-s1', title: 'Semana 7' },
                { id: 'fl-actua-s2', title: 'Semana 8' },
                { id: 'fl-actua-s3', title: 'Semana 9' },
            ]
        },
        { id: 'fl-cierre', title: 'Cierre y certificado' },
    ],
    RIESGO_PSICOSOCIAL: [
        {
            id: 'rp-prog-pa', title: 'PRO-Activo de Bienestar', children: [
                { id: 'pa-bienvenida', title: 'Bienvenida' },
                { id: 'pa-s1', title: 'S1 · El Poder de la Calma' },
                { id: 'pa-s2', title: 'S2 · ¿Amenaza o Desafío?' },
                { id: 'pa-s3', title: 'S3 · Tú no eres tu trabajo' },
                { id: 'pa-s4', title: 'S4 · Mente Clara, Trabajo Seguro' },
                { id: 'pa-s5', title: 'S5 · Foco en lo Controlable' },
                { id: 'pa-s6', title: 'S6 · Tu Voz es el Motor' },
                { id: 'pa-s7', title: 'S7 · Gestión de Órdenes' },
                { id: 'pa-s8', title: 'S8 · El Poder del Feedback' },
                { id: 'pa-s9', title: 'S9 · Críticas con Resiliencia' },
                { id: 'pa-s10', title: 'S10 · Persona vs. Problema' },
                { id: 'pa-s11', title: 'S11 · El Apoyo Social' },
                { id: 'pa-s12', title: 'S12 · Mi Hogar, Mi Refugio' },
                { id: 'pa-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'rp-prog-co', title: 'Co-Gestores de Bienestar', children: [
                { id: 'rp-bienvenida', title: 'Bienvenida' },
                { id: 'rp-aprende-s1', title: 'S1 · Anclaje de Alto Rendimiento' },
                { id: 'rp-aprende-s2', title: 'S2 · Perspectiva Sistémica' },
                { id: 'rp-aprende-s3', title: 'S3 · Esencia vs. Rol' },
                { id: 'rp-aprende-s4', title: 'S4 · Foco de Control' },
                { id: 'rp-conecta-s1', title: 'S5 · Deep Work' },
                { id: 'rp-conecta-s2', title: 'S6 · Ingeniería de Prioridades' },
                { id: 'rp-conecta-s3', title: 'S7 · Sin Procrastinación' },
                { id: 'rp-conecta-s4', title: 'S8 · Sinergia en Agenda' },
                { id: 'rp-actua-s1', title: 'S9 · Resolución de Problemas' },
                { id: 'rp-actua-s2', title: 'S10 · Feedback para la Excelencia' },
                { id: 'rp-actua-s3', title: 'S11 · Negociación de Apoyos' },
                { id: 'rp-actua-s4', title: 'S12 · Desconexión de Alto Nivel' },
                { id: 'rp-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'rp-prog-lb', title: 'Arquitectos de Bienestar', children: [
                { id: 'lb-bienvenida', title: 'Bienvenida' },
                { id: 'lb-s1', title: 'S1 · Neurobiología del Mando' },
                { id: 'lb-s2', title: 'S2 · Perspectiva de Escenario' },
                { id: 'lb-s3', title: 'S3 · Integridad vs. Rol' },
                { id: 'lb-s4', title: 'S4 · Arquitectura de Decisiones' },
                { id: 'lb-s5', title: 'S5 · Matriz de Priorización' },
                { id: 'lb-s6', title: 'S6 · Blindaje del Enfoque' },
                { id: 'lb-s7', title: 'S7 · Gestión de la Ejecución' },
                { id: 'lb-s8', title: 'S8 · Sinergia Grupal' },
                { id: 'lb-s9', title: 'S9 · Delegación Facultativa' },
                { id: 'lb-s10', title: 'S10 · Algoritmos de Resolución' },
                { id: 'lb-s11', title: 'S11 · Feedback de Alto Rendimiento' },
                { id: 'lb-s12', title: 'S12 · Ecosistemas en Equilibrio' },
                { id: 'lb-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'rp-prog-ve', title: 'Cultura de Bienestar', children: [
                { id: 've-bienvenida', title: 'Bienvenida' },
                { id: 've-s1', title: 'S1 · Bio-Recarga' },
                { id: 've-s2', title: 'S2 · Zona de Enfoque' },
                { id: 've-s3', title: 'S3 · Pausas Cognitivas' },
                { id: 've-s4', title: 'S4 · Brújula de Prioridades' },
                { id: 've-s5', title: 'S5 · Inteligencia Financiera' },
                { id: 've-s6', title: 'S6 · Sinergia de Equipo' },
                { id: 've-s7', title: 'S7 · Maestría en el Cambio' },
                { id: 've-s8', title: 'S8 · Algoritmos de Solución' },
                { id: 've-s9', title: 'S9 · Tu Voz es el Motor' },
                { id: 've-s10', title: 'S10 · Escudo del Reconocimiento' },
                { id: 've-s11', title: 'S11 · Feedback Inteligente' },
                { id: 've-s12', title: 'S12 · Mi Hogar, Mi Fortaleza' },
                { id: 've-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'rp-prog-ei', title: 'Ecosistema Inclusivo', children: [
                { id: 'ei-bienvenida', title: 'Bienvenida' },
                { id: 'ei-h1', title: 'Espacios a tu Medida' },
                { id: 'ei-h2', title: 'Corazón del Cuidador' },
                { id: 'ei-h3', title: 'Autenticidad sin Barreras' },
                { id: 'ei-h4', title: 'Tu Hogar, Tu Trabajo' },
                { id: 'ei-cierre', title: 'Cierre' },
            ]
        },
    ],
    CLIMA_ORGANIZACIONAL: [
        {
            id: 'co-prog-vp', title: 'Vida y Trabajo con Propósito', children: [
                { id: 'co-vp-bienvenida', title: 'Bienvenida' },
                { id: 'co-vp-m1', title: 'Mes 1 · El arte de conectar con el propósito' },
                { id: 'co-vp-m2', title: 'Mes 2 · El Valor de la Reciprocidad' },
                { id: 'co-vp-m3', title: 'Mes 3 · La Ruta de mi Futuro' },
                { id: 'co-vp-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'co-prog-ct', title: 'Reconstruyendo el Puente de la Confianza', children: [
                { id: 'co-ct-bienvenida', title: 'Bienvenida' },
                { id: 'co-ct-m1', title: 'Mes 1 · Alivio y Validación' },
                { id: 'co-ct-m2', title: 'Mes 2 · Liderazgo de Servicio y Empatía' },
                { id: 'co-ct-m3', title: 'Mes 3 · Propósito y Futuro' },
                { id: 'co-ct-cierre', title: 'Cierre y certificado' },
            ]
        },
        {
            id: 'co-prog-at', title: 'Arquitectos de Confianza: Liderazgo que Transforma', children: [
                { id: 'co-at-bienvenida', title: 'Bienvenida' },
                { id: 'co-at-m1', title: 'Mes 1 · Autoliderazgo y Credibilidad' },
                { id: 'co-at-m2', title: 'Mes 2 · Seguridad Psicológica y Comunicación' },
                { id: 'co-at-m3', title: 'Mes 3 · Reconocimiento y Propósito' },
                { id: 'co-at-cierre', title: 'Cierre y certificado' },
            ]
        },
    ],
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@Component({
    selector: 'app-my-plan',
    standalone: true,
    imports: [CommonModule, DatePipe, RouterModule, MatIconModule, MatButtonModule, BackgroundCirclesComponent],
    templateUrl: './my-plan.component.html',
    styleUrls: ['./my-plan.component.scss'],
})
export class MyPlanComponent implements OnInit {
    private readonly _userService = inject(UserService);
    private readonly _actionPlanSvc = inject(ActionPlanService);

    // â”€â”€ View state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    view = signal<'intro' | 'module-intro' | 'module'>('intro');
    activeModuleId = signal<string>('');
    activeSectionId = signal<string>('');
    loading = signal<boolean>(false);

    // ── Week tab & slider ────────────────────────────────────────────────────────────────────
    activeTab = signal<'aprende' | 'conecta' | 'actua'>('aprende');
    sliderIndex = signal<number>(0);

    readonly MH_WEEK_IMAGES: Record<string, string[]> = {
        'mh-s1': [
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I01_E.ANIMO_CONOCIMIENTO_ANSIEDAD+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I01_E.ANIMO_CONOCIMIENTO_ANSIEDAD+02.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I02_E.ANIMO_CONOCIMIENTO_DEPRESION+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I02_E.ANIMO_CONOCIMIENTO_DEPRESION+02.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I03_E.ANIMO_CONOCIMIENTO_ESTRES+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I03_E.ANIMO_CONOCIMIENTO_ESTRES+02.png',
        ],
    };

    selectTab(tab: 'aprende' | 'conecta' | 'actua'): void {
        this.activeTab.set(tab);
        if (tab === 'conecta') this.sliderIndex.set(0);
    }

    sliderPrev(): void {
        const imgs = this.activeSlideImages();
        if (!imgs.length) return;
        this.sliderIndex.set((this.sliderIndex() - 1 + imgs.length) % imgs.length);
    }

    sliderNext(): void {
        const imgs = this.activeSlideImages();
        if (!imgs.length) return;
        this.sliderIndex.set((this.sliderIndex() + 1) % imgs.length);
    }

    readonly activeSlideImages = computed(() => this.MH_WEEK_IMAGES[this.activeSectionId()] ?? []);

    // â”€â”€ Navigation signals (from API step detail) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    activeStepPrevID = signal<number | null>(null);
    activeStepNextID = signal<number | null>(null);

    // â”€â”€ Certificate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    userName = signal<string>('Nombre del usuario');
    today = new Date();
    showCertificate = signal<boolean>(false);

    // â”€â”€ Modules (populated from API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    modules: PlanModule[] = [];

    // â”€â”€ Lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ngOnInit(): void {
        this._userService.user$.subscribe(u => {
            if (u?.name) this.userName.set(u.name);
        });
        this.loadModules().subscribe({ error: () => this.loading.set(false) });
    }

    // â”€â”€ API loaders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private loadModules() {
        // Pre-poblar módulos conocidos visualmente (sin pantalla en blanco)
        this.modules = Object.entries(MODULE_VISUAL).map(([code, visual]) => ({
            ...visual,
            title: MODULE_TITLE[code] ?? code,
            moduleCode: code,
            moduleID: undefined,
            progressPercent: 0,
            sections: [],
            expanded: false,
        }));

        // Obtener moduleIDs, títulos y progreso reales desde la API
        this.loading.set(true);
        return this._actionPlanSvc.getModules().pipe(
            tap(dtos => {
                dtos.forEach(dto => {
                    if (dto.moduleCode?.startsWith('RP_')) {
                        // RP sub-programs map to the single RIESGO_PSICOSOCIAL tile
                        const rpTile = this.modules.find(
                            m => m.moduleCode === 'RIESGO_PSICOSOCIAL' || m.moduleCode?.startsWith('RP_')
                        );
                        if (rpTile && !rpTile.moduleID) {
                            rpTile.moduleID = dto.moduleID;
                            rpTile.progressPercent = dto.progressPercent;
                            rpTile.programCode = dto.moduleCode; // specific sub-program
                            // moduleCode stays 'RIESGO_PSICOSOCIAL' so _applyStaticSections shows all 5 programs
                            const prog = RP_PROGRAM_VISUAL[dto.moduleCode];
                            if (prog) {
                                rpTile.introRich = prog.introRich as any;
                            }
                        }
                    } else {
                        const mod = this.modules.find(m => m.moduleCode === dto.moduleCode);
                        if (mod) {
                            mod.moduleID = dto.moduleID;
                            mod.title = dto.moduleName;
                            mod.progressPercent = dto.progressPercent;
                        }
                    }
                });
                // Desplegar y activar el primer módulo con moduleID reconocido
                // Solo en carga inicial (activeModuleId vacío) — no sobreescribir si el usuario ya eligió un módulo
                const currentId = this.activeModuleId();
                if (currentId) {
                    // Restaurar expanded en el módulo activo (fue reconstruido con expanded: false)
                    const active = this.modules.find(m => m.id === currentId);
                    if (active) active.expanded = true;
                } else {
                    const first = this.modules.find(m => m.moduleID !== undefined);
                    if (first) {
                        first.expanded = true;
                        this.activeModuleId.set(first.id);
                    }
                }
                this.loading.set(false);
            })
        );
    }

    private loadSteps(module: PlanModule): void {
        if (!module.moduleID) {
            this._applyStaticSections(module);
            return;
        }
        // RP: load full 5-program structure in sidebar, then overlay API completion data
        if (module.moduleCode === 'RIESGO_PSICOSOCIAL' && module.programCode) {
            this._applyStaticSections(module);
            this._actionPlanSvc.getSteps(module.moduleID).subscribe({
                next: (steps) => this._overlayRpSteps(module, steps),
                error: () => { },
            });
            return;
        }
        this._actionPlanSvc.getSteps(module.moduleID).subscribe({
            next: (steps) => this._applySteps(module, steps),
            error: () => this._applyStaticSections(module),
        });
    }

    private _applySteps(module: PlanModule, steps: ActionPlanStepDto[]): void {
        const code = module.moduleCode ?? '';
        const prefix = STEP_PREFIX[code] ?? module.id.substring(0, 2);
        module.sections = steps.map(s => ({
            id: `${prefix}-${STEP_KEY_SUFFIX[s.stepKey] ?? s.stepKey.toLowerCase()}`,
            title: s.stepKey === 'CIERRE' ? 'Cierre y certificado' : s.title,
            actionPlanStepID: s.actionPlanStepID,
            stepKey: s.stepKey,
            isCompleted: s.isCompleted,
            completedAt: s.completedAt,
            completed: s.isCompleted,
        }));
        module.hasCertification = steps.some(s => s.hasCertification);
        if (module.sections.length > 0) {
            const firstIncompleteIdx = module.sections.findIndex(s => !s.isCompleted);
            const startIdx = firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0;
            this.activeSectionId.set(module.sections[startIdx].id);
            this.setNavSignals(module, startIdx);
        }
    }

    private _applyStaticSections(module: PlanModule): void {
        const code = module.moduleCode ?? '';
        module.sections = (STATIC_SECTIONS[code] ?? []).map(s => ({
            ...s,
            childExpanded: false,
            children: s.children ? s.children.map(c => ({ ...c })) : undefined,
        }));
        if (module.sections.length > 0) {
            const flatIds = this._flatStepsForModule(module);
            const firstId = flatIds[0] ?? module.sections[0].id;
            this.activeSectionId.set(firstId);
            this._expandParentSection(module, firstId);
            // Si el primer paso es una sección directa (ej. Bienvenida),
            // auto-expandir el primer acordeón para que no queden todos cerrados
            if (!module.sections.some(s => s.children?.some(c => c.id === firstId))) {
                const firstParent = module.sections.find(s => s.children && s.children.length > 0);
                if (firstParent) firstParent.childExpanded = true;
            }
            this.setNavSignals(module, 0);
        }
    }

    /** Overlay API completion data onto the user's enrolled RP sub-program children */
    private _overlayRpSteps(module: PlanModule, steps: ActionPlanStepDto[]): void {
        const prefix = STEP_PREFIX[module.programCode ?? ''] ?? 'rp';
        // Build map: section-id → step dto
        const stepById = new Map<string, ActionPlanStepDto>();
        steps.forEach(s => {
            const id = `${prefix}-${STEP_KEY_SUFFIX[s.stepKey] ?? s.stepKey.toLowerCase()}`;
            stepById.set(id, s);
        });
        // Find first incomplete child for navigation
        let firstIncompleteId: string | undefined;
        module.sections.forEach(prog => {
            if (!prog.children) return;
            prog.children.forEach(child => {
                const step = stepById.get(child.id);
                if (step) {
                    child.completed = step.isCompleted;
                    child.actionPlanStepID = step.actionPlanStepID;
                    if (!step.isCompleted && !firstIncompleteId) firstIncompleteId = child.id;
                }
            });
        });
        module.hasCertification = steps.some(s => s.hasCertification);
        const targetId = firstIncompleteId ?? this._flatStepsForModule(module)[0];
        if (targetId) {
            this.activeSectionId.set(targetId);
            this._expandParentSection(module, targetId);
            const flatIds = this._flatStepsForModule(module);
            this.setNavSignals(module, Math.max(0, flatIds.indexOf(targetId)));
        }
    }

    /**
     * Returns the flat step list to use for Prev/Next navigation.
     * For RP modules: scopes to whichever sub-program section contains the current active step,
     * so navigating inside Co-Gestores doesn't bleed into PRO-Activo.
     */
    private _flatStepsForNavigation(m: PlanModule): string[] {
        if (m.moduleCode === 'RIESGO_PSICOSOCIAL') {
            const activeId = this.activeSectionId();
            const parentSection = m.sections.find(s => s.children?.some(c => c.id === activeId));
            if (parentSection?.children) {
                return parentSection.children.map(c => c.id);
            }
        }
        return this._flatStepsForModule(m);
    }

    private setNavSignals(module: PlanModule, idx: number): void {
        const total = this._flatStepsForNavigation(module).length;
        this.activeStepPrevID.set(idx > 0 ? idx : null);
        this.activeStepNextID.set(idx < total - 1 ? idx + 1 : null);
    }

    // â”€â”€ Module navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    openModule(module: PlanModule): void {
        if (module.disabled) return;  // Clima Organizacional: no hacer nada
        const moduleId = module.id;
        this.activeModuleId.set(moduleId);
        module.expanded = true;
        this.view.set('module-intro');

        if (module.moduleID) {
            // moduleID ya disponible — cargar steps directamente con IDs reales
            this.loadSteps(module);
        } else {
            // moduleID aún no llegó — esperar la API de módulos, luego cargar steps
            // NOTA: loadModules() reconstruye this.modules, hay que resolver la ref fresca
            const moduleId = module.id;
            this.loadModules().pipe(
                switchMap(() => {
                    const fresh = this.modules.find(m => m.id === moduleId);
                    if (fresh?.moduleID) {
                        return this._actionPlanSvc.getSteps(fresh.moduleID).pipe(
                            map(steps => ({ fresh, steps }))
                        );
                    }
                    return of({ fresh: fresh ?? module, steps: null });
                })
            ).subscribe({
                next: ({ fresh, steps }) => {
                    if (!steps || fresh.moduleCode === 'SALUD_MENTAL') { this._applyStaticSections(fresh); return; }
                    if (fresh.moduleCode === 'RIESGO_PSICOSOCIAL' && fresh.programCode) {
                        this._applyStaticSections(fresh);
                        this._overlayRpSteps(fresh, steps);
                        return;
                    }
                    this._applySteps(fresh, steps);
                },
                error: () => {
                    const fresh = this.modules.find(m => m.id === moduleId) ?? module;
                    this._applyStaticSections(fresh);
                },
            });
        }
    }

    continueModule(): void {
        const m = this.activeModule;
        if (m && m.sections.length > 0) {
            // Use flat steps (resolves children) to validate the active ID
            const flatIds = this._flatStepsForModule(m);
            if (!flatIds.includes(this.activeSectionId())) {
                const firstId = flatIds[0] ?? m.sections[0].id;
                this.activeSectionId.set(firstId);
                this._expandParentSection(m, firstId);
                this.setNavSignals(m, 0);
            }
        }
        this.view.set('module');
    }

    backToIntro(): void {
        if (this.view() === 'module') {
            this.view.set('module-intro');
        } else {
            this.view.set('intro');
        }
    }

    toggleModule(module: PlanModule): void {
        module.expanded = !module.expanded;
        if (module.expanded && module.sections.length === 0) {
            this.loadSteps(module);
        }
    }

    selectSection(module: PlanModule, section: PlanSection): void {
        this.activeModuleId.set(module.id);
        this.activeTab.set('aprende');
        this.sliderIndex.set(0);
        if (!module.expanded) module.expanded = true;
        if (section.children && section.children.length > 0) {
            // Toggle expand and select first child on open
            const wasExpanded = section.childExpanded;
            module.sections.forEach(s => { if (s !== section) s.childExpanded = false; });
            section.childExpanded = !wasExpanded;
            if (section.childExpanded && section.children[0]) {
                this.activeSectionId.set(section.children[0].id);
            }
        } else {
            module.sections.forEach(s => { s.childExpanded = false; });
            this.activeSectionId.set(section.id);
        }
        const navIds = this._flatStepsForNavigation(module);
        this.setNavSignals(module, Math.max(0, navIds.indexOf(this.activeSectionId())));
    }

    selectSubSection(module: PlanModule, weekId: string): void {
        this.activeModuleId.set(module.id);
        this.activeTab.set('aprende');
        this.sliderIndex.set(0);
        this.activeSectionId.set(weekId);
        const navIds = this._flatStepsForNavigation(module);
        this.setNavSignals(module, Math.max(0, navIds.indexOf(weekId)));
    }

    isSectionOrChildActive(section: PlanSection): boolean {
        if (this.activeSectionId() === section.id) return true;
        return section.children?.some(c => c.id === this.activeSectionId()) ?? false;
    }

    navigateSection(direction: 'prev' | 'next'): void {
        const m = this.activeModule;
        if (!m || m.sections.length === 0) return;

        const navIds = this._flatStepsForNavigation(m);
        let idx = navIds.indexOf(this.activeSectionId());
        if (idx === -1) { idx = 0; }

        if (direction === 'next') {
            const nextIdx = idx + 1;
            if (nextIdx >= navIds.length) return;

            // Marcar completado INMEDIATAMENTE en local (sin esperar API)
            this._markStepComplete(m, navIds[idx]);
            m.progressPercent = this.calcProgress(m);

            // Sync con API — solo si el paso tiene actionPlanStepID (solo programa inscrito)
            const parentSection = m.sections.find(s =>
                s.id === navIds[idx] || s.children?.some(c => c.id === navIds[idx])
            );
            const activeChild = parentSection?.children?.find(c => c.id === navIds[idx]);
            const stepIdToComplete = activeChild?.actionPlanStepID ?? parentSection?.actionPlanStepID;
            if (m.moduleID && stepIdToComplete) {
                this._actionPlanSvc.completeStep(m.moduleID, stepIdToComplete).subscribe({
                    next: (result) => { m.progressPercent = result.moduleProgressPercent; },
                });
            }

            const nextId = navIds[nextIdx];
            this.activeSectionId.set(nextId);
            this.activeTab.set('aprende');
            this.sliderIndex.set(0);
            this._expandParentSection(m, nextId);
            this.setNavSignals(m, nextIdx);
        } else {
            const prevIdx = idx - 1;
            if (prevIdx < 0) return;
            const prevId = navIds[prevIdx];
            this.activeSectionId.set(prevId);
            this.activeTab.set('aprende');
            this.sliderIndex.set(0);
            this._expandParentSection(m, prevId);
            this.setNavSignals(m, prevIdx);
        }
    }

    private calcProgress(m: PlanModule): number {
        const total = this._flatStepsForModule(m).length;
        if (total === 0) return 0;
        let done = 0;
        for (const s of m.sections) {
            if (s.children && s.children.length > 0) {
                done += s.children.filter(c => c.completed).length;
            } else if (s.isCompleted || s.completed) {
                done++;
            }
        }
        return Math.round((done / total) * 100);
    }

    // ── Flat-steps helpers ────────────────────────────────────────────────────

    private _flatStepsForModule(m: PlanModule): string[] {
        const ids: string[] = [];
        // For RP sub-programs, Previous/Next and step completion only apply to the enrolled program
        if (m.moduleCode === 'RIESGO_PSICOSOCIAL' && m.programCode) {
            const prefix = STEP_PREFIX[m.programCode];
            const enrolledSection = prefix
                ? m.sections.find(s => s.children?.some(c => c.id.startsWith(prefix + '-')))
                : undefined;
            if (enrolledSection?.children) {
                enrolledSection.children.forEach(c => ids.push(c.id));
                return ids;
            }
        }
        for (const s of m.sections) {
            if (s.children && s.children.length > 0) {
                s.children.forEach(c => ids.push(c.id));
            } else {
                ids.push(s.id);
            }
        }
        return ids;
    }

    get flatSteps(): string[] {
        return this.activeModule ? this._flatStepsForModule(this.activeModule) : [];
    }

    private _markStepComplete(m: PlanModule, stepId: string): void {
        const sec = m.sections.find(s => s.id === stepId);
        if (sec) { sec.isCompleted = true; sec.completed = true; return; }
        for (const s of m.sections) {
            const child = s.children?.find(c => c.id === stepId);
            if (child) { child.completed = true; return; }
        }
    }

    private _expandParentSection(m: PlanModule, stepId: string): void {
        m.sections.forEach(s => {
            if (s.children?.some(c => c.id === stepId)) {
                s.childExpanded = true;
            }
        });
    }

    // â”€â”€ Getters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    get activeModule(): PlanModule | undefined {
        return this.modules.find(m => m.id === this.activeModuleId());
    }

    get activeSection(): PlanSection | undefined {
        const m = this.activeModule;
        if (!m) return undefined;
        const id = this.activeSectionId();
        const direct = m.sections.find(s => s.id === id);
        if (direct) return direct;
        // Return parent section if active ID is a child (week)
        return m.sections.find(s => s.children?.some(c => c.id === id));
    }

    get activeStepTitle(): string {
        const id = this.activeSectionId();
        const m = this.activeModule;
        if (!m) return '';
        const sec = m.sections.find(s => s.id === id);
        if (sec) return sec.title;
        for (const s of m.sections) {
            const child = s.children?.find(c => c.id === id);
            if (child) return `${s.title} · ${child.title}`;
        }
        return '';
    }

    get moduleProgress(): number {
        return this.activeModule?.progressPercent ?? 0;
    }

    isSectionActive(sectionId: string): boolean {
        return this.activeSectionId() === sectionId;
    }

    isModuleActive(moduleId: string): boolean {
        return this.activeModuleId() === moduleId;
    }

    get isLastSection(): boolean {
        const steps = this.flatSteps;
        return steps.length > 0 && steps[steps.length - 1] === this.activeSectionId();
    }

    get certModuleSubtitle(): string {
        const code = this.activeModule?.programCode ?? this.activeModule?.moduleCode;
        if (code === 'FATIGA') return 'en Gestión de Fatiga Laboral';
        if (code === 'RIESGO_PSICOSOCIAL') return 'en Manejo de Riesgo Psicosocial';
        if (code === 'RP_PRO_ACTIVO') return 'en PRO-Activo de Bienestar';
        if (code === 'RP_CO_GESTORES') return 'en Co-Gestión de Bienestar';
        if (code === 'RP_ARQUITECTOS') return 'en Arquitectura de Bienestar';
        if (code === 'RP_CULTURA') return 'en Cultura de Bienestar';
        if (code === 'RP_ECOSISTEMA') return 'en Ecosistema Inclusivo';
        if (code === 'CLIMA_ORGANIZACIONAL') {
            const sid = this.activeSectionId();
            if (sid.startsWith('co-vp-')) return 'Programa: Vida y Trabajo con Propósito';
            if (sid.startsWith('co-ct-')) return 'Programa: Reconstruyendo el Puente de la Confianza';
            if (sid.startsWith('co-at-')) return 'Programa: Arquitectos de Confianza: Liderazgo que Transforma';
            return 'en Clima Organizacional';
        }
        return 'en Habilidades de Salud Mental';
    }

    get certModuleBadge(): string {
        const code = this.activeModule?.programCode ?? this.activeModule?.moduleCode;
        if (code === 'FATIGA') return 'Módulo: Fatiga Laboral';
        if (code === 'RIESGO_PSICOSOCIAL') return 'Módulo: Riesgo Psicosocial';
        if (code === 'RP_PRO_ACTIVO') return 'Programa: PRO-Activo de Bienestar';
        if (code === 'RP_CO_GESTORES') return 'Programa: Co-Gestores de Bienestar';
        if (code === 'RP_ARQUITECTOS') return 'Programa: Arquitectos de Bienestar';
        if (code === 'RP_CULTURA') return 'Programa: Cultura de Bienestar';
        if (code === 'RP_ECOSISTEMA') return 'Programa: Ecosistema Inclusivo';
        if (code === 'CLIMA_ORGANIZACIONAL') {
            const sid = this.activeSectionId();
            if (sid.startsWith('co-vp-')) return 'Programa: Vida y Trabajo con Propósito';
            if (sid.startsWith('co-ct-')) return 'Programa: Reconstruyendo el Puente de la Confianza';
            if (sid.startsWith('co-at-')) return 'Programa: Arquitectos de Confianza: Liderazgo que Transforma';
            return 'Módulo: Clima Organizacional';
        }
        return 'Módulo: Salud Mental';
    }

    get certBodyText(): string {
        const code = this.activeModule?.programCode ?? this.activeModule?.moduleCode;
        if (code === 'FATIGA') {
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento de habilidades junto a Emocheck. ' +
                'Has aprobado este proceso, desarrollando recursos personales que te permiten identificar señales de fatiga, ' +
                'comprender su impacto y aplicar estrategias efectivas para gestionarla de manera consciente y sostenible.';
        }
        if (code === 'RIESGO_PSICOSOCIAL' || code?.startsWith('RP_')) {
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento de habilidades junto a Emocheck. ' +
                'Has aprobado este proceso, identificando factores de riesgo psicosocial y desarrollando estrategias ' +
                'para gestionarlos y promover un entorno laboral más saludable y equilibrado.';
        }
        if (code === 'CLIMA_ORGANIZACIONAL') {
            const sid = this.activeSectionId();
            if (sid.startsWith('co-vp-')) {
                return 'Reconocemos tu compromiso con el desarrollo de un clima laboral más humano y significativo. ' +
                    'Has completado el programa Vida y Trabajo con Propósito, cultivando la conexión con tu propósito, ' +
                    'la reciprocidad en tus relaciones y una visión clara de tu futuro profesional.';
            }
            if (sid.startsWith('co-ct-')) {
                return 'Reconocemos tu compromiso con la construcción de entornos laborales basados en la confianza. ' +
                    'Has completado el programa Reconstruyendo el Puente de la Confianza, desarrollando habilidades ' +
                    'de escucha, empatía y liderazgo de servicio para fortalecer tu equipo.';
            }
            if (sid.startsWith('co-at-')) {
                return 'Reconocemos tu compromiso con el autoliderazgo y la credibilidad. ' +
                    'Has completado el programa Arquitectos de Confianza, fortaleciendo la coherencia, ' +
                    'la transparencia y la responsabilidad como pilares de un liderazgo que transforma el clima laboral.';
            }
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento del clima organizacional junto a Emocheck.';
        }
        return 'Reconocemos tu esfuerzo y dedicación en el desarrollo de habilidades junto a Emocheck. ' +
            'Has aprobado este proceso, fortaleciendo recursos personales que te permiten evaluar, ' +
            'comprender y aplicar estrategias adecuadas frente a situaciones que puedan impactar ' +
            'tu bienestar y tu estilo de vida.';
    }

    completeLastSection(): void {
        const m = this.activeModule;
        if (!m) return;
        const last = m.sections[m.sections.length - 1];
        if (!last) return;
        last.isCompleted = true;
        last.completed = true;
        m.progressPercent = this.calcProgress(m);

        const afterComplete = (finalProgress: number) => {
            m.progressPercent = finalProgress;
            if (finalProgress >= 100) {
                this._goToNextPendingModule(m);
            }
        };

        if (m.moduleID && last.actionPlanStepID) {
            this._actionPlanSvc.completeStep(m.moduleID, last.actionPlanStepID).subscribe({
                next: (result) => afterComplete(result.moduleProgressPercent),
                error: () => afterComplete(m.progressPercent ?? 0),
            });
        } else {
            afterComplete(m.progressPercent);
        }
    }

    private _goToNextPendingModule(current: PlanModule): void {
        const currentIdx = this.modules.indexOf(current);
        // Buscar siguiente módulo incompleto después del actual
        const nextPending = this.modules.find(
            (m, i) => i > currentIdx && (m.progressPercent ?? 0) < 100
        );
        if (nextPending) {
            // Contraer el módulo actual
            current.expanded = false;
            this.openModule(nextPending);
        } else {
            // Todos los módulos completados → volver a la pantalla intro
            this.view.set('intro');
        }
    }

    // â”€â”€ Certificate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    openCertificate(): void {
        this.showCertificate.set(true);
        document.body.style.overflow = 'hidden';
    }

    closeCertificate(): void {
        this.showCertificate.set(false);
        document.body.style.overflow = '';
    }

    printCertificate(): void {
        document.body.classList.add('printing-cert');
        window.addEventListener('afterprint', () => {
            document.body.classList.remove('printing-cert');
        }, { once: true });
        window.print();
    }
}

