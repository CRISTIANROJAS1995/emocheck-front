import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssessmentQuestion } from 'app/core/models/assessment.model';
import { RichAnswer } from 'app/core/services/assessment.service';
import { QuestionnaireConfig } from './questionnaire.types';
import { ExamTimerComponent } from 'app/shared/components/ui/exam-timer/exam-timer.component';

/** Internal answer: numeric for LIKERT/ROUTING/INTEGER; string for TIME; mixed for ROUTING with text companion. */
interface QuestionAnswer {
    value: number | null;   // option index (LIKERT/ROUTING) or integer value (INTEGER); null for TIME
    text: string | null;    // free-text companion (TIME raw string, or ROUTING enableTextIfValue match)
    subItems?: QuestionAnswer[]; // answers for sub-items (ICSP_VC P5a-P5j)
}

@Component({
    selector: 'emo-questionnaire',
    standalone: true,
    imports: [CommonModule, FormsModule, ExamTimerComponent],
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.scss'],
})
export class EmoQuestionnaireComponent implements OnChanges {
    @Input({ required: true }) config!: QuestionnaireConfig;

    /** Unique key used to persist the timer in localStorage across refreshes/navigation */
    @Input() timerKey = 'exam-timer:questionnaire:generic';

    @Output() back = new EventEmitter<void>();
    @Output() completed = new EventEmitter<number[]>();
    @Output() completedRich = new EventEmitter<RichAnswer[]>();

    currentQuestionIndex = 0;
    answers: QuestionAnswer[] = [];

    private advanceTimer: number | null = null;
    isLocked = false;
    hasSubmitted = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config?.questions?.length) {
            this.currentQuestionIndex = 0;
            this.answers = this.config.questions.map(() => ({ value: null, text: null }));
            this.hasSubmitted = false;
            this.isLocked = false;
            if (this.advanceTimer != null) {
                clearTimeout(this.advanceTimer);
                this.advanceTimer = null;
            }
        }
    }

    get currentQuestion(): AssessmentQuestion {
        return this.config.questions[this.currentQuestionIndex];
    }

    get currentAnswer(): QuestionAnswer {
        return this.answers[this.currentQuestionIndex] ?? { value: null, text: null };
    }

    get progress(): number {
        return ((this.currentQuestionIndex + 1) / this.config.questions.length) * 100;
    }

    get progressText(): string {
        return `Pregunta ${this.currentQuestionIndex + 1} de ${this.config.questions.length}`;
    }

    get questionType(): string {
        return this.currentQuestion?.questionType ?? 'LIKERT';
    }

    get isLikert(): boolean { return this.questionType === 'LIKERT'; }
    get isTime(): boolean   { return this.questionType === 'TIME'; }
    get isInteger(): boolean { return this.questionType === 'INTEGER'; }
    get isRouting(): boolean { return this.questionType === 'ROUTING'; }

    /** True when ROUTING question has enableTextIfValue and current selection matches */
    get showRoutingText(): boolean {
        if (!this.isRouting) return false;
        const q = this.currentQuestion;
        if (q.enableTextIfValue == null) return false;
        return this.currentAnswer.value === q.enableTextIfValue;
    }

    /** True if current answer is sufficiently filled to advance */
    get currentAnswerComplete(): boolean {
        const ans = this.currentAnswer;
        if (this.isTime)    return (ans.text ?? '').trim().length > 0;
        if (this.isInteger) return ans.value !== null && Number.isFinite(ans.value);
        if (this.isRouting) {
            if (ans.value === null) return false;
            if (this.showRoutingText) return (ans.text ?? '').trim().length > 0;
            return true;
        }
        // LIKERT: subItems group — all sub-items must be answered
        if (this.currentQuestion.subItems?.length) {
            const subAnswers = this.subItemAnswers;
            return this.currentQuestion.subItems.every((_, i) => subAnswers[i]?.value !== null);
        }
        return ans.value !== null;
    }

    // ── Sub-items (ICSP_VC P5a-P5j) ──────────────────────────────────────────

    /** Returns or initializes an array of sub-answers for the current question's subItems */
    get subItemAnswers(): QuestionAnswer[] {
        const q = this.currentQuestion;
        if (!q.subItems?.length) return [];
        const ans = this.answers[this.currentQuestionIndex];
        if (!ans.subItems) {
            ans.subItems = q.subItems.map(() => ({ value: null, text: null }));
        }
        return ans.subItems;
    }

    selectSubItemOption(subIndex: number, optionIndex: number): void {
        if (this.isLocked || this.hasSubmitted) return;
        const subs = this.subItemAnswers;
        subs[subIndex] = { value: optionIndex, text: null };
        // Auto-advance only after ALL sub-items answered
        if (this.currentAnswerComplete) {
            this.scheduleAdvance();
        }
    }

    isSubItemSelected(subIndex: number, optionIndex: number): boolean {
        return this.subItemAnswers[subIndex]?.value === optionIndex;
    }

    // ── LIKERT ────────────────────────────────────────────────────────────────

    selectOption(optionIndex: number): void {
        if (this.isLocked || this.hasSubmitted) return;
        this.answers[this.currentQuestionIndex] = { value: optionIndex, text: null };
        this.scheduleAdvance();
    }

    isOptionSelected(optionIndex: number): boolean {
        return this.currentAnswer.value === optionIndex;
    }

    // ── ROUTING ───────────────────────────────────────────────────────────────

    selectRoutingOption(optionIndex: number): void {
        if (this.isLocked || this.hasSubmitted) return;
        const prev = this.currentAnswer;
        this.answers[this.currentQuestionIndex] = { value: optionIndex, text: prev.text };
        // If text companion was showing but selection changed away, clear text
        if (!this.showRoutingText) {
            this.answers[this.currentQuestionIndex].text = null;
        }
        if (this.currentAnswerComplete) {
            this.scheduleAdvance();
        }
    }

    onRoutingTextChange(text: string): void {
        this.answers[this.currentQuestionIndex].text = text;
    }

    isRoutingSelected(optionIndex: number): boolean {
        return this.currentAnswer.value === optionIndex;
    }

    // ── TIME ──────────────────────────────────────────────────────────────────

    onTimeChange(value: string): void {
        this.answers[this.currentQuestionIndex] = { value: null, text: value };
    }

    get timeValue(): string {
        return this.currentAnswer.text ?? '';
    }

    // ── INTEGER ───────────────────────────────────────────────────────────────

    onIntegerChange(value: string): void {
        const parsed = parseInt(value, 10);
        this.answers[this.currentQuestionIndex] = {
            value: Number.isFinite(parsed) ? parsed : null,
            text: null,
        };
    }

    get integerValue(): string {
        const v = this.currentAnswer.value;
        return v !== null ? String(v) : '';
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    private scheduleAdvance(): void {
        if (this.advanceTimer != null) clearTimeout(this.advanceTimer);
        this.isLocked = true;
        this.advanceTimer = window.setTimeout(() => {
            this.isLocked = false;
            this.nextQuestion();
        }, 300);
    }

    previousQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    nextQuestion(): void {
        if (this.hasSubmitted) return;
        if (this.currentQuestionIndex < this.config.questions.length - 1) {
            this.currentQuestionIndex++;
        } else {
            this.submit();
        }
    }

    submit(partial = false): void {
        if (this.hasSubmitted) return;
        this.hasSubmitted = true;

        // Build rich answers (preserves sub-items, TIME text, INTEGER, ROUTING)
        // In partial mode, skip questions that have not been answered
        const rich: RichAnswer[] = this.config.questions
            .map((q, i) => {
                const ans = this.answers[i] ?? { value: null, text: null };

                if (partial && ans.value === null && !(ans.text ?? '').trim()) {
                    return null;
                }

                const subItems = q.subItems ?? [];
                const subAnswers = subItems.length
                    ? (ans.subItems ?? []).map((sa, si) => ({
                        questionId: subItems[si]?.id ?? 0,
                        value: sa.value,
                        text: sa.text,
                    }))
                    : undefined;
                return {
                    questionId: q.id,
                    value: ans.value,
                    text: ans.text,
                    subAnswers,
                };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null) as RichAnswer[];

        // Backward-compat flat emission (value index per question)
        const flat = this.answers.map((a) => (a.value ?? 0));
        // Limpiar el timer persistido — el examen terminó (enviado o tiempo agotado)
        ExamTimerComponent.clearKey(this.timerKey);
        this.completed.emit(flat);
        this.completedRich.emit(rich);
    }

    goBack(): void {
        this.back.emit();
    }

    onTimeUp(): void {
        // Submit exactly the same as if completed normally
        // — this ensures timeout submissions are marked as completed
        this.submit();
    }

    get canGoBack(): boolean {
        return this.currentQuestionIndex > 0;
    }

    get answeredCount(): number {
        return this.answers.filter((a) => a.value !== null || (a.text ?? '').trim().length > 0).length;
    }

    get answeredText(): string {
        return `${this.answeredCount} de ${this.config.questions.length} respondidas`;
    }

    get themeVars(): Record<string, string> {
        return {
            '--badge-gradient': this.config.theme.badgeGradient,
            '--badge-shadow': this.config.theme.badgeShadow,
            '--question-card-bg': this.config.theme.questionCardBackground,
        };
    }
}

