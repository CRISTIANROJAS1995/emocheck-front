import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UsersService, UserProfileDto } from 'app/core/services/users.service';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatIconModule, BackgroundCirclesComponent],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    loading = true;
    error: string | null = null;
    profile: UserProfileDto | null = null;

    photoFile: File | null = null;
    photoPreviewUrl: string | null = null;

    form = this.fb.group({
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        documentNumber: [''],
        email: ['', [Validators.required, Validators.email]],
    });

    passwordForm = this.fb.group(
        {
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
        },
        { validators: [ProfileComponent.passwordsMatchValidator] }
    );

    constructor(private readonly fb: FormBuilder, private readonly users: UsersService) { }

    ngOnInit(): void {
        this.load();
    }

    get initials(): string {
        const fullName = `${this.form.value.firstName ?? ''} ${this.form.value.lastName ?? ''}`.trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? '';
        const second = parts[1]?.[0] ?? '';
        return (first + second).toUpperCase() || 'U';
    }

    triggerPhotoInput(input: HTMLInputElement): void {
        input.click();
    }

    onPhotoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.photoFile = file;

        if (this.photoPreviewUrl) {
            URL.revokeObjectURL(this.photoPreviewUrl);
        }
        this.photoPreviewUrl = URL.createObjectURL(file);
    }

    load(): void {
        this.loading = true;
        this.error = null;

        this.users
            .getMyProfile()
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (p) => {
                    this.profile = p;

                    const parsed = this.parseFullName(p.fullName ?? '');
                    this.form.patchValue({
                        firstName: parsed.firstName,
                        lastName: parsed.lastName,
                        documentNumber: p.documentNumber ?? '',
                        email: p.email ?? '',
                    });
                },
                error: (e) => {
                    this.error = e?.message || 'No fue posible cargar tu perfil';
                },
            });
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.error = null;

        const value = this.form.getRawValue();
        const fullName = `${value.firstName ?? ''} ${value.lastName ?? ''}`.trim();
        this.users
            .updateMyProfile({
                fullName: fullName || undefined,
                documentNumber: value.documentNumber ?? undefined,
                email: value.email ?? undefined,
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (p) => {
                    this.profile = p;
                    if (this.photoFile) {
                        window.alert('Perfil actualizado. Foto seleccionada (pendiente de integración con backend).');
                    } else {
                        window.alert('Perfil actualizado');
                    }
                },
                error: (e) => {
                    this.error = e?.message || 'No fue posible guardar el perfil';
                },
            });
    }

    changePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        window.alert('Cambio de contraseña: UI lista (pendiente de endpoint backend).');
        this.passwordForm.reset();
    }

    private parseFullName(fullName: string): { firstName: string; lastName: string } {
        const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
        if (parts.length <= 1) {
            return { firstName: parts[0] ?? '', lastName: '' };
        }
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }

    private static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
        const group = control as any;
        const newPassword = group?.get?.('newPassword')?.value;
        const confirmPassword = group?.get?.('confirmPassword')?.value;
        if (!newPassword || !confirmPassword) return null;
        return newPassword === confirmPassword ? null : { passwordsMismatch: true };
    }
}
