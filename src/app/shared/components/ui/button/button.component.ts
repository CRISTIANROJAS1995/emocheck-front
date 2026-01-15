import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonVariant, ButtonSize } from './button.types';

@Component({
    selector: 'emo-button',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule],
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss']
})
export class EmoButtonComponent {
    @Input() variant: ButtonVariant = 'primary';
    @Input() size: ButtonSize = 'medium';
    @Input() fullWidth: boolean = false;
    @Input() disabled: boolean = false;
    @Input() loading: boolean = false;
    @Input() type: 'button' | 'submit' = 'button';

    @Output() clicked = new EventEmitter<Event>();

    onClick(event: Event): void {
        if (!this.disabled && !this.loading) {
            this.clicked.emit(event);
        }
    }

    get buttonClasses(): string {
        const classes = [
            'emo-button',
            `emo-button--${this.variant}`,
            `emo-button--${this.size}`,
        ];

        if (this.fullWidth) {
            classes.push('emo-button--full-width');
        }

        if (this.disabled || this.loading) {
            classes.push('emo-button--disabled');
        }

        return classes.join(' ');
    }
}
