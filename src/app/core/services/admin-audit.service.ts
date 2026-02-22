import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AuditLogQuery {
    userId?: number;
    action?: string;
    tableName?: string;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
}

export interface AuditLogDto {
    auditLogID: number;
    userID?: number | null;
    userName?: string | null;
    action?: string | null;
    tableName?: string | null;
    recordID?: string | null;
    oldValues?: string | null;
    newValues?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: string | null;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}

export interface SystemLogDto {
    systemLogID: number;
    level?: string | null;
    source?: string | null;
    message?: string | null;
    stackTrace?: string | null;
    createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminAuditService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    /** Get paginated audit logs — GET /api/auditlog?pageNumber=1&pageSize=50 */
    getAuditLogs(query?: AuditLogQuery): Observable<PaginatedResult<AuditLogDto>> {
        return this.http
            .get<unknown>(`${this.apiUrl}/auditlog`, { params: this.buildParams(query) })
            .pipe(
                map((res) => this.unwrapPaginated<AuditLogDto>(res)),
                catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 50 }))
            );
    }

    /** Get audit logs by user — GET /api/auditlog/user/{userId} */
    getByUser(userId: number, startDate?: string, endDate?: string): Observable<AuditLogDto[]> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http
            .get<unknown>(`${this.apiUrl}/auditlog/user/${userId}`, { params })
            .pipe(
                map((res) => this.unwrapArray<AuditLogDto>(res)),
                catchError(() => of([]))
            );
    }

    /** Get audit logs by action — GET /api/auditlog/action/{action} */
    getByAction(action: string): Observable<AuditLogDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/auditlog/action/${action}`)
            .pipe(
                map((res) => this.unwrapArray<AuditLogDto>(res)),
                catchError(() => of([]))
            );
    }

    /** Get audit logs by table name — GET /api/auditlog/table/{tableName}?recordId={id} */
    getByTable(tableName: string, recordId?: number): Observable<AuditLogDto[]> {
        let params = new HttpParams();
        if (recordId !== undefined) params = params.set('recordId', String(recordId));
        return this.http
            .get<unknown>(`${this.apiUrl}/auditlog/table/${tableName}`, { params })
            .pipe(
                map((res) => this.unwrapArray<AuditLogDto>(res)),
                catchError(() => of([]))
            );
    }

    /** Get audit logs by date range — GET /api/auditlog/date-range */
    getByDateRange(startDate: string, endDate: string): Observable<AuditLogDto[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http
            .get<unknown>(`${this.apiUrl}/auditlog/date-range`, { params })
            .pipe(
                map((res) => this.unwrapArray<AuditLogDto>(res)),
                catchError(() => of([]))
            );
    }

    /** Get system log errors — GET /api/systemlog/errors?since={date} */
    getSystemErrors(since?: string): Observable<SystemLogDto[]> {
        let params = new HttpParams();
        if (since) params = params.set('since', since);
        return this.http
            .get<unknown>(`${this.apiUrl}/systemlog/errors`, { params })
            .pipe(
                map((res) => this.unwrapArray<SystemLogDto>(res)),
                catchError(() => of([]))
            );
    }

    /** Get system logs by date range — GET /api/systemlog/date-range */
    getSystemLogsByDateRange(startDate: string, endDate: string): Observable<SystemLogDto[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http
            .get<unknown>(`${this.apiUrl}/systemlog/date-range`, { params })
            .pipe(
                map((res) => this.unwrapArray<SystemLogDto>(res)),
                catchError(() => of([]))
            );
    }

    private buildParams(query?: AuditLogQuery): HttpParams {
        let params = new HttpParams();
        if (!query) return params;

        const setIf = (key: string, value: unknown) => {
            if (value === undefined || value === null || value === '') return;
            params = params.set(key, String(value));
        };

        setIf('pageNumber', query.pageNumber);
        setIf('pageSize', query.pageSize);
        return params;
    }

    private unwrapPaginated<T>(res: unknown): PaginatedResult<T> {
        const anyRes = res as any;
        // Check if it's already in paginated format
        if (anyRes && typeof anyRes === 'object' && 'items' in anyRes) {
            return {
                items: Array.isArray(anyRes.items) ? anyRes.items : [],
                totalCount: Number(anyRes.totalCount ?? 0),
                pageNumber: Number(anyRes.pageNumber ?? 1),
                pageSize: Number(anyRes.pageSize ?? 50),
            };
        }
        // ApiResponse<PaginatedResult<T>> wrapper
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return this.unwrapPaginated<T>(anyRes.data);
        }
        // If it's just an array
        if (Array.isArray(anyRes)) {
            return { items: anyRes, totalCount: anyRes.length, pageNumber: 1, pageSize: anyRes.length };
        }
        return { items: [], totalCount: 0, pageNumber: 1, pageSize: 50 };
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && 'items' in anyRes) {
            return Array.isArray(anyRes.items) ? anyRes.items : [];
        }
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            const data = anyRes.data;
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object' && 'items' in data) return data.items ?? [];
        }
        return [];
    }
}
