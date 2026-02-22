import { Component } from '@angular/core';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-whatsapp-button',
    standalone: true,
    template: `
        <a
            [href]="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="whatsapp-fab"
            aria-label="Contactar por WhatsApp"
            title="Soporte por WhatsApp"
        >
            <!-- WhatsApp SVG logo -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff">
                <path d="M16 0C7.164 0 0 7.163 0 16c0 2.822.736 5.469 2.023 7.774L0 32l8.418-2.004A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.257 13.257 0 0 1-6.756-1.843l-.484-.287-5.001 1.191 1.21-4.869-.316-.5A13.224 13.224 0 0 1 2.667 16C2.667 8.637 8.637 2.667 16 2.667S29.333 8.637 29.333 16 23.363 29.333 16 29.333zm7.27-9.874c-.398-.199-2.354-1.162-2.719-1.295-.365-.133-.63-.199-.896.2-.265.398-1.028 1.295-1.26 1.56-.232.266-.465.299-.863.1-.398-.2-1.682-.62-3.203-1.977-1.184-1.057-1.983-2.363-2.215-2.762-.232-.398-.025-.614.174-.812.179-.178.398-.465.597-.697.199-.232.265-.398.398-.664.133-.265.066-.497-.033-.697-.1-.199-.896-2.16-1.228-2.957-.323-.776-.651-.671-.896-.683l-.763-.013c-.265 0-.697.1-1.062.497-.365.398-1.394 1.362-1.394 3.322s1.427 3.853 1.627 4.119c.199.265 2.808 4.286 6.803 6.012.951.41 1.693.655 2.271.838.954.303 1.822.26 2.509.158.765-.114 2.354-.963 2.687-1.893.332-.93.332-1.727.232-1.893-.099-.166-.365-.265-.763-.464z"/>
            </svg>
        </a>
    `,
    styles: [`
        .whatsapp-fab {
            position: fixed;
            bottom: 28px;
            right: 28px;
            z-index: 9999;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #25D366;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            text-decoration: none;
        }

        .whatsapp-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 22px rgba(37, 211, 102, 0.6);
        }

        .whatsapp-fab:active {
            transform: scale(0.96);
        }
    `],
})
export class WhatsappButtonComponent {
    readonly whatsappUrl: string;

    constructor() {
        const number = environment.whatsappNumber;
        const message = encodeURIComponent(environment.whatsappMessage);
        this.whatsappUrl = `https://wa.me/${number}?text=${message}`;
    }
}
