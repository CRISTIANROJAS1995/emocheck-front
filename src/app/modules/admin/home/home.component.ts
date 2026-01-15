import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { ModuleCardComponent, ModuleCardData, EmoBadgeComponent } from 'app/shared/components';

interface Module extends ModuleCardData {
    route: string;
}

interface Resource {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconClass: string;
    buttonText: string;
    action: () => void;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, ModuleCardComponent, EmoBadgeComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    user: User;

    modules: Module[] = [
        {
            id: 'mental-health',
            title: 'Salud Mental',
            description: 'Tamizaje de ansiedad, depresión, trastorno del sueño y desgaste emocional',
            icon: 'heroicons_outline:heart',
            colorClass: 'module-card--mental-health',
            iconClass: 'module-icon--blue',
            route: '/mental-health'
        },
        {
            id: 'work-fatigue',
            title: 'Fatiga Laboral',
            description: 'Evaluación rápida de energía cognitiva y emocional',
            icon: 'heroicons_outline:bolt',
            colorClass: 'module-card--work-fatigue',
            iconClass: 'module-icon--green',
            route: '/work-fatigue'
        },
        {
            id: 'organizational-climate',
            title: 'Clima Organizacional',
            description: 'Percepción del entorno, liderazgo y propósito',
            icon: 'heroicons_outline:user-group',
            colorClass: 'module-card--organizational-climate',
            iconClass: 'module-icon--teal',
            route: '/organizational-climate'
        },
        {
            id: 'psychosocial-risk',
            title: 'Riesgo Psicosocial',
            description: 'Factores intralaborales y extralaborales según Batería Ministerio del Trabajo',
            icon: 'heroicons_outline:exclamation-triangle',
            colorClass: 'module-card--psychosocial-risk',
            iconClass: 'module-icon--orange',
            route: '/psychosocial-risk'
        }
    ];

    resources: Resource[] = [
        {
            id: 'emotional-calibration',
            title: 'Calibración Emocional',
            description: 'Analiza tu estado emocional cuando lo necesites',
            icon: 'heroicons_outline:heart',
            iconClass: 'resource-icon--teal',
            buttonText: 'Iniciar',
            action: () => this.navigateToResource('emotional-calibration')
        },
        {
            id: 'mindfulness',
            title: 'Mindfulness',
            description: 'Ejercicios de meditación y respiración consciente',
            icon: 'heroicons_outline:sparkles',
            iconClass: 'resource-icon--purple',
            buttonText: 'Explorar',
            action: () => this.navigateToResource('mindfulness')
        },
        {
            id: 'neuropauses',
            title: 'Neuropausas',
            description: 'Pausas activas para recargar tu energía mental',
            icon: 'heroicons_outline:play-circle',
            iconClass: 'resource-icon--pink',
            buttonText: 'Explorar',
            action: () => this.navigateToResource('neuropauses')
        },
        {
            id: 'professional-support',
            title: 'Apoyo Profesional',
            description: 'Conecta con especialistas en salud mental',
            icon: 'heroicons_outline:user-circle',
            iconClass: 'resource-icon--cyan',
            buttonText: 'Solicitar',
            action: () => this.navigateToResource('professional-support')
        }
    ];

    constructor(
        private router: Router,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        // Subscribe to user data
        this.userService.user$.subscribe((user) => {
            this.user = user;
        });
    }

    startEvaluation(moduleId: string): void {
        const module = this.modules.find(m => m.id === moduleId);
        if (module && !module.disabled) {
            this.router.navigate([module.route]);
        }
    }

    viewPlan(moduleId: string): void {
        this.router.navigate(['/plan', moduleId]);
    }

    navigateToResource(resourceId: string): void {
        this.router.navigate(['/resources', resourceId]);
    }

    get userName(): string {
        return this.user?.name || 'Usuario';
    }
}
