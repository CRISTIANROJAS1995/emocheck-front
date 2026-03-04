import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { AuthService } from 'app/core/services/auth.service';
import { of } from 'rxjs';
import { catchError, map, finalize, switchMap } from 'rxjs/operators';
import { S3Folder, S3UploadService } from 'app/core/services/s3-upload.service';

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface AdminResourceCategoryDto {
    resourceCategoryID: number;
    categoryName?: string | null;
    name?: string | null;
    description?: string | null;
    isActive?: boolean;
}

export interface AdminResourceDto {
    resourceID?: number;
    wellnessResourceID?: number;
    wellnessResourceId?: number;
    resourceCategoryID?: number;
    categoryName?: string | null;
    title?: string | null;
    description?: string | null;
    contentType?: string | null;
    contentUrl?: string | null;
    thumbnailUrl?: string | null;
    moduleID?: number | null;
    targetRiskLevel?: string | null;
    durationMinutes?: number | null;
    tags?: string | null;
    displayOrder?: number;
    isActive?: boolean;
}

export interface CreateResourcePayload {
    resourceCategoryID: number;
    title: string;
    description?: string;
    contentType: string;
    contentUrl: string;
    thumbnailUrl?: string;
    moduleID?: number;
    targetRiskLevel?: string;
    durationMinutes?: number;
    tags?: string;
    displayOrder?: number;
}

// ── Mapeo contentType → carpeta S3 ──────────────────────────────────────────

const CONTENT_TYPE_FOLDER: Record<string, S3Folder> = {
    VIDEO:         'recursos/videos',
    AUDIO:         'recursos/audios',
    ARTICLE:       'recursos/articles',
    EXERCISE:      'recursos/images',
    EXTERNAL_LINK: 'recursos/articles',
};

@Component({
    selector: 'app-admin-resources',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-resources.component.html',
    styleUrls: ['./admin-resources.component.scss'],
})
export class AdminResourcesComponent implements OnInit {

    @ViewChild('createFileInput')  createFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('createThumbInput') createThumbInput!: ElementRef<HTMLInputElement>;
    @ViewChild('editFileInput')    editFileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('editThumbInput')   editThumbInput!: ElementRef<HTMLInputElement>;

    private readonly apiUrl = environment.apiUrl;

    // ── Estado general ───────────────────────────────────────────────────────
    loading  = false;
    saving   = false;
    search   = '';
    filterCategory = 0;

    resources:  AdminResourceDto[]         = [];
    categories: AdminResourceCategoryDto[] = [];

    // ── Formulario creación ──────────────────────────────────────────────────
    showCreateForm = false;
    resourceForm: Partial<CreateResourcePayload> = this.emptyForm();

    /** Archivo de contenido seleccionado para crear */
    createFile:  File | null = null;
    /** Thumbnail seleccionado para crear */
    createThumb: File | null = null;
    /** Progreso de carga S3 al crear ('idle' | 'uploading-content' | 'uploading-thumb' | 'saving') */
    createUploadState: 'idle' | 'uploading-content' | 'uploading-thumb' | 'saving' = 'idle';

    // ── Formulario edición ───────────────────────────────────────────────────
    editingId: number | null = null;
    editForm: Partial<CreateResourcePayload> = {};

    /** Archivo de contenido seleccionado para editar */
    editFile:  File | null = null;
    /** Thumbnail seleccionado para editar */
    editThumb: File | null = null;
    /** Progreso de carga S3 al editar */
    editUploadState: 'idle' | 'uploading-content' | 'uploading-thumb' | 'saving' = 'idle';

    // ── Opciones de formulario ───────────────────────────────────────────────
    readonly contentTypes = ['VIDEO', 'AUDIO', 'ARTICLE', 'EXERCISE', 'EXTERNAL_LINK'];
    readonly riskLevels   = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'];

    // ── Gestión de categorías ────────────────────────────────────────────────
    showCategoryPanel    = false;
    savingCategory       = false;
    deletingCategoryId: number | null = null;
    categoryForm         = { name: '', description: '' };
    editingCategoryId: number | null = null;
    editCategoryForm     = { name: '', description: '' };

    constructor(
        private readonly http: HttpClient,
        private readonly notify: AlertService,
        private readonly s3: S3UploadService,
        private readonly auth: AuthService,
    ) { }

    // ── Permisos por rol ─────────────────────────────────────────────────────

    /** SuperAdmin (SystemAdmin) y Psychologist pueden crear/editar recursos. */
    get canWrite(): boolean {
        const roles = this.auth.getCurrentUser()?.roles ?? [];
        return roles.some(r => ['superadmin', 'systemadmin', 'psychologist'].includes(r.toLowerCase()));
    }

    /** Solo SuperAdmin (SystemAdmin) puede eliminar. */
    get canDelete(): boolean {
        const roles = this.auth.getCurrentUser()?.roles ?? [];
        return roles.some(r => ['superadmin', 'systemadmin'].includes(r.toLowerCase()));
    }

    ngOnInit(): void {
        this.loadCategories();
        this.loadResources();
    }

    // ── Helpers API ──────────────────────────────────────────────────────────

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const r = res as any;
        if (r && 'data' in r) return Array.isArray(r.data) ? r.data : [];
        return [];
    }

    loadCategories(): void {
        this.http.get<unknown>(`${this.apiUrl}/resource/categories`).pipe(
            map(r => this.unwrapArray<AdminResourceCategoryDto>(r)),
            catchError(() => of([] as AdminResourceCategoryDto[]))
        ).subscribe(cats => { this.categories = cats; });
    }

    loadResources(): void {
        this.loading = true;
        this.http.get<unknown>(`${this.apiUrl}/resource`).pipe(
            map(r => this.unwrapArray<AdminResourceDto>(r)),
            catchError(() => of([] as AdminResourceDto[])),
            finalize(() => (this.loading = false))
        ).subscribe(res => { this.resources = res; });
    }

    get filtered(): AdminResourceDto[] {
        const q = this.search.trim().toLowerCase();
        return this.resources.filter(r => {
            const matchCat = this.filterCategory === 0 || r.resourceCategoryID === this.filterCategory;
            const matchQ   = !q || `${r.title ?? ''} ${r.tags ?? ''} ${r.description ?? ''}`.toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    }

    categoryLabel(id: number | undefined): string {
        if (!id) return '-';
        const cat = this.categories.find(c => c.resourceCategoryID === id);
        return cat?.name ?? cat?.categoryName ?? '-';
    }

    idOf(r: AdminResourceDto): number {
        return r.resourceID ?? r.wellnessResourceID ?? r.wellnessResourceId ?? 0;
    }

    // ── Helpers S3 ───────────────────────────────────────────────────────────

    private folderFor(contentType: string | undefined | null): S3Folder {
        return CONTENT_TYPE_FOLDER[(contentType ?? '').toUpperCase()] ?? 'recursos/articles';
    }

    onCreateFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.createFile = input.files?.[0] ?? null;
        if (this.createFile) {
            // Si el usuario sube archivo, limpiamos la URL manual para que no haya conflicto
            this.resourceForm.contentUrl = '';
        }
    }

    onCreateThumbChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.createThumb = input.files?.[0] ?? null;
        if (this.createThumb) this.resourceForm.thumbnailUrl = '';
    }

    onEditFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.editFile = input.files?.[0] ?? null;
        if (this.editFile) this.editForm.contentUrl = '';
    }

    onEditThumbChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.editThumb = input.files?.[0] ?? null;
        if (this.editThumb) this.editForm.thumbnailUrl = '';
    }

    // ── Creación ─────────────────────────────────────────────────────────────

    createResource(): void {
        if (!this.resourceForm.title?.trim())          { this.notify.error('El título es requerido'); return; }
        if (!this.resourceForm.resourceCategoryID)     { this.notify.error('La categoría es requerida'); return; }
        if (!this.createFile && !this.resourceForm.contentUrl?.trim()) {
            this.notify.error('Sube un archivo o ingresa la URL del contenido'); return;
        }

        this.saving = true;

        // Paso 1: subir archivo de contenido a S3 (si hay archivo seleccionado)
        const uploadContent$ = this.createFile
            ? (this.createUploadState = 'uploading-content',
               this.s3.upload(this.createFile, this.folderFor(this.resourceForm.contentType)).pipe(
                   map(result => { this.resourceForm.contentUrl = result.url; return result; })
               ))
            : of(null);

        uploadContent$.pipe(
            switchMap(() => {
                // Paso 2: subir thumbnail a S3 (si hay thumb seleccionado)
                if (this.createThumb) {
                    this.createUploadState = 'uploading-thumb';
                    return this.s3.upload(this.createThumb, 'thumbs').pipe(
                        map(result => { this.resourceForm.thumbnailUrl = result.url; return result; })
                    );
                }
                return of(null);
            }),
            switchMap(() => {
                // Paso 3: llamar al backend
                this.createUploadState = 'saving';
                return this.http.post<unknown>(`${this.apiUrl}/resource`, this.resourceForm);
            }),
            finalize(() => { this.saving = false; this.createUploadState = 'idle'; })
        ).subscribe({
            next: () => {
                this.notify.success('Recurso creado correctamente');
                this.showCreateForm = false;
                this.resourceForm = this.emptyForm();
                this.createFile  = null;
                this.createThumb = null;
                this.loadResources();
            },
            error: (e) => this.notify.error(e?.message || e?.error?.message || 'Error al crear recurso'),
        });
    }

    // ── Edición ──────────────────────────────────────────────────────────────

    startEdit(r: AdminResourceDto): void {
        this.editingId = this.idOf(r);
        this.editFile  = null;
        this.editThumb = null;
        this.editForm  = {
            resourceCategoryID: r.resourceCategoryID,
            title:              r.title ?? '',
            description:        r.description ?? '',
            contentType:        r.contentType ?? 'ARTICLE',
            contentUrl:         r.contentUrl ?? '',
            thumbnailUrl:       r.thumbnailUrl ?? '',
            targetRiskLevel:    r.targetRiskLevel ?? '',
            durationMinutes:    r.durationMinutes ?? undefined,
            tags:               r.tags ?? '',
            displayOrder:       r.displayOrder ?? 0,
        };
    }

    cancelEdit(): void {
        this.editingId = null;
        this.editForm  = {};
        this.editFile  = null;
        this.editThumb = null;
    }

    saveEdit(): void {
        if (!this.editingId || !this.editForm.title?.trim()) { this.notify.error('El título es requerido'); return; }

        this.saving = true;

        const uploadContent$ = this.editFile
            ? (this.editUploadState = 'uploading-content',
               this.s3.upload(this.editFile, this.folderFor(this.editForm.contentType)).pipe(
                   map(result => { this.editForm.contentUrl = result.url; return result; })
               ))
            : of(null);

        uploadContent$.pipe(
            switchMap(() => {
                if (this.editThumb) {
                    this.editUploadState = 'uploading-thumb';
                    return this.s3.upload(this.editThumb, 'thumbs').pipe(
                        map(result => { this.editForm.thumbnailUrl = result.url; return result; })
                    );
                }
                return of(null);
            }),
            switchMap(() => {
                this.editUploadState = 'saving';
                return this.http.put<unknown>(`${this.apiUrl}/resource/${this.editingId}`, this.editForm);
            }),
            finalize(() => { this.saving = false; this.editUploadState = 'idle'; })
        ).subscribe({
            next: () => {
                this.notify.success('Recurso actualizado correctamente');
                this.editingId = null;
                this.editFile  = null;
                this.editThumb = null;
                this.loadResources();
            },
            error: (e) => this.notify.error(e?.message || e?.error?.message || 'Error al actualizar recurso'),
        });
    }

    // ── Eliminación ──────────────────────────────────────────────────────────

    async deleteResource(r: AdminResourceDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar el recurso "${r.title}"?`);
        if (!ok) return;
        this.saving = true;
        this.http.delete<void>(`${this.apiUrl}/resource/${this.idOf(r)}`).pipe(
            finalize(() => (this.saving = false))
        ).subscribe({
            next: () => { this.notify.success('Recurso eliminado'); this.loadResources(); },
            error: (e) => this.notify.error(e?.error?.message || 'Error al eliminar recurso'),
        });
    }

    // ── Helpers UI ───────────────────────────────────────────────────────────

    uploadLabel(state: 'idle' | 'uploading-content' | 'uploading-thumb' | 'saving'): string {
        switch (state) {
            case 'uploading-content': return 'Subiendo archivo a S3...';
            case 'uploading-thumb':   return 'Subiendo thumbnail a S3...';
            case 'saving':            return 'Guardando en servidor...';
            default:                  return '';
        }
    }

    // ── Categorías CRUD ──────────────────────────────────────────────────────

    createCategory(): void {
        const name = this.categoryForm.name.trim();
        if (!name) { this.notify.error('El nombre de la categoría es requerido'); return; }
        this.savingCategory = true;
        this.http.post<unknown>(`${this.apiUrl}/resource/categories`, this.categoryForm).pipe(
            finalize(() => (this.savingCategory = false))
        ).subscribe({
            next: () => {
                this.notify.success('Categoría creada correctamente');
                this.categoryForm = { name: '', description: '' };
                this.showCategoryPanel = false;
                this.loadCategories();
            },
            error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al crear categoría'),
        });
    }

    startEditCategory(c: AdminResourceCategoryDto): void {
        this.editingCategoryId = c.resourceCategoryID;
        this.editCategoryForm  = { name: c.name ?? c.categoryName ?? '', description: c.description ?? '' };
    }

    cancelEditCategory(): void {
        this.editingCategoryId = null;
        this.editCategoryForm  = { name: '', description: '' };
    }

    saveEditCategory(): void {
        if (!this.editingCategoryId) return;
        const name = this.editCategoryForm.name.trim();
        if (!name) { this.notify.error('El nombre es requerido'); return; }
        this.savingCategory = true;
        this.http.put<unknown>(`${this.apiUrl}/resource/categories/${this.editingCategoryId}`, this.editCategoryForm).pipe(
            finalize(() => (this.savingCategory = false))
        ).subscribe({
            next: () => {
                this.notify.success('Categoría actualizada');
                this.editingCategoryId = null;
                this.loadCategories();
            },
            error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al actualizar categoría'),
        });
    }

    async deleteCategory(c: AdminResourceCategoryDto): Promise<void> {
        const ok = await this.notify.confirm(`¿Eliminar la categoría "${c.name ?? c.categoryName}"?`);
        if (!ok) return;
        this.deletingCategoryId = c.resourceCategoryID;
        this.http.delete<void>(`${this.apiUrl}/resource/categories/${c.resourceCategoryID}`).pipe(
            finalize(() => (this.deletingCategoryId = null))
        ).subscribe({
            next: () => { this.notify.success('Categoría eliminada'); this.loadCategories(); },
            error: (e) => this.notify.error(e?.error?.message || e?.message || 'Error al eliminar categoría'),
        });
    }

    private emptyForm(): Partial<CreateResourcePayload> {
        return { contentType: 'ARTICLE', displayOrder: 0, durationMinutes: 0 };
    }
}
