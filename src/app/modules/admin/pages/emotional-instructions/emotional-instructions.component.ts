import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-emotional-instructions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './emotional-instructions.component.html',
    styleUrls: ['./emotional-instructions.component.scss']
})
export class EmotionalInstructionsComponent {
    userName: string = 'María Gómez';

    constructor(private _router: Router) { }

    startEvaluation(): void {
        console.log('Starting emotional evaluation...');
        // Navegar a la pantalla de análisis emocional
        this._router.navigate(['/emotional-analysis']);
    }

    skipStep(): void {
        console.log('Skipping emotional evaluation...');
        // Navegar al home o dashboard
        this._router.navigate(['/home']);
    }
}
