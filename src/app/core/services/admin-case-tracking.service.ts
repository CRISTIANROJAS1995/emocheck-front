import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminCaseQuery {
    status?: 'Open' | 'InProgress' | 'Resolved' | 'Closed' | string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical' | string;
    psychologistId?: number;
}

export interface CaseTrackingDto {
    caseTrackingId: number;
    alertId: number;
    userId: number;
    userInitials?: string;
    assignedToPsychologistId?: number;
    assignedToPsychologistName?: string;
    caseNumber?: string;
    status?: string;
    priority?: string;
    initialAssessment?: string;
    interventionPlan?: string;
    progressNotes?: string;
    finalOutcome?: string;
    openedAt?: string;
    closedAt?: string;
    nextFollowUpDate?: string;
}

export interface CreateCaseTrackingDto {
    alertId: number;
    userId?: number;
    assignedToPsychologistId: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
    initialAssessment: string;
    interventionPlan: string;
    nextFollowUpDate?: string;
}

export interface UpdateCaseTrackingDto {
    status?: string;
    progressNotes?: string;
    nextFollowUpDate?: string;
}

type BackendCaseTrackingDto = {
    caseTrackingID?: number;
    caseNumber?: string;
    alertID?: number;
    userID?: number;
    userFullName?: string;
    assignedToPsychologistID?: number;
    psychologistName?: string;
    status?: string;
    priority?: string;
    initialAssessment?: string;
    interventionPlan?: string;
    progressNotes?: string;
    finalOutcome?: string;
    openedAt?: string;
    closedAt?: string;
    nextFollowUpDate?: string;
};

@Injectable({ providedIn: 'root' })
export class AdminCaseTrackingService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private toInitials(fullName: string | null | undefined): string | undefined {
        const raw = String(fullName ?? '').trim();
        if (!raw) return undefined;
        const parts = raw.split(/\s+/).filter(Boolean);
        const a = parts[0]?.[0] ?? '';
        const b = parts[1]?.[0] ?? '';
        const initials = (a + b).toUpperCase();
        return initials || undefined;
    }

    private mapCase(row: BackendCaseTrackingDto): CaseTrackingDto {
        return {
            caseTrackingId: Number(row.caseTrackingID ?? 0),
            alertId: Number(row.alertID ?? 0),
            userId: Number(row.userID ?? 0),
            userInitials: this.toInitials(row.userFullName),
            assignedToPsychologistId:
                typeof row.assignedToPsychologistID === 'number' ? row.assignedToPsychologistID : undefined,
            assignedToPsychologistName: row.psychologistName,
            caseNumber: row.caseNumber,
            status: row.status,
            priority: row.priority,
            initialAssessment: row.initialAssessment,
            interventionPlan: row.interventionPlan,
            progressNotes: row.progressNotes,
            finalOutcome: row.finalOutcome,
            openedAt: row.openedAt,
            closedAt: row.closedAt,
            nextFollowUpDate: row.nextFollowUpDate,
        };
    }

    list(query?: AdminCaseQuery): Observable<CaseTrackingDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking`)
            .pipe(
                map((res) => this.unwrapArray<BackendCaseTrackingDto>(res).map((x) => this.mapCase(x))),
                map((rows) => this.applyClientFilters(rows, query))
            );
    }

    create(payload: CreateCaseTrackingDto): Observable<CaseTrackingDto> {
        const backendPayload = {
            alertID: payload.alertId,
            userID: typeof payload.userId === 'number' ? payload.userId : 0,
            assignedToPsychologistID: payload.assignedToPsychologistId,
            priority: payload.priority,
            initialAssessment: payload.initialAssessment,
            interventionPlan: payload.interventionPlan,
            nextFollowUpDate: payload.nextFollowUpDate,
        };

        return this.http
            .post<unknown>(`${this.apiUrl}/casetracking`, backendPayload)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    update(caseId: number, payload: UpdateCaseTrackingDto): Observable<CaseTrackingDto> {
        return this.http
            .put<unknown>(`${this.apiUrl}/casetracking/${caseId}`, payload)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    close(caseId: number): Observable<CaseTrackingDto> {
        return this.http
            .post<unknown>(`${this.apiUrl}/casetracking/${caseId}/close`, {})
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    private applyClientFilters(rows: CaseTrackingDto[], query?: AdminCaseQuery): CaseTrackingDto[] {
        if (!query) return rows;

        let filtered = rows;
        if (query.status) {
            const st = String(query.status).toLowerCase();
            filtered = filtered.filter((x) => String(x.status ?? '').toLowerCase() === st);
        }
        if (query.priority) {
            const pr = String(query.priority).toLowerCase();
            filtered = filtered.filter((x) => String(x.priority ?? '').toLowerCase() === pr);
        }
        if (typeof query.psychologistId === 'number') {
            filtered = filtered.filter((x) => x.assignedToPsychologistId === query.psychologistId);
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
