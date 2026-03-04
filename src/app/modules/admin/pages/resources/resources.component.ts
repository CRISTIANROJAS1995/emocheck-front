import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
    ProfessionalSupportDto,
    ResourceCategoryDto,
    ResourcesService,
    WellnessResourceDto,
} from 'app/core/services/resources.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';

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
    private _pendingCategorySlug: string | null = null;

    categories: ResourceCategoryDto[] = [];
    selectedCategoryId: number | null = null;

    get selectedCategoryName(): string | null {
        if (this.selectedCategoryId == null) return null;
        return this.categories.find(c => c.resourceCategoryID === this.selectedCategoryId)?.name ?? null;
    }

    featured: WellnessResourceDto[] = [];
    recommended: WellnessResourceDto[] = [];
    resources: WellnessResourceDto[] = [];
    professionals: ProfessionalSupportDto[] = [];
    emergencyContacts: ProfessionalSupportDto[] = [];

    constructor(
        private readonly resourcesApi: ResourcesService,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) { }

    ngOnInit(): void {
        // Leer query param ?category= si viene desde el home
        const categoryParam = this.route.snapshot.queryParamMap.get('category');
        this._pendingCategorySlug = categoryParam ?? null;
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
            featured: this.resourcesApi.getRecommended().pipe(
                catchError((e) => { warn('Destacados', e); return of([]); })
            ),
            recommended: this.resourcesApi.getRecommended().pipe(
                catchError((e) => { warn('Recomendados', e); return of([]); })
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

                    // Aplicar filtro automático si viene de un acceso directo (home)
                    if (this._pendingCategorySlug) {
                        this.openQuickAccess(this._pendingCategorySlug as any);
                        this._pendingCategorySlug = null;
                    } else {
                        this.loadResources();
                    }
                },
                error: () => {
                    this.error = 'No fue posible cargar recursos';
                },
            });
    }

    selectCategory(categoryId: number | null): void {
        this.selectedCategoryId = categoryId != null ? Number(categoryId) : null;
        this.loadResources();
    }

    loadResources(): void {
        this.loading = true;
        this.error = null;

        const source$ = this.selectedCategoryId != null
            ? this.resourcesApi.getByCategory(this.selectedCategoryId)
            : this.resourcesApi.getResources();

        source$
            .pipe(
                map((items) =>
                    // doble seguridad: también filtramos en memoria por si el backend no filtra
                    this.selectedCategoryId != null
                        ? items.filter((r) => Number(r.resourceCategoryID) === Number(this.selectedCategoryId))
                        : items
                ),
                finalize(() => (this.loading = false))
            )
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
                this.selectCategoryByAnyName([
                    'Mindfulness',
                    'mindfulness',
                    'Atención Plena',
                    'Atencion Plena',
                    'Meditación',
                    'Meditacion',
                ]);
                return;
            case 'neuropauses':
                this.selectCategoryByAnyName([
                    'Neuropausas',
                    'Neuro Pausas',
                    'Neuro-Pausas',
                    'Pausas activas',
                    'Pausas Activas',
                    'Pausas Neurales',
                ]);
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
            const current = (c?.name ?? '').trim().toLowerCase();
            return !!current && normalized.includes(current);
        });

        this.selectCategory(match?.resourceCategoryID ?? null);
    }

    openResource(resource: { wellnessResourceID: number; contentUrl: string }): void {
        const url = (resource?.contentUrl ?? '').trim();
        if (url) {
            try {
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch {
                // ignorar
            }
        }

        // Registra acceso (no bloqueante)
        this.resourcesApi
            .registerAccess({ wellnessResourceID: resource.wellnessResourceID, timeSpentSeconds: 0, completed: false })
            .pipe(catchError(() => of(void 0)))
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
