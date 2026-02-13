import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface DashboardQuery {
    companyId?: number;
    siteId?: number;
    areaId?: number;
    startDate?: string; // ISO 8601
    endDate?: string; // ISO 8601
    periodType?: 'daily' | 'weekly' | 'monthly' | string;
}

export interface RiskDistributionDto {
    greenCount: number;
    yellowCount: number;
    redCount: number;
    greenPercentage: number;
    yellowPercentage: number;
    redPercentage: number;
}

export interface ModuleStatisticsDto {
    moduleName?: string | null;
    totalEvaluations: number;
    averageScore: number;
    riskDistribution: RiskDistributionDto;
}

export interface DashboardIndicatorsDto {
    totalUsers: number;
    totalEvaluationsCompleted: number;
    participationRate: number;
    unattendedAlerts: number;
    riskDistribution: RiskDistributionDto;
    moduleStatistics?: ModuleStatisticsDto[] | null;
}

export interface TrendDataDto {
    period?: string | null;
    greenCount: number;
    yellowCount: number;
    redCount: number;
    averageScore: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && anyRes.success === true && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
    }

    private unwrapArray<T>(res: unknown): T[] {
        const anyRes = res as any;
        if (Array.isArray(anyRes)) return anyRes as T[];
        if (anyRes && typeof anyRes === 'object' && anyRes.success === true && 'data' in anyRes) {
            return (anyRes.data ?? []) as T[];
        }
        return [];
    }

    getIndicators(query?: DashboardQuery): Observable<DashboardIndicatorsDto> {
        // Swagger: GET /api/dashboard/indicators -> DashboardIndicatorsDto (direct)
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/indicators`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapObject<DashboardIndicatorsDto>(res))
        );
    }

    getRiskDistribution(query?: DashboardQuery): Observable<RiskDistributionDto> {
        // Swagger: GET /api/dashboard/risk-distribution -> RiskDistributionDto (direct)
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/risk-distribution`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapObject<RiskDistributionDto>(res))
        );
    }

    getTrends(query: DashboardQuery): Observable<TrendDataDto[]> {
        // Swagger: GET /api/dashboard/trends -> TrendDataDto[] (direct)
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/trends`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapArray<TrendDataDto>(res))
        );
    }

    getModuleStatistics(query?: Omit<DashboardQuery, 'periodType'>): Observable<ModuleStatisticsDto[]> {
        // Swagger: GET /api/dashboard/module-statistics -> ModuleStatisticsDto[] (direct)
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/module-statistics`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapArray<ModuleStatisticsDto>(res))
        );
    }

    private buildParams(query?: DashboardQuery): HttpParams {
        let params = new HttpParams();
        if (!query) return params;

        const setIf = (key: string, value: unknown) => {
            if (value === undefined || value === null || value === '') return;
            params = params.set(key, String(value));
        };

        setIf('companyId', query.companyId);
        setIf('siteId', query.siteId);
        setIf('areaId', query.areaId);
        setIf('startDate', query.startDate);
        setIf('endDate', query.endDate);
        setIf('periodType', query.periodType);
        return params;
    }
}
