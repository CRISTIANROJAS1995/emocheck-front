import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AssessmentService, RichAnswer } from 'app/core/services/assessment.service';
import { AssessmentStateService } from 'app/core/services/assessment-state.service';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { AssessmentQuestion } from 'app/core/models/assessment.model';

interface SleepQuestion {
  id: string;
  text: string;
  type: 'time' | 'number' | 'scale' | 'select' | 'text';
  options?: { value: number; label: string }[];
  required?: boolean;
  conditional?: {
    dependsOn: string;
    showWhen: (value: any) => boolean;
  };
}

@Component({
  selector: 'app-sleep-questionnaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="questionnaire-page">
      <div class="blur-circle blur-circle--green-top-right"></div>
      <div class="blur-circle blur-circle--blue-bottom-left"></div>

      <div class="questionnaire-shell">
        <!-- Header -->
        <div class="questionnaire-header">
          <div class="questionnaire-header-inner">
            <div class="header-top">
              <button class="back-button" type="button" (click)="previousQuestion()">
                <svg viewBox="0 0 20 20"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/></svg>
              </button>
              <div class="header-main">
                <div class="module-badge" style="--badge-gradient: linear-gradient(135deg,#06b6d4,#0891b2); --badge-shadow: 0 4px 12px rgba(6,182,212,0.35);">
                  <img src="icons/Icon (29).svg" class="module-badge-icon" alt="">
                </div>
                <div class="header-text">
                  <div class="header-title">Hábitos de Sueño (ICSP)</div>
                  <div class="header-subtitle">Pregunta {{ currentQuestionIndex() + 1 }} de {{ totalQuestions }}</div>
                </div>
              </div>
            </div>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="progress()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main -->
        <div class="questionnaire-main">

          <!-- Question Card -->
          <div class="question-card" *ngIf="currentQuestion() && !isSubmitting()">
            <p class="question-title">{{ currentQuestion()!.text }}</p>
            <p class="question-help">Selecciona la opción que mejor describe tu situación</p>

            <!-- Scale / Select → botones tipo radio igual que DASS-21 -->
            <div class="options" *ngIf="currentQuestion()!.type === 'scale' || currentQuestion()!.type === 'select'">
              <button
                *ngFor="let option of currentQuestion()!.options"
                type="button"
                class="option"
                [class.selected]="form.get(currentQuestion()!.id)?.value === option.value"
                (click)="selectOption(option.value)">
                <span class="radio">
                  <span class="radio-inner" *ngIf="form.get(currentQuestion()!.id)?.value === option.value"></span>
                </span>
                <span class="option-label">{{ option.label }}</span>
                <svg class="chevron" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </button>
            </div>

            <!-- Time Input -->
            <div class="input-field-wrap" *ngIf="currentQuestion()!.type === 'time'">
              <label class="input-field-label">Selecciona la hora</label>
              <select class="input-field input-field--time" [formControl]="getControl(currentQuestion()!.id)">
                <option value="">-- Selecciona --</option>
                <option *ngFor="let hour of timeOptions" [value]="hour.value">{{ hour.label }}</option>
              </select>
            </div>

            <!-- Number Input -->
            <div class="input-field-wrap" *ngIf="currentQuestion()!.type === 'number'">
              <label class="input-field-label">Cantidad en minutos</label>
              <input type="number" class="input-field input-field--integer" [formControl]="getControl(currentQuestion()!.id)" placeholder="0">
            </div>

            <!-- Text Input -->
            <div class="input-field-wrap" *ngIf="currentQuestion()!.type === 'text'">
              <label class="input-field-label">Describe</label>
              <input type="text" class="input-field" [formControl]="getControl(currentQuestion()!.id)" placeholder="Escribe aquí...">
            </div>

            <!-- Acción para tipos que necesitan botón explícito -->
            <div class="input-action-row" *ngIf="currentQuestion()!.type === 'time' || currentQuestion()!.type === 'number' || currentQuestion()!.type === 'text'">
              <button class="next-button" type="button" (click)="onSubmit()" [disabled]="!isCurrentQuestionValid() || isSubmitting()">
                {{ isLastQuestion() ? (isSubmitting() ? 'Guardando...' : 'Finalizar') : 'Siguiente' }}
              </button>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <button class="prev-button" type="button" (click)="previousQuestion()" [disabled]="currentQuestionIndex() === 0">
                Pregunta anterior
              </button>
              <span class="answered-text">{{ currentQuestionIndex() }} de {{ totalQuestions }} respondidas</span>
            </div>
          </div>

          <!-- Submitting Card -->
          <div class="question-card" *ngIf="isSubmitting()">
            <div style="text-align:center; padding: 48px 0;">
              <div style="font-size:48px; margin-bottom:16px; animation: spin 1.5s linear infinite; display:inline-block;">⏳</div>
              <h2 style="font-family:'Montserrat',sans-serif; font-size:20px; font-weight:700; color:#1E2939; margin:0 0 12px;">Guardando tus respuestas...</h2>
              <p style="font-family:'Montserrat',sans-serif; font-size:14px; color:#6A7282; line-height:1.6; margin:0;">Un momento, estamos registrando tu evaluación.</p>
            </div>
          </div>

          <!-- Reminder -->
          <div class="reminder" *ngIf="!isSubmitting()">
            <span class="reminder-title">Recuerda:</span>
            <span class="reminder-text"> No hay respuestas correctas o incorrectas. Sé honesto/a contigo mismo/a para obtener los mejores resultados.</span>
          </div>

        </div>
      </div>
    </div>
  `,
  styleUrl: './sleep-questionnaire.component.scss'
})
export class SleepQuestionnaireComponent implements OnInit {
  
  form: FormGroup;
  currentQuestionIndex = signal(0);
  isCompleted = signal(false);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  /** Backend questions loaded from API — used to get real questionIds for submission */
  private backendQuestions: AssessmentQuestion[] = [];
  /** ICSP_VC instrumentId from backend — passed to submitRich for per-instrument tracking */
  private icspInstrumentId: number | undefined;
  
  readonly totalQuestions = 19; // Máximo posible incluyendo condicionales
  
  private readonly questions: SleepQuestion[] = [
    {
      id: 'bedtime',
      text: 'Durante el último mes, ¿Cuál ha sido normalmente su hora de acostarse?',
      type: 'time',
      required: true
    },
    {
      id: 'sleepLatency',
      text: '¿Cuánto tiempo ha tardado normalmente en dormirse cada noche durante el último mes?',
      type: 'number',
      required: true
    },
    {
      id: 'wakeTime',
      text: 'Durante el último mes, ¿A qué hora se ha levantado habitualmente por la mañana?',
      type: 'time',
      required: true
    },
    {
      id: 'hoursSlept',
      text: '¿Cuántas horas calcula que ha dormido verdaderamente cada noche durante el último mes?',
      type: 'number',
      required: true
    },
    {
      id: 'trouble5a',
      text: 'Durante el mes pasado, ¿cuántas veces ha tenido problemas para dormir a causa de... No poder quedarse dormido en la primera media hora?',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5b',
      text: 'Despertarse durante la noche o de madrugada',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5c',
      text: 'Tener que levantarse para ir al baño',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5d',
      text: 'No poder respirar bien',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5e',
      text: 'Toser o roncar ruidosamente',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5f',
      text: 'Sentir frío',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5g',
      text: 'Sentir calor',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5h',
      text: 'Tener \'malos sueños\' o pesadillas',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5i',
      text: 'Tener dolores',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5j',
      text: 'Otras razones',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'trouble5jDescription',
      text: '¿Cuáles son esas otras razones?',
      type: 'text',
      conditional: {
        dependsOn: 'trouble5j',
        showWhen: (value) => value >= 2
      }
    },
    {
      id: 'medication',
      text: 'Durante el último mes, ¿Cuántas veces ha tomado medicinas recetadas por el médico o por su cuenta para dormir?',
      type: 'scale',
      options: [
        { value: 0, label: 'Ninguna vez en el último mes' },
        { value: 1, label: 'Menos de una vez a la semana' },
        { value: 2, label: 'Una o dos veces a la semana' },
        { value: 3, label: 'Tres o más veces a la semana' }
      ],
      required: true
    },
    {
      id: 'stayAwake',
      text: 'Durante el último mes, ¿Cuántas veces ha tenido problemas para permanecer despierto mientras conducía, comía, trabajaba, estudiaba o desarrollaba alguna otra actividad social?',
      type: 'scale',
      options: [
        { value: 0, label: 'Nada problemático' },
        { value: 1, label: 'Solo ligeramente problemático' },
        { value: 2, label: 'Moderadamente problemático' },
        { value: 3, label: 'Muy problemático' }
      ],
      required: true
    },
    {
      id: 'enthusiasm',
      text: 'Durante el último mes, ¿El \'tener ánimos\', ¿qué tantos problemas le han traído a usted para realizar actividades como conducir, comer, trabajar, estudiar o alguna actividad social?',
      type: 'scale',
      options: [
        { value: 0, label: 'Nada problemático' },
        { value: 1, label: 'Solo ligeramente problemático' },
        { value: 2, label: 'Moderadamente problemático' },
        { value: 3, label: 'Muy problemático' }
      ],
      required: true
    },
    {
      id: 'sleepQuality',
      text: 'Durante el último mes, ¿Cómo calificaría en conjunto la calidad de su sueño?',
      type: 'scale',
      options: [
        { value: 0, label: 'Muy buena' },
        { value: 1, label: 'Bastante buena' },
        { value: 2, label: 'Bastante mala' },
        { value: 3, label: 'Muy mala' }
      ],
      required: true
    },
    {
      id: 'partner',
      text: '¿Tiene usted pareja o compañero/a de habitación?',
      type: 'select',
      options: [
        { value: 0, label: 'No tengo pareja ni compañero/a de habitación.' },
        { value: 1, label: 'Si tengo, pero duerme en otra habitación.' },
        { value: 2, label: 'Si tengo, pero duerme en la misma habitación y distinta cama.' },
        { value: 3, label: 'Si tengo y duerme en la misma cama.' }
      ],
      required: true
    }
  ];

  readonly timeOptions = Array.from({length: 24}, (_, i) => ({
    value: `${i.toString().padStart(2, '0')}:00`,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private assessmentService: AssessmentService,
    private assessmentState: AssessmentStateService,
    private alert: AlertService
  ) {
    this.form = this.fb.group({});
    this.initializeForm();
  }

  ngOnInit() {
    this.updateProgress();
    // Load backend questions for ICSP_VC to get real questionIds for submission
    this.assessmentService.getModuleInstruments('mental-health').pipe(
      switchMap((instruments) => {
        const icsp = instruments.find(i => i.code === 'ICSP_VC');
        if (!icsp) throw new Error('Instrumento ICSP_VC no encontrado');
        this.icspInstrumentId = icsp.instrumentId;
        return this.assessmentService.getInstrumentQuestions('mental-health', icsp.index);
      })
    ).subscribe({
      next: (questions) => { this.backendQuestions = questions; },
      error: () => { /* Will be caught at submit time */ }
    });
  }

  private initializeForm() {
    const controls: any = {};
    this.questions.forEach(q => {
      if (q.required || !q.conditional) {
        controls[q.id] = ['', q.required ? Validators.required : null];
      } else {
        controls[q.id] = [''];
      }
    });
    this.form = this.fb.group(controls);
  }

  currentQuestion() {
    const visibleQuestions = this.getVisibleQuestions();
    return visibleQuestions[this.currentQuestionIndex()] || null;
  }

  getControl(id: string) {
    return this.form.get(id) as any;
  }

  selectOption(value: number) {
    if (this.isSubmitting()) return;
    const currentQ = this.currentQuestion();
    if (!currentQ) return;
    this.form.get(currentQ.id)?.setValue(value);
    // Avanzar automáticamente igual que el questionnaire principal
    setTimeout(() => this.onSubmit(), 300);
  }

  private getVisibleQuestions(): SleepQuestion[] {
    return this.questions.filter(q => {
      if (!q.conditional) return true;
      const dependentValue = this.form.get(q.conditional.dependsOn)?.value;
      return q.conditional.showWhen(dependentValue);
    });
  }

  progress() {
    const visibleQuestions = this.getVisibleQuestions();
    if (visibleQuestions.length === 0) return 0;
    return ((this.currentQuestionIndex() + 1) / visibleQuestions.length) * 100;
  }

  isCurrentQuestionValid(): boolean {
    const currentQ = this.currentQuestion();
    if (!currentQ) return false;
    
    const control = this.form.get(currentQ.id);
    return control ? control.valid : false;
  }

  isLastQuestion(): boolean {
    const visibleQuestions = this.getVisibleQuestions();
    return this.currentQuestionIndex() >= visibleQuestions.length - 1;
  }

  onSubmit() {
    if (this.isLastQuestion()) {
      this.complete();
    } else {
      this.nextQuestion();
    }
  }

  nextQuestion() {
    const visibleQuestions = this.getVisibleQuestions();
    if (this.currentQuestionIndex() < visibleQuestions.length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
      this.updateProgress();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
      this.updateProgress();
    }
  }

  private updateProgress() {
    // Update progress logic if needed
  }

  private complete() {
    if (this.backendQuestions.length === 0) {
      this.alert.error('No se pudieron cargar las preguntas del servidor. Por favor, recarga la página e inténtalo de nuevo.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const richAnswers = this._buildRichAnswers();

    this.assessmentService.submitRich('mental-health', richAnswers, 'ICSP_VC', this.icspInstrumentId).pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (result) => {
        this.assessmentState.mergeResult(result);
        this.router.navigate(['/mental-health/instrument-results']);
      },
      error: (err) => {
        if (err?.code === 'CONSENT_REQUIRED') {
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
        if (err?.code === 'ALREADY_COMPLETED') {
          this.alert.info(
            'Este cuestionario ya fue completado anteriormente.',
            'Ya completado',
          );
          this.router.navigate(['/mental-health/instrument-results']);
          return;
        }
        const msg = err?.error?.detail || err?.error?.title || err?.message || 'Error al guardar las respuestas. Por favor, inténtalo de nuevo.';
        this.submitError.set(msg);
        this.alert.error(msg);
      }
    });
  }

  /**
   * Builds the RichAnswer[] array by mapping form values to backend question IDs.
   * The backend ICSP_VC questions follow the same order as the frontend static list.
   * TIME questions → textValue; INTEGER questions → value; LIKERT → value (option index).
   */
  private _buildRichAnswers(): RichAnswer[] {
    const formValue = this.form.value;
    const richAnswers: RichAnswer[] = [];

    // Map of frontend question id → form value
    const formMap: Record<string, any> = formValue;

    // The frontend questions list (excluding conditionals like trouble5jDescription)
    // follows the same order as the backend ICSP_VC questions.
    const coreIds = [
      'bedtime',        // TIME
      'sleepLatency',   // INTEGER (minutes)
      'wakeTime',       // TIME
      'hoursSlept',     // INTEGER (hours)
      'trouble5a',      // LIKERT
      'trouble5b',      // LIKERT
      'trouble5c',      // LIKERT
      'trouble5d',      // LIKERT
      'trouble5e',      // LIKERT
      'trouble5f',      // LIKERT
      'trouble5g',      // LIKERT
      'trouble5h',      // LIKERT
      'trouble5i',      // LIKERT
      'trouble5j',      // LIKERT
      'medication',     // LIKERT
      'stayAwake',      // LIKERT
      'enthusiasm',     // LIKERT
      'sleepQuality',   // LIKERT
      'partner',        // LIKERT
    ];

    coreIds.forEach((frontendId, idx) => {
      const backendQ = this.backendQuestions[idx];
      if (!backendQ) return;

      const rawValue = formMap[frontendId];
      const qType = backendQ.questionType ?? 'LIKERT';

      if (qType === 'TIME') {
        richAnswers.push({
          questionId: backendQ.id,
          value: null,
          text: String(rawValue ?? ''),
        });
      } else if (qType === 'INTEGER') {
        richAnswers.push({
          questionId: backendQ.id,
          value: Number.isFinite(Number(rawValue)) ? Number(rawValue) : 0,
          text: null,
        });
      } else {
        // LIKERT: rawValue is already the numeric option value (0-3)
        richAnswers.push({
          questionId: backendQ.id,
          value: Number.isFinite(Number(rawValue)) ? Number(rawValue) : 0,
          text: null,
        });
      }
    });

    return richAnswers;
  }

  showResults() {
    // Navigate to specialized results with sleep context
    this.router.navigate(['/mental-health/specialized-results'], { 
      queryParams: { instrument: 'sleep' }
    });
  }
}