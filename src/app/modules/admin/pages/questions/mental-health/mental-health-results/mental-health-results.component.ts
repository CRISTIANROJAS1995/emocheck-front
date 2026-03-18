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
    <div class="mh-results">
      <!-- Header -->
      <div class="mh-header">
        <button class="mh-back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver
        </button>
        <h1>Resultados de {{ instrumentName }}</h1>
      </div>

      <!-- Results Container -->
      <div class="mh-content" *ngIf="results">
        
        <!-- Score Display -->
        <div class="mh-score-section">
          <div class="mh-score-card" [class]="'mh-score-card--' + results.level">
            <div class="mh-score-icon">
              <div class="mh-risk-indicator" [class]="'mh-risk-indicator--' + results.level">
                {{ getRiskIcon(results.level) }}
              </div>
            </div>
            <div class="mh-score-content">
              <h2>{{ results.title }}</h2>
              <p class="mh-score-description">{{ results.description }}</p>
              <div class="mh-score-badge" [style.background-color]="results.color">
                {{ getRiskLabel(results.level) }}
              </div>
            </div>
          </div>
        </div>

        <!-- DASS-21 Specific Results -->
        <div class="mh-dass-breakdown" *ngIf="instrumentType === 'dass21' && dassComponents">
          <h3>Desglose por componente:</h3>
          <div class="mh-component-grid">
            <div class="mh-component-card" *ngFor="let component of dassComponents">
              <div class="mh-component-icon" [style.background-color]="component.color">
                {{ component.icon }}
              </div>
              <div class="mh-component-info">
                <h4>{{ component.name }}</h4>
                <span class="mh-component-level" [class]="'mh-level--' + component.level">
                  {{ getRiskLabel(component.level) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sleep Quality Results -->
        <div class="mh-sleep-results" *ngIf="instrumentType === 'sleep'">
          <div class="mh-visual-result">
            <div class="mh-face-indicator" [class]="'mh-face--' + results.level">
              {{ getFaceIcon(results.level) }}
            </div>
          </div>
        </div>

        <!-- Emotional Intelligence Results -->
        <div class="mh-ei-results" *ngIf="instrumentType === 'emotional-intelligence' && eiComponents">
          <h3>Dimensiones de Inteligencia Emocional:</h3>
          <div class="mh-ei-puzzle">
            <div class="mh-puzzle-piece" *ngFor="let dimension of eiComponents" 
                 [class]="'mh-puzzle-piece--' + (dimension.adequate ? 'green' : 'yellow')">
              <h4>{{ dimension.name }}</h4>
              <p>{{ dimension.description }}</p>
              <div class="mh-puzzle-status">
                {{ dimension.adequate ? '✓ Adecuada' : '⚠ Debe mejorar' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="mh-recommendations" *ngIf="results.recommendations.length > 0">
          <h3>Recomendaciones:</h3>
          <ul class="mh-recommendation-list">
            <li *ngFor="let recommendation of results.recommendations">
              {{ recommendation }}
            </li>
          </ul>
        </div>

        <!-- Alert Generation -->
        <div class="mh-alert" *ngIf="shouldGenerateAlert()">
          <div class="mh-alert-content">
            <svg class="mh-alert-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <h4>Seguimiento requerido</h4>
              <p>Se ha generado una alerta para seguimiento en la plataforma de monitoreo.</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mh-actions">
          <button class="mh-btn mh-btn--secondary" (click)="goToModule()">
            Ver otros instrumentos
          </button>
          <button class="mh-btn mh-btn--primary" (click)="goToTracking()">
            Ver mi seguimiento completo
          </button>
        </div>
      </div>
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