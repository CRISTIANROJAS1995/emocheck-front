import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface EmotionalIntelligenceQuestion {
  id: string;
  text: string;
  category: 'attention' | 'clarity' | 'repair';
}

@Component({
  selector: 'app-emotional-intelligence-questionnaire',
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
                <div class="module-badge" style="--badge-gradient: linear-gradient(135deg,#8b5cf6,#6d28d9); --badge-shadow: 0 4px 12px rgba(139,92,246,0.35);">
                  <img src="icons/Icon (26).svg" class="module-badge-icon" alt="">
                </div>
                <div class="header-text">
                  <div class="header-title">Inteligencia Emocional (TMMS-24)</div>
                  <div class="header-subtitle">Pregunta {{ currentQuestionIndex() + 1 }} de {{ questions.length }}</div>
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
          <div class="question-card" *ngIf="currentQuestion() && !isCompleted()">
            <p class="question-title">{{ currentQuestion()!.text }}</p>
            <p class="question-help">Selecciona la opción que mejor describe tu situación</p>

            <div class="options">
              <button
                *ngFor="let option of likertOptions"
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

            <div class="card-footer">
              <button class="prev-button" type="button" (click)="previousQuestion()" [disabled]="currentQuestionIndex() === 0">
                Pregunta anterior
              </button>
              <span class="answered-text">{{ currentQuestionIndex() }} de {{ questions.length }} respondidas</span>
            </div>
          </div>

          <!-- Completion Card -->
          <div class="question-card" *ngIf="isCompleted()">
            <div style="text-align:center; padding: 48px 0;">
              <div style="font-size:64px; margin-bottom:16px;">🧠</div>
              <h2 style="font-family:'Montserrat',sans-serif; font-size:22px; font-weight:700; color:#1E2939; margin:0 0 16px;">¡Has finalizado!</h2>
              <p style="font-family:'Montserrat',sans-serif; font-size:15px; color:#6A7282; line-height:1.6; margin:0 0 32px;">
                Identificar lo que sentimos, comprender por qué ocurre y responder de manera más consciente y equilibrada ante distintas situaciones refuerza nuestra inteligencia emocional.
              </p>
              <button class="continue-btn" (click)="showResults()">
                Ver mis resultados
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/></svg>
              </button>
            </div>
          </div>

          <!-- Reminder -->
          <div class="reminder" *ngIf="!isCompleted()">
            <span class="reminder-title">Recuerda:</span>
            <span class="reminder-text"> No hay respuestas correctas o incorrectas. Sé honesto/a contigo mismo/a para obtener los mejores resultados.</span>
          </div>

        </div>
      </div>
    </div>
  `,
  styleUrl: './emotional-intelligence-questionnaire.component.scss'
})
export class EmotionalIntelligenceQuestionnaireComponent implements OnInit {
  
  form: FormGroup;
  currentQuestionIndex = signal(0);
  isCompleted = signal(false);
  
  readonly likertOptions = [
    { value: 1, label: 'Nada de acuerdo' },
    { value: 2, label: 'Algo de acuerdo' },
    { value: 3, label: 'Bastante de acuerdo' },
    { value: 4, label: 'Muy de acuerdo' },
    { value: 5, label: 'Totalmente de acuerdo' }
  ];
  
  readonly questions: EmotionalIntelligenceQuestion[] = [
    // Atención a los sentimientos (1-8)
    { id: 'q1', text: 'Presto mucha atención a los sentimientos.', category: 'attention' },
    { id: 'q2', text: 'Normalmente me preocupo mucho por lo que siento.', category: 'attention' },
    { id: 'q3', text: 'Normalmente dedico tiempo a pensar en mis emociones.', category: 'attention' },
    { id: 'q4', text: 'Pienso que merece la pena prestar atención a mis emociones y estado de ánimo.', category: 'attention' },
    { id: 'q5', text: 'Dejo que mis sentimientos afecten a mis pensamientos.', category: 'attention' },
    { id: 'q6', text: 'Pienso en mi estado de ánimo constantemente.', category: 'attention' },
    { id: 'q7', text: 'A menudo pienso en mis sentimientos.', category: 'attention' },
    { id: 'q8', text: 'Presto mucha atención a cómo me siento.', category: 'attention' },
    
    // Claridad emocional (9-16)
    { id: 'q9', text: 'Tengo claros mis sentimientos.', category: 'clarity' },
    { id: 'q10', text: 'Frecuentemente puedo definir mis sentimientos.', category: 'clarity' },
    { id: 'q11', text: 'Casi siempre sé cómo me siento.', category: 'clarity' },
    { id: 'q12', text: 'Normalmente conozco mis sentimientos sobre las personas.', category: 'clarity' },
    { id: 'q13', text: 'A menudo me doy cuenta de mis sentimientos en diferentes situaciones.', category: 'clarity' },
    { id: 'q14', text: 'Siempre puedo decir cómo me siento.', category: 'clarity' },
    { id: 'q15', text: 'A veces puedo decir cuáles son mis emociones.', category: 'clarity' },
    { id: 'q16', text: 'Puedo llegar a comprender mis sentimientos.', category: 'clarity' },
    
    // Reparación de las emociones (17-24)
    { id: 'q17', text: 'Aunque a veces me siento triste, suelo tener una visión optimista.', category: 'repair' },
    { id: 'q18', text: 'Aunque me sienta mal, procuro pensar en cosas agradables.', category: 'repair' },
    { id: 'q19', text: 'Cuando estoy triste, pienso en todos los placeres de la vida.', category: 'repair' },
    { id: 'q20', text: 'Intento tener pensamientos positivos, aunque me sienta mal.', category: 'repair' },
    { id: 'q21', text: 'Si doy demasiadas vueltas a las cosas, complicándolas, trato de calmarme.', category: 'repair' },
    { id: 'q22', text: 'Me preocupo por tener un buen estado de ánimo.', category: 'repair' },
    { id: 'q23', text: 'Tengo mucha energía cuando me siento feliz.', category: 'repair' },
    { id: 'q24', text: 'Cuando estoy enfadado intento cambiar mi estado de ánimo.', category: 'repair' }
  ];

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
      controls[q.id] = ['', Validators.required];
    });
    this.form = this.fb.group(controls);
  }

  currentQuestion() {
    return this.questions[this.currentQuestionIndex()] || null;
  }

  selectOption(value: number) {
    const currentQ = this.currentQuestion();
    if (!currentQ) return;
    this.form.get(currentQ.id)?.setValue(value);
    setTimeout(() => this.onSubmit(), 300);
  }

  progress() {
    return ((this.currentQuestionIndex() + 1) / this.questions.length) * 100;
  }

  isCurrentQuestionValid(): boolean {
    const currentQ = this.currentQuestion();
    if (!currentQ) return false;
    
    const control = this.form.get(currentQ.id);
    return control ? control.valid : false;
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex() >= this.questions.length - 1;
  }

  onSubmit() {
    if (this.isLastQuestion()) {
      this.complete();
    } else {
      this.nextQuestion();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.questions.length - 1) {
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
    console.log('Cuestionario de Inteligencia Emocional completado:', this.form.value);
  }

  private calculateScores() {
    const formValues = this.form.value;
    
    // Calculate scores for each dimension
    const attentionQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];
    const clarityQuestions = ['q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16'];
    const repairQuestions = ['q17', 'q18', 'q19', 'q20', 'q21', 'q22', 'q23', 'q24'];
    
    const attentionScore = attentionQuestions.reduce((sum, q) => sum + (formValues[q] || 0), 0);
    const clarityScore = clarityQuestions.reduce((sum, q) => sum + (formValues[q] || 0), 0);
    const repairScore = repairQuestions.reduce((sum, q) => sum + (formValues[q] || 0), 0);
    
    return { attentionScore, clarityScore, repairScore };
  }

  getResultClass(dimension: string): string {
    const scores = this.calculateScores();
    
    let score = 0;
    let threshold = 0;
    
    switch (dimension) {
      case 'attention':
        score = scores.attentionScore;
        threshold = 24; // Midpoint for 8 questions * 1-5 scale
        break;
      case 'clarity':
        score = scores.clarityScore;
        threshold = 24; // Midpoint for 8 questions * 1-5 scale
        break;
      case 'repair':
        score = scores.repairScore;
        threshold = 24; // Midpoint for 8 questions * 1-5 scale
        break;
    }
    
    return score >= threshold ? 'ei-result--positive' : 'ei-result--negative';
  }

  getResultLabel(dimension: string): string {
    const scores = this.calculateScores();
    
    let score = 0;
    let threshold = 24;
    
    switch (dimension) {
      case 'attention':
        score = scores.attentionScore;
        break;
      case 'clarity':
        score = scores.clarityScore;
        break;
      case 'repair':
        score = scores.repairScore;
        break;
    }
    
    return score >= threshold ? 'Adecuada' : 'Debe mejorar';
  }

  showResults() {
    // Navigate to specialized results with emotional intelligence context
    this.router.navigate(['/mental-health/specialized-results'], {
      queryParams: { instrument: 'emotional-intelligence' }
    });
  }
}