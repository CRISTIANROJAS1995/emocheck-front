import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { UserService } from 'app/core/user/user.service';
import { ActionPlanService, ActionPlanStepDto } from 'app/core/services/action-plan.service';

// â”€â”€ Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PlanSection {
    id: string;
    title: string;
    icon?: string;
    completed?: boolean;
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
    sections: PlanSection[];
    expanded?: boolean;
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
};

/** Prefix for section IDs per moduleCode — maps to existing HTML @if blocks */
const STEP_PREFIX: Record<string, string> = {
    SALUD_MENTAL: 'mh',
    FATIGA: 'fl',
};

/** Maps stepKey â†’ section id suffix */
const STEP_KEY_SUFFIX: Record<string, string> = {
    BIENVENIDA: 'bienvenida',
    APRENDE: 'aprende',
    CONECTA: 'conecta',
    ACTUA: 'actua',
    CIERRE: 'cierre',
};

/** Secciones estáticas por moduleCode — fallback cuando la API no tiene datos para este usuario */
const STATIC_SECTIONS: Record<string, Array<{ id: string; title: string }>> = {
    SALUD_MENTAL: [
        { id: 'mh-bienvenida', title: 'Bienvenida' },
        { id: 'mh-aprende',    title: 'Aprende' },
        { id: 'mh-conecta',    title: 'Conecta' },
        { id: 'mh-actua',      title: 'Actúa' },
        { id: 'mh-cierre',     title: 'Cierre y certificado' },
    ],
    FATIGA: [
        { id: 'fl-bienvenida', title: 'Bienvenida' },
        { id: 'fl-aprende',    title: 'Aprende' },
        { id: 'fl-conecta',    title: 'Conecta' },
        { id: 'fl-actua',      title: 'Actúa' },
        { id: 'fl-cierre',     title: 'Cierre y certificado' },
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
    private readonly _userService     = inject(UserService);
    private readonly _actionPlanSvc   = inject(ActionPlanService);

    // â”€â”€ View state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    view             = signal<'intro' | 'module-intro' | 'module'>('intro');
    activeModuleId   = signal<string>('');
    activeSectionId  = signal<string>('');
    loading          = signal<boolean>(false);

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
            title:           code === 'SALUD_MENTAL' ? 'Salud Mental' : 'Fatiga Laboral',
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
                const first = this.modules.find(m => m.moduleID !== undefined);
                if (first) {
                    first.expanded = true;
                    this.activeModuleId.set(first.id);
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
        module.sections = (STATIC_SECTIONS[code] ?? []).map(s => ({ ...s }));
        if (module.sections.length > 0) {
            this.activeSectionId.set(module.sections[0].id);
            this.setNavSignals(module, 0);
        }
    }

    private setNavSignals(module: PlanModule, idx: number): void {
        this.activeStepPrevID.set(idx > 0 ? idx : null);
        this.activeStepNextID.set(idx < module.sections.length - 1 ? idx + 1 : null);
    }

    // â”€â”€ Module navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    openModule(module: PlanModule): void {
        this.activeModuleId.set(module.id);
        module.expanded = true;
        this.view.set('module-intro');

        if (module.moduleID) {
            // moduleID ya disponible — cargar steps directamente con IDs reales
            this.loadSteps(module);
        } else {
            // moduleID aún no llegó — esperar la API de módulos, luego cargar steps
            this.loadModules().pipe(
                switchMap(() => {
                    if (module.moduleID) {
                        return this._actionPlanSvc.getSteps(module.moduleID);
                    }
                    return of(null);
                })
            ).subscribe({
                next: (steps) => steps ? this._applySteps(module, steps) : this._applyStaticSections(module),
                error: () => this._applyStaticSections(module),
            });
        }
    }

    continueModule(): void {
        const m = this.activeModule;
        // Si activeSectionId pertenece a otro módulo (condición de carrera), corregir
        if (m && m.sections.length > 0) {
            const match = m.sections.find(s => s.id === this.activeSectionId());
            if (!match) {
                const firstIncomplete = m.sections.findIndex(s => !s.isCompleted);
                const startIdx = firstIncomplete >= 0 ? firstIncomplete : 0;
                this.activeSectionId.set(m.sections[startIdx].id);
                this.setNavSignals(m, startIdx);
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
        this.activeSectionId.set(section.id);
        if (!module.expanded) module.expanded = true;
        const idx = module.sections.indexOf(section);
        this.setNavSignals(module, idx);
    }

    navigateSection(direction: 'prev' | 'next'): void {
        const m = this.activeModule;
        if (!m || m.sections.length === 0) return;

        let idx = m.sections.findIndex(s => s.id === this.activeSectionId());
        // activeSectionId de módulo anterior — resetear al primer paso del módulo actual
        if (idx === -1) {
            const firstIncomplete = m.sections.findIndex(s => !s.isCompleted);
            idx = firstIncomplete >= 0 ? firstIncomplete : 0;
            this.activeSectionId.set(m.sections[idx].id);
            this.setNavSignals(m, idx);
            return; // mostrar sección correcta antes de navegar
        }

        if (direction === 'next') {
            const nextIdx = idx + 1;
            if (nextIdx >= m.sections.length) return;

            // Marcar completado INMEDIATAMENTE en local (sin esperar API)
            const current = m.sections[idx];
            current.isCompleted = true;
            current.completed   = true;
            m.progressPercent   = this.calcProgress(m);

            // Sync con API (best-effort, no bloquea navegación)
            if (m.moduleID && current.actionPlanStepID) {
                this._actionPlanSvc.completeStep(m.moduleID, current.actionPlanStepID).subscribe({
                    next: (result) => {
                        m.progressPercent = result.moduleProgressPercent;
                    },
                });
            }
            this.selectSection(m, m.sections[nextIdx]);
        } else {
            const prevIdx = idx - 1;
            if (prevIdx < 0) return;
            this.selectSection(m, m.sections[prevIdx]);
        }
    }

    private calcProgress(m: PlanModule): number {
        if (m.sections.length === 0) return 0;
        const done = m.sections.filter(s => s.completed || s.isCompleted).length;
        return Math.round((done / m.sections.length) * 100);
    }

    // â”€â”€ Getters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    get activeModule(): PlanModule | undefined {
        return this.modules.find(m => m.id === this.activeModuleId());
    }

    get activeSection(): PlanSection | undefined {
        return this.activeModule?.sections.find(s => s.id === this.activeSectionId());
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
        const m = this.activeModule;
        if (!m || m.sections.length === 0) return false;
        return m.sections[m.sections.length - 1]?.id === this.activeSectionId();
    }

    get certModuleSubtitle(): string {
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA') return 'en Gestión de Fatiga Laboral';
        return 'en Habilidades de Salud Mental';
    }

    get certModuleBadge(): string {
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA') return 'Módulo: Fatiga Laboral';
        return 'Módulo: Salud Mental';
    }

    get certBodyText(): string {
        const code = this.activeModule?.moduleCode;
        if (code === 'FATIGA') {
            return 'Reconocemos tu esfuerzo y dedicación en el fortalecimiento de habilidades junto a Emocheck. ' +
                'Has aprobado este proceso, desarrollando recursos personales que te permiten identificar señales de fatiga, ' +
                'comprender su impacto y aplicar estrategias efectivas para gestionarla de manera consciente y sostenible.';
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

