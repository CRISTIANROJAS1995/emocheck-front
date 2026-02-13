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
import { AdminCreateUserResponseDto, AdminUserListItemDto, AdminUsersService } from 'app/core/services/admin-users.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { finalize } from 'rxjs/operators';

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
        BackgroundCirclesComponent,
    ],
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
    loading = true;
    saving = false;

    users: AdminUserListItemDto[] = [];
    created: AdminCreateUserResponseDto | null = null;

    filterForm!: UntypedFormGroup;
    createForm!: UntypedFormGroup;

    readonly roleOptions: Array<{ id: number; name: string }> = [
        { id: 1, name: 'Employee' },
        { id: 2, name: 'HSE Leader' },
        { id: 3, name: 'Psychologist' },
        { id: 4, name: 'Company Admin' },
        { id: 5, name: 'System Admin' },
        { id: 6, name: 'ARL Admin' },
    ];

    constructor(
        private readonly fb: UntypedFormBuilder,
        private readonly adminUsers: AdminUsersService,
        private readonly alert: AlertService
    ) { }

    ngOnInit(): void {
        this.filterForm = this.fb.group({
            search: [''],
            companyId: [''],
            siteId: [''],
            areaId: [''],
            stateId: [''],
        });

        this.createForm = this.fb.group({
            fullName: ['', Validators.required],
            documentNumber: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            companyID: [''],
            siteID: [''],
            areaID: [''],
            jobTypeID: ['', Validators.required],
            roleIDs: [[1], Validators.required],
        });

        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.created = null;

        const raw = this.filterForm?.getRawValue?.() || {};
        const toNum = (v: any): number | undefined => {
            if (v === null || v === undefined || v === '') return undefined;
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
        };

        this.adminUsers
            .listUsers({
                search: raw.search || undefined,
                companyId: toNum(raw.companyId),
                siteId: toNum(raw.siteId),
                areaId: toNum(raw.areaId),
                stateId: toNum(raw.stateId),
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (users) => {
                    this.users = users;
                },
                error: (e) => {
                    this.users = [];
                    this.alert.error(e?.message || 'No fue posible cargar usuarios');
                },
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
        this.created = null;

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
                next: (created) => {
                    this.created = created;
                    this.alert.success('Usuario creado exitosamente');
                    this.createForm.patchValue({
                        fullName: '',
                        documentNumber: '',
                        email: '',
                        password: '',
                        roleIDs: [1],
                    });
                    this.loadUsers();
                },
                error: (e) => this.alert.error(e?.message || 'No fue posible crear el usuario'),
            });
    }

    riskLabel(riskLevel: string | null | undefined): string {
        const v = (riskLevel || '').toLowerCase();
        if (v.includes('green') || v.includes('verde')) return 'Verde';
        if (v.includes('yellow') || v.includes('amarillo')) return 'Amarillo';
        if (v.includes('red') || v.includes('rojo')) return 'Rojo';
        return 'N/D';
    }

    riskChipClass(riskLevel: string | null | undefined): string {
        const v = (riskLevel || '').toLowerCase();
        if (v.includes('green') || v.includes('verde')) return 'risk-chip risk-chip--green';
        if (v.includes('yellow') || v.includes('amarillo')) return 'risk-chip risk-chip--yellow';
        if (v.includes('red') || v.includes('rojo')) return 'risk-chip risk-chip--red';
        return 'risk-chip risk-chip--unknown';
    }
}
