import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AssessmentService } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { getAssessmentModuleDefinition } from 'app/core/constants/assessment-modules';
import { EmoQuestionnaireComponent, QuestionnaireConfig } from 'app/shared/components';

@Component({
    selector: 'app-organizational-climate',
    standalone: true,
    imports: [CommonModule, EmoQuestionnaireComponent],
    templateUrl: './organizational-climate.component.html',
    styleUrls: []
})
export class OrganizationalClimateComponent implements OnInit {
    config?: QuestionnaireConfig;

    constructor(
        private readonly router: Router,
        private readonly assessmentService: AssessmentService,
        private readonly assessmentState: AssessmentStateService
    ) { }

    ngOnInit(): void {
        const moduleDef = getAssessmentModuleDefinition('organizational-climate');
        this.assessmentService.getQuestions('organizational-climate').subscribe((questions) => {
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
        this.assessmentService.submit('organizational-climate', answers).subscribe((result) => {
            this.assessmentState.setResult(result);
            this.router.navigate(['/organizational-climate/results']);
        });
    }
}
