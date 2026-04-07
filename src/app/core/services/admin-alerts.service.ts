import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface AdminAlertsQuery {
    status?: string;
    alertLevel?: string;
    companyId?: number;
    areaId?: number;
    startDate?: string;
    endDate?: string;
}

export interface AdminAlertDto {
    alertId: number;
    userId?: number;
    userIdAnonymized?: string;
    // Enriched fields (populated from GET /users/{id} after loading)
    userName?: string;           // fullName del usuario
    userDocumentNumber?: string; // número de identificación
    userEmail?: string;
    userCompany?: string;
    userArea?: string;
    // Company fields from API response
    companyID?: number;
    companyName?: string;
    evaluationResultId?: number;
    alertLevel?: string;
    alertType?: string;
    title?: string;
    description?: string;
    status?: string;
    isAttended: boolean;
    assignedToUserId?: number | null;
    assignedToUserName?: string | null;
    attendedByUserName?: string | null;
    attendedAt?: string | null;
    actionTaken?: string | null;
    notes?: string | null;
    createdAt?: string;
}

export interface AlertStatisticsDto {
    totalAlerts: number;
    pendingCount: number;
    acknowledgedCount: number;
    resolvedCount: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
}

type BackendAlertDto = {
    alertID?: number;
    userID?: number;
    userIdentifier?: string;
    evaluationResultID?: number;
    alertLevel?: string;
    severity?: string;       // algunos endpoints retornan "severity" en lugar de "alertLevel"
    alertType?: string;
    title?: string;
    description?: string;
    status?: string;
    isAttended?: boolean;
    assignedToUserID?: number;
    assignedToUserName?: string;
    attendedByUserName?: string;
    attendedAt?: string;
    actionTaken?: string;
    notes?: string;
    createdAt?: string;
    companyID?: number;
    companyName?: string;
};

export interface CreateAlertPayload {
    evaluationID?: number;
    userID?: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    alertType: string;
    title: string;
    description: string;
}

export interface AttendAlertDto {
    actionTaken: string;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAlertsService {
    private readonly apiUrl = environment.apiUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly auth: AuthService,
    ) { }

    private get isHRManager(): boolean {
        return this.auth.isHRManager();
    }

    private mapAlert(row: BackendAlertDto): AdminAlertDto {
        return {
            alertId: Number(row.alertID ?? 0),
            userId: typeof row.userID === 'number' ? row.userID : undefined,
            userIdAnonymized: typeof row.userIdentifier === 'string' ? row.userIdentifier : undefined,
            evaluationResultId: typeof row.evaluationResultID === 'number' ? row.evaluationResultID : undefined,
            alertLevel: (row.alertLevel ?? row.severity ?? '').toUpperCase() || undefined,
            alertType: row.alertType,
            title: row.title,
            description: row.description,
            status: row.status,
            isAttended: !!row.isAttended,
            assignedToUserId: row.assignedToUserID ?? null,
            assignedToUserName: row.assignedToUserName ?? null,
            attendedByUserName: row.attendedByUserName ?? null,
            attendedAt: row.attendedAt ?? null,
            actionTaken: row.actionTaken ?? null,
            notes: row.notes ?? null,
            createdAt: row.createdAt,
            companyID: row.companyID,
            companyName: row.companyName || undefined,
        };
    }

    /** Get all alerts — auto-routes to /alert/my-company for HRManager */
    list(query?: AdminAlertsQuery): Observable<AdminAlertDto[]> {
        const url = this.isHRManager
            ? `${this.apiUrl}/alert/my-company`
            : `${this.apiUrl}/alert`;
        return this.http
            .get<unknown>(url)
            .pipe(
                map((res) => {
                    const mapped = this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x));
                    return mapped;
                }),
                map((rows) => this.applyClientFilters(rows, query))
            );
    }

    /** Get alerts by status — GET /alert/status/{status} */
    listByStatus(status: string): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/status/${status}`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    /** Get alerts by severity — GET /alert/severity/{severity} */
    listBySeverity(severity: string): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/severity/${severity}`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    /** Get alerts by company — GET /alert/company/{companyId} */
    listByCompany(companyId: number): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/company/${companyId}`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    /** Get alerts by area — GET /alert/area/{areaId} */
    listByArea(areaId: number): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/area/${areaId}`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    /** Get alert statistics — auto-routes for HRManager: derives stats from my-company alert list */
    getStatistics(): Observable<AlertStatisticsDto> {
        if (this.isHRManager) {
            return this.list().pipe(
                map((alerts) => this.computeStatsFromAlerts(alerts)),
                catchError(() => of(this.emptyStats()))
            );
        }
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/statistics`)
            .pipe(
                map((res) => this.unwrapObject<AlertStatisticsDto>(res)),
                catchError(() => of(this.emptyStats()))
            );
    }

    private emptyStats(): AlertStatisticsDto {
        return { totalAlerts: 0, pendingCount: 0, acknowledgedCount: 0, resolvedCount: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 };
    }

    computeStatsFromAlerts(alerts: AdminAlertDto[]): AlertStatisticsDto {
        return {
            totalAlerts: alerts.length,
            pendingCount: alerts.filter(a => (a.status ?? '').toUpperCase() === 'OPEN').length,
            acknowledgedCount: alerts.filter(a => (a.status ?? '').toUpperCase() === 'IN_PROGRESS' || (a.status ?? '').toUpperCase() === 'ACKNOWLEDGED').length,
            resolvedCount: alerts.filter(a => (a.status ?? '').toUpperCase() === 'RESOLVED' || (a.status ?? '').toUpperCase() === 'CLOSED').length,
            criticalCount: alerts.filter(a => (a.alertLevel ?? '').toUpperCase() === 'CRITICAL').length,
            highCount: alerts.filter(a => (a.alertLevel ?? '').toUpperCase() === 'HIGH').length,
            mediumCount: alerts.filter(a => (a.alertLevel ?? '').toUpperCase() === 'MEDIUM').length,
            lowCount: alerts.filter(a => (a.alertLevel ?? '').toUpperCase() === 'LOW').length,
        };
    }

    /** Get single alert by id */
    getById(alertId: number): Observable<AdminAlertDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/${alertId}`)
            .pipe(map((res) => this.mapAlert(this.unwrapObject<BackendAlertDto>(res))));
    }

    /** Create a new alert — POST /alert */
    create(payload: CreateAlertPayload): Observable<AdminAlertDto | null> {
        return this.http
            .post<unknown>(`${this.apiUrl}/alert`, payload)
            .pipe(
                map((res) => this.mapAlert(this.unwrapObject<BackendAlertDto>(res))),
                catchError((err) => {
                    console.error('[AdminAlertsService] POST /alert error:', err?.status, err?.error ?? err?.message);
                    return of(null);
                })
            );
    }

    /** Acknowledge an alert — PATCH /alert/{id}/acknowledge */
    acknowledge(alertId: number, actionTaken?: string): Observable<unknown> {
        const body: Record<string, string> = {};
        if (actionTaken?.trim()) body['actionTaken'] = actionTaken.trim();
        return this.http
            .patch<unknown>(`${this.apiUrl}/alert/${alertId}/acknowledge`, body)
            .pipe(catchError(() => of(null)));
    }

    /** Assign an alert to a psychologist — no dedicated endpoint, not supported by API */
    assign(_alertId: number, _payload: { assignedToUserId: number }): Observable<unknown> {
        return of(null);
    }

    /** Resolve an alert — PATCH /alert/{id}/resolve */
    resolve(alertId: number, payload: { resolution?: string }): Observable<unknown> {
        const body = { resolutionNotes: payload.resolution ?? '' };
        return this.http
            .patch<unknown>(`${this.apiUrl}/alert/${alertId}/resolve`, body)
            .pipe(catchError(() => of(null)));
    }

    /** Attend (mark as attended) — kept for backward compat, redirects to acknowledge */
    attend(alertId: number, _payload: AttendAlertDto): Observable<AdminAlertDto> {
        return this.http
            .patch<unknown>(`${this.apiUrl}/alert/${alertId}/acknowledge`, {})
            .pipe(
                map((res) => this.mapAlert(this.unwrapObject<BackendAlertDto>(res))),
                catchError(() => of(null as any))
            );
    }

    listPending(): Observable<AdminAlertDto[]> {
        // No /alert/unattended in V5 — use /alert/status/OPEN as equivalent
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/status/OPEN`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    listCritical(): Observable<AdminAlertDto[]> {
        // No /alert/critical in V5 — use /alert/severity/CRITICAL
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/severity/CRITICAL`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    private applyClientFilters(rows: AdminAlertDto[], query?: AdminAlertsQuery): AdminAlertDto[] {
        if (!query) return rows;

        let filtered = rows;

        if (query.status) {
            const wantPending = String(query.status).toLowerCase() === 'pending';
            filtered = filtered.filter((x) => (wantPending ? !x.isAttended : x.isAttended));
        }

        if (query.alertLevel) {
            const level = String(query.alertLevel).toLowerCase();
            filtered = filtered.filter((x) => String(x.alertLevel ?? '').toLowerCase() === level);
        }

        if (query.startDate || query.endDate) {
            const start = query.startDate ? new Date(query.startDate) : null;
            const end = query.endDate ? new Date(query.endDate) : null;
            filtered = filtered.filter((x) => {
                if (!x.createdAt) return true;
                const created = new Date(x.createdAt);
                if (start && created < start) return false;
                if (end && created > end) return false;
                return true;
            });
        }

        return filtered;
    }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as ApiResponse<T>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
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
