import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components';

@Component({
    selector: 'app-mental-health',
    standalone: true,
    imports: [CommonModule, EmoQuestionnaireComponent],
    templateUrl: './mental-health.component.html'
})
export class MentalHealthComponent implements OnInit {
    config?: QuestionnaireConfig;

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService
    ) { }

    ngOnInit(): void {
        const moduleDef = getAssessmentModuleDefinition('mental-health');
        this.assessmentService.getQuestions('mental-health').subscribe((questions) => {
            this.config = {
                title: moduleDef.questionnaireTitle,
                icon: moduleDef.icon,
                theme: moduleDef.theme,
                questions,
            };
        });
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    onCompleted(answers: number[]): void {
        this.assessmentService.submit('mental-health', answers).subscribe((result) => {
            this.assessmentState.setResult(result);
            this.router.navigate(['/mental-health/results']);
        });
    }
}
