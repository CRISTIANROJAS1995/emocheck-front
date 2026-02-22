import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';

// ── DTOs ────────────────────────────────────
export interface AdminResourceCategoryDto {
    resourceCategoryID: number;
    categoryName?: string | null;
    name?: string | null;
    description?: string | null;
    isActive?: boolean;
}

export interface AdminResourceDto {
    resourceID?: number;
    wellnessResourceId?: number;
    resourceCategoryID?: number;
    categoryName?: string | null;
    title?: string | null;
    description?: string | null;
    contentType?: string | null;
    resourceType?: string | null;
    contentUrl?: string | null;
    moduleID?: number | null;
    targetRiskLevel?: string | null;
    targetAudience?: string | null;
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
    moduleID?: number;
    targetRiskLevel?: string;
    durationMinutes?: number;
    tags?: string;
    displayOrder?: number;
}

@Component({
    selector: 'app-admin-resources',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-resources.component.html',
    styleUrls: ['./admin-resources.component.scss'],
})
export class AdminResourcesComponent implements OnInit {
    private readonly apiUrl = environment.apiUrl;

    loading = false;
    saving = false;
    search = '';
    filterCategory = 0;

    resources: AdminResourceDto[] = [];
    categories: AdminResourceCategoryDto[] = [];

    showCreateForm = false;
    resourceForm: Partial<CreateResourcePayload> = this.emptyForm();
    editingId: number | null = null;
    editForm: Partial<CreateResourcePayload> = {};

    contentTypes = ['VIDEO', 'AUDIO', 'ARTICLE', 'PDF', 'LINK'];
    riskLevels = ['LOW', 'MODERATE', 'HIGH', 'SEVERE'];

    constructor(private readonly http: HttpClient, private readonly notify: AlertService) { }

    ngOnInit(): void {
        this.loadCategories();
        this.loadResources();
    }

    private unwrap<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const r = res as any;
        if (r && 'data' in r) return Array.isArray(r.data) ? r.data : [];
        return [];
    }

    private unwrapOne<T>(res: unknown): T {
        const r = res as any;
        if (r && 'data' in r) return r.data as T;
        return res as T;
    }

    loadCategories(): void {
        this.http.get<unknown>(`${this.apiUrl}/resource/categories`).pipe(
            map(r => this.unwrap<AdminResourceCategoryDto>(r)),
            catchError(() => of([] as AdminResourceCategoryDto[]))
        ).subscribe(cats => { this.categories = cats; });
    }

    loadResources(): void {
        this.loading = true;
        this.http.get<unknown>(`${this.apiUrl}/resource`).pipe(
            map(r => this.unwrap<AdminResourceDto>(r)),
            catchError(() => of([] as AdminResourceDto[])),
            finalize(() => (this.loading = false))
        ).subscribe(res => { this.resources = res; });
    }

    get filtered(): AdminResourceDto[] {
        const q = this.search.trim().toLowerCase();
        return this.resources.filter(r => {
            const matchCat = this.filterCategory === 0 || r.resourceCategoryID === this.filterCategory;
            const matchQ = !q || `${r.title ?? ''} ${r.tags ?? ''} ${r.description ?? ''}`.toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    }

    categoryName(id: number | undefined): string {
        if (!id) return '-';
        return this.categories.find(c => (c.resourceCategoryID) === id)?.categoryName ?? this.categories.find(c => (c.resourceCategoryID) === id)?.name ?? '-';
    }

    idOf(r: AdminResourceDto): number { return r.resourceID ?? r.wellnessResourceId ?? 0; }

    createResource(): void {
        if (!this.resourceForm.title?.trim()) { this.notify.error('El título es requerido'); return; }
        if (!this.resourceForm.contentUrl?.trim()) { this.notify.error('La URL del contenido es requerida'); return; }
        if (!this.resourceForm.resourceCategoryID) { this.notify.error('La categoría es requerida'); return; }
        this.saving = true;
        this.http.post<unknown>(`${this.apiUrl}/resource`, this.resourceForm).pipe(
            finalize(() => (this.saving = false))
        ).subscribe({
            next: () => { this.notify.success('Recurso creado'); this.showCreateForm = false; this.resourceForm = this.emptyForm(); this.loadResources(); },
            error: (e) => this.notify.error(e?.error?.message || 'Error al crear recurso'),
        });
    }

    startEdit(r: AdminResourceDto): void {
        this.editingId = this.idOf(r);
        this.editForm = {
            resourceCategoryID: r.resourceCategoryID,
            title: r.title ?? '',
            description: r.description ?? '',
            contentType: r.contentType ?? r.resourceType ?? 'LINK',
            contentUrl: r.contentUrl ?? '',
            targetRiskLevel: r.targetRiskLevel ?? r.targetAudience ?? '',
            durationMinutes: r.durationMinutes ?? undefined,
            tags: r.tags ?? '',
            displayOrder: r.displayOrder ?? 0,
        };
    }

    cancelEdit(): void { this.editingId = null; this.editForm = {}; }

    saveEdit(): void {
        if (!this.editingId || !this.editForm.title?.trim()) { this.notify.error('El título es requerido'); return; }
        this.saving = true;
        this.http.put<unknown>(`${this.apiUrl}/resource/${this.editingId}`, this.editForm).pipe(
            finalize(() => (this.saving = false))
        ).subscribe({
            next: () => { this.notify.success('Recurso actualizado'); this.editingId = null; this.loadResources(); },
            error: (e) => this.notify.error(e?.error?.message || 'Error al actualizar recurso'),
        });
    }

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

    private emptyForm(): Partial<CreateResourcePayload> {
        return { contentType: 'ARTICLE', displayOrder: 0, durationMinutes: 0 };
    }
}
