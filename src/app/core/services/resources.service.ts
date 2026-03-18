import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// -- Enums --------------------------------------------------------------------

export type ContentType = 'ARTICLE' | 'VIDEO' | 'AUDIO' | 'EXERCISE' | 'EXTERNAL_LINK';
export type RiskLevel   = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

// -- DTOs p�blicos (usados por los componentes) -------------------------------

export interface ResourceCategoryDto {
    resourceCategoryID: number;
    name: string;
    description: string | null;
    iconName: string;
    displayOrder: number;
    resourceCount: number;
}

export interface WellnessResourceDto {
    wellnessResourceID: number;
    resourceCategoryID: number;
    categoryName: string;
    title: string;
    description: string;
    contentType: ContentType;
    contentUrl: string;
    thumbnailUrl: string | null;
    moduleID: number | null;
    moduleName: string | null;
    targetRiskLevel: RiskLevel | null;
    durationMinutes: number;
    tags: string | null;
    displayOrder: number;
}

export interface CreateWellnessResourceDto {
    resourceCategoryID: number;
    title: string;
    description: string;
    contentType: ContentType;
    contentUrl: string;
    thumbnailUrl?: string;
    moduleID?: number;
    targetRiskLevel?: RiskLevel;
    durationMinutes?: number;
    displayOrder?: number;
}

export interface UpdateWellnessResourceDto {
    resourceCategoryID?: number;
    title?: string;
    description?: string;
    contentType?: ContentType;
    contentUrl?: string;
    thumbnailUrl?: string;
    moduleID?: number;
    targetRiskLevel?: RiskLevel;
    durationMinutes?: number;
    displayOrder?: number;
    isActive?: boolean;
}

export interface RegisterResourceAccessDto {
    wellnessResourceID: number;
    timeSpentSeconds: number;
    completed: boolean;
    rating?: number;
}

export interface ProfessionalSupportDto {
    professionalSupportID: number;
    professionalType: string;
    name: string;
    specialty?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    website?: string | null;
    availableHours?: string | null;
    isEmergency?: boolean;
    is24Hours?: boolean;
    languages?: string | null;
}

// -- Servicio -----------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class ResourcesService {

    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    // -- Helpers --------------------------------------------------------------

    /** Desenvuelve el envelope { success, data } del backend o devuelve el valor directamente. */
    private unwrap<T>(res: unknown): T {
        const any = res as any;
        if (any && typeof any === 'object' && 'success' in any) {
            return (any.data as T) ?? (undefined as any);
        }
        return any as T;
    }

    /** Devuelve siempre un array, compatible con respuesta directa o envelope. */
    private unwrapArray<T>(res: unknown): T[] {
        const any = res as any;
        if (Array.isArray(any)) return any as T[];
        if (any && typeof any === 'object' && 'success' in any) {
            return Array.isArray(any.data) ? (any.data as T[]) : [];
        }
        return [];
    }

    private mapResource(r: any): WellnessResourceDto {
        return {
            wellnessResourceID: r.wellnessResourceID ?? r.wellnessResourceId ?? 0,
            resourceCategoryID: r.resourceCategoryID ?? r.resourceCategoryId ?? 0,
            categoryName:       r.categoryName ?? '',
            title:              r.title ?? '',
            description:        r.description ?? '',
            contentType:        (r.contentType ?? 'ARTICLE') as ContentType,
            contentUrl:         r.contentUrl ?? '',
            thumbnailUrl:       r.thumbnailUrl ?? null,
            moduleID:           r.moduleID ?? r.moduleId ?? null,
            moduleName:         r.moduleName ?? null,
            targetRiskLevel:    (r.targetRiskLevel ?? null) as RiskLevel | null,
            durationMinutes:    r.durationMinutes ?? 0,
            tags:               null,
            displayOrder:       r.displayOrder ?? 0,
        };
    }

    private mapCategory(c: any): ResourceCategoryDto {
        return {
            resourceCategoryID: c.resourceCategoryID ?? c.resourceCategoryId ?? 0,
            name:               c.name ?? c.categoryName ?? '',
            description:        c.description ?? null,
            iconName:           c.iconName ?? c.iconUrl ?? '',
            displayOrder:       c.displayOrder ?? 0,
            resourceCount:      c.resourceCount ?? 0,
        };
    }

    // -- Categor�as -----------------------------------------------------------

    /** Lista todas las categor�as activas. */
    getCategories(): Observable<ResourceCategoryDto[]> {
        // Backend V5: GET /api/resource/categories
        return this.http.get<unknown>(`${this.apiUrl}/resource/categories`).pipe(
            map((res) => this.unwrapArray<any>(res).map((c) => this.mapCategory(c)))
        );
    }

    // -- Recursos -------------------------------------------------------------

    /** Lista todos los recursos activos. */
    getResources(): Observable<WellnessResourceDto[]> {
        // Backend V5: GET /api/resource
        return this.http.get<unknown>(`${this.apiUrl}/resource`).pipe(
            map((res) => this.unwrapArray<any>(res).map((r) => this.mapResource(r)))
        );
    }

    /** Lista recursos filtrados por categor�a. */
    getByCategory(categoryId: number): Observable<WellnessResourceDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/resource/by-category/${categoryId}`).pipe(
            map((res) => this.unwrapArray<any>(res).map((r) => this.mapResource(r)))
        );
    }

    /**
     * Recursos recomendados autom�ticamente para el usuario autenticado.
     * El backend lee el �ltimo EvaluationResult y filtra por RiskLevel.
     * Si no hay evaluaciones devuelve recursos LOW.
     */
    getRecommended(): Observable<WellnessResourceDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/resource/recommended`).pipe(
            map((res) => this.unwrapArray<any>(res).map((r) => this.mapResource(r))),
            catchError(() => of([]))
        );
    }

    /** Lista recursos filtrados por nivel de riesgo. */
    getByRiskLevel(level: RiskLevel | string): Observable<WellnessResourceDto[]> {
        // Backend V5: GET /api/resource/by-risk-level/{level}
        return this.http.get<unknown>(`${this.apiUrl}/resource/by-risk-level/${level}`).pipe(
            map((res) => this.unwrapArray<any>(res).map((r) => this.mapResource(r))),
            catchError(() => of([]))
        );
    }

    /** Obtiene un recurso por ID. */
    getById(id: number): Observable<WellnessResourceDto> {
        return this.http.get<unknown>(`${this.apiUrl}/resource/${id}`).pipe(
            map((res) => this.mapResource(this.unwrap<any>(res)))
        );
    }

    // -- CRUD (SuperAdmin / Psychologist) -------------------------------------

    /** Crea un nuevo recurso. Requiere rol SuperAdmin o Psychologist. */
    create(dto: CreateWellnessResourceDto): Observable<WellnessResourceDto> {
        // Backend V5: POST /api/resource
        return this.http.post<unknown>(`${this.apiUrl}/resource`, dto).pipe(
            map((res) => this.mapResource(this.unwrap<any>(res)))
        );
    }

    /** Actualiza un recurso. Solo los campos enviados se modifican (PATCH sem�ntico). */
    update(id: number, dto: UpdateWellnessResourceDto): Observable<WellnessResourceDto> {
        return this.http.put<unknown>(`${this.apiUrl}/resource/${id}`, dto).pipe(
            map((res) => this.mapResource(this.unwrap<any>(res)))
        );
    }

    /** Desactiva un recurso sin eliminarlo f�sicamente. */
    deactivate(id: number): Observable<WellnessResourceDto> {
        return this.update(id, { isActive: false });
    }

    /** Reactiva un recurso previamente desactivado. */
    reactivate(id: number): Observable<WellnessResourceDto> {
        return this.update(id, { isActive: true });
    }

    /**
     * Elimina un recurso (borrado l�gico � IsActive = false en BD).
     * Solo SuperAdmin.
     */
    delete(id: number): Observable<void> {
        return this.http.delete<unknown>(`${this.apiUrl}/resource/${id}`).pipe(
            map(() => void 0)
        );
    }

    // -- Registro de acceso ---------------------------------------------------

    /**
     * Registra que el usuario consumi� un recurso.
     */
    registerAccess(dto: RegisterResourceAccessDto): Observable<void> {
        return this.http.post<unknown>(`${this.apiUrl}/resource/access`, dto).pipe(
            map(() => void 0)
        );
    }

    // -- Profesionales (sin endpoint en V5 � devuelve vac�o) -----------------

    getProfessionals(): Observable<ProfessionalSupportDto[]> {
        return of([]);
    }

    getEmergencyProfessionals(): Observable<ProfessionalSupportDto[]> {
        return of([]);
    }

    // -- Helpers para la UI ---------------------------------------------------

    contentTypeIcon(contentType: ContentType | string | null | undefined): string {
        switch ((contentType ?? '').toUpperCase()) {
            case 'VIDEO':         return 'heroicons_outline:video-camera';
            case 'AUDIO':         return 'heroicons_outline:musical-note';
            case 'EXERCISE':      return 'heroicons_outline:bolt';
            case 'EXTERNAL_LINK': return 'heroicons_outline:arrow-top-right-on-square';
            case 'ARTICLE':
            default:              return 'heroicons_outline:document-text';
        }
    }

    contentTypeToneClass(contentType: ContentType | string | null | undefined): string {
        switch ((contentType ?? '').toUpperCase()) {
            case 'VIDEO':         return 'resource-card--blue';
            case 'AUDIO':         return 'resource-card--purple';
            case 'EXERCISE':      return 'resource-card--lime';
            case 'EXTERNAL_LINK': return 'resource-card--teal';
            case 'ARTICLE':
            default:              return 'resource-card--indigo';
        }
    }
}

