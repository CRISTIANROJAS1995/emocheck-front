import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from 'app/core/services/auth.service';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export interface UserProfileDto {
    userId: number;
    fullName: string;
    documentNumber?: string;
    email: string;
    profilePhotoUrl?: string | null;   // ← nuevo campo v2
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

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient, private readonly auth: AuthService) { }

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

    private mapProfile(data: any): UserProfileDto {
        return {
            userId: Number(data.userID ?? data.userId ?? 0),
            fullName: String(data.fullName ?? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()),
            documentNumber: data.documentNumber ?? undefined,
            email: String(data.email ?? ''),
            profilePhotoUrl: data.profilePhotoUrl ?? null,
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
        };
    }

    getMyProfile(): Observable<UserProfileDto> {
        return this.http
            .get<any>(`${this.apiUrl}/users/me`)
            .pipe(
                map((res: any) => {
                    if (typeof res?.success === 'boolean' && !res.success) {
                        throw { status: 400, message: res?.message || 'No fue posible obtener el perfil' };
                    }
                    return this.mapProfile(res?.data ?? res ?? {});
                })
            );
    }

    updateMyProfile(payload: UpdateUserProfileDto): Observable<UserProfileDto> {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            return throwError(() => ({ status: 401, message: 'No se pudo obtener el ID del usuario' }));
        }

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
                    return this.mapProfile(res?.data ?? res ?? {});
                })
            );
    }

    /**
     * Actualiza la foto de perfil: llama a PATCH /api/users/me/photo con la URL pública de S3.
     */
    updateProfilePhoto(photoUrl: string): Observable<UserProfileDto> {
        return this.http
            .patch<any>(`${this.apiUrl}/users/me/photo`, { photoUrl })
            .pipe(
                map((res) => {
                    if (typeof res?.success === 'boolean' && !res.success) {
                        throw { status: 400, message: res?.message || 'No fue posible actualizar la foto' };
                    }
                    return this.mapProfile(res?.data ?? res ?? {});
                })
            );
    }

    /**
     * Cambia la contraseña del usuario autenticado.
     * El backend devuelve HTTP 200 con success:false si la contraseña actual es incorrecta.
     */
    changePassword(dto: ChangePasswordDto): Observable<boolean> {
        return this.http
            .post<any>(`${this.apiUrl}/auth/change-password`, dto)
            .pipe(
                map((res) => {
                    // Backend devuelve 200 con success:false si la clave actual es incorrecta
                    return res?.success !== false;
                })
            );
    }
}
