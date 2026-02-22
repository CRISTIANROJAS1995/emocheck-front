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

    /**
     * Extract user ID from JWT token payload.
     */
    private getUserIdFromToken(): number | null {
        const token = this.auth.getToken();
        if (!token) return null;
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            const id = Number(decoded?.sub || decoded?.nameid || 0);
            return id > 0 ? id : null;
        } catch {
            return null;
        }
    }

    getMyProfile(): Observable<UserProfileDto> {
        return this.http
            .get<any>(`${this.apiUrl}/users/me`)
            .pipe(
                map((res: any) => {
                    if (typeof res?.success === 'boolean' && !res.success) {
                        throw { status: 400, message: res?.message || 'No fue posible obtener el perfil' };
                    }
                    const data = res?.data ?? res ?? {};
                    return {
                        userId: Number(data.userID ?? data.userId ?? 0),
                        fullName: String(data.fullName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()),
                        documentNumber: data.documentNumber ?? undefined,
                        email: String(data.email ?? ''),
                        companyId: data.companyID ?? data.company?.id ?? data.companyId ?? undefined,
                        companyName: data.companyName ?? data.company?.name ?? undefined,
                        siteId: data.siteID ?? data.site?.id ?? data.siteId ?? undefined,
                        siteName: data.siteName ?? data.site?.name ?? undefined,
                        areaId: data.areaID ?? data.area?.id ?? data.areaId ?? undefined,
                        areaName: data.areaName ?? data.area?.name ?? undefined,
                        jobTypeId: data.jobTypeID ?? data.jobType?.id ?? data.jobTypeId ?? undefined,
                        jobTypeName: data.jobTypeName ?? data.jobType?.name ?? undefined,
                        stateName: data.stateName ?? undefined,
                        creationDate: data.createdAt ?? data.creationDate ?? undefined,
                    } as UserProfileDto;
                })
            );
    }

    updateMyProfile(payload: UpdateUserProfileDto): Observable<UserProfileDto> {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            return throwError(() => ({ status: 401, message: 'No se pudo obtener el ID del usuario' }));
        }

        // API PUT /users/{id} accepts: firstName, lastName (split from fullName), phone, areaID, jobTypeID
        const nameParts = (payload.fullName ?? '').trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] ?? undefined;
        const lastName = nameParts.slice(1).join(' ') || undefined;

        return this.http
            .put<any>(`${this.apiUrl}/users/${userId}`, {
                ...(firstName ? { firstName } : {}),
                ...(lastName ? { lastName } : {}),
                ...(payload.documentNumber ? { documentNumber: payload.documentNumber } : {}),
                ...(payload.areaId ? { areaID: payload.areaId } : {}),
                ...(payload.jobTypeId ? { jobTypeID: payload.jobTypeId } : {}),
            })
            .pipe(
                map((res) => {
                    if (typeof res?.success === 'boolean' && !res.success) {
                        throw { status: 400, message: res?.message || 'No fue posible actualizar el perfil' };
                    }
                    const data = res?.data ?? res ?? {};
                    return {
                        userId: Number(data.userID ?? data.userId ?? userId),
                        fullName: String(data.fullName ?? payload.fullName ?? ''),
                        documentNumber: data.documentNumber ?? payload.documentNumber ?? undefined,
                        email: String(data.email ?? ''),
                        companyId: data.companyID ?? data.company?.id ?? undefined,
                        companyName: data.companyName ?? data.company?.name ?? undefined,
                        siteId: data.siteID ?? data.site?.id ?? payload.siteId ?? undefined,
                        siteName: data.siteName ?? data.site?.name ?? undefined,
                        areaId: data.areaID ?? data.area?.id ?? payload.areaId ?? undefined,
                        areaName: data.areaName ?? data.area?.name ?? undefined,
                        jobTypeId: data.jobTypeID ?? data.jobType?.id ?? payload.jobTypeId ?? undefined,
                        jobTypeName: data.jobTypeName ?? data.jobType?.name ?? undefined,
                        stateName: data.stateName ?? undefined,
                        creationDate: data.creationDate ?? undefined,
                    } as UserProfileDto;
                })
            );
    }
}
