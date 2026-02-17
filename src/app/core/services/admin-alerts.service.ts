import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminAlertsQuery {
    status?: 'Pending' | 'Attended' | string;
    alertLevel?: 'Critical' | 'High' | 'Medium' | string;
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
    isAttended: boolean;
    attendedByUserName?: string | null;
    attendedAt?: string | null;
    actionTaken?: string | null;
    notes?: string | null;
    createdAt?: string;
}

type BackendAlertDto = {
    alertID?: number;
    userID?: number;
    userIdentifier?: string;
    evaluationResultID?: number;
    alertLevel?: string;
    alertType?: string;
    description?: string;
    isAttended?: boolean;
    attendedByUserName?: string;
    attendedAt?: string;
    actionTaken?: string;
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
            isAttended: !!row.isAttended,
            attendedByUserName: row.attendedByUserName ?? null,
            attendedAt: row.attendedAt ?? null,
            actionTaken: row.actionTaken ?? null,
            createdAt: row.createdAt,
        };
    }

    list(query?: AdminAlertsQuery): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert`)
            .pipe(
                map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))),
                map((rows) => this.applyClientFilters(rows, query))
            );
    }

    listPending(): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/unattended`)
            .pipe(map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))));
    }

    listCritical(): Observable<AdminAlertDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/alert/critical`)
            .pipe(map((res) => this.unwrapArray<BackendAlertDto>(res).map((x) => this.mapAlert(x))));
    }

    attend(alertId: number, payload: AttendAlertDto): Observable<AdminAlertDto> {
        return this.http
            .put<unknown>(`${this.apiUrl}/alert/${alertId}/attend`, payload)
            .pipe(map((res) => this.mapAlert(this.unwrapObject<BackendAlertDto>(res))));
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
