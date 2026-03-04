import { Component } from '@angular/core';
import { InstrumentSelectorComponent } from 'app/shared/components';

@Component({
    selector: 'app-psychosocial-risk',
    standalone: true,
    imports: [InstrumentSelectorComponent],
    template: `<app-instrument-selector moduleId="psychosocial-risk"></app-instrument-selector>`,
})
export class PsychosocialRiskComponent {}
