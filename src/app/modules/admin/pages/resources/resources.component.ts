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

    private readonly subscriptions = new Subscription();

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
        this.loadInitial();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadInitial(): void {
        this.loading = true;
        this.error = null;
        this.warnings = [];

        const warn = (label: string, e: unknown): void => {
            const msg = this.extractErrorMessage(e, 'Error desconocido');
            this.warnings = [...this.warnings, `${label}: ${msg}`];
        };

        forkJoin({
            categories: this.resourcesApi.getCategories().pipe(
                catchError((e) => { warn('Categorías', e); return of([]); })
            ),
            featured: this.resourcesApi.getFeatured().pipe(
                catchError((e) => { warn('Destacados', e); return of([]); })
            ),
            recommended: this.resourcesApi.getRecommended().pipe(
                catchError((e) => { warn('Recomendados', e); return of(null); })
            ),
            professionals: this.resourcesApi.getProfessionals().pipe(
                catchError((e) => { warn('Profesionales', e); return of([]); })
            ),
            emergency: this.resourcesApi.getEmergencyProfessionals().pipe(
                catchError((e) => { warn('Emergencias', e); return of([]); })
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
                    this.loadResources();
                },
                error: () => {
                    this.error = 'No fue posible cargar recursos';
                },
            });
    }

    selectCategory(categoryId: number | null): void {
        this.selectedCategoryId = categoryId;
        this.loadResources();
    }

    loadResources(): void {
        this.loading = true;
        this.error = null;

        this.resourcesApi
            .getResources({ categoryId: this.selectedCategoryId ?? undefined })
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
                // ignorar
            }
        }

        // Tracking de acceso (no bloqueante)
        this.resourcesApi
            .trackAccess(resource.wellnessResourceId, { durationSeconds: 0, completedPercentage: 0 })
            .pipe(catchError(() => of(null)))
            .subscribe();
    }

    private extractErrorMessage(error: unknown, fallback: string): string {
        const http = error as Partial<HttpErrorResponse> & { error?: any };
        const body = http?.error;

        if (body) {
            if (typeof body === 'string' && body.trim()) return body.trim();
            if (typeof body === 'object') {
                if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
                if (typeof body.title === 'string' && body.title.trim()) return body.title.trim();
                if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim();
                if (Array.isArray(body.errors) && body.errors.length) return String(body.errors[0]);
            }
        }

        if (typeof http?.message === 'string' && http.message.trim()) return http.message.trim();
        return fallback;
    }
}
