import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';
import { UsersService } from 'app/core/services/users.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';

@Component({
    selector: 'app-complete-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BackgroundCirclesComponent],
    templateUrl: './complete-profile.component.html',
    styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit {
    profileForm: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private _router: Router,
        private readonly usersService: UsersService,
        private readonly alert: AlertService
    ) {
        this.profileForm = this._formBuilder.group({
            fullName: ['', Validators.required],
            idDocument: ['', Validators.required],
            area: [''],
            sede: [''],
            position: [''],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        this.usersService.getMyProfile().subscribe({
            next: (profile) => {
                this.profileForm.patchValue({
                    fullName: profile.fullName ?? '',
                    idDocument: profile.documentNumber ?? '',
                    email: profile.email ?? '',
                });
            },
            error: (e) => {
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar tu perfil';
                this.alert.error(msg);
            },
        });
    }

    completeRegistration(): void {

        Object.keys(this.profileForm.controls).forEach(key => {
            this.profileForm.get(key)?.markAsTouched();
        });

        if (!this.profileForm.valid) return;

        const payload = {
            fullName: this.profileForm.get('fullName')?.value,
            documentNumber: this.profileForm.get('idDocument')?.value,
            email: this.profileForm.get('email')?.value,
        };

        this.usersService.updateMyProfile(payload).subscribe({
            next: () => this._router.navigate(['/emotional-instructions']),
            error: (e) => {
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible completar tu perfil';
                this.alert.error(msg);
            },
        });
    }
}
