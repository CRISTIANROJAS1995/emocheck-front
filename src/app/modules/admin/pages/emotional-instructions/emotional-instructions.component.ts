import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from 'app/core/services/auth.service';

@Component({
    selector: 'app-emotional-instructions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './emotional-instructions.component.html',
    styleUrls: ['./emotional-instructions.component.scss']
})
export class EmotionalInstructionsComponent implements OnInit {
    userName: string = '';

    constructor(
        private readonly _router: Router,
        private readonly _authService: AuthService
    ) { }

    ngOnInit(): void {
        // Intentar obtener el nombre desde la caché inmediata
        const cached = this._authService.getCurrentUser();
        if (cached?.name) {
            this.userName = cached.name;
        }

        // Garantizar que el nombre provenga del backend (rehydration)
        this._authService
            .ensureCurrentUserLoaded()
            .pipe(take(1))
            .subscribe({
                next: (user) => {
                    if (user?.name) {
                        this.userName = user.name;
                    }
                },
                error: () => { /* Mantener nombre en caché o vacío */ },
            });
    }

    startEvaluation(): void {
        this._router.navigate(['/emotional-analysis']);
    }

    skipStep(): void {
        this._router.navigate(['/home']);
    }
}
