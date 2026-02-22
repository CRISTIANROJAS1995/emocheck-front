import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WhatsappButtonComponent } from './shared/components/whatsapp-button/whatsapp-button.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, WhatsappButtonComponent],
})
export class AppComponent {
    /**
     * Constructor
     */
    constructor() {}
}
