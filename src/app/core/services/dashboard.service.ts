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

    /**
     * Maps backend risk-distribution fields (low/moderate/high/severe)
     * to frontend DTO fields (green/yellow/red).
     */
    private mapRiskDistribution(raw: any): RiskDistributionDto {
        if (!raw || typeof raw !== 'object') {
            return { greenCount: 0, yellowCount: 0, redCount: 0, greenPercentage: 0, yellowPercentage: 0, redPercentage: 0 };
        }
        // If the response already uses green/yellow/red field names, pass through
        if ('greenCount' in raw) return raw as RiskDistributionDto;
        // Map from backend low/moderate/high/severe
        return {
            greenCount: Number(raw.lowCount ?? 0),
            yellowCount: Number(raw.moderateCount ?? 0),
            redCount: Number(raw.highCount ?? 0) + Number(raw.severeCount ?? 0),
            greenPercentage: Number(raw.lowPercentage ?? 0),
            yellowPercentage: Number(raw.moderatePercentage ?? 0),
            redPercentage: Number(raw.highPercentage ?? 0) + Number(raw.severePercentage ?? 0),
        };
    }

    /**
     * Maps backend indicator fields to frontend DashboardIndicatorsDto.
     */
    private mapIndicators(raw: any): DashboardIndicatorsDto {
        if (!raw || typeof raw !== 'object') {
            return {
                totalUsers: 0, totalEvaluationsCompleted: 0, participationRate: 0,
                unattendedAlerts: 0, riskDistribution: this.mapRiskDistribution(null),
            };
        }
        // If already using frontend field names, pass through
        if ('totalEvaluationsCompleted' in raw) return raw as DashboardIndicatorsDto;
        return {
            totalUsers: Number(raw.totalUsers ?? 0),
            totalEvaluationsCompleted: Number(raw.completedEvaluations ?? raw.totalEvaluations ?? 0),
            participationRate: Number(raw.participationRate ?? raw.completionRate ?? 0),
            unattendedAlerts: Number(raw.activeAlerts ?? raw.unattendedAlerts ?? 0),
            riskDistribution: raw.riskDistribution
                ? this.mapRiskDistribution(raw.riskDistribution)
                : this.mapRiskDistribution(null),
            moduleStatistics: Array.isArray(raw.moduleStatistics)
                ? raw.moduleStatistics.map((m: any) => this.mapModuleStat(m))
                : null,
        };
    }

    /**
     * Maps backend module-statistics fields to frontend ModuleStatisticsDto.
     */
    private mapModuleStat(raw: any): ModuleStatisticsDto {
        if (!raw || typeof raw !== 'object') {
            return { moduleName: null, totalEvaluations: 0, averageScore: 0, riskDistribution: this.mapRiskDistribution(null) };
        }
        return {
            moduleName: raw.moduleName ?? null,
            totalEvaluations: Number(raw.evaluationCount ?? raw.totalEvaluations ?? 0),
            averageScore: Number(raw.averageScore ?? 0),
            riskDistribution: raw.riskDistribution
                ? this.mapRiskDistribution(raw.riskDistribution)
                : this.mapRiskDistribution(null),
        };
    }

    /**
     * Maps backend trend data fields to frontend TrendDataDto.
     */
    private mapTrend(raw: any): TrendDataDto {
        if (!raw || typeof raw !== 'object') {
            return { period: null, greenCount: 0, yellowCount: 0, redCount: 0, averageScore: 0 };
        }
        // If already using frontend field names, pass through
        if ('greenCount' in raw) return raw as TrendDataDto;
        return {
            period: raw.period ?? null,
            greenCount: Number(raw.lowCount ?? 0),
            yellowCount: Number(raw.moderateCount ?? 0),
            redCount: Number(raw.highCount ?? 0) + Number(raw.severeCount ?? 0),
            averageScore: Number(raw.averageScore ?? 0),
        };
    }

    getIndicators(query?: DashboardQuery): Observable<DashboardIndicatorsDto> {
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/indicators`, { params: this.buildParams(query) }).pipe(
            map((res) => this.mapIndicators(this.unwrapObject<any>(res)))
        );
    }

    getRiskDistribution(query?: DashboardQuery): Observable<RiskDistributionDto> {
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/risk-distribution`, { params: this.buildParams(query) }).pipe(
            map((res) => this.mapRiskDistribution(this.unwrapObject<any>(res)))
        );
    }

    getTrends(query: DashboardQuery): Observable<TrendDataDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/trends`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapArray<any>(res).map((t: any) => this.mapTrend(t)))
        );
    }

    getModuleStatistics(query?: Omit<DashboardQuery, 'periodType'>): Observable<ModuleStatisticsDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/module-statistics`, { params: this.buildParams(query) }).pipe(
            map((res) => this.unwrapArray<any>(res).map((m: any) => this.mapModuleStat(m)))
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
