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
    <div class="ei-questionnaire">
      <!-- Header -->
      <div class="ei-header">
        <div class="ei-progress">
          <div class="ei-progress__bar">
            <div 
              class="ei-progress__fill" 
              [style.width.%]="progress()">
            </div>
          </div>
          <span class="ei-progress__text">
            {{ currentQuestionIndex() + 1 }} de {{ questions.length }}
          </span>
        </div>
      </div>

      <!-- Question Container -->
      <div class="ei-content" *ngIf="currentQuestion()">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          
          <!-- Question Text -->
          <div class="ei-question">
            <h2>{{ currentQuestion()!.text }}</h2>
          </div>

          <!-- Likert Scale Options -->
          <div class="ei-options">
            <div class="ei-option" *ngFor="let option of likertOptions">
              <label class="ei-radio-label">
                <input 
                  type="radio" 
                  [formControlName]="currentQuestion()!.id"
                  [value]="option.value"
                  class="ei-radio">
                <span class="ei-radio-custom"></span>
                <span class="ei-radio-text">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <!-- Navigation -->
          <div class="ei-navigation">
            <button 
              type="button" 
              class="ei-btn ei-btn--secondary"
              (click)="previousQuestion()"
              [disabled]="currentQuestionIndex() === 0">
              Anterior
            </button>
            
            <button 
              type="submit" 
              class="ei-btn ei-btn--primary"
              [disabled]="!isCurrentQuestionValid()">
              {{ isLastQuestion() ? 'Finalizar' : 'Siguiente' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Completion Message -->
      <div class="ei-completion" *ngIf="isCompleted()">
        <div class="ei-completion__content">
          <h2>¡Has finalizado!</h2>
          <p>
            Identificar lo que sentimos, comprender por qué ocurre y responder de manera más consciente y equilibrada ante distintas situaciones hace que reforcemos nuestra inteligencia emocional. 
            Este proceso permite reflexionar sobre la forma en que se gestionan las emociones en la vida diaria y abre un espacio para reconocer fortalezas, así como aspectos que pueden seguir desarrollándose.
          </p>
          
          <!-- Results Preview -->
          <div class="ei-results-preview">
            <h3>Tus resultados son:</h3>
            <div class="ei-dimensions">
              <div class="ei-dimension">
                <h4>Atención a los sentimientos</h4>
                <div class="ei-result-indicator" [class]="getResultClass('attention')">
                  {{ getResultLabel('attention') }}
                </div>
              </div>
              <div class="ei-dimension">
                <h4>Claridad emocional</h4>
                <div class="ei-result-indicator" [class]="getResultClass('clarity')">
                  {{ getResultLabel('clarity') }}
                </div>
              </div>
              <div class="ei-dimension">
                <h4>Reparación de las emociones</h4>
                <div class="ei-result-indicator" [class]="getResultClass('repair')">
                  {{ getResultLabel('repair') }}
                </div>
              </div>
            </div>
          </div>
          
          <p class="ei-closing-message">
            Tu bienestar comienza cuando te escuchas con compasión y te das el espacio para sentir y cuidar de tu mente, igual que cuidas de tu cuerpo.
          </p>
          
          <button class="ei-btn ei-btn--primary" (click)="showResults()">
            Ver mis resultados detallados
          </button>
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