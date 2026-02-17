import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminAssessmentModuleDto {
    assessmentModuleID: number;
    moduleName?: string | null;
    description?: string | null;
    instrumentType?: string | null;
    maxScore?: number;
    greenThreshold?: number;
    yellowThreshold?: number;
    orderIndex?: number;
    isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminModulesService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    listActive(): Observable<AdminAssessmentModuleDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/assessmentmodule/active`)
            .pipe(map((res) => this.unwrapArray<AdminAssessmentModuleDto>(res)));
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as ApiResponse<T[]>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return Array.isArray(anyRes.data) ? anyRes.data : [];
        }
        return [];
    }
}
