import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CountryDto {
    countryID: number;
    name: string;
    iSOCode: string;
    phoneCode: string;
    isActive: boolean;
    createdAt?: string;
}

export interface StateDto {
    stateID: number;
    countryID: number;
    countryName?: string;
    name: string;
    code?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface CityDto {
    cityID: number;
    stateID: number;
    stateName?: string;
    name: string;
    isActive: boolean;
    createdAt?: string;
}

export interface JobTypeDto {
    jobTypeID: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface RoleDto {
    roleID: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface CreateCountryPayload {
    name: string;
    iSOCode: string;
    phoneCode: string;
    isActive?: boolean;
}

export interface CreateStatePayload {
    countryID: number;
    name: string;
    code?: string;
}

export interface CreateCityPayload {
    stateID: number;
    name: string;
}

export interface CreateJobTypePayload {
    name: string;
    description?: string;
}

export interface CreateRolePayload {
    name: string;
    description: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const r = res as any;
        if (r && typeof r === 'object' && 'data' in r) {
            return Array.isArray(r.data) ? r.data : [];
        }
        return [];
    }

    private unwrapOne<T>(res: unknown): T {
        const r = res as any;
        if (r && typeof r === 'object' && 'data' in r) return r.data as T;
        return res as T;
    }

    // ── Countries ─────────────────────────────────────────────────────────────

    getCountries(): Observable<CountryDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/countries`).pipe(
            map(r => this.unwrapArray<CountryDto>(r)),
            catchError(() => of([]))
        );
    }

    getActiveCountries(): Observable<CountryDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/countries/active`).pipe(
            map(r => this.unwrapArray<CountryDto>(r)),
            catchError(() => this.getCountries())
        );
    }

    createCountry(payload: CreateCountryPayload): Observable<CountryDto> {
        // .NET serializer may use iSOCode or isoCode depending on JsonNamingPolicy
        const body = {
            name: payload.name,
            iSOCode: payload.iSOCode,
            isoCode: payload.iSOCode,   // fallback key
            phoneCode: payload.phoneCode,
            isActive: payload.isActive ?? true,
        };
        return this.http.post<unknown>(`${this.apiUrl}/catalog/countries`, body).pipe(
            map(r => this.unwrapOne<CountryDto>(r))
        );
    }

    updateCountry(id: number, payload: Partial<CreateCountryPayload>): Observable<CountryDto> {
        const body: any = { ...payload };
        if (payload.iSOCode) body['isoCode'] = payload.iSOCode;
        return this.http.put<unknown>(`${this.apiUrl}/catalog/countries/${id}`, body).pipe(
            map(r => this.unwrapOne<CountryDto>(r))
        );
    }

    deleteCountry(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/catalog/countries/${id}`);
    }

    // ── States ────────────────────────────────────────────────────────────────

    getStates(): Observable<StateDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/states`).pipe(
            map(r => this.unwrapArray<StateDto>(r)),
            catchError(() => of([]))
        );
    }

    getStatesByCountry(countryId: number): Observable<StateDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/states/by-country/${countryId}`).pipe(
            map(r => this.unwrapArray<StateDto>(r)),
            catchError(() => of([]))
        );
    }

    createState(payload: CreateStatePayload): Observable<StateDto> {
        return this.http.post<unknown>(`${this.apiUrl}/catalog/states`, payload).pipe(
            map(r => this.unwrapOne<StateDto>(r))
        );
    }

    updateState(id: number, payload: Partial<CreateStatePayload>): Observable<StateDto> {
        return this.http.put<unknown>(`${this.apiUrl}/catalog/states/${id}`, payload).pipe(
            map(r => this.unwrapOne<StateDto>(r))
        );
    }

    deleteState(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/catalog/states/${id}`);
    }

    // ── Cities ────────────────────────────────────────────────────────────────

    getCities(): Observable<CityDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/cities`).pipe(
            map(r => this.unwrapArray<CityDto>(r)),
            catchError(() => of([]))
        );
    }

    getCitiesByState(stateId: number): Observable<CityDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/cities/by-state/${stateId}`).pipe(
            map(r => this.unwrapArray<CityDto>(r)),
            catchError(() => of([]))
        );
    }

    createCity(payload: CreateCityPayload): Observable<CityDto> {
        return this.http.post<unknown>(`${this.apiUrl}/catalog/cities`, payload).pipe(
            map(r => this.unwrapOne<CityDto>(r))
        );
    }

    updateCity(id: number, payload: Partial<CreateCityPayload>): Observable<CityDto> {
        return this.http.put<unknown>(`${this.apiUrl}/catalog/cities/${id}`, payload).pipe(
            map(r => this.unwrapOne<CityDto>(r))
        );
    }

    deleteCity(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/catalog/cities/${id}`);
    }

    // ── Job Types ─────────────────────────────────────────────────────────────

    getJobTypes(): Observable<JobTypeDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/job-types`).pipe(
            map(r => this.unwrapArray<JobTypeDto>(r)),
            catchError(() => of([]))
        );
    }

    getActiveJobTypes(): Observable<JobTypeDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/job-types/active`).pipe(
            map(r => this.unwrapArray<JobTypeDto>(r)),
            catchError(() => this.getJobTypes())
        );
    }

    createJobType(payload: CreateJobTypePayload): Observable<JobTypeDto> {
        return this.http.post<unknown>(`${this.apiUrl}/catalog/job-types`, payload).pipe(
            map(r => this.unwrapOne<JobTypeDto>(r))
        );
    }

    updateJobType(id: number, payload: Partial<CreateJobTypePayload>): Observable<JobTypeDto> {
        return this.http.put<unknown>(`${this.apiUrl}/catalog/job-types/${id}`, payload).pipe(
            map(r => this.unwrapOne<JobTypeDto>(r))
        );
    }

    deleteJobType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/catalog/job-types/${id}`);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    getRoles(): Observable<RoleDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/roles`).pipe(
            map(r => this.unwrapArray<RoleDto>(r)),
            catchError(() => of([]))
        );
    }

    getActiveRoles(): Observable<RoleDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/catalog/roles/active`).pipe(
            map(r => this.unwrapArray<RoleDto>(r)),
            catchError(() => this.getRoles())
        );
    }

    createRole(payload: CreateRolePayload): Observable<RoleDto> {
        return this.http.post<unknown>(`${this.apiUrl}/catalog/roles`, payload).pipe(
            map(r => this.unwrapOne<RoleDto>(r))
        );
    }

    updateRole(id: number, payload: Partial<CreateRolePayload>): Observable<RoleDto> {
        return this.http.put<unknown>(`${this.apiUrl}/catalog/roles/${id}`, payload).pipe(
            map(r => this.unwrapOne<RoleDto>(r))
        );
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/catalog/roles/${id}`);
    }
}
