import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/services/auth.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { EmoButtonComponent } from 'app/shared/components';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        EmoButtonComponent,
        BackgroundCirclesComponent,
    ],
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;

    loading: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private alertService: AlertService
    ) { }

    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            email: [
                'admin@motioniq.com',
                [Validators.required],
            ],
            password: ['Admin123!', Validators.required],
            rememberMe: [''],
        });
    }

    signIn(): void {
        if (this.signInForm.invalid) {
            this.signInForm.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.signInForm.disable();
        this.showAlert = false;
        const credentials = {
            email: this.signInForm.get('email')?.value,
            password: this.signInForm.get('password')?.value
        };
        this._authService.signIn(credentials).subscribe({
            next: (response) => {
                this.loading = false;
                this.signInForm.enable();
                const redirectURLParam = this._activatedRoute.snapshot.queryParamMap.get('redirectURL');
                const redirectURL = redirectURLParam
                    ? (redirectURLParam.startsWith('/') ? redirectURLParam : `/${redirectURLParam}`)
                    : '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
            },
            error: (error) => {
                this.loading = false;
                this.signInForm.enable();
                const msg = error?.message || error?.body?.message || 'Credenciales inválidas';
                this.alertService.error(msg);
            }
        });
    }
}

