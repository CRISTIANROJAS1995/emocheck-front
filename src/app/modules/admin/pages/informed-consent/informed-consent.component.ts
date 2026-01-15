import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackgroundCirclesInvertedComponent } from 'app/shared/components/ui/background-circles-inverted/background-circles-inverted.component';

@Component({
    selector: 'app-informed-consent',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BackgroundCirclesInvertedComponent],
    templateUrl: './informed-consent.component.html',
    styleUrls: ['./informed-consent.component.scss']
})
export class InformedConsentComponent {
    consentForm: FormGroup;
    userName: string = 'María Gómez';
    showFullConsent: boolean = false;

    constructor(
        private _formBuilder: FormBuilder,
        private _router: Router
    ) {
        this.consentForm = this._formBuilder.group({
            acceptConsent: [false, Validators.requiredTrue]
        });
    }

    toggleFullConsent(event: Event): void {
        event.preventDefault();
        this.showFullConsent = !this.showFullConsent;
    }

    continueWithRegistration(): void {
        if (this.consentForm.valid) {
            console.log('Consent accepted, continuing with registration...');
            this._router.navigateByUrl('/complete-profile');
        }
    }
}
