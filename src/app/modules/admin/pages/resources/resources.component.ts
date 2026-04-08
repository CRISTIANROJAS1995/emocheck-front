import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
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
    selectedStaticCategory = 'mindfulness';

    // ── Sub-item selection ────────────────────────────────────────────────
    selectedSubItem = 'mindfulness-infografias';

    // ── Mindfulness assets ────────────────────────────────────────────────
    readonly mindfulnessImages = [
        'images/infografia/1.png',
        'images/infografia/2.png',
        'images/infografia/3.png',
        'images/infografia/4.png',
        'images/infografia/5.png',
    ];
    readonly mindfulnessVideoUrl = 'https://emocheck-storage.s3.us-east-2.amazonaws.com/recursos/videos/1773932340162-z32655.mp4';

    readonly mindfulnessVideos: { id: string; title: string; url: string }[] = [
        {
            id: 'mindfulness-video-respiracion',
            title: 'El poder de la respiración',
            url: 'https://material-adjunto.s3.us-east-2.amazonaws.com/videos/mindfulness/VM01_El+poder+de+la+respiraci%C3%B3n.mp4',
        },
        {
            id: 'mindfulness-video-permanece',
            title: 'Permanece: Más allá del cambio',
            url: 'https://material-adjunto.s3.us-east-2.amazonaws.com/videos/mindfulness/VM03_Permanece+m%C3%A1s+all%C3%A1+del+cambio.mp4',
        },
    ];

    categorySliderIndex = 0;
    private _categorySliderTimer: ReturnType<typeof setInterval> | null = null;

    get selectedCategoryName(): string | null {
        if (this.selectedCategoryId == null) return null;
        return this.categories.find(c => c.resourceCategoryID === this.selectedCategoryId)?.name ?? null;
    }

    get isMindfulnessCategory(): boolean {
        const name = (this.selectedCategoryName ?? '').trim().toLowerCase();
        return ['mindfulness', 'atención plena', 'atencion plena', 'meditación', 'meditacion'].includes(name);
    }

    get isActionPlanCategory(): boolean {
        const name = (this.selectedCategoryName ?? '').trim().toLowerCase();
        return ['plan de acción', 'plan de accion', 'plan acción', 'plan accion'].includes(name);
    }

    featured: WellnessResourceDto[] = [];
    recommended: WellnessResourceDto[] = [];
    resources: WellnessResourceDto[] = [];
    professionals: ProfessionalSupportDto[] = [];
    emergencyContacts: ProfessionalSupportDto[] = [];

    // ── Infografía slider — Mindfulness ───────────────────────────────────
    readonly sliderImages = [
        'images/infografia/1.png',
        'images/infografia/2.png',
        'images/infografia/3.png',
        'images/infografia/4.png',
        'images/infografia/5.png',
    ];
    readonly sliderVideoUrl = 'https://emocheck-storage.s3.us-east-2.amazonaws.com/recursos/videos/1773932340162-z32655.mp4';

    // ── Infografía slider — Plan de acción ────────────────────────────────
    readonly actionPlanSliderImages = [
        'planaccion/ansiedad%201.jpeg',
        'planaccion/ansiedad%202.jpeg',
    ];
    readonly actionPlanSliderVideoUrl = 'https://emocheck-storage.s3.us-east-2.amazonaws.com/recursos/videos/1773933707490-vtdlfy.mp4';
    actionPlanSliderIndex = 0;
    private _actionPlanSliderTimer: ReturnType<typeof setInterval> | null = null;

    sliderIndex = 0;
    private _sliderTimer: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly resourcesApi: ResourcesService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly ngZone: NgZone
    ) { }

    ngOnInit(): void {
        // Leer query param ?category= si viene desde el home
        const categoryParam = this.route.snapshot.queryParamMap.get('category');

        // Aplicar categoría estática inmediatamente (sin esperar la API)
        if (categoryParam) {
            this.openQuickAccess(categoryParam as any);
        } else {
            // Start auto-slider for the default sub-item (mindfulness infografías)
            if (this.selectedSubItem === 'mindfulness-infografias') {
                this._startCategorySlider();
            }
        }

        this._pendingCategorySlug = null;
        this.loadInitial();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this._stopSlider();
        this._stopActionPlanSlider();
        this._stopCategorySlider();
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
                    this.loadResources();
                },
                error: () => {
                    this.error = 'No fue posible cargar recursos';
                },
            });
    }

    selectCategory(categoryId: number | null): void {
        this.selectedCategoryId = categoryId != null ? Number(categoryId) : null;
        this._stopSlider();
        this._stopActionPlanSlider();
        this.loadResources();
    }

    selectStaticCategory(cat: string): void {
        this.selectedStaticCategory = cat;
        this._stopCategorySlider();
        this.categorySliderIndex = 0;
        // Auto-select first sub-item per category
        const defaults: Record<string, string> = {
            mindfulness: 'mindfulness-infografias',
        };
        this.selectedSubItem = defaults[cat] ?? '';
        if (this.selectedSubItem === 'mindfulness-infografias') {
            this._startCategorySlider();
        }
    }

    selectSubItem(sub: string): void {
        this.selectedSubItem = sub;
        this._stopCategorySlider();
        this.categorySliderIndex = 0;
        if (sub === 'mindfulness-infografias') {
            this._startCategorySlider();
        }
    }

    categorySliderPrev(): void {
        const len = this.mindfulnessImages.length;
        this.categorySliderIndex = (this.categorySliderIndex - 1 + len) % len;
        this._stopCategorySlider();
        this._startCategorySlider();
    }

    categorySliderNext(): void {
        const len = this.mindfulnessImages.length;
        this.categorySliderIndex = (this.categorySliderIndex + 1) % len;
        this._stopCategorySlider();
        this._startCategorySlider();
    }

    categorySliderGoTo(i: number): void {
        this.categorySliderIndex = i;
        this._stopCategorySlider();
        this._startCategorySlider();
    }

    private _startCategorySlider(): void {
        this.ngZone.runOutsideAngular(() => {
            this._categorySliderTimer = setInterval(() => {
                this.ngZone.run(() => {
                    this.categorySliderIndex = (this.categorySliderIndex + 1) % this.mindfulnessImages.length;
                });
            }, 3500);
        });
    }

    private _stopCategorySlider(): void {
        if (this._categorySliderTimer != null) {
            clearInterval(this._categorySliderTimer);
            this._categorySliderTimer = null;
        }
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
                    // Start slider automatically when Mindfulness category is loaded
                    this._stopSlider();
                    this._stopActionPlanSlider();
                    if (this.isMindfulnessCategory) {
                        this.sliderIndex = 0;
                        this._startSlider();
                    } else if (this.isActionPlanCategory) {
                        this.actionPlanSliderIndex = 0;
                        this._startActionPlanSlider();
                    }
                },
                error: (e) => {
                    this.error = this.extractErrorMessage(e, 'No fue posible cargar el listado');
                },
            });
    }

    openQuickAccess(item: 'emotional-calibration' | 'mindfulness' | 'neuropauses' | 'professional-support' | 'action-plan'): void {
        switch (item) {
            case 'emotional-calibration':
                this.router.navigate(['/emotional-analysis']);
                return;
            case 'professional-support':
                this.router.navigate(['/support']);
                return;
            case 'mindfulness':
                this.selectStaticCategory('mindfulness');
                this._scrollToLayout();
                return;
            case 'neuropauses':
                this.selectStaticCategory('neuropausas');
                this._scrollToLayout();
                return;
            case 'action-plan':
                this.selectStaticCategory('calibracion');
                this._scrollToLayout();
                return;
        }
    }

    private _scrollToLayout(): void {
        setTimeout(() => {
            document.querySelector('.resources-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
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

    // ── Slider helpers — Mindfulness ─────────────────────────────────────
    sliderPrev(): void {
        this.sliderIndex = (this.sliderIndex - 1 + this.sliderImages.length) % this.sliderImages.length;
        this._resetSliderTimer();
    }

    sliderNext(): void {
        this.sliderIndex = (this.sliderIndex + 1) % this.sliderImages.length;
        this._resetSliderTimer();
    }

    sliderGoTo(index: number): void {
        this.sliderIndex = index;
        this._resetSliderTimer();
    }

    sliderClickImage(index: number): void {
        if (index === this.sliderImages.length - 1) {
            window.open(this.sliderVideoUrl, '_blank', 'noopener,noreferrer');
        }
    }

    private _startSlider(): void {
        this.ngZone.runOutsideAngular(() => {
            this._sliderTimer = setInterval(() => {
                this.ngZone.run(() => {
                    this.sliderIndex = (this.sliderIndex + 1) % this.sliderImages.length;
                });
            }, 3000);
        });
    }

    private _stopSlider(): void {
        if (this._sliderTimer != null) {
            clearInterval(this._sliderTimer);
            this._sliderTimer = null;
        }
    }

    private _resetSliderTimer(): void {
        this._stopSlider();
        this._startSlider();
    }

    // ── Slider helpers — Plan de acción ──────────────────────────────────
    actionPlanSliderPrev(): void {
        this.actionPlanSliderIndex = (this.actionPlanSliderIndex - 1 + this.actionPlanSliderImages.length) % this.actionPlanSliderImages.length;
        this._resetActionPlanSliderTimer();
    }

    actionPlanSliderNext(): void {
        this.actionPlanSliderIndex = (this.actionPlanSliderIndex + 1) % this.actionPlanSliderImages.length;
        this._resetActionPlanSliderTimer();
    }

    actionPlanSliderGoTo(index: number): void {
        this.actionPlanSliderIndex = index;
        this._resetActionPlanSliderTimer();
    }

    actionPlanSliderClickImage(index: number): void {
        if (index === this.actionPlanSliderImages.length - 1) {
            window.open(this.actionPlanSliderVideoUrl, '_blank', 'noopener,noreferrer');
        }
    }

    private _startActionPlanSlider(): void {
        this.ngZone.runOutsideAngular(() => {
            this._actionPlanSliderTimer = setInterval(() => {
                this.ngZone.run(() => {
                    this.actionPlanSliderIndex = (this.actionPlanSliderIndex + 1) % this.actionPlanSliderImages.length;
                });
            }, 3000);
        });
    }

    private _stopActionPlanSlider(): void {
        if (this._actionPlanSliderTimer != null) {
            clearInterval(this._actionPlanSliderTimer);
            this._actionPlanSliderTimer = null;
        }
    }

    private _resetActionPlanSliderTimer(): void {
        this._stopActionPlanSlider();
        this._startActionPlanSlider();
    }

    openResource(resource: { wellnessResourceID: number; contentUrl: string }): void {        const url = (resource?.contentUrl ?? '').trim();
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
