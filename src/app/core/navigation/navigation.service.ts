import { Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        const navigation: Navigation = {
            default: [
                {
                    id: 'mis-evaluaciones',
                    title: 'Mis Evaluaciones',
                    type: 'basic',
                    icon: 'heroicons_outline:clipboard-document-check',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
                {
                    id: 'mi-seguimiento',
                    title: 'Mi Seguimiento',
                    type: 'basic',
                    icon: 'heroicons_outline:chart-bar-square',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3 nav-hover-green'
                    }
                },
                {
                    id: 'mi-plan',
                    title: 'Mi Plan',
                    type: 'basic',
                    icon: 'heroicons_outline:calendar-days',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
                {
                    id: 'seguimiento-colaboradores',
                    title: 'Seguimiento Colaboradores',
                    type: 'basic',
                    icon: 'heroicons_outline:users',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3 nav-hover-green'
                    }
                },
                {
                    id: 'mi-perfil',
                    title: 'Mi Perfil',
                    type: 'basic',
                    icon: 'heroicons_outline:user-circle',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
                {
                    id: 'recursos',
                    title: 'Recursos',
                    type: 'basic',
                    icon: 'heroicons_outline:book-open',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
                {
                    id: 'configuracion',
                    title: 'Configuración',
                    type: 'basic',
                    icon: 'heroicons_outline:cog-8-tooth',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
                {
                    id: 'ayuda',
                    title: 'Ayuda',
                    type: 'basic',
                    icon: 'heroicons_outline:question-mark-circle',
                    link: '/home',
                    classes: {
                        title: '!text-[17px] !font-normal !text-gray-500',
                        wrapper: '!mb-3'
                    }
                },
            ],
            compact: [],
            futuristic: [],
            horizontal: [],
        };

        return of(navigation).pipe(
            tap((nav) => this._navigation.next(nav))
        );
    }
}
