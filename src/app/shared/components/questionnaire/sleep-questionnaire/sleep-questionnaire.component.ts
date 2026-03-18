import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
    <div class="sleep-questionnaire">
      <!-- Header -->
      <div class="sq-header">
        <div class="sq-progress">
          <div class="sq-progress__bar">
            <div 
              class="sq-progress__fill" 
              [style.width.%]="progress()">
            </div>
          </div>
          <span class="sq-progress__text">
            {{ currentQuestionIndex() + 1 }} de {{ totalQuestions }}
          </span>
        </div>
      </div>

      <!-- Question Container -->
      <div class="sq-content" *ngIf="currentQuestion()">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          
          <!-- Question Text -->
          <div class="sq-question">
            <h2>{{ currentQuestion()!.text }}</h2>
          </div>

          <!-- Time Input -->
          <div class="sq-input" *ngIf="currentQuestion()!.type === 'time'">
            <label>Selecciona la hora:</label>
            <select [formControlName]="currentQuestion()!.id" class="sq-time-select">
              <option value="">-- Selecciona --</option>
              <option *ngFor="let hour of timeOptions" [value]="hour.value">
                {{ hour.label }}
              </option>
            </select>
          </div>

          <!-- Number Input -->
          <div class="sq-input" *ngIf="currentQuestion()!.type === 'number'">
            <label>Número en minutos:</label>
            <input 
              type="number" 
              [formControlName]="currentQuestion()!.id"
              placeholder="Ingresa los minutos"
              class="sq-number-input">
          </div>

          <!-- Scale Options -->
          <div class="sq-options" *ngIf="currentQuestion()!.type === 'scale'">
            <div class="sq-option" *ngFor="let option of currentQuestion()!.options">
              <label class="sq-radio-label">
                <input 
                  type="radio" 
                  [formControlName]="currentQuestion()!.id"
                  [value]="option.value"
                  class="sq-radio">
                <span class="sq-radio-custom"></span>
                <span class="sq-radio-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <!-- Select Dropdown -->
          <div class="sq-input" *ngIf="currentQuestion()!.type === 'select'">
            <select [formControlName]="currentQuestion()!.id" class="sq-select">
              <option value="">-- Selecciona una opción --</option>
              <option *ngFor="let option of currentQuestion()!.options" [value]="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Text Input (for conditional questions) -->
          <div class="sq-input" *ngIf="currentQuestion()!.type === 'text'">
            <label>Describe:</label>
            <textarea 
              [formControlName]="currentQuestion()!.id"
              placeholder="Escribe aquí..."
              class="sq-textarea">
            </textarea>
          </div>

          <!-- Navigation -->
          <div class="sq-navigation">
            <button 
              type="button" 
              class="sq-btn sq-btn--secondary"
              (click)="previousQuestion()"
              [disabled]="currentQuestionIndex() === 0">
              Anterior
            </button>
            
            <button 
              type="submit" 
              class="sq-btn sq-btn--primary"
              [disabled]="!isCurrentQuestionValid()">
              {{ isLastQuestion() ? 'Finalizar' : 'Siguiente' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Completion Message -->
      <div class="sq-completion" *ngIf="isCompleted()">
        <div class="sq-completion__content">
          <h2>¡Has finalizado!</h2>
          <p>
            Recuerda que cuidar tu salud mental no siempre implica grandes cambios, sino pequeños gestos de atención hacia ti mismo/a. 
            Detenerte, respirar, leer algo que te conecte o expresar cómo te sientes es también una forma de sanar. 
            Permítete estar presente, sin exigencias, sin juicios.
          </p>
          <p>
            Antes de ver tu resultado realicemos un ejercicio de rapidez. 
            A continuación, No dejes que el Extraterrestre se lleve al humano de su cama, ¡Sálvalo!
          </p>
          <button class="sq-btn sq-btn--primary" (click)="showResults()">
            Ver mis resultados
          </button>
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
    private router: Router
  ) {
    this.form = this.fb.group({});
    this.initializeForm();
  }

  ngOnInit() {
    this.updateProgress();
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
    this.isCompleted.set(true);
    console.log('Cuestionario completado:', this.form.value);
  }

  showResults() {
    // Navigate to specialized results with sleep context
    this.router.navigate(['/mental-health/specialized-results'], { 
      queryParams: { instrument: 'sleep' }
    });
  }
}