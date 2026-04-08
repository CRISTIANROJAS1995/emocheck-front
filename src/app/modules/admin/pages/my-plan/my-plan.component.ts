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
        description: 'Evalúa el ambiente y la cultura de tu organización',
        introTexts: [
            'El clima organizacional refleja las percepciones compartidas por los miembros de una organización sobre su entorno de trabajo. Abarca aspectos como el liderazgo, la comunicación, el reconocimiento y la cohesión del equipo.',
            'Próximamente dispondrás de este módulo para explorar cómo el clima organizacional influye en tu motivación, compromiso y bienestar en el trabajo.',
        ],
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
        duration: 'Próximamente',
        topicsCount: 5,
        resourcesCount: 10,
        hasCertification: true,
        materials: ['Psicoeducación', 'Diagnóstico organizacional'],
        disabled: true,
        expanded: false,
    },
};

const MODULE_TITLE: Record<string, string> = {
    SALUD_MENTAL:          'Salud Mental',
    FATIGA:                'Fatiga Laboral',
    RIESGO_PSICOSOCIAL:    'Riesgo Psicosocial',
    CLIMA_ORGANIZACIONAL:  'Clima Organizacional',
};

/** Prefix for section IDs per moduleCode — maps to existing HTML @if blocks */
const STEP_PREFIX: Record<string, string> = {
    SALUD_MENTAL:          'mh',
    FATIGA:                'fl',
    RIESGO_PSICOSOCIAL:    'rp',
    CLIMA_ORGANIZACIONAL:  'co',
};

/** Maps stepKey â†’ section id suffix */
const STEP_KEY_SUFFIX: Record<string, string> = {
    BIENVENIDA: 'bienvenida',
    APRENDE: 'aprende',
    CONECTA: 'conecta',
    ACTUA: 'actua',
    CIERRE: 'cierre',
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
        { id: 'fl-aprende', title: 'Aprende', children: [
            { id: 'fl-aprende-s1', title: 'Semana 1' },
            { id: 'fl-aprende-s2', title: 'Semana 2' },
            { id: 'fl-aprende-s3', title: 'Semana 3' },
        ]},
        { id: 'fl-conecta', title: 'Conecta', children: [
            { id: 'fl-conecta-s1', title: 'Semana 4' },
            { id: 'fl-conecta-s2', title: 'Semana 5' },
            { id: 'fl-conecta-s3', title: 'Semana 6' },
        ]},
        { id: 'fl-actua', title: 'Actúa', children: [
            { id: 'fl-actua-s1', title: 'Semana 7' },
            { id: 'fl-actua-s2', title: 'Semana 8' },
            { id: 'fl-actua-s3', title: 'Semana 9' },
        ]},
        { id: 'fl-cierre', title: 'Cierre y certificado' },
    ],
    RIESGO_PSICOSOCIAL: [
        { id: 'rp-prog-pa', title: 'PRO-Activo de Bienestar', children: [
            { id: 'pa-bienvenida',  title: 'Bienvenida' },
            { id: 'pa-s1',          title: 'S1 · El Poder de la Calma' },
            { id: 'pa-s2',          title: 'S2 · ¿Amenaza o Desafío?' },
            { id: 'pa-s3',          title: 'S3 · Tú no eres tu trabajo' },
            { id: 'pa-s4',          title: 'S4 · Mente Clara, Trabajo Seguro' },
            { id: 'pa-s5',          title: 'S5 · Foco en lo Controlable' },
            { id: 'pa-s6',          title: 'S6 · Tu Voz es el Motor' },
            { id: 'pa-s7',          title: 'S7 · Gestión de Órdenes' },
            { id: 'pa-s8',          title: 'S8 · El Poder del Feedback' },
            { id: 'pa-s9',          title: 'S9 · Críticas con Resiliencia' },
            { id: 'pa-s10',         title: 'S10 · Persona vs. Problema' },
            { id: 'pa-s11',         title: 'S11 · El Apoyo Social' },
            { id: 'pa-s12',         title: 'S12 · Mi Hogar, Mi Refugio' },
            { id: 'pa-cierre',      title: 'Cierre y certificado' },
        ]},
        { id: 'rp-prog-co', title: 'Co-Gestores de Bienestar', children: [
            { id: 'rp-bienvenida',   title: 'Bienvenida' },
            { id: 'rp-aprende-s1',  title: 'S1 · Anclaje de Alto Rendimiento' },
            { id: 'rp-aprende-s2',  title: 'S2 · Perspectiva Sistémica' },
            { id: 'rp-aprende-s3',  title: 'S3 · Esencia vs. Rol' },
            { id: 'rp-aprende-s4',  title: 'S4 · Foco de Control' },
            { id: 'rp-conecta-s1',  title: 'S5 · Deep Work' },
            { id: 'rp-conecta-s2',  title: 'S6 · Ingeniería de Prioridades' },
            { id: 'rp-conecta-s3',  title: 'S7 · Sin Procrastinación' },
            { id: 'rp-conecta-s4',  title: 'S8 · Sinergia en Agenda' },
            { id: 'rp-actua-s1',    title: 'S9 · Resolución de Problemas' },
            { id: 'rp-actua-s2',    title: 'S10 · Feedback para la Excelencia' },
            { id: 'rp-actua-s3',    title: 'S11 · Negociación de Apoyos' },
            { id: 'rp-actua-s4',    title: 'S12 · Desconexión de Alto Nivel' },
            { id: 'rp-cierre',      title: 'Cierre y certificado' },
        ]},
        { id: 'rp-prog-lb', title: 'Arquitectos de Bienestar', children: [
            { id: 'lb-bienvenida',  title: 'Bienvenida' },
            { id: 'lb-s1',          title: 'S1 · Neurobiología del Mando' },
            { id: 'lb-s2',          title: 'S2 · Perspectiva de Escenario' },
            { id: 'lb-s3',          title: 'S3 · Integridad vs. Rol' },
            { id: 'lb-s4',          title: 'S4 · Arquitectura de Decisiones' },
            { id: 'lb-s5',          title: 'S5 · Matriz de Priorización' },
            { id: 'lb-s6',          title: 'S6 · Blindaje del Enfoque' },
            { id: 'lb-s7',          title: 'S7 · Gestión de la Ejecución' },
            { id: 'lb-s8',          title: 'S8 · Sinergia Grupal' },
            { id: 'lb-s9',          title: 'S9 · Delegación Facultativa' },
            { id: 'lb-s10',         title: 'S10 · Algoritmos de Resolución' },
            { id: 'lb-s11',         title: 'S11 · Feedback de Alto Rendimiento' },
            { id: 'lb-s12',         title: 'S12 · Ecosistemas en Equilibrio' },
            { id: 'lb-cierre',      title: 'Cierre y certificado' },
        ]},
        { id: 'rp-prog-ve', title: 'Cultura de Bienestar', children: [
            { id: 've-bienvenida',  title: 'Bienvenida' },
            { id: 've-s1',          title: 'S1 · Bio-Recarga' },
            { id: 've-s2',          title: 'S2 · Zona de Enfoque' },
            { id: 've-s3',          title: 'S3 · Pausas Cognitivas' },
            { id: 've-s4',          title: 'S4 · Brújula de Prioridades' },
            { id: 've-s5',          title: 'S5 · Inteligencia Financiera' },
            { id: 've-s6',          title: 'S6 · Sinergia de Equipo' },
            { id: 've-s7',          title: 'S7 · Maestría en el Cambio' },
            { id: 've-s8',          title: 'S8 · Algoritmos de Solución' },
            { id: 've-s9',          title: 'S9 · Tu Voz es el Motor' },
            { id: 've-s10',         title: 'S10 · Escudo del Reconocimiento' },
            { id: 've-s11',         title: 'S11 · Feedback Inteligente' },
            { id: 've-s12',         title: 'S12 · Mi Hogar, Mi Fortaleza' },
            { id: 've-cierre',      title: 'Cierre y certificado' },
        ]},
        { id: 'rp-prog-ei', title: 'Ecosistema Inclusivo', children: [
            { id: 'ei-bienvenida',  title: 'Bienvenida' },
            { id: 'ei-h1',          title: 'Espacios a tu Medida' },
            { id: 'ei-h2',          title: 'Corazón del Cuidador' },
            { id: 'ei-h3',          title: 'Autenticidad sin Barreras' },
            { id: 'ei-h4',          title: 'Tu Hogar, Tu Trabajo' },
            { id: 'ei-cierre',      title: 'Cierre' },
        ]},
    ],
    CLIMA_ORGANIZACIONAL: [],
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
    private readonly _userService     = inject(UserService);
    private readonly _actionPlanSvc   = inject(ActionPlanService);

    // â”€â”€ View state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    view             = signal<'intro' | 'module-intro' | 'module'>('intro');
    activeModuleId   = signal<string>('');
    activeSectionId  = signal<string>('');
    loading          = signal<boolean>(false);

    // ── Week tab & slider ────────────────────────────────────────────────────────────────────
    activeTab   = signal<'aprende' | 'conecta' | 'actua'>('aprende');
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
    userName        = signal<string>('Nombre del usuario');
    today           = new Date();
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
            title:           MODULE_TITLE[code] ?? code,
            moduleCode:      code,
            moduleID:        undefined,
            progressPercent: 0,
            sections:        [],
            expanded:        false,
        }));

        // Obtener moduleIDs, títulos y progreso reales desde la API
        this.loading.set(true);
        return this._actionPlanSvc.getModules().pipe(
            tap(dtos => {
                dtos.forEach(dto => {
                    const mod = this.modules.find(m => m.moduleCode === dto.moduleCode);
                    if (mod) {
                        mod.moduleID        = dto.moduleID;
                        mod.title           = dto.moduleName;
                        mod.progressPercent = dto.progressPercent;
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
        // SALUD_MENTAL uses a custom week-based static structure regardless of API steps
        if (!module.moduleID || module.moduleCode === 'SALUD_MENTAL') {
            this._applyStaticSections(module);
            return;
        }
        this._actionPlanSvc.getSteps(module.moduleID).subscribe({
            next: (steps) => this._applySteps(module, steps),
        });
    }

    private _applySteps(module: PlanModule, steps: ActionPlanStepDto[]): void {
        const code   = module.moduleCode ?? '';
        const prefix = STEP_PREFIX[code] ?? module.id.substring(0, 2);
        module.sections = steps.map(s => ({
            id:               `${prefix}-${STEP_KEY_SUFFIX[s.stepKey] ?? s.stepKey.toLowerCase()}`,
            title:            s.stepKey === 'CIERRE' ? 'Cierre y certificado' : s.title,
            actionPlanStepID: s.actionPlanStepID,
            stepKey:          s.stepKey,
            isCompleted:      s.isCompleted,
            completedAt:      s.completedAt,
            completed:        s.isCompleted,
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

    private setNavSignals(module: PlanModule, idx: number): void {
        const total = this._flatStepsForModule(module).length;
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
                next: ({ fresh, steps }) => steps && fresh.moduleCode !== 'SALUD_MENTAL' ? this._applySteps(fresh, steps) : this._applyStaticSections(fresh),
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
        const flatIds = this._flatStepsForModule(module);
        this.setNavSignals(module, Math.max(0, flatIds.indexOf(this.activeSectionId())));
    }

    selectSubSection(module: PlanModule, weekId: string): void {
        this.activeModuleId.set(module.id);
        this.activeTab.set('aprende');
        this.sliderIndex.set(0);
        this.activeSectionId.set(weekId);
        const flatIds = this._flatStepsForModule(module);
        this.setNavSignals(module, Math.max(0, flatIds.indexOf(weekId)));
    }

    isSectionOrChildActive(section: PlanSection): boolean {
        if (this.activeSectionId() === section.id) return true;
        return section.children?.some(c => c.id === this.activeSectionId()) ?? false;
    }

    navigateSection(direction: 'prev' | 'next'): void {
        const m = this.activeModule;
        if (!m || m.sections.length === 0) return;

        const flatIds = this._flatStepsForModule(m);
        let idx = flatIds.indexOf(this.activeSectionId());
        if (idx === -1) { idx = 0; }

        if (direction === 'next') {
            const nextIdx = idx + 1;
            if (nextIdx >= flatIds.length) return;

            // Marcar completado INMEDIATAMENTE en local (sin esperar API)
            this._markStepComplete(m, flatIds[idx]);
            m.progressPercent = this.calcProgress(m);

            // Sync con API — usa el actionPlanStepID de la sección padre
            const parentSection = m.sections.find(s =>
                s.id === flatIds[idx] || s.children?.some(c => c.id === flatIds[idx])
            );
            if (m.moduleID && parentSection?.actionPlanStepID) {
                this._actionPlanSvc.completeStep(m.moduleID, parentSection.actionPlanStepID).subscribe({
                    next: (result) => { m.progressPercent = result.moduleProgressPercent; },
                });
            }

            const nextId = flatIds[nextIdx];
            this.activeSectionId.set(nextId);
            this.activeTab.set('aprende');
            this.sliderIndex.set(0);
            this._expandParentSection(m, nextId);
            this.setNavSignals(m, nextIdx);
        } else {
            const prevIdx = idx - 1;
            if (prevIdx < 0) return;
            const prevId = flatIds[prevIdx];
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
        const m  = this.activeModule;
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
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA')             return 'en Gestión de Fatiga Laboral';
        if (code === 'RIESGO_PSICOSOCIAL') return 'en Manejo de Riesgo Psicosocial';
        return 'en Habilidades de Salud Mental';
    }

    get certModuleBadge(): string {
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA')             return 'Módulo: Fatiga Laboral';
        if (code === 'RIESGO_PSICOSOCIAL') return 'Módulo: Riesgo Psicosocial';
        return 'Módulo: Salud Mental';
    }

    get certBodyText(): string {
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA') {
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento de habilidades junto a Emocheck. ' +
                'Has aprobado este proceso, desarrollando recursos personales que te permiten identificar señales de fatiga, ' +
                'comprender su impacto y aplicar estrategias efectivas para gestionarla de manera consciente y sostenible.';
        }
        if (code === 'RIESGO_PSICOSOCIAL') {
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento de habilidades junto a Emocheck. ' +
                'Has aprobado este proceso, identificando factores de riesgo psicosocial y desarrollando estrategias ' +
                'para gestionarlos y promover un entorno laboral más saludable y equilibrado.';
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
        last.isCompleted  = true;
        last.completed    = true;
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
                error: ()       => afterComplete(m.progressPercent ?? 0),
            });
        } else {
            afterComplete(m.progressPercent);
        }
    }

    private _goToNextPendingModule(current: PlanModule): void {
        const currentIdx  = this.modules.indexOf(current);
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

