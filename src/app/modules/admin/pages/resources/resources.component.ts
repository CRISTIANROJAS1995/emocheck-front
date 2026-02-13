import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    ProfessionalSupportDto,
    RecommendedResourcesDto,
    ResourceCategoryDto,
    ResourcesService,
    WellnessResourceDto,
} from 'app/core/services/resources.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-resources',
    standalone: true,
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, BackgroundCirclesComponent],
    templateUrl: './resources.component.html',
    styleUrls: ['./resources.component.scss'],
})
export class ResourcesComponent implements OnInit, OnDestroy {
    loading = true;
    error: string | null = null;
    warnings: string[] = [];
    backendDisabled = false;
    useMockData = false;

    private mockAllResources: WellnessResourceDto[] = [];
    private readonly subscriptions = new Subscription();
    private bootstrapped = false;

    categories: ResourceCategoryDto[] = [];
    selectedCategoryId: number | null = null;

    featured: WellnessResourceDto[] = [];
    recommended: RecommendedResourcesDto | null = null;

    resources: WellnessResourceDto[] = [];

    professionals: ProfessionalSupportDto[] = [];
    emergencyContacts: ProfessionalSupportDto[] = [];

    constructor(
        private readonly resourcesApi: ResourcesService,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        this.subscriptions.add(
            this.route.queryParamMap.subscribe((params) => {
                const mockParam = params.get('mock');
                const shouldMock = mockParam === '1' || mockParam?.toLowerCase() === 'true';
                this.setMockMode(shouldMock);
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    enableMockView(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { mock: 1 },
            queryParamsHandling: 'merge',
        });
    }

    disableMockView(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { mock: null },
            queryParamsHandling: 'merge',
        });
    }

    private setMockMode(shouldMock: boolean): void {
        // First emission should always initialize the screen.
        if (!this.bootstrapped && this.useMockData === shouldMock) {
            this.bootstrapped = true;
            if (shouldMock) {
                this.applyMockData();
            } else {
                this.loadInitial();
            }
            return;
        }

        if (this.useMockData === shouldMock) return;

        this.bootstrapped = true;
        this.useMockData = shouldMock;

        if (this.useMockData) {
            this.applyMockData();
            return;
        }

        // Back to real API
        this.mockAllResources = [];
        this.loadInitial();
    }

    loadInitial(): void {
        this.loading = true;
        this.error = null;
        this.warnings = [];
        this.backendDisabled = false;

        const warn = (label: string, e: unknown): void => {
            const msg = this.extractErrorMessage(e, 'Error desconocido');
            this.warnings = [...this.warnings, `${label}: ${msg}`];
        };

        forkJoin({
            categories: this.resourcesApi.getCategories().pipe(
                catchError((e) => {
                    warn('Categorías', e);
                    return of([]);
                })
            ),
            featured: this.resourcesApi.getFeatured().pipe(
                catchError((e) => {
                    warn('Destacados', e);
                    return of([]);
                })
            ),
            recommended: this.resourcesApi.getRecommended().pipe(
                catchError((e) => {
                    warn('Recomendados', e);
                    return of(null);
                })
            ),
            professionals: this.resourcesApi.getProfessionals().pipe(
                catchError((e) => {
                    warn('Profesionales', e);
                    return of([]);
                })
            ),
            emergency: this.resourcesApi.getEmergencyProfessionals().pipe(
                catchError((e) => {
                    warn('Emergencias', e);
                    return of([]);
                })
            ),
        })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: ({ categories, featured, recommended, professionals, emergency }) => {
                    this.categories = categories;
                    this.featured = featured;
                    this.recommended = recommended;
                    this.professionals = professionals;
                    this.emergencyContacts = emergency;

                    // If the backend is misconfigured (e.g., DI can't resolve a service for ResourceController),
                    // avoid triggering additional calls that will certainly fail and spam the console.
                    const combined = [this.error, ...(this.warnings ?? [])].join(' | ');
                    if (this.isBackendServiceResolutionFailure(combined)) {
                        this.backendDisabled = true;

                        // If user explicitly asked for mock mode later, they can use ?mock=1.
                        this.error = 'El servidor no tiene habilitado el módulo de Recursos en este ambiente (configuración interna).';
                        return;
                    }

                    this.loadResources();
                },
                error: () => {
                    this.error = 'No fue posible cargar recursos';
                },
            });
    }

    selectCategory(categoryId: number | null): void {
        if (this.backendDisabled) return;
        this.selectedCategoryId = categoryId;

        if (this.useMockData) {
            this.applyMockFilter();
            return;
        }

        this.loadResources();
    }

    loadResources(): void {
        if (this.backendDisabled) {
            this.loading = false;
            return;
        }

        if (this.useMockData) {
            this.applyMockFilter();
            return;
        }
        this.loading = true;
        this.error = null;

        this.resourcesApi
            .getResources({
                categoryId: this.selectedCategoryId ?? undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (items) => {
                    this.resources = items;
                },
                error: (e) => {
                    this.error = this.extractErrorMessage(e, 'No fue posible cargar el listado');
                },
            });
    }

    openQuickAccess(item: 'emotional-calibration' | 'mindfulness' | 'neuropauses' | 'professional-support'): void {
        switch (item) {
            case 'emotional-calibration':
                this.router.navigate(['/emotional-analysis']);
                return;
            case 'professional-support':
                this.router.navigate(['/support']);
                return;
            case 'mindfulness':
                this.selectCategoryByAnyName(['Mindfulness']);
                return;
            case 'neuropauses':
                this.selectCategoryByAnyName(['Neuropausas', 'Pausas activas', 'Pausas Activas']);
                return;
        }
    }

    resourceTypeIcon(resourceType: string | null | undefined): string {
        const type = (resourceType ?? '').trim().toLowerCase();
        if (!type) return 'heroicons_outline:bookmark';

        if (type.includes('video')) return 'heroicons_outline:video-camera';
        if (type.includes('audio')) return 'heroicons_outline:musical-note';
        if (type.includes('exercise') || type.includes('ejercicio')) return 'heroicons_outline:bolt';
        if (type.includes('medit') || type.includes('mind')) return 'heroicons_outline:heart';
        if (type.includes('article') || type.includes('artículo') || type.includes('lectura') || type.includes('texto')) {
            return 'heroicons_outline:document-text';
        }
        return 'heroicons_outline:bookmark';
    }

    resourceToneClass(resourceType: string | null | undefined): string {
        const type = (resourceType ?? '').trim().toLowerCase();
        if (!type) return 'resource-card--neutral';

        if (type.includes('video')) return 'resource-card--blue';
        if (type.includes('audio')) return 'resource-card--purple';
        if (type.includes('exercise') || type.includes('ejercicio')) return 'resource-card--lime';
        if (type.includes('medit') || type.includes('mind')) return 'resource-card--teal';
        if (type.includes('article') || type.includes('artículo') || type.includes('lectura') || type.includes('texto')) {
            return 'resource-card--indigo';
        }
        return 'resource-card--neutral';
    }

    private selectCategoryByAnyName(names: string[]): void {
        if (this.backendDisabled) return;
        const normalized = (names ?? [])
            .map((n) => (n ?? '').trim().toLowerCase())
            .filter((n) => !!n);

        if (!normalized.length) {
            this.selectCategory(null);
            return;
        }

        const match = (this.categories ?? []).find((c) => {
            const current = (c?.categoryName ?? '').trim().toLowerCase();
            return !!current && normalized.includes(current);
        });

        this.selectCategory(match?.resourceCategoryId ?? null);
    }

    openResource(resource: { wellnessResourceId: number; contentUrl: string }): void {
        const url = (resource?.contentUrl ?? '').trim();
        if (url) {
            try {
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch {
                // ignore
            }
        }

        if (!this.backendDisabled && !this.useMockData) {
            // Minimal analytics call (non-blocking)
            this.resourcesApi
                .trackAccess(resource.wellnessResourceId, { durationSeconds: 0, completedPercentage: 0 })
                .pipe(catchError(() => of(null)))
                .subscribe();
        }
    }

    private applyMockData(): void {
        this.loading = false;
        this.error = null;
        this.warnings = [];
        this.backendDisabled = false;
        this.selectedCategoryId = null;

        this.categories = [
            {
                resourceCategoryId: 1,
                categoryName: 'Manejo del Estrés',
                description: 'Técnicas y herramientas para gestionar el estrés laboral',
                resourceCount: 15,
                isActive: true,
            },
            {
                resourceCategoryId: 2,
                categoryName: 'Mindfulness',
                description: 'Ejercicios de atención plena y meditación',
                resourceCount: 22,
                isActive: true,
            },
            {
                resourceCategoryId: 3,
                categoryName: 'Pausas Activas',
                description: 'Rutinas cortas para recargar energía mental',
                resourceCount: 18,
                isActive: true,
            },
        ];

        const all: WellnessResourceDto[] = [
            {
                wellnessResourceId: 101,
                resourceCategoryId: 2,
                categoryName: 'Mindfulness',
                title: 'Meditación guiada de 5 minutos',
                description: 'Una breve sesión para reconectar con tu respiración y calmar la mente.',
                resourceType: 'Video',
                contentUrl: 'https://example.com/resources/meditacion-5min',
                durationMinutes: 5,
                tags: 'meditación, respiración, mindfulness',
                targetAudience: 'All',
                rating: 4.8,
                isFeatured: true,
            },
            {
                wellnessResourceId: 102,
                resourceCategoryId: 3,
                categoryName: 'Pausas Activas',
                title: 'Estiramientos para oficina (3 min)',
                description: 'Rutina corta para aliviar tensión en cuello, hombros y espalda.',
                resourceType: 'Video',
                contentUrl: 'https://example.com/resources/estiramientos-oficina',
                durationMinutes: 3,
                tags: 'pausas activas, ergonomía, estiramiento',
                targetAudience: 'All',
                rating: 4.5,
                isFeatured: false,
            },
            {
                wellnessResourceId: 103,
                resourceCategoryId: 1,
                categoryName: 'Manejo del Estrés',
                title: 'Técnica 4-7-8 para ansiedad',
                description: 'Ejercicio de respiración para reducir activación fisiológica en pocos minutos.',
                resourceType: 'Exercise',
                contentUrl: 'https://example.com/resources/tecnica-4-7-8',
                durationMinutes: 6,
                tags: 'ansiedad, respiración, estrés',
                targetAudience: 'Yellow',
                rating: 4.7,
                isFeatured: true,
            },
            {
                wellnessResourceId: 104,
                resourceCategoryId: 2,
                categoryName: 'Mindfulness',
                title: 'Escaneo corporal (audio)',
                description: 'Audio guiado para observar sensaciones y liberar tensión acumulada.',
                resourceType: 'Audio',
                contentUrl: 'https://example.com/resources/escaneo-corporal-audio',
                durationMinutes: 8,
                tags: 'relajación, mindfulness',
                targetAudience: 'All',
                rating: 4.6,
                isFeatured: false,
            },
            {
                wellnessResourceId: 105,
                resourceCategoryId: 1,
                categoryName: 'Manejo del Estrés',
                title: 'Guía PDF: pausas mentales en jornada',
                description: 'Sugerencias prácticas para micro-pausas durante el día.',
                resourceType: 'PDF',
                contentUrl: 'https://example.com/resources/pausas-mentales-pdf',
                durationMinutes: 10,
                tags: 'hábitos, productividad, descanso',
                targetAudience: 'Green',
                rating: 4.4,
                isFeatured: false,
            },
        ];

        this.mockAllResources = all;
        this.resources = all;
        this.featured = all.filter((r) => !!r.isFeatured).slice(0, 4);
        this.recommended = {
            userRiskLevel: 'Yellow',
            recommendationReason: 'Basado en tu último resultado',
            resources: [
                {
                    wellnessResourceId: 103,
                    title: 'Técnica 4-7-8 para ansiedad',
                    description: 'Respiración guiada para bajar la intensidad emocional.',
                    resourceType: 'Exercise',
                    contentUrl: 'https://example.com/resources/tecnica-4-7-8',
                    durationMinutes: 6,
                    targetAudience: 'Yellow',
                },
                {
                    wellnessResourceId: 101,
                    title: 'Meditación guiada de 5 minutos',
                    description: 'Mindfulness corto para volver al presente.',
                    resourceType: 'Video',
                    contentUrl: 'https://example.com/resources/meditacion-5min',
                    durationMinutes: 5,
                    targetAudience: 'All',
                },
            ],
        };

        this.professionals = [
            {
                professionalSupportID: 10,
                professionalType: 'Psychologist',
                name: 'Dra. Laura Martínez',
                specialty: 'Estrés Laboral',
                phone: '+57 300 1234567',
                email: 'laura.martinez@emocheck.com',
                availableHours: 'Lun-Vie 09:00-17:00',
                isEmergency: false,
                is24Hours: false,
                languages: 'es',
            },
            {
                professionalSupportID: 11,
                professionalType: 'Counselor',
                name: 'Equipo de Orientación',
                specialty: 'Acompañamiento emocional',
                phone: '+57 300 7654321',
                email: 'orientacion@emocheck.com',
                availableHours: 'Lun-Sáb 08:00-18:00',
                isEmergency: false,
                is24Hours: false,
                languages: 'es',
            },
        ];

        this.emergencyContacts = [
            {
                professionalSupportID: 20,
                professionalType: 'Emergency',
                name: 'Línea de Emergencias',
                specialty: null,
                phone: '123',
                email: null,
                availableHours: '24/7',
                isEmergency: true,
                is24Hours: true,
                languages: 'es',
            },
        ];
    }

    private applyMockFilter(): void {
        const all = this.mockAllResources ?? [];
        const categoryId = this.selectedCategoryId;

        this.resources =
            categoryId == null
                ? all
                : all.filter((r) => r.resourceCategoryId === categoryId);
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        const http = error as Partial<HttpErrorResponse> & { error?: any };
        const body = http?.error;

        const tryParseServerEnvelopeString = (value: string): string | null => {
            const trimmed = value.trim();
            if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) return null;
            try {
                const parsed = JSON.parse(trimmed) as any;
                const message =
                    (typeof parsed?.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null) ||
                    (typeof parsed?.Message === 'string' && parsed.Message.trim() ? parsed.Message.trim() : null);
                const traceId =
                    (typeof parsed?.traceId === 'string' && parsed.traceId.trim() ? parsed.traceId.trim() : null) ||
                    (typeof parsed?.TraceId === 'string' && parsed.TraceId.trim() ? parsed.TraceId.trim() : null);

                if (message && traceId) return `${message} (TraceId: ${traceId})`;
                if (message) return message;
                return null;
            } catch {
                return null;
            }
        };

        if (body) {
            if (typeof body === 'string') {
                const trimmed = body.trim();
                const maybe = tryParseServerEnvelopeString(trimmed);
                if (maybe) return maybe;
                if (trimmed) return trimmed;
            }

            if (typeof body === 'object') {
                // Standard API wrapper
                if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
                // ASP.NET ProblemDetails
                if (typeof body.title === 'string' && body.title.trim()) return body.title.trim();
                if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim();

                // Some backends return `errors: string[]`
                if (Array.isArray(body.errors) && body.errors.length) return String(body.errors[0]);

                // ASP.NET ValidationProblemDetails: `errors: { field: string[] }`
                if (body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
                    const values = Object.values(body.errors) as any[];
                    const firstArray = values.find((v) => Array.isArray(v) && v.length);
                    if (firstArray) return String((firstArray as any[])[0]);
                    const firstString = values.find((v) => typeof v === 'string' && v.trim());
                    if (firstString) return String(firstString).trim();
                }

                // Last resort: show something useful
                try {
                    const serialized = JSON.stringify(body);
                    if (serialized && serialized !== '{}' && serialized !== 'null') return serialized;
                } catch {
                    // ignore
                }
            }
        }

        if (typeof http?.message === 'string' && http.message.trim()) return http.message.trim();
        return fallback;
    }

    private isBackendServiceResolutionFailure(text: string): boolean {
        const t = (text ?? '').toLowerCase();
        return (
            t.includes('unable to resolve service for type') ||
            t.includes('while attempting to activate') ||
            t.includes('resourcecontroller')
        );
    }
}
