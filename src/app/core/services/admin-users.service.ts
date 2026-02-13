import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    companyName?: string;
    siteName?: string;
    areaName?: string;
    jobTypeName?: string;
    stateName?: string;
    roles?: string[];
    creationDate?: string;
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

interface IdNameDto {
    id: number;
    name?: string | null;
}

interface UserDto {
    userID: number;
    fullName?: string | null;
    documentNumber?: string | null;
    email?: string | null;
    company?: IdNameDto | null;
    site?: IdNameDto | null;
    area?: IdNameDto | null;
    jobType?: IdNameDto | null;
    stateID?: number | null;
    creationDate?: string | null;
    roles?: IdNameDto[] | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    listUsers(query?: AdminUsersQuery): Observable<AdminUserListItemDto[]> {
        return this.http
            .get<ApiResponse<UserDto[]>>(`${this.apiUrl}/users`, {
                params: this.buildParams(query),
            })
            .pipe(
                map((res) => {
                    if (!res?.success) {
                        throw { status: 400, message: res?.message || 'No fue posible obtener usuarios', errors: res?.errors };
                    }
                    const data = (res.data || []) as UserDto[];
                    return data.map((u) => ({
                        userId: Number(u.userID ?? 0),
                        fullName: String(u.fullName ?? ''),
                        email: String(u.email ?? ''),
                        documentNumber: u.documentNumber ?? undefined,
                        companyName: u.company?.name ?? undefined,
                        siteName: u.site?.name ?? undefined,
                        areaName: u.area?.name ?? undefined,
                        jobTypeName: u.jobType?.name ?? undefined,
                        // En el contrato actual no viene `stateName`, solo `stateID`
                        stateName: u.stateID ? String(u.stateID) : undefined,
                        roles: Array.isArray(u.roles) ? u.roles.map((r) => String(r?.name ?? '')).filter(Boolean) : [],
                        creationDate: u.creationDate ?? undefined,
                    } as AdminUserListItemDto));
                })
            );
    }

    createUser(payload: AdminCreateUserRequestDto): Observable<AdminCreateUserResponseDto> {
        return this.http
            .post<ApiResponse<UserDto>>(`${this.apiUrl}/users`, payload)
            .pipe(
                map((res) => {
                    if (!res?.success) {
                        throw { status: 400, message: res?.message || 'No fue posible crear el usuario', errors: res?.errors };
                    }
                    const u = res.data as any;
                    return {
                        userId: Number(u?.userID ?? u?.userId ?? 0),
                        fullName: String(u?.fullName ?? ''),
                        email: String(u?.email ?? ''),
                        roles: Array.isArray(u?.roles) ? u.roles.map((r: any) => String(r?.name ?? '')).filter(Boolean) : [],
                    } as AdminCreateUserResponseDto;
                })
            );
    }

    deleteUser(userId: number): Observable<null> {
        return this.http
            .delete<void>(`${this.apiUrl}/users/${userId}`)
            .pipe(
                map(() => null)
            );
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
}
