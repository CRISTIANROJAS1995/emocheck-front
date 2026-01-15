import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputType } from './input.types';

@Component({
    selector: 'emo-input',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EmoInputComponent),
            multi: true
        }
    ]
})
export class EmoInputComponent implements ControlValueAccessor {
    @Input() type: InputType = 'text';
    @Input() placeholder: string = '';
    @Input() label: string = '';
    @Input() icon: string = '';
    @Input() errorMessage: string = '';
    @Input() disabled: boolean = false;
    @Input() formControlName: string = '';

    value: string = '';
    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: string): void {
        this.value = value || '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onInputChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.value = target.value;
        this.onChange(this.value);
    }

    onBlur(): void {
        this.onTouched();
    }
}
