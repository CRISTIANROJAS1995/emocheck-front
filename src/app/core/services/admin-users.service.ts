import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type RiskLevel = 'Green' | 'Yellow' | 'Red' | string;

export interface AdminUsersQuery {
    companyId?: number;
    siteId?: number;
    areaId?: number;
    stateId?: number;
    search?: string;
}

export interface AdminUserListItemDto {
    userId: number;
    fullName: string;
    email: string;
    documentNumber?: string;
    phone?: string;
    gender?: string;
    companyID?: number;
    companyName?: string;
    siteID?: number;
    siteName?: string;
    areaID?: number;
    areaName?: string;
    jobTypeID?: number;
    jobTypeName?: string;
    stateName?: string;
    isActive?: boolean;
    roles?: string[];
    creationDate?: string;
    lastLoginAt?: string;
    lastEvaluationDate?: string;
    evaluationsCompleted?: number;
    lastRiskLevel?: RiskLevel;
}

export interface AdminCreateUserRequestDto {
    fullName: string;
    documentNumber: string;
    email: string;
    password: string;
    companyID?: number | null;
    siteID?: number | null;
    areaID?: number | null;
    jobTypeID: number;
    roleIDs: number[];
}

export interface AdminCreateUserResponseDto {
    userId: number;
    fullName: string;
    email: string;
    roles?: string[];
}

/** Only fields accepted by PUT /api/users/{id} */
export interface AdminUpdateUserRequestDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    areaID?: number | null;
    jobTypeID?: number | null;
}

/** Shape returned by the deployed backend (flat fields, no nested objects) */
interface BackendUserDto {
    userID: number;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    email?: string | null;
    documentNumber?: string | null;
    phone?: string | null;
    gender?: string | null;
    companyID?: number | null;
    companyName?: string | null;
    company?: { id?: number; name?: string } | null;
    siteID?: number | null;
    siteName?: string | null;
    site?: { id?: number; name?: string } | null;
    areaID?: number | null;
    areaName?: string | null;
    area?: { id?: number; name?: string } | null;
    jobTypeID?: number | null;
    jobTypeName?: string | null;
    jobType?: { id?: number; name?: string } | null;
    isActive?: boolean;
    createdAt?: string | null;
    lastLoginAt?: string | null;
    roles?: (string | { id?: number; name?: string })[] | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private mapUser(u: BackendUserDto): AdminUserListItemDto {
        return {
            userId: Number(u.userID ?? 0),
            fullName: String(u.fullName ?? ''),
            email: String(u.email ?? ''),
            documentNumber: u.documentNumber ?? undefined,
            phone: u.phone ?? undefined,
            gender: u.gender ?? undefined,
            companyID: u.companyID ?? u.company?.id ?? undefined,
            companyName: u.companyName ?? u.company?.name ?? undefined,
            siteID: u.siteID ?? u.site?.id ?? undefined,
            siteName: u.siteName ?? u.site?.name ?? undefined,
            areaID: u.areaID ?? u.area?.id ?? undefined,
            areaName: u.areaName ?? u.area?.name ?? undefined,
            jobTypeID: u.jobTypeID ?? u.jobType?.id ?? undefined,
            jobTypeName: u.jobTypeName ?? u.jobType?.name ?? undefined,
            stateName: u.isActive != null ? (u.isActive ? 'Activo' : 'Inactivo') : undefined,
            isActive: u.isActive ?? true,
            roles: Array.isArray(u.roles)
                ? u.roles.map((r) => (typeof r === 'string' ? r : String(r?.name ?? ''))).filter(Boolean)
                : [],
            creationDate: u.createdAt ?? undefined,
            lastLoginAt: u.lastLoginAt ?? undefined,
        };
    }

    listUsers(query?: AdminUsersQuery): Observable<AdminUserListItemDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/users`, { params: this.buildParams(query) })
            .pipe(
                map((res) => this.unwrapArray<BackendUserDto>(res).map((u) => this.mapUser(u)))
            );
    }

    getUserById(userId: number): Observable<AdminUserListItemDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/users/${userId}`)
            .pipe(map((res) => this.mapUser(this.unwrapObject<BackendUserDto>(res))));
    }

    /** Get users by company — uses main listing with client-side filter */
    getUsersByCompany(companyId: number): Observable<AdminUserListItemDto[]> {
        return this.listUsers({ companyId });
    }

    /** Get users by site — uses main listing with client-side filter */
    getUsersBySite(siteId: number): Observable<AdminUserListItemDto[]> {
        return this.listUsers({ siteId });
    }

    /** Get users by area — uses main listing with client-side filter */
    getUsersByArea(areaId: number): Observable<AdminUserListItemDto[]> {
        return this.listUsers({ areaId });
    }

    createUser(payload: AdminCreateUserRequestDto): Observable<AdminCreateUserResponseDto> {
        return this.http
            .post<unknown>(`${this.apiUrl}/users`, payload)
            .pipe(
                map((res) => {
                    const u = this.unwrapObject<any>(res);
                    return {
                        userId: Number(u?.userID ?? u?.userId ?? 0),
                        fullName: String(u?.fullName ?? ''),
                        email: String(u?.email ?? ''),
                        roles: Array.isArray(u?.roles)
                            ? u.roles.map((r: any) => (typeof r === 'string' ? r : String(r?.name ?? ''))).filter(Boolean)
                            : [],
                    } as AdminCreateUserResponseDto;
                })
            );
    }

    updateUser(userId: number, payload: AdminUpdateUserRequestDto): Observable<AdminUserListItemDto> {
        return this.http
            .put<unknown>(`${this.apiUrl}/users/${userId}`, payload)
            .pipe(map((res) => this.mapUser(this.unwrapObject<BackendUserDto>(res))));
    }

    deleteUser(userId: number): Observable<null> {
        return this.http
            .delete<void>(`${this.apiUrl}/users/${userId}`)
            .pipe(map(() => null));
    }

    /** Activate user — PATCH /users/{id}/activate */
    activateUser(userId: number): Observable<unknown> {
        return this.http
            .patch<unknown>(`${this.apiUrl}/users/${userId}/activate`, {})
            .pipe(catchError(() => of(null)));
    }

    /** Deactivate user — PATCH /users/{id}/deactivate */
    deactivateUser(userId: number): Observable<unknown> {
        return this.http
            .patch<unknown>(`${this.apiUrl}/users/${userId}/deactivate`, {})
            .pipe(catchError(() => of(null)));
    }

    assignRole(userId: number, roleId: number): Observable<unknown> {
        return this.http
            .post(`${this.apiUrl}/users/${userId}/roles/${roleId}`, {})
            .pipe(catchError(() => of(null)));
    }

    removeRole(userId: number, roleId: number): Observable<unknown> {
        return this.http
            .delete(`${this.apiUrl}/users/${userId}/roles/${roleId}`)
            .pipe(catchError(() => of(null)));
    }

    private buildParams(query?: AdminUsersQuery): HttpParams {
        let params = new HttpParams();
        if (!query) return params;

        const setIf = (key: string, value: unknown) => {
            if (value === undefined || value === null || value === '') return;
            params = params.set(key, String(value));
        };

        setIf('companyId', query.companyId);
        setIf('siteId', query.siteId);
        setIf('areaId', query.areaId);
        setIf('stateId', query.stateId);
        setIf('search', query.search);
        return params;
    }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return Array.isArray(anyRes.data) ? anyRes.data : [];
        }
        return [];
    }
}
