import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UsersService, UserProfileDto } from 'app/core/services/users.service';
import { AuthService } from 'app/core/services/auth.service';
import { S3UploadService } from 'app/core/services/s3-upload.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, BackgroundCirclesComponent],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    loading = true;
    error: string | null = null;
    profile: UserProfileDto | null = null;

    // ── Foto de perfil ────────────────────────────────────────────────────────
    photoFile: File | null = null;
    photoPreviewUrl: string | null = null;
    uploadingPhoto = false;

    // ── Contraseña ────────────────────────────────────────────────────────────
    savingPassword = false;
    passwordError: string | null = null;
    passwordSuccess = false;

    form = this.fb.group({
        firstName: ['', [Validators.required]],
        lastName:  ['', [Validators.required]],
        documentNumber: [''],
        email: ['', [Validators.required, Validators.email]],
    });

    passwordForm = this.fb.group(
        {
            currentPassword: ['', [Validators.required]],
            newPassword:     ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: [ProfileComponent.passwordsMatchValidator] }
    );

    constructor(
        private readonly fb: FormBuilder,
        private readonly users: UsersService,
        private readonly auth: AuthService,
        private readonly s3: S3UploadService,
        private readonly notify: AlertService,
    ) { }

    get backRoute(): string {
        let roles = this.auth.getCurrentUser()?.roles ?? [];
        if (!roles.length) {
            try {
                const stored = localStorage.getItem('emocheck_user');
                if (stored) roles = JSON.parse(stored)?.roles ?? [];
            } catch { /* ignore */ }
        }
        return roles.includes('SystemAdmin') ? '/admin' : '/home';
    }

    ngOnInit(): void { this.load(); }

    get initials(): string {
        const fullName = `${this.form.value.firstName ?? ''} ${this.form.value.lastName ?? ''}`.trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
    }

    /** URL que se muestra en el avatar: primero preview local, luego la guardada en el servidor */
    get avatarUrl(): string | null {
        return this.photoPreviewUrl ?? this.profile?.profilePhotoUrl ?? null;
    }

    triggerPhotoInput(input: HTMLInputElement): void { input.click(); }

    onPhotoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        // Validaciones
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            this.notify.error('Formato no permitido. Usa JPG, PNG o WebP.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            this.notify.error('La imagen no puede superar 5 MB.');
            return;
        }

        this.photoFile = file;
        if (this.photoPreviewUrl) URL.revokeObjectURL(this.photoPreviewUrl);
        this.photoPreviewUrl = URL.createObjectURL(file);

        // Subir automáticamente al seleccionar
        this.uploadPhoto();
    }

    uploadPhoto(): void {
        if (!this.photoFile) return;
        const userId = this.profile?.userId ?? 0;
        const ext = this.photoFile.name.split('.').pop() ?? 'jpg';
        const fileName = `user-${userId}-${Date.now()}.${ext}`;

        this.uploadingPhoto = true;

        this.s3.upload(this.photoFile, 'avatars', fileName).pipe(
            switchMap((result) => this.users.updateProfilePhoto(result.url)),
            finalize(() => { this.uploadingPhoto = false; })
        ).subscribe({
            next: (updated) => {
                this.profile = updated;
                // Propagar el nuevo avatar al menú de navegación
                if (updated.profilePhotoUrl) {
                    this.auth.updateAvatar(updated.profilePhotoUrl);
                }
                // Liberar preview local — ahora usamos la URL del servidor
                if (this.photoPreviewUrl) URL.revokeObjectURL(this.photoPreviewUrl);
                this.photoPreviewUrl = null;
                this.photoFile = null;
                this.notify.success('Foto de perfil actualizada');
            },
            error: (e) => this.notify.error(e?.message || 'Error al subir la foto'),
        });
    }

    load(): void {
        this.loading = true;
        this.error = null;
        this.users.getMyProfile()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (p) => {
                    this.profile = p;
                    const parsed = this.parseFullName(p.fullName ?? '');
                    this.form.patchValue({
                        firstName:      parsed.firstName,
                        lastName:       parsed.lastName,
                        documentNumber: p.documentNumber ?? '',
                        email:          p.email ?? '',
                    });
                },
                error: (e) => { this.error = e?.message || 'No fue posible cargar tu perfil'; },
            });
    }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.loading = true;
        this.error = null;
        const v = this.form.getRawValue();
        const fullName = `${v.firstName ?? ''} ${v.lastName ?? ''}`.trim();
        this.users.updateMyProfile({
            fullName: fullName || undefined,
            documentNumber: v.documentNumber ?? undefined,
            email: v.email ?? undefined,
        })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
            next: (p) => {
                this.profile = p;
                this.notify.success('Perfil actualizado correctamente');
            },
            error: (e) => { this.error = e?.message || 'No fue posible guardar el perfil'; },
        });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
        this.passwordError = null;
        this.passwordSuccess = false;
        this.savingPassword = true;

        const v = this.passwordForm.getRawValue();
        this.users.changePassword({
            currentPassword: v.currentPassword ?? '',
            newPassword:     v.newPassword ?? '',
            confirmPassword: v.confirmPassword ?? '',
        })
        .pipe(finalize(() => (this.savingPassword = false)))
        .subscribe({
            next: (success) => {
                if (success) {
                    this.passwordSuccess = true;
                    this.passwordForm.reset();
                    this.notify.success('Contraseña actualizada correctamente');
                } else {
                    this.passwordError = 'La contraseña actual es incorrecta.';
                }
            },
            error: (e) => { this.passwordError = e?.message || 'Error al cambiar la contraseña'; },
        });
    }

    private parseFullName(fullName: string): { firstName: string; lastName: string } {
        const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
        if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' };
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }

    private static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
        const g = control as any;
        const np = g?.get?.('newPassword')?.value;
        const cp = g?.get?.('confirmPassword')?.value;
        if (!np || !cp) return null;
        return np === cp ? null : { passwordsMismatch: true };
    }
}
