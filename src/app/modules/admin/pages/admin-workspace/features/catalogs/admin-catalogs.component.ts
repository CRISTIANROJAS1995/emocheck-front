import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AlertService } from 'app/core/swal/sweet-alert.service';
import {
    AdminCatalogService,
    CountryDto, CreateCountryPayload,
    StateDto, CreateStatePayload,
    CityDto, CreateCityPayload,
    JobTypeDto, CreateJobTypePayload,
    RoleDto, CreateRolePayload,
} from '../../../../../../core/services/admin-catalog.service';

type CatalogTab = 'countries' | 'states' | 'cities' | 'jobtypes' | 'roles';

@Component({
    selector: 'app-admin-catalogs',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-catalogs.component.html',
    styleUrls: ['./admin-catalogs.component.scss'],
})
export class AdminCatalogsComponent implements OnInit {
    activeTab: CatalogTab = 'countries';
    loading = false;
    saving = false;
    showForm = false;
    showEditForm = false;

    // ── Countries ──────────────────────────────────────────────────────────
    countries: CountryDto[] = [];
    filteredCountries: CountryDto[] = [];
    countrySearch = '';
    countryForm: CreateCountryPayload = { name: '', iSOCode: '', phoneCode: '' };
    editCountryId: number | null = null;
    editCountryForm: CreateCountryPayload = { name: '', iSOCode: '', phoneCode: '' };

    // ── States ────────────────────────────────────────────────────────────
    states: StateDto[] = [];
    filteredStates: StateDto[] = [];
    stateSearch = '';
    stateCountryFilter = 0;
    stateForm: CreateStatePayload = { countryID: 0, name: '', code: '' };
    editStateId: number | null = null;
    editStateForm: CreateStatePayload = { countryID: 0, name: '', code: '' };

    // ── Cities ────────────────────────────────────────────────────────────
    cities: CityDto[] = [];
    filteredCities: CityDto[] = [];
    citySearch = '';
    cityStateFilter = 0;
    cityForm: CreateCityPayload = { stateID: 0, name: '' };
    editCityId: number | null = null;
    editCityForm: CreateCityPayload = { stateID: 0, name: '' };

    // ── Job Types ─────────────────────────────────────────────────────────
    jobTypes: JobTypeDto[] = [];
    filteredJobTypes: JobTypeDto[] = [];
    jobTypeSearch = '';
    jobTypeForm: CreateJobTypePayload = { name: '', description: '' };
    editJobTypeId: number | null = null;
    editJobTypeForm: CreateJobTypePayload = { name: '', description: '' };

    // ── Roles ─────────────────────────────────────────────────────────────
    roles: RoleDto[] = [];
    filteredRoles: RoleDto[] = [];
    roleSearch = '';
    roleForm: CreateRolePayload = { name: '', description: '' };
    editRoleId: number | null = null;
    editRoleForm: CreateRolePayload = { name: '', description: '' };

    constructor(
        private readonly catalog: AdminCatalogService,
        private readonly notify: AlertService,
    ) { }

    /** Extrae el mensaje legible del error HTTP del backend */
    private errMsg(err: unknown): string {
        const e = err as HttpErrorResponse;
        const body = e?.error;
        if (body?.message) return body.message;
        if (body?.errors && Array.isArray(body.errors)) return body.errors.join(', ');
        if (typeof body === 'string') return body;
        return e?.message ?? 'Error desconocido';
    }

    ngOnInit(): void {
        this.loadAll();
    }

    private loadAll(): void {
        this.loading = true;
        forkJoin({
            countries: this.catalog.getCountries().pipe(catchError(() => of([]))),
            states: this.catalog.getStates().pipe(catchError(() => of([]))),
            cities: this.catalog.getCities().pipe(catchError(() => of([]))),
            jobTypes: this.catalog.getJobTypes().pipe(catchError(() => of([]))),
            roles: this.catalog.getRoles().pipe(catchError(() => of([]))),
        }).pipe(finalize(() => this.loading = false))
            .subscribe(({ countries, states, cities, jobTypes, roles }) => {
                this.countries = countries;
                this.states = states;
                this.cities = cities;
                this.jobTypes = jobTypes;
                this.roles = roles;
                this.applyFilters();
            });
    }

    setTab(tab: CatalogTab): void {
        this.activeTab = tab;
        this.showForm = false;
        this.showEditForm = false;
        this.applyFilters();
    }

    applyFilters(): void {
        const q = (s: string) => s.trim().toLowerCase();
        const countryQ = q(this.countrySearch);
        this.filteredCountries = this.countries.filter(c =>
            !countryQ ||
            c.name.toLowerCase().includes(countryQ) ||
            (c.iSOCode ?? '').toLowerCase().includes(countryQ) ||
            (c.phoneCode ?? '').toLowerCase().includes(countryQ)
        );

        const stateQ = q(this.stateSearch);
        const countryF = +this.stateCountryFilter;
        this.filteredStates = this.states.filter(s =>
            (!stateQ || s.name.toLowerCase().includes(stateQ)) &&
            (!countryF || +s.countryID === countryF)
        );

        const cityQ = q(this.citySearch);
        const stateF = +this.cityStateFilter;
        this.filteredCities = this.cities.filter(c =>
            (!cityQ || c.name.toLowerCase().includes(cityQ)) &&
            (!stateF || +c.stateID === stateF)
        );

        const jobQ = q(this.jobTypeSearch);
        this.filteredJobTypes = this.jobTypes.filter(j =>
            !jobQ ||
            j.name.toLowerCase().includes(jobQ) ||
            (j.description ?? '').toLowerCase().includes(jobQ)
        );

        const roleQ = q(this.roleSearch);
        this.filteredRoles = this.roles.filter(r =>
            !roleQ ||
            r.name.toLowerCase().includes(roleQ) ||
            (r.description ?? '').toLowerCase().includes(roleQ)
        );
    }

    // ── Countries CRUD ────────────────────────────────────────────────────

    openCreateCountry(): void {
        this.countryForm = { name: '', iSOCode: '', phoneCode: '' };
        this.showForm = true;
        this.showEditForm = false;
    }

    saveCountry(): void {
        if (!this.countryForm.name || !this.countryForm.iSOCode || !this.countryForm.phoneCode) {
            this.notify.warning('Completa todos los campos requeridos', '');
            return;
        }
        this.saving = true;
        this.catalog.createCountry(this.countryForm).pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (c) => {
                    this.countries.push(c);
                    this.applyFilters();
                    this.showForm = false;
                    this.notify.success('País creado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    startEditCountry(c: CountryDto): void {
        this.editCountryId = c.countryID;
        this.editCountryForm = { name: c.name, iSOCode: c.iSOCode, phoneCode: c.phoneCode };
        this.showEditForm = true;
        this.showForm = false;
    }

    updateCountry(): void {
        if (!this.editCountryId) return;
        this.saving = true;
        this.catalog.updateCountry(this.editCountryId, this.editCountryForm)
            .pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (c) => {
                    const idx = this.countries.findIndex(x => x.countryID === this.editCountryId);
                    if (idx >= 0) this.countries[idx] = c;
                    this.applyFilters();
                    this.showEditForm = false;
                    this.editCountryId = null;
                    this.notify.success('País actualizado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    deleteCountry(c: CountryDto): void {
        this.notify.confirm(`¿Desactivar el país "${c.name}"?`).then(ok => {
            if (!ok) return;
            this.catalog.deleteCountry(c.countryID).subscribe({
                next: () => {
                    this.countries = this.countries.filter(x => x.countryID !== c.countryID);
                    this.applyFilters();
                    this.notify.success('País desactivado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
        });
    }

    // ── States CRUD ───────────────────────────────────────────────────────

    openCreateState(): void {
        this.stateForm = { countryID: 0, name: '', code: '' };
        this.showForm = true;
        this.showEditForm = false;
    }

    saveState(): void {
        if (!this.stateForm.name || !this.stateForm.countryID) {
            this.notify.warning('Selecciona un país e ingresa el nombre', '');
            return;
        }
        this.saving = true;
        this.catalog.createState(this.stateForm).pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (s) => {
                    this.states.push(s);
                    this.applyFilters();
                    this.showForm = false;
                    this.notify.success('Departamento creado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    startEditState(s: StateDto): void {
        this.editStateId = s.stateID;
        this.editStateForm = { countryID: s.countryID, name: s.name, code: s.code ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }

    updateState(): void {
        if (!this.editStateId) return;
        this.saving = true;
        this.catalog.updateState(this.editStateId, this.editStateForm)
            .pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (s) => {
                    const idx = this.states.findIndex(x => x.stateID === this.editStateId);
                    if (idx >= 0) this.states[idx] = s;
                    this.applyFilters();
                    this.showEditForm = false;
                    this.editStateId = null;
                    this.notify.success('Departamento actualizado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    deleteState(s: StateDto): void {
        this.notify.confirm(`¿Desactivar el departamento "${s.name}"?`).then(ok => {
            if (!ok) return;
            this.catalog.deleteState(s.stateID).subscribe({
                next: () => {
                    this.states = this.states.filter(x => x.stateID !== s.stateID);
                    this.applyFilters();
                    this.notify.success('Departamento desactivado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
        });
    }

    // ── Cities CRUD ───────────────────────────────────────────────────────

    openCreateCity(): void {
        this.cityForm = { stateID: 0, name: '' };
        this.showForm = true;
        this.showEditForm = false;
    }

    saveCity(): void {
        if (!this.cityForm.name || !this.cityForm.stateID) {
            this.notify.warning('Selecciona un departamento e ingresa el nombre', '');
            return;
        }
        this.saving = true;
        this.catalog.createCity(this.cityForm).pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (c) => {
                    this.cities.push(c);
                    this.applyFilters();
                    this.showForm = false;
                    this.notify.success('Ciudad creada', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    startEditCity(c: CityDto): void {
        this.editCityId = c.cityID;
        this.editCityForm = { stateID: c.stateID, name: c.name };
        this.showEditForm = true;
        this.showForm = false;
    }

    updateCity(): void {
        if (!this.editCityId) return;
        this.saving = true;
        this.catalog.updateCity(this.editCityId, this.editCityForm)
            .pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (c) => {
                    const idx = this.cities.findIndex(x => x.cityID === this.editCityId);
                    if (idx >= 0) this.cities[idx] = c;
                    this.applyFilters();
                    this.showEditForm = false;
                    this.editCityId = null;
                    this.notify.success('Ciudad actualizada', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    deleteCity(c: CityDto): void {
        this.notify.confirm(`¿Desactivar la ciudad "${c.name}"?`).then(ok => {
            if (!ok) return;
            this.catalog.deleteCity(c.cityID).subscribe({
                next: () => {
                    this.cities = this.cities.filter(x => x.cityID !== c.cityID);
                    this.applyFilters();
                    this.notify.success('Ciudad desactivada', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
        });
    }

    // ── Job Types CRUD ────────────────────────────────────────────────────

    openCreateJobType(): void {
        this.jobTypeForm = { name: '', description: '' };
        this.showForm = true;
        this.showEditForm = false;
    }

    saveJobType(): void {
        if (!this.jobTypeForm.name) {
            this.notify.warning('El nombre es obligatorio', '');
            return;
        }
        this.saving = true;
        this.catalog.createJobType(this.jobTypeForm).pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (j) => {
                    this.jobTypes.push(j);
                    this.applyFilters();
                    this.showForm = false;
                    this.notify.success('Tipo de cargo creado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    startEditJobType(j: JobTypeDto): void {
        this.editJobTypeId = j.jobTypeID;
        this.editJobTypeForm = { name: j.name, description: j.description ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }

    updateJobType(): void {
        if (!this.editJobTypeId) return;
        this.saving = true;
        this.catalog.updateJobType(this.editJobTypeId, this.editJobTypeForm)
            .pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (j) => {
                    const idx = this.jobTypes.findIndex(x => x.jobTypeID === this.editJobTypeId);
                    if (idx >= 0) this.jobTypes[idx] = j;
                    this.applyFilters();
                    this.showEditForm = false;
                    this.editJobTypeId = null;
                    this.notify.success('Tipo de cargo actualizado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    deleteJobType(j: JobTypeDto): void {
        this.notify.confirm(`¿Desactivar el tipo de cargo "${j.name}"?`).then(ok => {
            if (!ok) return;
            this.catalog.deleteJobType(j.jobTypeID).subscribe({
                next: () => {
                    this.jobTypes = this.jobTypes.filter(x => x.jobTypeID !== j.jobTypeID);
                    this.applyFilters();
                    this.notify.success('Tipo de cargo desactivado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
        });
    }

    // ── Roles CRUD ────────────────────────────────────────────────────────

    openCreateRole(): void {
        this.roleForm = { name: '', description: '' };
        this.showForm = true;
        this.showEditForm = false;
    }

    saveRole(): void {
        if (!this.roleForm.name || !this.roleForm.description) {
            this.notify.warning('Nombre y descripción son obligatorios', '');
            return;
        }
        this.saving = true;
        this.catalog.createRole(this.roleForm).pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (r) => {
                    this.roles.push(r);
                    this.applyFilters();
                    this.showForm = false;
                    this.notify.success('Rol creado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    startEditRole(r: RoleDto): void {
        this.editRoleId = r.roleID;
        this.editRoleForm = { name: r.name, description: r.description ?? '' };
        this.showEditForm = true;
        this.showForm = false;
    }

    updateRole(): void {
        if (!this.editRoleId) return;
        this.saving = true;
        this.catalog.updateRole(this.editRoleId, this.editRoleForm)
            .pipe(finalize(() => this.saving = false))
            .subscribe({
                next: (r) => {
                    const idx = this.roles.findIndex(x => x.roleID === this.editRoleId);
                    if (idx >= 0) this.roles[idx] = r;
                    this.applyFilters();
                    this.showEditForm = false;
                    this.editRoleId = null;
                    this.notify.success('Rol actualizado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
    }

    deleteRole(r: RoleDto): void {
        this.notify.confirm(`¿Desactivar el rol "${r.name}"?`).then(ok => {
            if (!ok) return;
            this.catalog.deleteRole(r.roleID).subscribe({
                next: () => {
                    this.roles = this.roles.filter(x => x.roleID !== r.roleID);
                    this.applyFilters();
                    this.notify.success('Rol desactivado', '');
                },
                error: (err) => this.notify.error(this.errMsg(err), ''),
            });
        });
    }

    cancelForm(): void {
        this.showForm = false;
        this.showEditForm = false;
        this.editCountryId = null;
        this.editStateId = null;
        this.editCityId = null;
        this.editJobTypeId = null;
        this.editRoleId = null;
    }
}
