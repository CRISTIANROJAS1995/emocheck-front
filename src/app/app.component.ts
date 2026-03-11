import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WhatsappButtonComponent } from './shared/components/whatsapp-button/whatsapp-button.component';
import { SeoService } from './core/services/seo.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet, WhatsappButtonComponent],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(private seoService: SeoService) {}

    ngOnInit(): void {
        this.seoService.init();
    }
}
