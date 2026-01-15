import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { EmoButtonComponent } from '../../ui/button';
import { ModuleCardData } from './module-card.types';

@Component({
    selector: 'emo-module-card',
    standalone: true,
    imports: [CommonModule, MatIconModule, EmoButtonComponent],
    templateUrl: './module-card.component.html',
    styleUrls: ['./module-card.component.scss']
})
export class ModuleCardComponent {
    @Input() module!: ModuleCardData;
    @Output() onStartEvaluation = new EventEmitter<string>();
    @Output() onViewPlan = new EventEmitter<string>();

    startEvaluation(): void {
        if (!this.module.disabled) {
            this.onStartEvaluation.emit(this.module.id);
        }
    }

    viewPlan(): void {
        this.onViewPlan.emit(this.module.id);
    }

    getButtonVariant(): 'primary' | 'blue' | 'green' | 'teal' | 'orange' {
        const variantMap: Record<string, 'primary' | 'blue' | 'green' | 'teal' | 'orange'> = {
            'module-card--mental-health': 'blue',
            'module-card--work-fatigue': 'green',
            'module-card--organizational-climate': 'teal',
            'module-card--psychosocial-risk': 'orange'
        };
        return variantMap[this.module.colorClass] || 'primary';
    }
}
