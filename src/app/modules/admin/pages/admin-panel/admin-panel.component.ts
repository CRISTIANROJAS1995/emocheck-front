import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { AdminUserListItemDto, AdminUsersService } from 'app/core/services/admin-users.service';
import {
    AdminOrganizationService,
    CompanyDto, SiteDto, AreaDto, JobTypeDto, RoleDto,
} from 'app/core/services/admin-organization.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-admin-panel',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
    loading = true;
    saving = false;
    showCreateForm = false;
    showEditForm = false;
    searchText = '';

    users: AdminUserListItemDto[] = [];
    filteredUsers: AdminUserListItemDto[] = [];
    selectedUser: AdminUserListItemDto | null = null;

    sortField = 'fullName';
    sortAsc = true;

    createForm!: UntypedFormGroup;
    editForm!: UntypedFormGroup;
    editingUser: AdminUserListItemDto | null = null;

    // Org dropdowns
    companies: CompanyDto[] = [];
    sites: SiteDto[] = [];
    areas: AreaDto[] = [];
    jobTypes: JobTypeDto[] = [];

    roleOptions: Array<{ id: number; name: string }> = [
        { id: 1, name: 'Super Admin' },
        { id: 2, name: 'Company Admin' },
        { id: 3, name: 'Psychologist' },
        { id: 4, name: 'HR Manager' },
        { id: 5, name: 'Area Manager' },
        { id: 6, name: 'Employee' },
    ];

    constructor(
        private readonly fb: UntypedFormBuilder,
        private readonly adminUsers: AdminUsersService,
        private readonly orgService: AdminOrganizationService,
        private readonly alert: AlertService
    ) { }

    ngOnInit(): void {
        this.createForm = this.fb.group({
            fullName: ['', Validators.required],
            documentNumber: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            companyID: [null],
            siteID: [null],
            areaID: [null],
            jobTypeID: [null, Validators.required],
            roleIDs: [[6], Validators.required],
        });

        this.editForm = this.fb.group({
            fullName: ['', Validators.required],
            documentNumber: [''],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            companyID: [null],
            siteID: [null],
            areaID: [null],
            jobTypeID: [null],
        });

        this.loadUsers();
        this.loadOrgData();
    }

    loadOrgData(): void {
        forkJoin({
            companies: this.orgService.getCompanies().pipe(catchError(() => of([]))),
            sites: this.orgService.getSites().pipe(catchError(() => of([]))),
            areas: this.orgService.getAreas().pipe(catchError(() => of([]))),
            jobTypes: this.orgService.getJobTypes().pipe(catchError(() => of([]))),
            roles: this.orgService.getRoles().pipe(catchError(() => of([]))),
        }).subscribe(({ companies, sites, areas, jobTypes, roles }) => {
            this.companies = companies;
            this.sites = sites;
            this.areas = areas;
            this.jobTypes = jobTypes;
            if (roles.length > 0) {
                this.roleOptions = (roles as RoleDto[]).map(r => ({ id: r.roleID, name: r.name }));
            }
        });
    }

    loadUsers(): void {
        this.loading = true;
        this.adminUsers
            .listUsers()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    this.applyFilter();
                },
                error: (e) => {
                    this.users = [];
                    this.filteredUsers = [];
                    this.alert.error(e?.message || 'No fue posible cargar usuarios');
                },
            });
    }

    applyFilter(): void {
        const term = this.searchText.toLowerCase().trim();
        let filtered = this.users;
        if (term) {
            filtered = filtered.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(term) ||
                    u.email.toLowerCase().includes(term) ||
                    (u.companyName ?? '').toLowerCase().includes(term) ||
                    (u.roles ?? []).join(' ').toLowerCase().includes(term)
            );
        }
        // Sort
        filtered = [...filtered].sort((a, b) => {
            const aVal = String((a as any)[this.sortField] ?? '').toLowerCase();
            const bVal = String((b as any)[this.sortField] ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal);
            return this.sortAsc ? cmp : -cmp;
        });
        this.filteredUsers = filtered;
    }

    toggleSort(field: string): void {
        if (this.sortField === field) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortField = field;
            this.sortAsc = true;
        }
        this.applyFilter();
    }

    sortClass(field: string): string {
        if (this.sortField !== field) return '';
        return this.sortAsc ? 'sorted-asc' : 'sorted-desc';
    }

    selectUser(user: AdminUserListItemDto): void {
        this.selectedUser = this.selectedUser?.userId === user.userId ? null : user;
    }

    toggleActive(user: AdminUserListItemDto): void {
        this.saving = true;
        const obs = user.isActive
            ? this.adminUsers.deactivateUser(user.userId)
            : this.adminUsers.activateUser(user.userId);

        obs.pipe(finalize(() => (this.saving = false))).subscribe({
            next: () => {
                this.alert.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado');
                this.loadUsers();
            },
            error: (e) => this.alert.error(e?.message || 'Error al cambiar estado'),
        });
    }

    async deleteUser(user: AdminUserListItemDto): Promise<void> {
        const ok = await this.alert.confirm(`Se eliminará el usuario "${user.fullName}" (${user.email}).`);
        if (!ok) return;

        this.saving = true;
        this.adminUsers
            .deleteUser(user.userId)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success('Usuario eliminado');
                    this.loadUsers();
                },
                error: (e) => this.alert.error(e?.message || 'No fue posible eliminar el usuario'),
            });
    }

    createUser(): void {
        if (this.createForm.invalid) {
            this.createForm.markAllAsTouched();
            return;
        }

        this.saving = true;

        const v = this.createForm.getRawValue();
        const toOptionalNum = (value: any): number | null | undefined => {
            if (value === null || value === undefined || value === '') return null;
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        };

        const roleIDs: number[] = Array.isArray(v.roleIDs)
            ? v.roleIDs.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
            : [];

        this.adminUsers
            .createUser({
                fullName: String(v.fullName || '').trim(),
                documentNumber: String(v.documentNumber || '').trim(),
                email: String(v.email || '').trim(),
                password: String(v.password || '').trim(),
                companyID: toOptionalNum(v.companyID),
                siteID: toOptionalNum(v.siteID),
                areaID: toOptionalNum(v.areaID),
                jobTypeID: Number(v.jobTypeID),
                roleIDs: roleIDs.length ? roleIDs : [1],
            })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success('Usuario creado exitosamente');
                    this.createForm.reset({ roleIDs: [1] });
                    this.showCreateForm = false;
                    this.loadUsers();
                },
                error: (e) => this.alert.error(e?.message || 'No fue posible crear el usuario'),
            });
    }

    get activeCount(): number {
        return this.users.filter((u) => u.isActive).length;
    }

    get inactiveCount(): number {
        return this.users.filter((u) => !u.isActive).length;
    }

    // ── Edit User ──

    startEditUser(user: AdminUserListItemDto): void {
        this.editingUser = user;
        this.showEditForm = true;
        this.showCreateForm = false;
        this.editForm.patchValue({
            fullName: user.fullName,
            documentNumber: user.documentNumber ?? '',
            email: user.email,
            phone: user.phone ?? '',
            companyID: user.companyID ?? null,
            siteID: user.siteID ?? null,
            areaID: user.areaID ?? null,
            jobTypeID: user.jobTypeID ?? null,
        });
    }

    cancelEdit(): void {
        this.showEditForm = false;
        this.editingUser = null;
    }

    saveEditUser(): void {
        if (this.editForm.invalid || !this.editingUser) {
            this.editForm.markAllAsTouched();
            return;
        }
        this.saving = true;
        const v = this.editForm.getRawValue();
        const toOptionalNum = (value: any): number | null => {
            if (value === null || value === undefined || value === '') return null;
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        };

        this.adminUsers
            .updateUser(this.editingUser.userId, {
                fullName: String(v.fullName || '').trim(),
                documentNumber: String(v.documentNumber || '').trim() || undefined,
                email: String(v.email || '').trim(),
                phone: String(v.phone || '').trim() || undefined,
                companyID: toOptionalNum(v.companyID),
                siteID: toOptionalNum(v.siteID),
                areaID: toOptionalNum(v.areaID),
                jobTypeID: toOptionalNum(v.jobTypeID),
            } as any)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success('Usuario actualizado exitosamente');
                    this.cancelEdit();
                    this.loadUsers();
                },
                error: (e) => this.alert.error(e?.error?.message || e?.message || 'No fue posible actualizar el usuario'),
            });
    }

    // ── Filtered sites/areas based on selected company ──

    get filteredCreateSites(): SiteDto[] {
        const cid = this.createForm.get('companyID')?.value;
        return cid ? this.sites.filter(s => s.companyID === Number(cid)) : this.sites;
    }

    get filteredCreateAreas(): AreaDto[] {
        const cid = this.createForm.get('companyID')?.value;
        return cid ? this.areas.filter(a => a.companyID === Number(cid)) : this.areas;
    }

    get filteredEditSites(): SiteDto[] {
        const cid = this.editForm.get('companyID')?.value;
        return cid ? this.sites.filter(s => s.companyID === Number(cid)) : this.sites;
    }

    get filteredEditAreas(): AreaDto[] {
        const cid = this.editForm.get('companyID')?.value;
        return cid ? this.areas.filter(a => a.companyID === Number(cid)) : this.areas;
    }
}
