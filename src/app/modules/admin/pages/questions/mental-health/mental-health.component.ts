import { Component } from '@angular/core';
import { InstrumentSelectorComponent } from 'app/shared/components';

@Component({
    selector: 'app-mental-health',
    standalone: true,
    imports: [InstrumentSelectorComponent],
    template: `<app-instrument-selector moduleId="mental-health"></app-instrument-selector>`,
})
export class MentalHealthComponent {}
