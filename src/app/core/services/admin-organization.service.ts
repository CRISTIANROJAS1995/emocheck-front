import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ── Company ──────────────────────────────────────────────────
export interface CompanyDto {
    companyID: number;
    businessName: string;
    tradeName: string;
    taxID?: string;
    industry?: string;
    email?: string;
    phone?: string;
    address?: string;
    cityID?: number;
    cityName?: string;
    website?: string;
    logoUrl?: string;
    employeeCount?: number;
    isActive: boolean;
    createdAt?: string;
    // campos calculados localmente para UI
    name: string;        // alias de tradeName
    siteCount: number;
    areaCount: number;
    userCount: number;
}
export interface CreateCompanyDto {
    businessName: string;
    tradeName: string;
    taxID?: string;
    industry?: string;
    email?: string;
    phone?: string;
    address?: string;
    cityID?: number;
    website?: string;
    logoUrl?: string;
    employeeCount?: number;
    // alias UI
    name?: string;
}

// ── Site ─────────────────────────────────────────────────────
export interface SiteDto {
    siteID: number;
    companyID: number;
    companyName: string;
    name: string;
    address?: string;
    cityID?: number;
    cityName?: string;
    phone?: string;
    isActive: boolean;
    createdAt?: string;
    // UI alias
    code?: string;
    email?: string;
    userCount: number;
}
export interface CreateSiteDto {
    companyID: number;
    name: string;
    address?: string;
    cityID?: number;
    phone?: string;
    // UI alias
    code?: string;
    email?: string;
}

// ── Area ─────────────────────────────────────────────────────
export interface AreaDto {
    areaID: number;
    companyID: number;
    companyName: string;
    siteID?: number;
    siteName?: string;
    name: string;
    managerName?: string;
    isActive: boolean;
    createdAt?: string;
    // UI alias
    code?: string;
    description?: string;
    managerEmail?: string;
    userCount: number;
}
export interface CreateAreaDto {
    companyID: number;
    siteID?: number;
    name: string;
    managerName?: string;
    // UI alias
    code?: string;
    description?: string;
    managerEmail?: string;
}

// ── JobType ──────────────────────────────────────────────────
export interface JobTypeDto {
    jobTypeID: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    // UI alias
    level?: string;
    userCount: number;
}
export interface CreateJobTypeDto {
    name: string;
    description?: string;
    // UI alias
    level?: string;
}

// ── Role ─────────────────────────────────────────────────────
export interface RoleDto {
    roleID: number;
    name: string;
    code?: string;
    description?: string;
}

/** Mapea la respuesta del backend al DTO de UI */
function mapCompany(c: any): CompanyDto {
    return {
        ...c,
        name: c.tradeName ?? c.businessName ?? '',
        siteCount: c.siteCount ?? c.sites?.length ?? 0,
        areaCount: c.areaCount ?? c.areas?.length ?? 0,
        userCount: c.userCount ?? 0,
    };
}

function mapSite(s: any): SiteDto {
    return {
        ...s,
        code: s.code ?? '',
        email: s.email ?? '',
        userCount: s.userCount ?? 0,
    };
}

function mapArea(a: any): AreaDto {
    return {
        ...a,
        code: a.code ?? '',
        description: a.description ?? '',
        managerEmail: a.managerEmail ?? '',
        userCount: a.userCount ?? 0,
    };
}

function mapJobType(j: any): JobTypeDto {
    return {
        ...j,
        level: j.level ?? '',
        userCount: j.userCount ?? 0,
    };
}

@Injectable({ providedIn: 'root' })
export class AdminOrganizationService {
    private readonly base = `${environment.apiUrl}/company`;
    private readonly catalogBase = `${environment.apiUrl}/catalog`;

    constructor(private readonly http: HttpClient) { }

    // ── Company ──────────────────────────────────────────────
    getCompanies(): Observable<CompanyDto[]> {
        return this.http.get<any>(`${this.base}`).pipe(
            map(r => (r.data ?? r ?? []).map(mapCompany)),
            catchError(() => of([])),
        );
    }
    getCompany(id: number): Observable<CompanyDto> {
        return this.http.get<any>(`${this.base}/${id}`).pipe(
            map(r => mapCompany(r.data ?? r)),
        );
    }
    createCompany(dto: CreateCompanyDto): Observable<any> {
        const payload = {
            businessName: dto.businessName || dto.name || '',
            tradeName: dto.tradeName || dto.name || '',
            taxID: dto.taxID,
            industry: dto.industry,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            cityID: dto.cityID,
            website: dto.website,
            logoUrl: dto.logoUrl,
            employeeCount: dto.employeeCount,
        };
        return this.http.post(`${this.base}`, payload);
    }
    updateCompany(id: number, dto: Partial<CreateCompanyDto>): Observable<any> {
        const payload = {
            businessName: dto.businessName || dto.name,
            tradeName: dto.tradeName || dto.name,
            taxID: dto.taxID,
            industry: dto.industry,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            cityID: dto.cityID,
            website: dto.website,
            employeeCount: dto.employeeCount,
        };
        return this.http.put(`${this.base}/${id}`, payload);
    }
    /** Activa o desactiva una empresa — el backend usa DELETE para desactivar */
    toggleCompany(id: number, currentlyActive: boolean): Observable<any> {
        if (currentlyActive) {
            return this.http.delete(`${this.base}/${id}`);
        }
        // Reactivar: PUT con isActive: true
        return this.http.put(`${this.base}/${id}`, { isActive: true });
    }

    // ── Sites ─────────────────────────────────────────────────
    getSites(companyId?: number): Observable<SiteDto[]> {
        const url = companyId
            ? `${this.base}/${companyId}/sites`
            : `${this.base}/sites`;
        return this.http.get<any>(url).pipe(
            map(r => (r.data ?? r ?? []).map(mapSite)),
            catchError(() => of([])),
        );
    }
    createSite(dto: CreateSiteDto): Observable<any> {
        const payload = {
            companyID: dto.companyID,
            name: dto.name,
            address: dto.address,
            cityID: dto.cityID,
            phone: dto.phone,
        };
        return this.http.post(`${this.base}/sites`, payload);
    }
    updateSite(id: number, dto: Partial<CreateSiteDto>): Observable<any> {
        const payload = {
            companyID: dto.companyID,
            name: dto.name,
            address: dto.address,
            cityID: dto.cityID,
            phone: dto.phone,
        };
        return this.http.put(`${this.base}/sites/${id}`, payload);
    }
    toggleSite(id: number, currentlyActive: boolean): Observable<any> {
        if (currentlyActive) {
            return this.http.delete(`${this.base}/sites/${id}`);
        }
        return this.http.put(`${this.base}/sites/${id}`, { isActive: true });
    }

    // ── Areas ─────────────────────────────────────────────────
    getAreas(companyId?: number): Observable<AreaDto[]> {
        const url = companyId
            ? `${this.base}/${companyId}/areas`
            : `${this.base}/areas`;
        return this.http.get<any>(url).pipe(
            map(r => (r.data ?? r ?? []).map(mapArea)),
            catchError(() => of([])),
        );
    }
    createArea(dto: CreateAreaDto): Observable<any> {
        const payload = {
            companyID: dto.companyID,
            siteID: dto.siteID || undefined,
            name: dto.name,
            managerName: dto.managerName,
        };
        return this.http.post(`${this.base}/areas`, payload);
    }
    updateArea(id: number, dto: Partial<CreateAreaDto>): Observable<any> {
        const payload = {
            companyID: dto.companyID,
            siteID: dto.siteID || undefined,
            name: dto.name,
            managerName: dto.managerName,
        };
        return this.http.put(`${this.base}/areas/${id}`, payload);
    }
    toggleArea(id: number, currentlyActive: boolean): Observable<any> {
        if (currentlyActive) {
            return this.http.delete(`${this.base}/areas/${id}`);
        }
        return this.http.put(`${this.base}/areas/${id}`, { isActive: true });
    }

    // ── JobTypes ──────────────────────────────────────────────
    getJobTypes(): Observable<JobTypeDto[]> {
        return this.http.get<any>(`${this.catalogBase}/job-types`).pipe(
            map(r => (r.data ?? r ?? []).map(mapJobType)),
            catchError(() => of([])),
        );
    }
    createJobType(dto: CreateJobTypeDto): Observable<any> {
        return this.http.post(`${this.catalogBase}/job-types`, {
            name: dto.name,
            description: dto.description,
        });
    }
    updateJobType(id: number, dto: Partial<CreateJobTypeDto>): Observable<any> {
        return this.http.put(`${this.catalogBase}/job-types/${id}`, {
            name: dto.name,
            description: dto.description,
            isActive: true,
        });
    }
    toggleJobType(id: number, currentlyActive: boolean): Observable<any> {
        if (currentlyActive) {
            return this.http.delete(`${this.catalogBase}/job-types/${id}`);
        }
        return this.http.put(`${this.catalogBase}/job-types/${id}`, { isActive: true });
    }

    // ── Roles ──────────────────────────────────────────────────
    getRoles(): Observable<RoleDto[]> {
        return this.http.get<any>(`${this.catalogBase}/roles/active`).pipe(
            map(r => r.data ?? r ?? []),
            catchError(() => of([])),
        );
    }
}
