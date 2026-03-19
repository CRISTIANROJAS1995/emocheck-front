import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

interface ResultInterpretation {
  level: 'low' | 'moderate' | 'high';
  title: string;
  description: string;
  color: string;
  recommendations: string[];
}

@Component({
  selector: 'app-mental-health-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spr-page">

      <!-- Sticky header -->
      <header class="spr-header">
        <div class="spr-header__inner">
          <button class="spr-back-btn" (click)="goBack()" type="button" aria-label="Volver">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.5 19.5a1 1 0 0 1-.707-.293l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 1 1 1.414 1.414L6.914 10.5H20a1 1 0 1 1 0 2H6.914l4.293 4.293A1 1 0 0 1 10.5 19.5Z"/>
            </svg>
          </button>
          <span class="spr-header__title">{{ instrumentName }}</span>
        </div>
      </header>

      <main class="spr-shell" *ngIf="results">

        <!-- Summary card -->
        <section class="spr-summary" [ngClass]="'spr-summary--' + results.level">
          <div class="spr-summary__icon-wrap" [ngClass]="'spr-summary__icon-wrap--' + results.level" aria-hidden="true">
            <svg *ngIf="results.level === 'low'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
              <path d="M7 12.5l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg *ngIf="results.level === 'moderate'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
              <path d="M12 7v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="16.5" r="1.3" fill="currentColor"/>
            </svg>
            <svg *ngIf="results.level === 'high'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
              <path d="M12 7v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="16.5" r="1.3" fill="currentColor"/>
            </svg>
          </div>
          <div class="spr-summary__body">
            <h2 class="spr-summary__title">{{ results.title }}</h2>
            <p class="spr-summary__desc">{{ results.description }}</p>
            <span class="spr-summary__badge" [ngClass]="'spr-badge--' + results.level">
              {{ getRiskLabel(results.level) }}
            </span>
          </div>
        </section>

        <!-- DASS-21 breakdown -->
        <section class="spr-card" *ngIf="instrumentType === 'dass21' && dassComponents">
          <div class="spr-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Desglose por componente
          </div>
          <div class="spr-dim-grid">
            <div class="spr-dim-card" *ngFor="let c of dassComponents" [ngClass]="'spr-dim-card--' + c.level">
              <span class="spr-dim-card__name">{{ c.name }}</span>
              <span class="spr-dim-card__badge" [ngClass]="'spr-badge--' + c.level">{{ getRiskLabel(c.level) }}</span>
            </div>
          </div>
        </section>

        <!-- EI breakdown -->
        <section class="spr-card" *ngIf="instrumentType === 'emotional-intelligence' && eiComponents">
          <div class="spr-card__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Dimensiones de Inteligencia Emocional
          </div>
          <div class="spr-ei-list">
            <div class="spr-ei-item" *ngFor="let d of eiComponents" [ngClass]="d.adequate ? 'spr-ei-item--ok' : 'spr-ei-item--warn'">
              <div class="spr-ei-item__dot"></div>
              <div class="spr-ei-item__body">
                <span class="spr-ei-item__name">{{ d.name }}</span>
                <span class="spr-ei-item__status">{{ d.adequate ? '✓ Adecuada' : '⚠ Debe mejorar' }}</span>
                <p class="spr-ei-item__desc">{{ d.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Recommendations -->
        <section class="spr-card spr-card--rec" *ngIf="results.recommendations.length > 0">
          <div class="spr-card__title">Recomendaciones</div>
          <div class="spr-rec-list">
            <div class="spr-rec-item" *ngFor="let r of results.recommendations; let i = index">
              <span class="spr-rec-item__badge">{{ i + 1 }}</span>
              <span class="spr-rec-item__text">{{ r }}</span>
            </div>
          </div>
        </section>

        <!-- High risk alert -->
        <section class="spr-alert" *ngIf="results.level === 'high'">
          <div class="spr-alert__icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3L22 21H2L12 3Z" stroke-linejoin="round"/>
              <path d="M12 9v5" stroke-linecap="round"/>
              <circle cx="12" cy="17" r="1.25" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="spr-alert__body">
            <p class="spr-alert__title">¿Necesitas ayuda inmediata?</p>
            <p class="spr-alert__desc">Si sientes que necesitas apoyo urgente, no dudes en contactarnos. Estamos aquí para ayudarte.</p>
          </div>
        </section>

        <!-- Actions -->
        <div class="spr-actions">
          <button class="spr-btn spr-btn--ghost" (click)="goToModule()" type="button">Ver otros instrumentos</button>
          <button class="spr-btn spr-btn--primary" (click)="goToTracking()" type="button">Ver mi seguimiento completo</button>
        </div>

      </main>
    </div>
  `,
  styleUrl: './mental-health-results.component.scss'
})
export class MentalHealthResultsComponent implements OnInit {
  
  instrumentType: string = '';
  instrumentName: string = '';
  results: ResultInterpretation | null = null;
  
  // DASS-21 specific
  dassComponents: Array<{
    name: string;
    level: 'low' | 'moderate' | 'high';
    color: string;
    icon: string;
  }> | null = null;
  
  // Emotional Intelligence specific
  eiComponents: Array<{
    name: string;
    adequate: boolean;
    description: string;
  }> | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Read the instrument type from query parameters
    this.route.queryParams.subscribe(params => {
      const instrumentType = params['instrument'];
      this.loadResultsByType(instrumentType);
    });
  }

  private loadResultsByType(instrumentType: string) {
    switch (instrumentType) {
      case 'sleep':
        this.loadSleepResults();
        break;
      case 'emotional-intelligence':
        this.loadEmotionalIntelligenceResults();
        break;
      case 'dass21':
        this.loadDassResults();
        break;
      default:
        this.loadDefaultResults();
        break;
    }
  }

  private loadDassResults() {
    this.instrumentType = 'dass21';
    this.instrumentName = 'DASS-21';
    
    // Simulate DASS-21 results based on document specifications
    this.results = {
      level: 'moderate',
      title: 'Riesgo Moderado',
      description: 'El malestar emocional comienza a manifestarse también en lo físico, como cansancio persistente, cambios en el sueño o falta de energía. Estas señales indican que tu bienestar se está viendo afectado y requiere ser atendido con mayor detalle.',
      color: '#f59e0b',
      recommendations: [
        'Considera hablar con un profesional de la salud mental',
        'Mantén rutinas regulares de sueño y ejercicio',
        'Practica técnicas de relajación y mindfulness',
        'Busca apoyo en tu red social cercana'
      ]
    };

    this.dassComponents = [
      { name: 'Depresión', level: 'moderate', color: '#8b5cf6', icon: '😔' },
      { name: 'Ansiedad', level: 'high', color: '#ef4444', icon: '😰' },
      { name: 'Estrés', level: 'low', color: '#10b981', icon: '😌' }
    ];
  }

  private loadSleepResults() {
    this.instrumentType = 'sleep';
    this.instrumentName = 'Hábitos de Sueño (ICSP-VC)';
    
    this.results = {
      level: 'moderate',
      title: 'Descanso interrumpido',
      description: 'Podrías estar atravesando situaciones que están generando algunas variaciones en tu rutina de sueño, las cuales pueden influir en tu bienestar y en las actividades diarias. Puede ser oportuno revisar hábitos de descanso y considerar estrategias que favorezcan espacios más reparadores.',
      color: '#f59e0b',
      recommendations: [
        'Establece una rutina regular de sueño',
        'Evita pantallas 1 hora antes de dormir',
        'Crea un ambiente tranquilo y oscuro para dormir',
        'Considera técnicas de relajación antes de acostarte'
      ]
    };
  }

  private loadEmotionalIntelligenceResults() {
    this.instrumentType = 'emotional-intelligence';
    this.instrumentName = 'Inteligencia Emocional (TMMS-24)';
    
    this.results = {
      level: 'moderate',
      title: 'Desarrollo emocional en progreso',
      description: 'Tu bienestar comienza cuando te escuchas con compasión y te das el espacio para sentir y cuidar de tu mente, igual que cuidas de tu cuerpo.',
      color: '#8b5cf6',
      recommendations: [
        'Practica la autoobservación emocional diaria',
        'Desarrolla técnicas de regulación emocional',
        'Busca espacios de reflexión personal',
        'Considera terapia psicológica para profundizar en el autoconocimiento'
      ]
    };

    this.eiComponents = [
      {
        name: 'Atención a los sentimientos',
        adequate: true,
        description: 'Atiendes adecuadamente las emociones que experimentas en tu día a día, así como sensibilidad frente a los estados emocionales de los demás.'
      },
      {
        name: 'Claridad emocional',
        adequate: false,
        description: 'No sueles tener claridad respecto a lo que sientes, haciendo difícil comprender lo que deseas y desean los demás.'
      },
      {
        name: 'Reparación de las emociones',
        adequate: true,
        description: 'Cuentas con un adecuado proceso de reparación emocional teniendo a disposición estrategias para afrontar situaciones emocionalmente difíciles.'
      }
    ];
  }

  private loadDefaultResults() {
    this.instrumentType = 'general';
    this.instrumentName = 'Evaluación de Salud Mental';
    
    this.results = {
      level: 'low',
      title: 'Riesgo Bajo',
      description: 'Algunos aspectos emocionales asociados al bajo estado de ánimo, como desmotivación o sensación de desconexión se pueden estar viviendo en este momento. Aunque estos no limitan de forma marcada tu día a día, es importante prestarles atención y cuidarte.',
      color: '#10b981',
      recommendations: [
        'Mantén tus hábitos saludables actuales',
        'Continúa con actividades que te generen bienestar',
        'Mantente atento a cambios en tu estado emocional',
        'Busca espacios de autocuidado regularmente'
      ]
    };
  }

  getRiskLabel(level: 'low' | 'moderate' | 'high'): string {
    switch (level) {
      case 'low': return 'Bajo';
      case 'moderate': return 'Moderado';
      case 'high': return 'Alto';
    }
  }

  getRiskIcon(level: 'low' | 'moderate' | 'high'): string {
    switch (level) {
      case 'low': return '🟢';
      case 'moderate': return '🟡';
      case 'high': return '🔴';
    }
  }

  getFaceIcon(level: 'low' | 'moderate' | 'high'): string {
    switch (level) {
      case 'low': return '😊';
      case 'moderate': return '😐';
      case 'high': return '😟';
    }
  }

  shouldGenerateAlert(): boolean {
    return this.results?.level === 'high';
  }

  goBack() {
    this.router.navigate(['/mental-health']);
  }

  goToModule() {
    this.router.navigate(['/mental-health']);
  }

  goToTracking() {
    this.router.navigate(['/my-tracking']);
  }
}