import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'app-complete-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BackgroundCirclesComponent],
    templateUrl: './complete-profile.component.html',
    styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent {
    profileForm: FormGroup;

    constructor(private _formBuilder: FormBuilder, private _router: Router) {
        this.profileForm = this._formBuilder.group({
            fullName: ['María Gómez', Validators.required],
            idDocument: ['', Validators.required],
            area: ['', Validators.required],
            sede: ['', Validators.required],
            position: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    completeRegistration(): void {

        Object.keys(this.profileForm.controls).forEach(key => {
            this.profileForm.get(key)?.markAsTouched();
        });

        if (this.profileForm.valid) {
            console.log('Profile completed, continuing to emotional instructions...', this.profileForm.value);
            this._router.navigate(['/emotional-instructions']);
        } else {
            console.log('Formulario inválido. Por favor completa todos los campos requeridos.');
        }
    }
}
