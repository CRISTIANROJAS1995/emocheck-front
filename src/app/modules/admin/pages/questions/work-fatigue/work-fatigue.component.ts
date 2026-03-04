import { Component } from '@angular/core';
import { InstrumentSelectorComponent } from 'app/shared/components';

@Component({
    selector: 'app-work-fatigue',
    standalone: true,
    imports: [InstrumentSelectorComponent],
    template: `<app-instrument-selector moduleId="work-fatigue"></app-instrument-selector>`,
})
export class WorkFatigueComponent {}
