import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

export interface DashboardQuery {
    companyId?: number;
    siteId?: number;
    areaId?: number;
    moduleId?: number;
    startDate?: string; // ISO 8601 or YYYY-MM-DD
    endDate?: string;   // ISO 8601 or YYYY-MM-DD
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

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
    ) { }

    private get isHRManager(): boolean {
        return this.auth.isHRManager();
    }

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
        const params = this.buildParams(query);
        const url = this.isHRManager
            ? `${this.apiUrl}/dashboard/my-company/indicators`
            : `${this.apiUrl}/dashboard/indicators`;
        return this.http.get<unknown>(url, { params }).pipe(
            map((res) => this.mapIndicators(this.unwrapObject<any>(res))),
            catchError(() => {
                return of(this.mapIndicators({}));
            })
        );
    }

    /**
     * Estadísticas del usuario autenticado — GET /api/dashboard/user-stats (no en Postman, kept as fallback)
     */
    getUserStats(query?: DashboardQuery): Observable<DashboardIndicatorsDto> {
        const params = this.buildParams(query);
        return this.http.get<unknown>(`${this.apiUrl}/dashboard/indicators`, { params }).pipe(
            map((res) => {
                return this.mapIndicators(this.unwrapObject<any>(res));
            })
        );
    }

    getRiskDistribution(query?: DashboardQuery): Observable<RiskDistributionDto> {
        const params = this.buildParams(query);
        const url = this.isHRManager
            ? `${this.apiUrl}/dashboard/my-company/risk-distribution`
            : `${this.apiUrl}/dashboard/risk-distribution`;
        return this.http.get<unknown>(url, { params }).pipe(
            map((res) => {
                const data = this.unwrapObject<any>(res);
                return this.mapRiskDistribution(data);
            }),
            catchError(() => of(this.mapRiskDistribution({})))
        );
    }

    getTrends(query: DashboardQuery): Observable<TrendDataDto[]> {
        const params = this.buildParams(query);
        const url = this.isHRManager
            ? `${this.apiUrl}/dashboard/my-company/trends`
            : `${this.apiUrl}/dashboard/trends`;
        return this.http.get<unknown>(url, { params }).pipe(
            map((res) => {
                const data = this.unwrapObject<any>(res);
                return Array.isArray(data) ? data : (Array.isArray(data?.trends) ? data.trends : []);
            }),
            catchError(() => of([]))
        );
    }

    getModuleStatistics(query?: Omit<DashboardQuery, 'periodType'>): Observable<ModuleStatisticsDto[]> {
        const url = this.isHRManager
            ? `${this.apiUrl}/dashboard/my-company/module-statistics`
            : `${this.apiUrl}/dashboard/module-statistics`;
        return this.http.get<unknown>(url, { params: this.buildParams(query) }).pipe(
            map((res) => {
                const data = this.unwrapObject<any>(res);
                return Array.isArray(data)
                    ? data.map((m: any) => this.mapModuleStat(m))
                    : Array.isArray(data?.moduleStatistics)
                        ? data.moduleStatistics.map((m: any) => this.mapModuleStat(m))
                        : [];
            }),
            catchError(() => of([]))
        );
    }

    /** GET /api/dashboard/my-company/area-comparison — HRManager only */
    getAreaComparison(query?: Omit<DashboardQuery, 'periodType'>): Observable<any[]> {
        const url = this.isHRManager
            ? `${this.apiUrl}/dashboard/my-company/area-comparison`
            : `${this.apiUrl}/dashboard/area-comparison`;
        return this.http.get<unknown>(url, { params: this.buildParams(query) }).pipe(
            map((res) => {
                const data = this.unwrapObject<any>(res);
                return Array.isArray(data) ? data : [];
            }),
            catchError(() => of([]))
        );
    }

    private buildParams(query?: DashboardQuery): HttpParams {
        let params = new HttpParams();

        const setIf = (key: string, value: unknown) => {
            if (value === undefined || value === null || value === '') return;
            params = params.set(key, String(value));
        };

        // Backend V5 expects PascalCase query params (CompanyID, SiteID, etc.)
        setIf('CompanyID', query?.companyId);
        setIf('SiteID', query?.siteId);
        setIf('AreaID', query?.areaId);
        setIf('ModuleID', (query as any)?.moduleId);

        // Dates: backend expects YYYY-MM-DD. Always send a default range if not provided
        // (backend returns 400 when StartDate/EndDate are missing).
        const toYMD = (iso: string) => iso.substring(0, 10);
        const today = new Date();
        const defaultEnd = toYMD(today.toISOString());
        const defaultStart = toYMD(new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString());

        setIf('StartDate', query?.startDate ? toYMD(query.startDate) : defaultStart);
        setIf('EndDate',   query?.endDate   ? toYMD(query.endDate)   : defaultEnd);

        setIf('periodType', query?.periodType);
        return params;
    }
}
