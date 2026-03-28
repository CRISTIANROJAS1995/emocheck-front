import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AssessmentService, RichAnswer } from 'app/core/services/assessment.service';
import { AssessmentQuestion } from 'app/core/models/assessment.model';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { PendingClosingService } from 'app/core/services/pending-closing.service';
import { ExamTimerComponent } from 'app/shared/components/ui/exam-timer/exam-timer.component';
import { BackgroundCirclesComponent } from 'app/shared/components/ui/background-circles/background-circles.component';

interface MFIQuestion {
    id: number;
    text: string;
    dimension: 'fatiga_general' | 'fatiga_fisica' | 'actividad_reducida' | 'motivacion' | 'dinamismo';
    reversed?: boolean; // Para preguntas con puntuación invertida
}

@Component({
    selector: 'app-mfi-questionnaire',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BackgroundCirclesComponent, ExamTimerComponent],
    templateUrl: './mfi-questionnaire.component.html',
    styleUrl: './mfi-questionnaire.component.scss'
})
export class MfiQuestionnaireComponent implements OnInit {
    
    form!: FormGroup;
    currentQuestionIndex = 0;
    isSubmitting = false;
    showResults = false;

    /** Backend questions loaded on init — needed to get real questionIDs for submission */
    private backendQuestions: AssessmentQuestion[] = [];
    private mfiInstrumentId: number | undefined;

    // Preguntas del MFI-20 basadas en la literatura científica
    readonly questions: MFIQuestion[] = [
        // Fatiga General (4 preguntas)
        { id: 1, text: 'Me siento en forma', dimension: 'fatiga_general', reversed: true },
        { id: 2, text: 'Físicamente me siento como si hubiera hecho muy poco', dimension: 'fatiga_general' },
        { id: 3, text: 'Me siento muy activo/a', dimension: 'fatiga_general', reversed: true },
        { id: 4, text: 'Tengo ganas de hacer todo tipo de cosas agradables', dimension: 'fatiga_general', reversed: true },
        
        // Fatiga Física (4 preguntas)
        { id: 5, text: 'Me siento cansado/a físicamente', dimension: 'fatiga_fisica' },
        { id: 6, text: 'Creo que hago muchas cosas en un día', dimension: 'fatiga_fisica', reversed: true },
        { id: 7, text: 'Cuando hago algo, puedo concentrarme bien en ello', dimension: 'fatiga_fisica', reversed: true },
        { id: 8, text: 'Físicamente me siento en excelentes condiciones', dimension: 'fatiga_fisica', reversed: true },
        
        // Actividad Reducida (4 preguntas)
        { id: 9, text: 'Tengo problemas para empezar cosas', dimension: 'actividad_reducida' },
        { id: 10, text: 'Pienso que hago muy pocas cosas en un día', dimension: 'actividad_reducida' },
        { id: 11, text: 'Puedo concentrarme bien', dimension: 'actividad_reducida', reversed: true },
        { id: 12, text: 'Me siento descansado/a', dimension: 'actividad_reducida', reversed: true },
        
        // Motivación (4 preguntas)
        { id: 13, text: 'No tengo ganas de hacer nada', dimension: 'motivacion' },
        { id: 14, text: 'Mentalmente me siento bastante cansado/a', dimension: 'motivacion' },
        { id: 15, text: 'Cuando hago algo, me involucro completamente', dimension: 'motivacion', reversed: true },
        { id: 16, text: 'Puedo disfrutar bien de las cosas', dimension: 'motivacion', reversed: true },
        
        // Dinamismo (4 preguntas)
        { id: 17, text: 'Me resulta difícil concentrarme en algo', dimension: 'dinamismo' },
        { id: 18, text: 'Físicamente me siento mal', dimension: 'dinamismo' },
        { id: 19, text: 'Tengo planes', dimension: 'dinamismo', reversed: true },
        { id: 20, text: 'Fácilmente me canso', dimension: 'dinamismo' }
    ];

    readonly likertOptions = [
        { value: 1, label: 'Sí, es verdad' },
        { value: 2, label: 'Sí, a veces' },
        { value: 3, label: 'No lo sé' },
        { value: 4, label: 'No, normalmente no' },
        { value: 5, label: 'No, nunca' }
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private assessmentService: AssessmentService,
        private assessmentState: AssessmentStateService,
        private alert: AlertService,
        private pendingClosingService: PendingClosingService,
    ) {}

    ngOnInit(): void {
        this.initializeForm();
        // Load backend questions to get real questionIDs for submission (same pattern as SleepQuestionnaire)
        this.assessmentService.getModuleInstruments('work-fatigue').pipe(
            switchMap((instruments) => {
                const mfi = instruments.find(i => i.code === 'MFI20');
                if (!mfi) throw new Error('Instrumento MFI20 no encontrado');
                this.mfiInstrumentId = mfi.instrumentId;
                return this.assessmentService.getInstrumentQuestions('work-fatigue', mfi.index);
            })
        ).subscribe({
            next: (questions) => { this.backendQuestions = questions; },
            error: () => { /* Will be caught at submit time if questions fail to load */ }
        });
    }

    private initializeForm(): void {
        const controls: { [key: string]: FormControl } = {};
        
        this.questions.forEach(question => {
            controls[`q${question.id}`] = this.fb.control(null, [Validators.required]);
        });

        this.form = this.fb.group(controls);
    }

    get currentQuestion(): MFIQuestion {
        return this.questions[this.currentQuestionIndex];
    }

    get currentControl(): FormControl {
        return this.form.get(`q${this.currentQuestion.id}`) as FormControl;
    }

    get progress(): number {
        return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    }

    get isFirstQuestion(): boolean {
        return this.currentQuestionIndex === 0;
    }

    get isLastQuestion(): boolean {
        return this.currentQuestionIndex === this.questions.length - 1;
    }

    nextQuestion(): void {
        if (this.currentControl.invalid) {
            this.currentControl.markAsTouched();
            return;
        }

        if (this.isLastQuestion) {
            this.submitQuestionnaire();
        } else {
            this.currentQuestionIndex++;
        }
    }

    previousQuestion(): void {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    selectOption(value: number): void {
        this.currentControl.setValue(value);
        
        // Auto-advance después de una breve pausa para mejor UX
        setTimeout(() => {
            if (this.currentControl.valid) {
                this.nextQuestion();
            }
        }, 150);
    }

    private submitQuestionnaire(partial = false): void {
        if (!partial && (this.form.invalid || this.isSubmitting)) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.isSubmitting) return;

        this.isSubmitting = true;

        // Convertir las respuestas al formato RichAnswer
        // En modo partial se omiten preguntas sin respuesta
        const richAnswers: RichAnswer[] = this.questions
            .map((question, qi) => {
                let rawValue = this.form.get(`q${question.id}`)?.value;

                // Skip unanswered questions in partial mode
                if (partial && (rawValue === null || rawValue === undefined || rawValue === '')) {
                    return null;
                }

                // Aplicar inversión de puntuación si es necesario
                if (question.reversed) {
                    rawValue = 6 - rawValue; // Invertir escala 1-5 a 5-1
                }

                // Convertir valor 1-5 a índice 0-based para que submitRichResponses
                // resuelva correctamente el numericValue de la opción del backend.
                // Usar el questionID real del backend (posición qi) cuando esté disponible.
                const optionIndex = (rawValue ?? 1) - 1;
                const questionId = this.backendQuestions[qi]?.id ?? question.id;

                return {
                    questionId,
                    value: optionIndex,
                    text: null
                };
            })
            .filter((r): r is RichAnswer => r !== null);

        // Enviar al backend pasando también el instrumentId para el evaluation/start
        this.assessmentService.submitRich('work-fatigue', richAnswers, 'MFI20', this.mfiInstrumentId).pipe(
            finalize(() => { this.isSubmitting = false; })
        ).subscribe({
            next: (result) => {
                this.assessmentState.mergeResult(result);
                // Limpiar el timer persistido para que el próximo intento empiece desde 0
                ExamTimerComponent.clearKey('exam-timer:mfi-questionnaire');
                this.pendingClosingService.set({
                    richAnswers,
                    instrumentCode: 'MFI20',
                    instrumentId: undefined,
                    moduleId: 'work-fatigue',
                });
                this.router.navigate(['/work-fatigue']);
            },
            error: (error) => {
                if (error?.code === 'CONSENT_REQUIRED') {
                    this.alert.confirm(
                        'Debes aceptar el consentimiento informado para continuar.',
                        'Consentimiento requerido',
                        'Ir a consentimiento',
                        'Cancelar',
                    ).then((go) => {
                        if (go) this.router.navigate(['/informed-consent']);
                    });
                    return;
                }
                
                if (error?.code === 'ALREADY_COMPLETED') {
                    this.alert.info(
                        'Este instrumento ya fue completado anteriormente.',
                        'Instrumento completado',
                    );
                    this.router.navigate(['/work-fatigue/results']);
                    return;
                }

                const message = error?.error?.detail || error?.error?.title || error?.message || 'Error al enviar las respuestas';
                this.alert.error(message);
            }
        });
    }

    private getLikertLabel(value: number): string {
        const option = this.likertOptions.find(opt => opt.value === value);
        return option ? option.label : '';
    }

    goBack(): void {
        this.router.navigate(['/work-fatigue']);
    }

    onTimeUp(): void {
        this.alert.info(
            'El tiempo para completar la evaluación ha terminado. Las preguntas respondidas hasta ahora serán enviadas.',
            'Tiempo agotado'
        );
        this.submitQuestionnaire(); // Mismo comportamiento que si hubiera respondido todo
    }

    getDimensionInfo(dimension: string): { title: string; description: string } {
        const dimensionMap = {
            'fatiga_general': {
                title: 'Fatiga General',
                description: 'Evaluación del nivel general de cansancio y agotamiento'
            },
            'fatiga_fisica': {
                title: 'Fatiga Física',
                description: 'Evaluación del cansancio corporal y físico'
            },
            'actividad_reducida': {
                title: 'Actividad Reducida',
                description: 'Evaluación de la disminución en las actividades diarias'
            },
            'motivacion': {
                title: 'Motivación',
                description: 'Evaluación del nivel de motivación y energía mental'
            },
            'dinamismo': {
                title: 'Dinamismo',
                description: 'Evaluación de la capacidad de acción y concentración'
            }
        };

        return dimensionMap[dimension] || { title: 'Dimensión', description: '' };
    }
}