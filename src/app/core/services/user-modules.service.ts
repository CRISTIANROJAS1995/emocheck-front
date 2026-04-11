import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserModulePermission {
    moduleID: number;
    moduleName: string;
    moduleCode: string;
    isEnabled: boolean;
    displayOrder: number;
}

export interface ModulePermissionItem {
    moduleID: number;
    isEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserModulesService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) {}

    /** GET /api/user-modules/me — módulos del usuario autenticado */
    getMyModules(): Observable<UserModulePermission[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/user-modules/me`)
            .pipe(map((res) => this.unwrapArray(res)));
    }

    /** GET /api/user-modules/{userId} — módulos de un usuario (SuperAdmin) */
    getUserModules(userId: number): Observable<UserModulePermission[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/user-modules/${userId}`)
            .pipe(map((res) => this.unwrapArray(res)));
    }

    /**
     * PATCH /api/user-modules/{userId}/module/{moduleId} — toggle individual
     * @param isEnabled nuevo estado del módulo
     */
    toggleModule(userId: number, moduleId: number, isEnabled: boolean): Observable<{ message: string }> {
        return this.http
            .patch<unknown>(`${this.apiUrl}/user-modules/${userId}/module/${moduleId}`, { isEnabled })
            .pipe(map((res) => this.unwrapObject(res) as { message: string }));
    }

    /** PUT /api/user-modules/{userId} — guardar todos en bulk */
    saveAllPermissions(
        userId: number,
        permissions: ModulePermissionItem[]
    ): Observable<{ message: string }> {
        return this.http
            .put<unknown>(`${this.apiUrl}/user-modules/${userId}`, { permissions })
            .pipe(map((res) => this.unwrapObject(res) as { message: string }));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private unwrapArray(res: unknown): UserModulePermission[] {
        const raw = (res as any)?.data ?? res;
        return Array.isArray(raw) ? (raw as UserModulePermission[]) : [];
    }

    private unwrapObject(res: unknown): unknown {
        return (res as any)?.data ?? res;
    }
}
