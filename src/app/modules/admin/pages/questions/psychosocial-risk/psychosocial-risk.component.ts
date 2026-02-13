import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-psychosocial-risk',
    standalone: true,
    imports: [CommonModule, EmoQuestionnaireComponent],
    templateUrl: './psychosocial-risk.component.html',
    styleUrls: []
})
export class PsychosocialRiskComponent implements OnInit {
    config?: QuestionnaireConfig;
    private isSubmitting = false;

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService,
        private readonly alert: AlertService
    ) { }

    ngOnInit(): void {
        const moduleDef = getAssessmentModuleDefinition('psychosocial-risk');
        this.assessmentService.getQuestions('psychosocial-risk').subscribe({
            next: (questions) => {
                this.config = {
                    title: moduleDef.questionnaireTitle,
                    icon: moduleDef.icon,
                    theme: moduleDef.theme,
                    questions,
                };
            },
            error: (e) => {
                const msg = e?.error?.detail || e?.error?.title || e?.message || 'No fue posible cargar el cuestionario';
                this.alert.error(msg);
                this.router.navigate(['/home']);
            },
        });
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    onCompleted(answers: number[]): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        this.assessmentService.submit('psychosocial-risk', answers).pipe(
            finalize(() => {
                this.isSubmitting = false;
            })
        ).subscribe({
            next: (result) => {
                this.assessmentState.setResult(result);
                this.router.navigate(['/psychosocial-risk/results']);
            },
            error: (e) => {
                if (e?.code === 'CONSENT_REQUIRED') {
                    this.alert
                        .confirm(
                            'Debes aceptar el consentimiento informado para continuar.',
                            'Consentimiento requerido',
                            'Ir a consentimiento',
                            'Cancelar'
                        )
                        .then((go) => {
                            if (go) this.router.navigate(['/informed-consent']);
                        });
                    return;
                }

                const msg =
                    e?.error?.detail ||
                    e?.error?.title ||
                    e?.message ||
                    'No fue posible completar la evaluación';
                this.alert.error(msg);
            },
        });
    }
}
