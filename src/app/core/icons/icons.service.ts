import { inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconsService {
    /**
     * Constructor
     */
    constructor() {
        const domSanitizer = inject(DomSanitizer);
        const matIconRegistry = inject(MatIconRegistry);

        // Register icon sets
        matIconRegistry.addSvgIconSet(
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-twotone.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-outline.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'mat_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/material-solid.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'feather',
            domSanitizer.bypassSecurityTrustResourceUrl('icons/feather.svg')
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_outline',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-outline.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_solid',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-solid.svg'
            )
        );
        matIconRegistry.addSvgIconSetInNamespace(
            'heroicons_mini',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/heroicons-mini.svg'
            )
        );

        // EmoCheck custom navigation icons
        matIconRegistry.addSvgIconInNamespace(
            'emocheck',
            'mis-evaluaciones',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/emocheck-nav-mis-evaluaciones.svg'
            )
        );
        matIconRegistry.addSvgIconInNamespace(
            'emocheck',
            'mi-plan',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/emocheck-nav-mi-plan.svg'
            )
        );
        matIconRegistry.addSvgIconInNamespace(
            'emocheck',
            'mi-perfil',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/emocheck-nav-mi-perfil.svg'
            )
        );
        matIconRegistry.addSvgIconInNamespace(
            'emocheck',
            'recursos',
            domSanitizer.bypassSecurityTrustResourceUrl(
                'icons/emocheck-nav-recursos.svg'
            )
        );
    }
}
