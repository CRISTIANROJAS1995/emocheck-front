import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { AuthService } from 'app/core/services/auth.service';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export interface UserProfileDto {
    userId: number;
    fullName: string;
    documentNumber?: string;
    email: string;
    companyId?: number;
    companyName?: string;
    siteId?: number;
    siteName?: string;
    areaId?: number;
    areaName?: string;
    jobTypeId?: number;
    jobTypeName?: string;
    stateId?: number;
    stateName?: string;
    creationDate?: string;
}

export interface UpdateUserProfileDto {
    fullName?: string;
    documentNumber?: string;
    email?: string;
    siteId?: number;
    areaId?: number;
    jobTypeId?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient, private readonly auth: AuthService) { }

    getMyProfile(): Observable<UserProfileDto> {
        return this.http
            .get<ApiResponse<any>>(`${this.apiUrl}/users/current`)
            .pipe(
                map((res) => {
                    if (!res?.success) {
                        throw { status: 400, message: res?.message || 'No fue posible obtener el perfil', errors: res?.errors };
                    }

                    const data = res.data ?? {};
                    return {
                        userId: Number(data.userID ?? data.userId ?? 0),
                        fullName: String(data.fullName ?? ''),
                        documentNumber: data.documentNumber ?? undefined,
                        email: String(data.email ?? ''),
                        companyId: data.company?.id ?? data.companyId ?? undefined,
                        companyName: data.company?.name ?? data.companyName ?? undefined,
                        siteId: data.site?.id ?? data.siteId ?? undefined,
                        siteName: data.site?.name ?? data.siteName ?? undefined,
                        areaId: data.area?.id ?? data.areaId ?? undefined,
                        areaName: data.area?.name ?? data.areaName ?? undefined,
                        jobTypeId: data.jobType?.id ?? data.jobTypeId ?? undefined,
                        jobTypeName: data.jobType?.name ?? data.jobTypeName ?? undefined,
                        stateId: data.stateID ?? data.stateId ?? undefined,
                        stateName: data.stateName ?? undefined,
                        creationDate: data.creationDate ?? data.creationDate ?? undefined,
                    } as UserProfileDto;
                })
            );
    }

    updateMyProfile(payload: UpdateUserProfileDto): Observable<UserProfileDto> {
        const user = this.auth.getCurrentUser();
        if (!user?.id) {
            return throwError(() => ({ status: 401, message: 'Usuario no autenticado' }));
        }

        return this.http
            .put<ApiResponse<any>>(`${this.apiUrl}/users/${user.id}`, {
                fullName: payload.fullName,
                documentNumber: payload.documentNumber,
                email: payload.email,
                siteID: payload.siteId,
                areaID: payload.areaId,
                jobTypeID: payload.jobTypeId,
            })
            .pipe(
                map((res) => {
                    if (!res?.success) {
                        throw { status: 400, message: res?.message || 'No fue posible actualizar el perfil', errors: res?.errors };
                    }
                    const data = res.data ?? {};
                    return {
                        userId: Number(data.userID ?? data.userId ?? user.id),
                        fullName: String(data.fullName ?? payload.fullName ?? user.name ?? ''),
                        documentNumber: data.documentNumber ?? payload.documentNumber ?? undefined,
                        email: String(data.email ?? payload.email ?? user.email ?? ''),
                        companyId: data.company?.id ?? data.companyId ?? undefined,
                        companyName: data.company?.name ?? data.companyName ?? undefined,
                        siteId: data.site?.id ?? data.siteId ?? payload.siteId ?? undefined,
                        siteName: data.site?.name ?? data.siteName ?? undefined,
                        areaId: data.area?.id ?? data.areaId ?? payload.areaId ?? undefined,
                        areaName: data.area?.name ?? data.areaName ?? undefined,
                        jobTypeId: data.jobType?.id ?? data.jobTypeId ?? payload.jobTypeId ?? undefined,
                        jobTypeName: data.jobType?.name ?? data.jobTypeName ?? undefined,
                        stateId: data.stateID ?? data.stateId ?? undefined,
                        stateName: data.stateName ?? undefined,
                        creationDate: data.creationDate ?? undefined,
                    } as UserProfileDto;
                })
            );
    }
}
