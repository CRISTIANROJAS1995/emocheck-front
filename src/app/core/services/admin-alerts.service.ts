import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    evaluationResultId?: number;
    alertLevel?: string;
    alertType?: string;
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
    alertType?: string;
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
};

export interface AttendAlertDto {
    actionTaken: string;
    notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAlertsService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private mapAlert(row: BackendAlertDto): AdminAlertDto {
        return {
            alertId: Number(row.alertID ?? 0),
            userId: typeof row.userID === 'number' ? row.userID : undefined,
            userIdAnonymized: typeof row.userIdentifier === 'string' ? row.userIdentifier : undefined,
            evaluationResultId: typeof row.evaluationResultID === 'number' ? row.evaluationResultID : undefined,
            alertLevel: row.alertLevel,
            alertType: row.alertType,
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
        };
    }

    /** Get all alerts */
    list(query?: AdminAlertsQuery): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
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

    /** Get alert statistics */
    getStatistics(): Observable<AlertStatisticsDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/statistics`)
            .pipe(
                map((res) => this.unwrapObject<AlertStatisticsDto>(res)),
                catchError(() => of({
                    totalAlerts: 0, pendingCount: 0, acknowledgedCount: 0, resolvedCount: 0,
                    criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0,
                }))
            );
    }

    /** Get single alert by id */
    getById(alertId: number): Observable<AdminAlertDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/${alertId}`)
            .pipe(map((res) => this.mapAlert(this.unwrapObject<BackendAlertDto>(res))));
    }

    /** Acknowledge an alert — PATCH /alert/{id}/acknowledge (no body) */
    acknowledge(alertId: number): Observable<unknown> {
        return this.http
            .patch<unknown>(`${this.apiUrl}/alert/${alertId}/acknowledge`, {})
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
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/unattended`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                catchError(() => of([]))
            );
    }

    listCritical(): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/critical`)
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
