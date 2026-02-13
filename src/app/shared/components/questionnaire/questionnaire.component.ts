import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { QuestionnaireConfig } from './questionnaire.types';

@Component({
    selector: 'emo-questionnaire',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.scss'],
})
export class EmoQuestionnaireComponent implements OnChanges {
    @Input({ required: true }) config!: QuestionnaireConfig;

    @Output() back = new EventEmitter<void>();
    @Output() completed = new EventEmitter<number[]>();

    currentQuestionIndex = 0;
    selectedAnswer: number | null = null;
    answers: (number | null)[] = [];

    private advanceTimer: number | null = null;
    isLocked = false;
    hasSubmitted = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config?.questions?.length) {
            this.currentQuestionIndex = 0;
            this.answers = new Array(this.config.questions.length).fill(null);
            this.selectedAnswer = this.answers[this.currentQuestionIndex];

            this.hasSubmitted = false;
            this.isLocked = false;
            if (this.advanceTimer != null) {
                clearTimeout(this.advanceTimer);
                this.advanceTimer = null;
            }
        }
    }

    get currentQuestion() {
        return this.config.questions[this.currentQuestionIndex];
    }

    get progress(): number {
        return ((this.currentQuestionIndex + 1) / this.config.questions.length) * 100;
    }

    get progressText(): string {
        return `Pregunta ${this.currentQuestionIndex + 1} de ${this.config.questions.length}`;
    }

    selectOption(optionIndex: number): void {
        if (this.isLocked || this.hasSubmitted) return;

        this.isLocked = true;
        this.selectedAnswer = optionIndex;
        this.answers[this.currentQuestionIndex] = optionIndex;

        if (this.advanceTimer != null) {
            clearTimeout(this.advanceTimer);
            this.advanceTimer = null;
        }

        this.advanceTimer = window.setTimeout(() => {
            this.isLocked = false;
            this.nextQuestion();
        }, 250);
    }

    previousQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.selectedAnswer = this.answers[this.currentQuestionIndex];
        }
    }

    nextQuestion(): void {
        if (this.hasSubmitted) return;
        if (this.currentQuestionIndex < this.config.questions.length - 1) {
            this.currentQuestionIndex++;
            this.selectedAnswer = this.answers[this.currentQuestionIndex];
        } else {
            this.submit();
        }
    }

    submit(): void {
        if (this.hasSubmitted) return;
        this.hasSubmitted = true;
        const answers = this.answers.map((a) => (a ?? 0));
        this.completed.emit(answers);
    }

    goBack(): void {
        this.back.emit();
    }

    get canGoBack(): boolean {
        return this.currentQuestionIndex > 0;
    }

    get answeredCount(): number {
        return this.answers.filter((a) => a !== null).length;
    }

    get answeredText(): string {
        return `${this.answeredCount} de ${this.config.questions.length} respondidas`;
    }

    isOptionSelected(optionIndex: number): boolean {
        return this.selectedAnswer === optionIndex;
    }

    get themeVars(): Record<string, string> {
        return {
            '--badge-gradient': this.config.theme.badgeGradient,
            '--badge-shadow': this.config.theme.badgeShadow,
            '--question-card-bg': this.config.theme.questionCardBackground,
        };
    }
}
