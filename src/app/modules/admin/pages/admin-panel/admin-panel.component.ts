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
import { AdminUserListItemDto, AdminUsersService, AdminUpdateUserRequestDto, BulkUploadResult } from 'app/core/services/admin-users.service';
import { AuthService } from 'app/core/services/auth.service';
import {
    AdminOrganizationService,
    CompanyDto, SiteDto, AreaDto, JobTypeDto, RoleDto,
} from 'app/core/services/admin-organization.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import * as XLSX from 'xlsx-js-style';

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
    showBulkUpload = false;
    searchText = '';

    users: AdminUserListItemDto[] = [];
    filteredUsers: AdminUserListItemDto[] = [];
    selectedUser: AdminUserListItemDto | null = null;

    sortField = 'fullName';
    sortAsc = true;

    createForm!: UntypedFormGroup;
    editForm!: UntypedFormGroup;
    editingUser: AdminUserListItemDto | null = null;

    // Bulk upload
    selectedFile: File | null = null;
    uploadResult: any = null;
    uploading = false;

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
        private readonly alert: AlertService,
        private readonly auth: AuthService,
    ) { }

    ngOnInit(): void {
        this.createForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            documentType: ['CC', Validators.required],
            documentNumber: ['', Validators.required],
            phone: ['', Validators.required],
            gender: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            companyID: [null],
            siteID: [null],
            areaID: [null],
            jobTypeID: [null, Validators.required],
            roleIDs: [[6], Validators.required],
        });

        this.editForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            phone: [''],
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
                    this.alert.error(this.extractErrorMessage(e, 'No fue posible cargar usuarios'));
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
            error: (e) => this.alert.error(this.extractErrorMessage(e, 'Error al cambiar estado')),
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
                error: (e) => this.alert.error(this.extractErrorMessage(e, 'No fue posible eliminar el usuario')),
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
                firstName: String(v.firstName || '').trim(),
                lastName: String(v.lastName || '').trim(),
                documentType: String(v.documentType || '').trim(),
                documentNumber: String(v.documentNumber || '').trim(),
                phone: String(v.phone || '').trim(),
                gender: String(v.gender || '').trim(),
                email: String(v.email || '').trim(),
                password: String(v.password || '').trim(),
                companyID: toOptionalNum(v.companyID),
                siteID: toOptionalNum(v.siteID),
                areaID: toOptionalNum(v.areaID),
                jobTypeID: Number(v.jobTypeID),
                roleIDs: roleIDs.length ? roleIDs : [6],
            })
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success('Usuario creado exitosamente');
                    this.createForm.reset({ roleIDs: [6] });
                    this.showCreateForm = false;
                    this.loadUsers();
                },
                error: (e) => this.alert.error(this.extractErrorMessage(e, 'No fue posible crear el usuario')),
            });
    }

    get activeCount(): number {
        return this.users.filter((u) => u.isActive).length;
    }

    get inactiveCount(): number {
        return this.users.filter((u) => !u.isActive).length;
    }

    // ── Edit User ──

    /** IDs de roles que el usuario tiene actualmente en el formulario de edición */
    editRoleIDs: Set<number> = new Set();
    /** Flag para mostrar spinner mientras se cambia un rol individualmente */
    savingRole = false;

    startEditUser(user: AdminUserListItemDto): void {
        this.editingUser = user;
        this.showEditForm = true;
        this.showCreateForm = false;
        // Split fullName into firstName / lastName for the API
        const nameParts = (user.fullName ?? '').trim().split(/\s+/);
        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ') ?? '';
        this.editForm.patchValue({
            firstName,
            lastName,
            phone: user.phone ?? '',
            areaID: user.areaID ?? null,
            jobTypeID: user.jobTypeID ?? null,
        });
        // Inicializar roles actuales del usuario
        this.editRoleIDs = new Set(
            (user.roles ?? [])
                .map(roleName => this.roleOptions.find(r => r.name.toLowerCase() === roleName.toLowerCase())?.id)
                .filter((id): id is number => id !== undefined)
        );
    }

    cancelEdit(): void {
        this.showEditForm = false;
        this.editingUser = null;
        this.editRoleIDs = new Set();
    }

    hasEditRole(roleId: number): boolean {
        return this.editRoleIDs.has(roleId);
    }

    toggleEditRole(roleId: number): void {
        if (!this.editingUser) return;
        const userId = this.editingUser.userId;
        const wasAssigned = this.editRoleIDs.has(roleId);
        this.savingRole = true;

        const obs = wasAssigned
            ? this.adminUsers.removeRole(userId, roleId)
            : this.adminUsers.assignRole(userId, roleId);

        obs.pipe(finalize(() => (this.savingRole = false))).subscribe({
            next: () => {
                if (wasAssigned) {
                    this.editRoleIDs.delete(roleId);
                } else {
                    this.editRoleIDs.add(roleId);
                }
                // Actualizar el objeto en memoria para que el badge de la tabla refleje el cambio
                if (this.editingUser) {
                    const roleName = this.roleOptions.find(r => r.id === roleId)?.name ?? '';
                    const currentRoles = [...(this.editingUser.roles ?? [])];
                    if (wasAssigned) {
                        this.editingUser.roles = currentRoles.filter(r => r.toLowerCase() !== roleName.toLowerCase());
                    } else {
                        this.editingUser.roles = [...currentRoles, roleName];
                    }
                }
                this.alert.success(wasAssigned ? 'Rol removido' : 'Rol asignado');
            },
            error: (e) => this.alert.error(this.extractErrorMessage(e, 'Error al modificar rol')),
        });
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

        const payload: AdminUpdateUserRequestDto = {
            firstName: String(v.firstName || '').trim() || undefined,
            lastName: String(v.lastName || '').trim() || undefined,
            phone: String(v.phone || '').trim() || undefined,
            areaID: toOptionalNum(v.areaID),
            jobTypeID: toOptionalNum(v.jobTypeID),
        };

        this.adminUsers
            .updateUser(this.editingUser.userId, payload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success('Usuario actualizado exitosamente');
                    this.cancelEdit();
                    this.loadUsers();
                },
                error: (e) => this.alert.error(this.extractErrorMessage(e, 'No fue posible actualizar el usuario')),
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

    get filteredEditAreas(): AreaDto[] {
        return this.areas;
    }

    // ── Reset Password (SuperAdmin) ──

    get isSuperAdmin(): boolean {
        const roles = this.auth.getCurrentUser()?.roles ?? [];
        return roles.some(r => ['superadmin', 'systemadmin'].includes(r.toLowerCase()));
    }

    /** Genera una contraseña temporal aleatoria de 10 caracteres */
    private generateTempPassword(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
        return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }

    async resetPassword(user: AdminUserListItemDto): Promise<void> {
        const tempPassword = this.generateTempPassword();
        const ok = await this.alert.confirm(
            `¿Restablecer la contraseña de "${user.fullName}"?\n\nContraseña temporal generada:\n${tempPassword}\n\nEl usuario deberá cambiarla en el próximo login.`
        );
        if (!ok) return;

        this.saving = true;
        this.adminUsers.adminResetPassword(user.userId, tempPassword)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
                next: () => {
                    this.alert.success(
                        `Contraseña restablecida.\n\nComunica esta contraseña temporal al usuario:\n${tempPassword}`
                    );
                },
                error: (e) => this.alert.error(this.extractErrorMessage(e, 'No fue posible restablecer la contraseña')),
            });
    }

    // ── Error helpers ──

    /**
     * Extrae el mensaje legible de un HttpErrorResponse.
     * Maneja los dos formatos que retorna el backend:
     *   1. { StatusCode, Message, Details }   → usa "Message"
     *   2. { errors: { Field: [msg, ...] } }  → concatena todos los mensajes de campo
     */
    private extractErrorMessage(e: any, fallback = 'Ha ocurrido un error'): string {
        const body = e?.error;
        if (!body) return e?.message || fallback;

        // Formato 1: { Message: "..." }
        if (typeof body.Message === 'string' && body.Message.trim()) {
            return body.Message.trim();
        }

        // Formato 2: { errors: { Field: ["msg1", ...] } }
        if (body.errors && typeof body.errors === 'object') {
            const messages: string[] = [];
            for (const field of Object.keys(body.errors)) {
                const fieldMsgs: string[] = Array.isArray(body.errors[field])
                    ? body.errors[field]
                    : [String(body.errors[field])];
                messages.push(...fieldMsgs);
            }
            if (messages.length) return messages.join('\n');
        }

        // Formato genérico: message / title
        return body.message || body.title || e?.message || fallback;
    }

    // ── Bulk Upload ──────────────────────────────────────────────────────────

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) {
            this.selectedFile = null;
            return;
        }

        // Validar que sea .xlsx
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            this.alert.error('Solo se permiten archivos .xlsx');
            this.selectedFile = null;
            return;
        }

        // Validar tamaño (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.alert.error('El archivo no puede superar 10 MB');
            this.selectedFile = null;
            return;
        }

        this.selectedFile = file;
        this.uploadResult = null;
    }

    uploadUsers(): void {
        if (!this.selectedFile) {
            this.alert.error('Selecciona un archivo Excel primero');
            return;
        }

        this.uploading = true;
        this.uploadResult = null;

        this.adminUsers.bulkUpload(this.selectedFile)
            .pipe(finalize(() => (this.uploading = false)))
            .subscribe({
                next: (result) => {
                    this.uploadResult = result;
                    this.selectedFile = null;
                    
                    // Reset file input
                    const fileInput = document.getElementById('bulk-upload-file') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';

                    // Reload users if some were created
                    if (result.created > 0) {
                        this.loadUsers();
                        this.alert.success(`Se crearon ${result.created} usuarios correctamente`);
                    }

                    // Show errors if any
                    if (result.errors.length > 0) {
                        console.warn('Bulk upload errors:', result.errors);
                    }
                },
                error: (e) => {
                    this.selectedFile = null;
                    this.alert.error(this.extractErrorMessage(e, 'Error al procesar el archivo'));
                }
            });
    }

    downloadTemplate(): void {
        try {
            // Crear datos estructurados para Excel
            const headers = [
                'FirstName', 'LastName', 'Email', 'Password', 'DocumentType', 
                'DocumentNumber', 'Phone', 'Gender', 'CompanyID', 'SiteID', 
                'AreaID', 'JobTypeID', 'RoleIDs'
            ];
            
            const examples = [
                ['Juan', 'Pérez', 'juan.perez@empresa.com', 'Pass123!', 'CC', '12345678', '3001234567', 'M', '1', '1', '1', '1', '6'],
                ['María', 'García', 'maria.garcia@empresa.com', 'Pass456!', 'CC', '87654321', '3007654321', 'F', '1', '1', '2', '2', '6,4'],
                ['Carlos', 'López', 'carlos.lopez@empresa.com', 'Pass789!', 'CE', '11223344', '3009876543', 'M', '1', '2', '3', '1', '5']
            ];

            // Crear datos del worksheet: headers + ejemplos + filas vacías
            const worksheetData = [
                headers,
                ...examples,
                // Agregar 15 filas vacías para completar
                ...Array(15).fill(null).map(() => new Array(headers.length).fill(''))
            ];

            // Crear worksheet usando SheetJS
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            
            // Configurar anchos de columnas
            const columnWidths = [
                { wch: 12 }, // FirstName
                { wch: 12 }, // LastName  
                { wch: 25 }, // Email
                { wch: 12 }, // Password
                { wch: 12 }, // DocumentType
                { wch: 15 }, // DocumentNumber
                { wch: 15 }, // Phone
                { wch: 8 },  // Gender
                { wch: 10 }, // CompanyID
                { wch: 8 },  // SiteID
                { wch: 8 },  // AreaID
                { wch: 10 }, // JobTypeID
                { wch: 10 }  // RoleIDs
            ];
            worksheet['!cols'] = columnWidths;

            // Aplicar estilos a las celdas
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
            
            // Estilo para headers (fila 1)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                if (!worksheet[cellRef]) continue;
                
                worksheet[cellRef].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '4472C4' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    }
                };
            }

            // Estilo para ejemplos (filas 2-4)
            for (let row = 1; row <= 3; row++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!worksheet[cellRef]) continue;
                    
                    worksheet[cellRef].s = {
                        font: { italic: true, color: { rgb: '666666' } },
                        fill: { fgColor: { rgb: 'F2F2F2' } },
                        border: {
                            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
                        }
                    };
                }
            }

            // Crear workbook y agregar worksheet
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

            // Generar y descargar archivo Excel
            const excelBuffer = XLSX.write(workbook, { 
                bookType: 'xlsx', 
                type: 'array',
                cellStyles: true
            });
            
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'plantilla_usuarios_emocheck.xlsx');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.alert.success('📊 Plantilla Excel generada correctamente. Elimina los ejemplos (filas 2-4) y completa con tus datos.');
            
        } catch (error) {
            console.error('Error generando Excel:', error);
            this.alert.error('Error al generar Excel. Intenta con la opción CSV.');
        }
    }

    private generateExcelTable(headers: string[], examples: string[][]): string {
        // Esta función ya no se usa, mantenemos por compatibilidad
        return '';
    }

    downloadCSVTemplate(): void {
        // CSV optimizado para Excel con BOM y formato correcto
        const headers = [
            'FirstName', 'LastName', 'Email', 'Password', 'DocumentType', 
            'DocumentNumber', 'Phone', 'Gender', 'CompanyID', 'SiteID', 
            'AreaID', 'JobTypeID', 'RoleIDs'
        ];
        
        const examples = [
            ['Juan', 'Pérez', 'juan.perez@empresa.com', 'Pass123!', 'CC', '12345678', '3001234567', 'M', '1', '1', '1', '1', '6'],
            ['María', 'García', 'maria.garcia@empresa.com', 'Pass456!', 'CC', '87654321', '3007654321', 'F', '1', '1', '2', '2', '"6,4"'],
            ['Carlos', 'López', 'carlos.lopez@empresa.com', 'Pass789!', 'CE', '11223344', '3009876543', 'M', '1', '2', '3', '1', '5']
        ];

        // Función para escapar valores CSV
        const escapeCSV = (value: string): string => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        // UTF-8 BOM para que Excel lo reconozca correctamente
        const BOM = '\uFEFF';
        const rows = [
            // Headers
            headers.map(h => escapeCSV(h)).join(','),
            // Ejemplos
            ...examples.map(row => row.map(cell => escapeCSV(cell)).join(','))
        ];

        // Agregar filas vacías para facilitar el llenado
        for (let i = 0; i < 15; i++) {
            rows.push(new Array(headers.length).fill('').join(','));
        }
        
        const csvContent = BOM + rows.join('\n');
        const blob = new Blob([csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'plantilla_usuarios_emocheck.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.alert.info('📄 Plantilla CSV descargada. Excel la abrirá automáticamente. Elimina los ejemplos (filas 2-4) y guarda como .xlsx antes de subir.');
    }

    closeBulkUpload(): void {
        this.showBulkUpload = false;
        this.selectedFile = null;
        this.uploadResult = null;
        this.uploading = false;
    }
}
