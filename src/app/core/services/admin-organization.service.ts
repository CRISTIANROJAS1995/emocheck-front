import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ── Company ──────────────────────────────────────────────────
export interface CompanyDto {
    companyID: number;
    name: string;
    businessName?: string;
    taxID?: string;
    logo?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    industry?: string;
    employeeCount?: number;
    isActive: boolean;
    siteCount: number;
    areaCount: number;
    userCount: number;
    createdAt?: string;
}
export interface CreateCompanyDto {
    name: string;
    businessName?: string;
    taxID?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    industry?: string;
    employeeCount?: number;
}

// ── Site ─────────────────────────────────────────────────────
export interface SiteDto {
    siteID: number;
    companyID: number;
    companyName: string;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    userCount: number;
    createdAt?: string;
}
export interface CreateSiteDto {
    companyID: number;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
}

// ── Area ─────────────────────────────────────────────────────
export interface AreaDto {
    areaID: number;
    companyID: number;
    companyName: string;
    name: string;
    code?: string;
    description?: string;
    managerName?: string;
    managerEmail?: string;
    isActive: boolean;
    userCount: number;
    createdAt?: string;
}
export interface CreateAreaDto {
    companyID: number;
    name: string;
    code?: string;
    description?: string;
    managerName?: string;
    managerEmail?: string;
}

// ── JobType ──────────────────────────────────────────────────
export interface JobTypeDto {
    jobTypeID: number;
    name: string;
    description?: string;
    level?: string;
    isActive: boolean;
    userCount: number;
    createdAt?: string;
}
export interface CreateJobTypeDto {
    name: string;
    description?: string;
    level?: string;
}

// ── Role ─────────────────────────────────────────────────────
export interface RoleDto {
    roleID: number;
    name: string;
    code?: string;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrganizationService {
    private readonly base = `${environment.apiUrl}/organization`;

    constructor(private readonly http: HttpClient) { }

    // ── Company ──
    getCompanies(): Observable<CompanyDto[]> {
        return this.http.get<any>(`${this.base}/companies`).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
    createCompany(dto: CreateCompanyDto): Observable<any> {
        return this.http.post(`${this.base}/companies`, dto);
    }
    updateCompany(id: number, dto: Partial<CreateCompanyDto>): Observable<any> {
        return this.http.put(`${this.base}/companies/${id}`, dto);
    }
    toggleCompany(id: number): Observable<any> {
        return this.http.patch(`${this.base}/companies/${id}/toggle`, {});
    }

    // ── Site ──
    getSites(companyId?: number): Observable<SiteDto[]> {
        const url = companyId ? `${this.base}/sites?companyId=${companyId}` : `${this.base}/sites`;
        return this.http.get<any>(url).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
    createSite(dto: CreateSiteDto): Observable<any> {
        return this.http.post(`${this.base}/sites`, dto);
    }
    updateSite(id: number, dto: Partial<CreateSiteDto>): Observable<any> {
        return this.http.put(`${this.base}/sites/${id}`, dto);
    }
    toggleSite(id: number): Observable<any> {
        return this.http.patch(`${this.base}/sites/${id}/toggle`, {});
    }

    // ── Area ──
    getAreas(companyId?: number): Observable<AreaDto[]> {
        const url = companyId ? `${this.base}/areas?companyId=${companyId}` : `${this.base}/areas`;
        return this.http.get<any>(url).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
    createArea(dto: CreateAreaDto): Observable<any> {
        return this.http.post(`${this.base}/areas`, dto);
    }
    updateArea(id: number, dto: Partial<CreateAreaDto>): Observable<any> {
        return this.http.put(`${this.base}/areas/${id}`, dto);
    }
    toggleArea(id: number): Observable<any> {
        return this.http.patch(`${this.base}/areas/${id}/toggle`, {});
    }

    // ── JobType ──
    getJobTypes(): Observable<JobTypeDto[]> {
        return this.http.get<any>(`${this.base}/jobtypes`).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
    createJobType(dto: CreateJobTypeDto): Observable<any> {
        return this.http.post(`${this.base}/jobtypes`, dto);
    }
    updateJobType(id: number, dto: Partial<CreateJobTypeDto>): Observable<any> {
        return this.http.put(`${this.base}/jobtypes/${id}`, dto);
    }
    toggleJobType(id: number): Observable<any> {
        return this.http.patch(`${this.base}/jobtypes/${id}/toggle`, {});
    }

    // ── Roles ──
    getRoles(): Observable<RoleDto[]> {
        return this.http.get<any>(`${this.base}/roles`).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
}
