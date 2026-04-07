import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AdminCaseQuery {
    status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ESCALATED' | string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    psychologistId?: number;
}

export interface CaseTrackingDto {
    caseTrackingId: number;
    alertId: number;
    userId: number;
    userInitials?: string;
    userName?: string;
    // Enriched fields (populated from users list after loading)
    userDocumentNumber?: string;
    userEmail?: string;
    userCompany?: string;
    userArea?: string;
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

export interface FollowUpDto {
    followUpId: number;
    caseTrackingId: number;
    notes?: string;
    actionType?: string;
    outcome?: string;
    followUpDate?: string;
    nextActionDate?: string;
    createdByUserId?: number;
    createdByName?: string;
    createdAt?: string;
}

export interface CreateFollowUpDto {
    notes: string;
    followUpType?: 'SESSION' | 'CALL' | 'EMAIL' | string;
    scheduledDate?: string;
}

export interface CreateCaseTrackingDto {
    alertId: number;
    userId?: number;
    assignedToUserID: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    description: string;
}

export interface UpdateCaseTrackingDto {
    status?: string;
    assignedToUserID?: number;
    priority?: string;
}

type BackendCaseTrackingDto = {
    caseTrackingID?: number;
    caseNumber?: string;
    alertID?: number;
    userID?: number;
    userFullName?: string;
    // Backend real fields (confirmed from API response)
    assignedToUserID?: number;
    assignedToUserName?: string;
    // Legacy / alternative field names (kept for compatibility)
    assignedToPsychologistID?: number;
    psychologistName?: string;
    status?: string;
    priority?: string;
    description?: string;        // backend uses "description" not "initialAssessment"
    actionPlan?: string;         // backend uses "actionPlan"
    closureReason?: string;
    initialAssessment?: string;
    interventionPlan?: string;
    progressNotes?: string;
    finalOutcome?: string;
    createdAt?: string;          // backend uses "createdAt" not "openedAt"
    openedAt?: string;
    closedAt?: string;
    updatedAt?: string;
    nextFollowUpDate?: string;
    followUps?: unknown[];
};

type BackendFollowUpDto = {
    followUpID?: number;
    caseFollowUpID?: number;      // real backend field name
    caseTrackingID?: number;
    notes?: string;
    description?: string;         // real backend field name
    actionType?: string;
    followUpType?: string;
    outcome?: string;
    followUpDate?: string;
    scheduledDate?: string;
    nextActionDate?: string;
    performedAt?: string;         // real backend field name for createdAt
    createdByUserID?: number;
    performedByUserID?: number;   // real backend field name
    createdByName?: string;
    performedByUserName?: string; // real backend field name
    createdAt?: string;
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
        const assignedId = row.assignedToUserID ?? row.assignedToPsychologistID;
        const assignedName = row.assignedToUserName ?? row.psychologistName;
        const userName = row.userFullName?.trim() || undefined;
        return {
            caseTrackingId: Number(row.caseTrackingID ?? 0),
            alertId: Number(row.alertID ?? 0),
            userId: Number(row.userID ?? 0),
            userInitials: this.toInitials(userName),
            userName: userName,
            assignedToPsychologistId: typeof assignedId === 'number' ? assignedId : undefined,
            assignedToPsychologistName: assignedName?.trim() || undefined,
            caseNumber: row.caseNumber,
            status: row.status,
            priority: row.priority,
            // description/actionPlan are the real backend fields; fallback to old names
            initialAssessment: row.description ?? row.initialAssessment,
            interventionPlan: row.actionPlan ?? row.interventionPlan,
            progressNotes: row.progressNotes,
            finalOutcome: row.closureReason ?? row.finalOutcome,
            // createdAt is the real backend field for opening date
            openedAt: row.createdAt ?? row.openedAt,
            closedAt: row.closedAt,
            nextFollowUpDate: row.nextFollowUpDate,
        };
    }

    private mapFollowUp(row: BackendFollowUpDto): FollowUpDto {
        return {
            followUpId: Number(row.caseFollowUpID ?? row.followUpID ?? 0),
            caseTrackingId: Number(row.caseTrackingID ?? 0),
            notes: row.description ?? row.notes,
            actionType: row.actionType ?? row.followUpType,
            outcome: row.outcome ?? undefined,
            followUpDate: row.scheduledDate ?? row.followUpDate,
            nextActionDate: row.nextActionDate ?? undefined,
            createdByUserId: row.performedByUserID ?? row.createdByUserID,
            createdByName: row.performedByUserName ?? row.createdByName,
            createdAt: row.performedAt ?? row.createdAt,
        };
    }

    // ── Cases CRUD ─────────────────────────────
    /** GET /api/casetracking/my-company — all cases for the HRManager's company */
    listMyCompany(): Observable<CaseTrackingDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking/my-company`)
            .pipe(
                map((res) => this.unwrapArray<BackendCaseTrackingDto>(res).map((x) => this.mapCase(x))),
                catchError(() => of([])),
            );
    }

    list(query?: AdminCaseQuery): Observable<CaseTrackingDto[]> {
        // Si no hay filtro de status, traer todos los estados en paralelo
        if (!query?.status) {
            const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'ESCALATED'];
            return forkJoin(
                ALL_STATUSES.map(s =>
                    this.http.get<unknown>(`${this.apiUrl}/casetracking/status/${s}`).pipe(
                        map(res => this.unwrapArray<BackendCaseTrackingDto>(res).map(x => this.mapCase(x))),
                        catchError(() => of([] as CaseTrackingDto[])),
                    )
                )
            ).pipe(
                map(results => {
                    const all = (results as CaseTrackingDto[][]).flat();
                    return this.applyClientFilters(all, query);
                }),
            );
        }

        const status = query.status.toUpperCase();
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking/status/${status}`)
            .pipe(
                map((res) => {
                    const rows = this.unwrapArray<BackendCaseTrackingDto>(res);
                    return rows.map((x) => this.mapCase(x));
                }),
                map((rows) => this.applyClientFilters(rows, query)),
                catchError((err) => { console.error('[CaseTracking] ERROR:', err); return of([]); }),
            );
    }

    getById(caseId: number): Observable<CaseTrackingDto> {
        // Backend V5: GET /api/casetracking/{id}
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking/${caseId}`)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    /** Get cases by status — GET /casetracking/status/{status} */
    listByStatus(status: string): Observable<CaseTrackingDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking/status/${status.toUpperCase()}`)
            .pipe(
                map((res) => this.unwrapArray<BackendCaseTrackingDto>(res).map((x) => this.mapCase(x))),
                catchError(() => of([])),
            );
    }

    create(payload: CreateCaseTrackingDto): Observable<CaseTrackingDto> {
        // Backend V5: POST /api/casetracking
        const backendPayload = {
            alertID: payload.alertId,
            userID: typeof payload.userId === 'number' ? payload.userId : undefined,
            assignedToUserID: payload.assignedToUserID,
            priority: payload.priority,
            description: payload.description,
        };
        return this.http
            .post<unknown>(`${this.apiUrl}/casetracking`, backendPayload)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    update(caseId: number, payload: UpdateCaseTrackingDto): Observable<CaseTrackingDto> {
        // Backend V5: PUT /api/casetracking/{id}
        return this.http
            .put<unknown>(`${this.apiUrl}/casetracking/${caseId}`, payload)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    /** Close a case — PATCH /casetracking/{id}/close */
    close(caseId: number, closeReason?: string): Observable<CaseTrackingDto> {
        const body = { ClosureReason: closeReason ?? 'Caso cerrado' };
        return this.http
            .patch<unknown>(`${this.apiUrl}/casetracking/${caseId}/close`, body)
            .pipe(map((res) => this.mapCase(this.unwrapObject<BackendCaseTrackingDto>(res))));
    }

    // ── Follow-ups ─────────────────────────────
    getFollowUps(caseId: number): Observable<FollowUpDto[]> {
        // Backend V5: GET /api/casetracking/{id}/follow-ups
        return this.http
            .get<unknown>(`${this.apiUrl}/casetracking/${caseId}/follow-ups`)
            .pipe(
                map((res) => this.unwrapArray<BackendFollowUpDto>(res).map((x) => this.mapFollowUp(x))),
                catchError(() => of([])),
            );
    }

    createFollowUp(caseId: number, payload: CreateFollowUpDto): Observable<FollowUpDto | null> {
        // Backend V5: POST /api/casetracking/{id}/follow-ups
        const body = {
            actionType: payload.followUpType ?? 'SESSION',
            description: payload.notes,
            scheduledDate: payload.scheduledDate ?? null,
        };
        return this.http
            .post<unknown>(`${this.apiUrl}/casetracking/${caseId}/follow-ups`, body)
            .pipe(
                map((res) => this.mapFollowUp(this.unwrapObject<BackendFollowUpDto>(res))),
                catchError((err) => { console.error('[FollowUps] POST error:', err?.error ?? err); return of(null); }),
            );
    }

    // ── Client-side filters ─────────────────────
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
