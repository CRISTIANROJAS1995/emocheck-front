import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type ResourceType = 'Video' | 'Article' | 'Audio' | 'Exercise' | 'PDF' | string;
export type TargetAudience = 'Green' | 'Yellow' | 'Red' | 'All' | string;

export interface ResourceCategoryDto {
    resourceCategoryId: number;
    categoryName: string;
    description?: string;
    iconUrl?: string;
    resourceCount?: number;
    isActive?: boolean;
}

export interface WellnessResourceDto {
    wellnessResourceId: number;
    resourceCategoryId: number;
    categoryName?: string;
    title: string;
    description?: string;
    resourceType: ResourceType;
    contentUrl: string;
    thumbnailUrl?: string;
    author?: string;
    durationMinutes?: number;
    tags?: string;
    targetAudience?: TargetAudience;
    viewCount?: number;
    rating?: number;
    isFeatured?: boolean;
    createdAt?: string;
}

export interface RecommendedResourcesDto {
    userRiskLevel: TargetAudience;
    recommendationReason?: string;
    resources: Array<Pick<WellnessResourceDto, 'wellnessResourceId' | 'title' | 'description' | 'resourceType' | 'contentUrl' | 'durationMinutes' | 'targetAudience'>>;
}

export interface TrackAccessDto {
    durationSeconds: number;
    completedPercentage: number;
    rating?: number;
    feedback?: string;
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

// Swagger DTOs (casing differs from UI-facing DTOs)
interface SwaggerResourceCategoryDto {
    resourceCategoryID: number;
    name?: string | null;
    description?: string | null;
    iconUrl?: string | null;
    displayOrder?: number;
    resourceCount?: number;
}

interface SwaggerWellnessResourceDto {
    wellnessResourceID: number;
    resourceCategoryID: number;
    categoryName?: string | null;
    title?: string | null;
    description?: string | null;
    resourceType?: string | null;
    contentUrl?: string | null;
    thumbnailUrl?: string | null;
    author?: string | null;
    durationMinutes?: number | null;
    tags?: string | null;
    targetAudience?: string | null;
    viewCount?: number;
    rating?: number | null;
    isFeatured?: boolean;
}

interface SwaggerEvaluationWithResultDto {
    completedAt: string;
    result?: {
        evaluationResultID?: number;
        evaluationResultId?: number;
        riskLevel?: string | null;
    } | null;
}

interface SwaggerRecommendationDto {
    recommendationID: number;
    title?: string | null;
    recommendationText?: string | null;
    resourceUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ResourcesService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private normalizeResponse(res: unknown): unknown {
        if (typeof res !== 'string') return res;
        const trimmed = res.trim();
        if (!trimmed) return res;
        try {
            return JSON.parse(trimmed);
        } catch {
            return res;
        }
    }

    private unwrapApiResponse<T>(res: unknown, fallbackErrorMessage: string): T {
        const anyRes = this.normalizeResponse(res) as any;

        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes) {
            const api = anyRes as Partial<ApiResponse<T>>;
            if (!api.success) throw new Error((api as any)?.message || fallbackErrorMessage);
            return (api.data as T) ?? (undefined as any);
        }

        return anyRes as T;
    }

    private toCategoryDto(dto: SwaggerResourceCategoryDto): ResourceCategoryDto {
        return {
            resourceCategoryId: dto.resourceCategoryID,
            categoryName: (dto.name ?? '').toString(),
            description: dto.description ?? undefined,
            iconUrl: dto.iconUrl ?? undefined,
            resourceCount: dto.resourceCount ?? undefined,
        };
    }

    private toResourceDto(dto: SwaggerWellnessResourceDto): WellnessResourceDto {
        return {
            wellnessResourceId: dto.wellnessResourceID,
            resourceCategoryId: dto.resourceCategoryID,
            categoryName: dto.categoryName ?? undefined,
            title: (dto.title ?? '').toString(),
            description: dto.description ?? undefined,
            resourceType: (dto.resourceType ?? '').toString(),
            contentUrl: (dto.contentUrl ?? '').toString(),
            thumbnailUrl: dto.thumbnailUrl ?? undefined,
            author: dto.author ?? undefined,
            durationMinutes: dto.durationMinutes ?? undefined,
            tags: dto.tags ?? undefined,
            targetAudience: (dto.targetAudience ?? undefined) as any,
            viewCount: dto.viewCount ?? undefined,
            rating: dto.rating ?? undefined,
            isFeatured: dto.isFeatured ?? undefined,
        };
    }

    getCategories(): Observable<ResourceCategoryDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/resource/categories`).pipe(
            map((res) => {
                const items = this.unwrapApiResponse<SwaggerResourceCategoryDto[]>(res, 'No fue posible obtener categorías') ?? [];
                return (items ?? []).map((c) => this.toCategoryDto(c));
            })
        );
    }

    getResources(filters?: {
        categoryId?: number;
        resourceType?: string;
        targetAudience?: string;
        isFeatured?: boolean;
    }): Observable<WellnessResourceDto[]> {
        const onlyCategoryFilter =
            filters?.categoryId != null && !filters?.resourceType && !filters?.targetAudience && filters?.isFeatured == null;

        const url = onlyCategoryFilter
            ? `${this.apiUrl}/resource/by-category/${filters!.categoryId}`
            : `${this.apiUrl}/resource`;

        const params: Record<string, string> = {};
        if (!onlyCategoryFilter) {
            if (filters?.categoryId != null) params['categoryId'] = String(filters.categoryId);
            if (filters?.resourceType) params['resourceType'] = String(filters.resourceType);
            if (filters?.targetAudience) params['targetAudience'] = String(filters.targetAudience);
            if (filters?.isFeatured != null) params['isFeatured'] = String(!!filters.isFeatured);
        }

        return this.http.get<unknown>(url, { params }).pipe(
            map((res) => {
                const items = this.unwrapApiResponse<SwaggerWellnessResourceDto[]>(res, 'No fue posible obtener recursos') ?? [];
                return (items ?? []).map((r) => this.toResourceDto(r));
            })
        );
    }

    getFeatured(): Observable<WellnessResourceDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/resource`).pipe(
            map((res) => {
                const items = this.unwrapApiResponse<SwaggerWellnessResourceDto[]>(res, 'No fue posible obtener recursos destacados') ?? [];
                return (items ?? []).filter((r) => r.isFeatured).map((r) => this.toResourceDto(r));
            })
        );
    }

    getRecommended(): Observable<RecommendedResourcesDto> {
        // Use the native V5 endpoint: GET /api/resource/recommended
        return this.http.get<unknown>(`${this.apiUrl}/resource/recommended`).pipe(
            map((res) => {
                const data = this.unwrapApiResponse<any>(res, 'No fue posible obtener recomendaciones');
                // API may return an array of resources or a wrapper object
                if (Array.isArray(data)) {
                    return {
                        userRiskLevel: 'All' as TargetAudience,
                        recommendationReason: 'Recomendaciones para ti',
                        resources: (data as SwaggerWellnessResourceDto[]).slice(0, 6).map((r) => ({
                            wellnessResourceId: r.wellnessResourceID,
                            title: r.title ?? '',
                            description: r.description ?? undefined,
                            resourceType: r.resourceType ?? '',
                            contentUrl: r.contentUrl ?? '',
                            durationMinutes: r.durationMinutes ?? undefined,
                            targetAudience: (r.targetAudience ?? 'All') as TargetAudience,
                        })),
                    } as RecommendedResourcesDto;
                }
                // Already a RecommendedResourcesDto shape
                return data as RecommendedResourcesDto;
            }),
            catchError(() => this.getRecommendedFallback('All'))
        );
    }

    private getRecommendedFallback(risk: TargetAudience): Observable<RecommendedResourcesDto> {
        return this.getResources().pipe(
            map((resources) => {
                const filtered = (resources ?? []).filter((r) => {
                    const audience = (r.targetAudience ?? 'All').toString();
                    return audience === 'All' || audience.toLowerCase() === String(risk ?? 'All').toLowerCase();
                });

                return {
                    userRiskLevel: (risk ?? 'All') as TargetAudience,
                    recommendationReason: 'Recomendaciones generales',
                    resources: filtered
                        .slice(0, 6)
                        .map((r) => ({
                            wellnessResourceId: r.wellnessResourceId,
                            title: r.title,
                            description: r.description,
                            resourceType: r.resourceType,
                            contentUrl: r.contentUrl,
                            durationMinutes: r.durationMinutes,
                            targetAudience: r.targetAudience,
                        })),
                } as RecommendedResourcesDto;
            }),
            catchError(() =>
                of({
                    userRiskLevel: (risk ?? 'All') as TargetAudience,
                    recommendationReason: 'Recomendaciones generales',
                    resources: [],
                } as RecommendedResourcesDto)
            )
        );
    }

    private unwrapArray<T>(res: unknown): T[] {
        const anyRes = this.normalizeResponse(res) as any;
        if (Array.isArray(anyRes)) return anyRes as T[];
        if (anyRes?.success === true) return (anyRes.data ?? []) as T[];
        return [];
    }

    trackAccess(_resourceId: number, _payload: TrackAccessDto): Observable<string | null> {
        // V5 API does not expose a resource access tracking endpoint.
        return of(null);
    }

    getProfessionals(): Observable<ProfessionalSupportDto[]> {
        // V5 API does not expose a professionals directory endpoint.
        // Return empty array to avoid 404 errors on the resources page.
        return of([]);
    }

    getEmergencyProfessionals(): Observable<ProfessionalSupportDto[]> {
        // V5 API does not expose an emergency professionals endpoint.
        // Return empty array to avoid 404 errors on the resources page.
        return of([]);
    }
}
