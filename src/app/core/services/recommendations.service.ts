import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type RecommendationPriority = 'Low' | 'Medium' | 'High' | string;
export type RecommendationType = 'Individual' | 'Medical' | 'Organizational' | string;
export type RecommendationTargetAudience = 'Employee' | 'Psychologist' | 'HSE' | 'Admin' | 'CompanyAdmin' | string;

export interface RecommendationActionButtonDto {
    text: string;
    url: string;
}

export interface RecommendationDto {
    recommendationId: number;
    evaluationResultId?: number;
    recommendationType?: RecommendationType;
    title: string;
    description?: string;
    priority?: RecommendationPriority;
    targetAudience?: RecommendationTargetAudience;
    isRead?: boolean;
    createdAt?: string;
    resourceUrl?: string;
    iconUrl?: string;
    actionButton?: RecommendationActionButtonDto;
}

type SwaggerRecommendationDto = {
    recommendationID: number;
    typeName?: string | null;
    title?: string | null;
    recommendationText?: string | null;
    priority?: string | null;
    resourceUrl?: string | null;
    isViewed: boolean;
};

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private unwrapArray<T>(res: unknown): T[] {
        const anyRes = res as any;
        if (Array.isArray(anyRes)) return anyRes as T[];

        // Defensive: some endpoints in this API return ApiResponse<T>
        if (anyRes && typeof anyRes === 'object' && anyRes.success === true) {
            return (anyRes.data ?? []) as T[];
        }

        return [];
    }

    private mapSwaggerToUi(dto: SwaggerRecommendationDto, evaluationResultId?: number): RecommendationDto {
        return {
            recommendationId: Number(dto.recommendationID ?? 0),
            evaluationResultId,
            recommendationType: (dto.typeName ?? undefined) as any,
            title: String(dto.title ?? ''),
            description: String(dto.recommendationText ?? ''),
            priority: (dto.priority ?? undefined) as any,
            isRead: Boolean(dto.isViewed ?? false),
            resourceUrl: dto.resourceUrl ?? undefined,
        };
    }

    getMyRecommendations(_filters?: { isRead?: boolean }): Observable<RecommendationDto[]> {
        // V5 API: GET /api/recommendation/by-result/{id} is the user-facing endpoint.
        // There is no "my recommendations" list endpoint — return empty to avoid 404.
        return new Observable((obs) => { obs.next([]); obs.complete(); });
    }

    getByResult(evaluationResultId: number): Observable<RecommendationDto[]> {
        // Swagger: GET /api/recommendation/by-result/{evaluationResultId} -> RecommendationDto[] (direct)
        return this.http.get<unknown>(`${this.apiUrl}/recommendation/by-result/${evaluationResultId}`).pipe(
            map((res) => {
                const items = this.unwrapArray<SwaggerRecommendationDto>(res);
                return (items ?? []).map((r) => this.mapSwaggerToUi(r, evaluationResultId));
            })
        );
    }

    markRead(recommendationId: number): Observable<void> {
        // V5 API does not expose a mark-viewed endpoint — no-op to avoid 404.
        return new Observable((obs) => { obs.next(); obs.complete(); });
    }
}
