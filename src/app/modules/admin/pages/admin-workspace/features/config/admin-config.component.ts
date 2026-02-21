import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AlertService } from 'app/core/swal/sweet-alert.service';
import {
    AdminOrganizationService,
    CompanyDto, CreateCompanyDto,
    SiteDto, CreateSiteDto,
    AreaDto, CreateAreaDto,
    JobTypeDto, CreateJobTypeDto,
} from '../../../../../../core/services/admin-organization.service';

type OrgTab = 'companies' | 'sites' | 'areas' | 'jobtypes';

@Component({
    selector: 'app-admin-config',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-config.component.html',
    styleUrls: ['./admin-config.component.scss'],
})
export class AdminConfigComponent implements OnInit {
    activeTab: OrgTab = 'companies';
    loading = false;
    saving = false;
    showForm = false;
    showEditForm = false;

    // ── Companies ──
    companies: CompanyDto[] = [];
    filteredCompanies: CompanyDto[] = [];
    companySearch = '';
    companyForm: CreateCompanyDto = this.emptyCompany();
    editCompanyId: number | null = null;
    editCompanyForm: CreateCompanyDto = this.emptyCompany();

    // ── Sites ──
    sites: SiteDto[] = [];
    filteredSites: SiteDto[] = [];
    siteSearch = '';
    siteCompanyFilter = 0;
    siteForm: CreateSiteDto = this.emptySite();
    editSiteId: number | null = null;
    editSiteForm: CreateSiteDto = this.emptySite();

    // ── Areas ──
    areas: AreaDto[] = [];
    filteredAreas: AreaDto[] = [];
    areaSearch = '';
    areaCompanyFilter = 0;
    areaForm: CreateAreaDto = this.emptyArea();
    editAreaId: number | null = null;
    editAreaForm: CreateAreaDto = this.emptyArea();

    // ── JobTypes ──
    jobTypes: JobTypeDto[] = [];
    filteredJobTypes: JobTypeDto[] = [];
    jobTypeSearch = '';
    jobTypeForm: CreateJobTypeDto = this.emptyJobType();
    editJobTypeId: number | null = null;
    editJobTypeForm: CreateJobTypeDto = this.emptyJobType();

    constructor(
        private readonly orgService: AdminOrganizationService,
        private readonly alert: AlertService,
    ) { }

    ngOnInit(): void {
        this.loadTab();
    }

    switchTab(tab: OrgTab): void {
        this.activeTab = tab;
        this.showForm = false;
        this.showEditForm = false;
        this.editCompanyId = null;
        this.editSiteId = null;
        this.editAreaId = null;
        this.editJobTypeId = null;
        this.loadTab();
    }

    loadTab(): void {
        this.loading = true;
        switch (this.activeTab) {
            case 'companies':
                this.orgService.getCompanies().subscribe(data => {
                    this.companies = data;
                    this.applyFilter();
                    this.loading = false;
                });
                break;
            case 'sites':
                this.orgService.getCompanies().subscribe(c => this.companies = c);
                this.orgService.getSites(this.siteCompanyFilter || undefined).subscribe(data => {
                    this.sites = data;
                    this.applyFilter();
                    this.loading = false;
                });
                break;
            case 'areas':
                this.orgService.getCompanies().subscribe(c => this.companies = c);
                this.orgService.getAreas(this.areaCompanyFilter || undefined).subscribe(data => {
                    this.areas = data;
                    this.applyFilter();
                    this.loading = false;
                });
                break;
            case 'jobtypes':
                this.orgService.getJobTypes().subscribe(data => {
                    this.jobTypes = data;
                    this.applyFilter();
                    this.loading = false;
                });
                break;
        }
    }

    applyFilter(): void {
        const s = (v: string) => v.toLowerCase().trim();
        switch (this.activeTab) {
            case 'companies': {
                const q = s(this.companySearch);
                this.filteredCompanies = !q ? [...this.companies] :
                    this.companies.filter(c =>
                        s(c.name).includes(q) ||
                        s(c.businessName ?? '').includes(q) ||
                        s(c.industry ?? '').includes(q) ||
                        s(c.email ?? '').includes(q)
                    );
                break;
            }
            case 'sites': {
                const q = s(this.siteSearch);
                this.filteredSites = !q ? [...this.sites] :
                    this.sites.filter(si =>
                        s(si.name).includes(q) ||
                        s(si.code ?? '').includes(q) ||
                        s(si.companyName).includes(q)
                    );
                break;
            }
            case 'areas': {
                const q = s(this.areaSearch);
                this.filteredAreas = !q ? [...this.areas] :
                    this.areas.filter(a =>
                        s(a.name).includes(q) ||
                        s(a.code ?? '').includes(q) ||
                        s(a.companyName).includes(q) ||
                        s(a.managerName ?? '').includes(q)
                    );
                break;
            }
            case 'jobtypes': {
                const q = s(this.jobTypeSearch);
                this.filteredJobTypes = !q ? [...this.jobTypes] :
                    this.jobTypes.filter(j =>
                        s(j.name).includes(q) ||
                        s(j.description ?? '').includes(q) ||
                        s(j.level ?? '').includes(q)
                    );
                break;
            }
        }
    }

    // ── Counts ──
    get activeCompanies(): number { return this.companies.filter(c => c.isActive).length; }
    get activeSites(): number { return this.sites.filter(s => s.isActive).length; }
    get activeAreas(): number { return this.areas.filter(a => a.isActive).length; }
    get activeJobTypes(): number { return this.jobTypes.filter(j => j.isActive).length; }

    // ── Create ──
    async createCompany(): Promise<void> {
        if (!this.companyForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.createCompany(this.companyForm).subscribe({
            next: () => { this.alert.success('Empresa creada exitosamente'); this.companyForm = this.emptyCompany(); this.showForm = false; this.loadTab(); },
            error: () => { this.alert.error('Error al crear empresa'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    async createSite(): Promise<void> {
        if (!this.siteForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        if (!this.siteForm.companyID) { this.alert.error('La empresa es requerida'); return; }
        this.saving = true;
        this.orgService.createSite(this.siteForm).subscribe({
            next: () => { this.alert.success('Sede creada exitosamente'); this.siteForm = this.emptySite(); this.showForm = false; this.loadTab(); },
            error: () => { this.alert.error('Error al crear sede'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    async createArea(): Promise<void> {
        if (!this.areaForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        if (!this.areaForm.companyID) { this.alert.error('La empresa es requerida'); return; }
        this.saving = true;
        this.orgService.createArea(this.areaForm).subscribe({
            next: () => { this.alert.success('Área creada exitosamente'); this.areaForm = this.emptyArea(); this.showForm = false; this.loadTab(); },
            error: () => { this.alert.error('Error al crear área'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    async createJobType(): Promise<void> {
        if (!this.jobTypeForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.createJobType(this.jobTypeForm).subscribe({
            next: () => { this.alert.success('Tipo de cargo creado exitosamente'); this.jobTypeForm = this.emptyJobType(); this.showForm = false; this.loadTab(); },
            error: () => { this.alert.error('Error al crear tipo de cargo'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    // ── Edit ──
    startEditCompany(c: CompanyDto): void {
        this.editCompanyId = c.companyID;
        this.editCompanyForm = { name: c.name, businessName: c.businessName ?? '', taxID: c.taxID ?? '', email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '', website: c.website ?? '', industry: c.industry ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }
    cancelEditCompany(): void { this.editCompanyId = null; this.showEditForm = false; }
    saveEditCompany(): void {
        if (!this.editCompanyId || !this.editCompanyForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.updateCompany(this.editCompanyId, this.editCompanyForm).subscribe({
            next: () => { this.alert.success('Empresa actualizada'); this.cancelEditCompany(); this.loadTab(); },
            error: () => { this.alert.error('Error al actualizar empresa'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    startEditSite(s: SiteDto): void {
        this.editSiteId = s.siteID;
        this.editSiteForm = { companyID: s.companyID, name: s.name, code: s.code ?? '', address: s.address ?? '', phone: s.phone ?? '', email: s.email ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }
    cancelEditSite(): void { this.editSiteId = null; this.showEditForm = false; }
    saveEditSite(): void {
        if (!this.editSiteId || !this.editSiteForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.updateSite(this.editSiteId, this.editSiteForm).subscribe({
            next: () => { this.alert.success('Sede actualizada'); this.cancelEditSite(); this.loadTab(); },
            error: () => { this.alert.error('Error al actualizar sede'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    startEditArea(a: AreaDto): void {
        this.editAreaId = a.areaID;
        this.editAreaForm = { companyID: a.companyID, name: a.name, code: a.code ?? '', description: a.description ?? '', managerName: a.managerName ?? '', managerEmail: a.managerEmail ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }
    cancelEditArea(): void { this.editAreaId = null; this.showEditForm = false; }
    saveEditArea(): void {
        if (!this.editAreaId || !this.editAreaForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.updateArea(this.editAreaId, this.editAreaForm).subscribe({
            next: () => { this.alert.success('Área actualizada'); this.cancelEditArea(); this.loadTab(); },
            error: () => { this.alert.error('Error al actualizar área'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    startEditJobType(j: JobTypeDto): void {
        this.editJobTypeId = j.jobTypeID;
        this.editJobTypeForm = { name: j.name, description: j.description ?? '', level: j.level ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }
    cancelEditJobType(): void { this.editJobTypeId = null; this.showEditForm = false; }
    saveEditJobType(): void {
        if (!this.editJobTypeId || !this.editJobTypeForm.name?.trim()) { this.alert.error('El nombre es requerido'); return; }
        this.saving = true;
        this.orgService.updateJobType(this.editJobTypeId, this.editJobTypeForm).subscribe({
            next: () => { this.alert.success('Cargo actualizado'); this.cancelEditJobType(); this.loadTab(); },
            error: () => { this.alert.error('Error al actualizar cargo'); this.saving = false; },
            complete: () => this.saving = false,
        });
    }

    // ── Toggle ──
    async toggleCompany(c: CompanyDto): Promise<void> {
        const ok = await this.alert.confirm(`¿${c.isActive ? 'Desactivar' : 'Activar'} "${c.name}"?`, 'Confirmar cambio');
        if (!ok) return;
        this.orgService.toggleCompany(c.companyID).subscribe({
            next: () => { this.alert.success(c.isActive ? 'Empresa desactivada' : 'Empresa activada'); this.loadTab(); },
            error: () => this.alert.error('Error al cambiar estado'),
        });
    }

    async toggleSite(s: SiteDto): Promise<void> {
        const ok = await this.alert.confirm(`¿${s.isActive ? 'Desactivar' : 'Activar'} "${s.name}"?`, 'Confirmar cambio');
        if (!ok) return;
        this.orgService.toggleSite(s.siteID).subscribe({
            next: () => { this.alert.success(s.isActive ? 'Sede desactivada' : 'Sede activada'); this.loadTab(); },
            error: () => this.alert.error('Error al cambiar estado'),
        });
    }

    async toggleArea(a: AreaDto): Promise<void> {
        const ok = await this.alert.confirm(`¿${a.isActive ? 'Desactivar' : 'Activar'} "${a.name}"?`, 'Confirmar cambio');
        if (!ok) return;
        this.orgService.toggleArea(a.areaID).subscribe({
            next: () => { this.alert.success(a.isActive ? 'Área desactivada' : 'Área activada'); this.loadTab(); },
            error: () => this.alert.error('Error al cambiar estado'),
        });
    }

    async toggleJobType(j: JobTypeDto): Promise<void> {
        const ok = await this.alert.confirm(`¿${j.isActive ? 'Desactivar' : 'Activar'} "${j.name}"?`, 'Confirmar cambio');
        if (!ok) return;
        this.orgService.toggleJobType(j.jobTypeID).subscribe({
            next: () => { this.alert.success(j.isActive ? 'Cargo desactivado' : 'Cargo activado'); this.loadTab(); },
            error: () => this.alert.error('Error al cambiar estado'),
        });
    }

    // ── Empty form factories ──
    private emptyCompany(): CreateCompanyDto {
        return { name: '', businessName: '', taxID: '', email: '', phone: '', address: '', website: '', industry: '' };
    }
    private emptySite(): CreateSiteDto {
        return { companyID: 0, name: '', code: '', address: '', phone: '', email: '' };
    }
    private emptyArea(): CreateAreaDto {
        return { companyID: 0, name: '', code: '', description: '', managerName: '', managerEmail: '' };
    }
    private emptyJobType(): CreateJobTypeDto {
        return { name: '', description: '', level: '' };
    }
}
