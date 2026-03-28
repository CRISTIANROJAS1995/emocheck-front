import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="exam-timer" [class.exam-timer--warning]="isWarning()" [class.exam-timer--critical]="isCritical()">
      <!-- Círculo con tiempo centrado dentro -->
      <div class="exam-timer__circle">
        <svg class="exam-timer__ring" viewBox="0 0 36 36">
          <circle class="exam-timer__ring-bg" cx="18" cy="18" r="15.9"/>
          <circle class="exam-timer__ring-fill" cx="18" cy="18" r="15.9"
            [style.stroke-dashoffset]="ringOffset()"/>
        </svg>
        <div class="exam-timer__center">
          <span class="exam-timer__time">{{ displayTime() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .exam-timer {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
    }

    /* ── Wrapper posición relativa ── */
    .exam-timer__circle {
      position: relative;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── Ring SVG ── */
    .exam-timer__ring {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .exam-timer__ring-bg {
      fill: none;
      stroke: #e2e8f0;
      stroke-width: 2.4;
    }

    .exam-timer__ring-fill {
      fill: none;
      stroke: #00D5BE;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-dasharray: 100 100;
      transition: stroke-dashoffset 1s linear, stroke 0.4s;
    }

    /* ── Texto centrado sobre el anillo ── */
    .exam-timer__center {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
    }

    .exam-timer__time {
      font-family: 'Montserrat', sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.02em;
      line-height: 1;
    }

    /* ── Warning (≤5 min) ── */
    .exam-timer--warning .exam-timer__ring-fill {
      stroke: #f59e0b;
    }

    .exam-timer--warning .exam-timer__time {
      color: #92400e;
    }

    /* ── Critical (≤1 min) ── */
    .exam-timer--critical .exam-timer__ring-fill {
      stroke: #ef4444;
    }

    .exam-timer--critical .exam-timer__time {
      color: #991b1b;
    }

    .exam-timer--critical .exam-timer__circle {
      animation: timer-pulse 0.9s ease-in-out infinite;
    }

    @keyframes timer-pulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.06); }
    }
  `]
})
export class ExamTimerComponent implements OnInit, OnDestroy {

  /** Duration in seconds. Default: 20 minutes */
  @Input() durationSeconds = 20 * 60;

  /**
   * Unique key used to read the start timestamp from localStorage.
   * The timestamp MUST be written externally (by whoever launches the questionnaire)
   * BEFORE this component mounts. The timer never writes to localStorage by itself —
   * it only reads and cleans up.
   * Example: "exam-timer:sleep-questionnaire"
   */
  @Input() storageKey = 'exam-timer:default';

  /** Emits when time runs out */
  @Output() timeUp = new EventEmitter<void>();

  private remaining = signal(this.durationSeconds);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  displayTime = computed(() => {
    const s = this.remaining();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  /** Stroke-dashoffset for the SVG ring: 100 = full, 0 = empty */
  ringOffset = computed(() => {
    const pct = this.remaining() / this.durationSeconds;
    return (100 - pct * 100).toFixed(1);
  });

  isWarning = computed(() => {
    const s = this.remaining();
    return s <= 300 && s > 60;
  });

  isCritical = computed(() => this.remaining() <= 60);

  ngOnInit() {
    const initialRemaining = this._readRemaining();
    this.remaining.set(initialRemaining);

    if (initialRemaining <= 0) {
      // Expired before mounting (e.g. user returned after a long absence)
      this.clearStorage();
      this.timeUp.emit();
      return;
    }

    this.intervalId = setInterval(() => {
      const current = this.remaining();
      if (current <= 0) {
        this.stop();
        this.clearStorage();
        this.timeUp.emit();
        return;
      }
      this.remaining.set(current - 1);
    }, 1000);
  }

  ngOnDestroy() {
    this.stop();
    // Do NOT clear storage on destroy — user may have just navigated away
    // and should resume the same countdown when they come back.
  }

  /**
   * Removes the start-timestamp from localStorage.
   * Call this when the exam is submitted (success or timeout) so
   * the next attempt starts fresh.
   */
  clearStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // localStorage unavailable (private mode, etc.) — ignore
    }
  }

  // ─── Static helper ────────────────────────────────────────────────────────

  /**
   * Write the start timestamp to localStorage RIGHT WHEN the user presses
   * "Comenzar cuestionario". Call this BEFORE navigating to the questionnaire
   * route or rendering the questionnaire component.
   *
   * If a timestamp already exists (resume scenario), it is NOT overwritten.
   */
  static markStart(storageKey: string): void {
    try {
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, Date.now().toString());
      }
    } catch { /* ignore */ }
  }

  /**
   * Erase the timestamp so the next attempt gets a fresh 20-minute window.
   * Call this after a successful submit or when the module detects the
   * instrument was already completed.
   */
  static clearKey(storageKey: string): void {
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Reads the persisted start timestamp and returns how many seconds remain.
   * Returns the full duration if no timestamp is found (fallback).
   */
  private _readRemaining(): number {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const startedAt = parseInt(stored, 10);
        if (!isNaN(startedAt)) {
          const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
          return Math.max(0, this.durationSeconds - elapsedSeconds);
        }
      }
    } catch { /* ignore */ }
    // No timestamp found — timer starts at full duration (safe fallback)
    return this.durationSeconds;
  }

  private stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
