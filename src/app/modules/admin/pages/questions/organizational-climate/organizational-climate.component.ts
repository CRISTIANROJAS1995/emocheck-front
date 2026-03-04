import { Component } from '@angular/core';
import { InstrumentSelectorComponent } from 'app/shared/components';

@Component({
    selector: 'app-organizational-climate',
    standalone: true,
    imports: [InstrumentSelectorComponent],
    template: `<app-instrument-selector moduleId="organizational-climate"></app-instrument-selector>`,
})
export class OrganizationalClimateComponent {}
