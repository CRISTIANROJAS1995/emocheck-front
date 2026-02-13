import { Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { AuthService } from 'app/core/services/auth.service';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Observable, ReplaySubject, of, tap } from 'rxjs';

function normalizeRole(role: string): string {
    return (role ?? '').trim().toLowerCase();
}

function hasAnyRole(userRoles: string[] | null | undefined, requiredRoles: string[]): boolean {
    if (!requiredRoles?.length) return true;
    const userSet = new Set((userRoles ?? []).map(normalizeRole));
    return requiredRoles.some((r) => userSet.has(normalizeRole(r)));
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);

    constructor(private readonly auth: AuthService) { }

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
        const roles = this.auth.getCurrentUser()?.roles ?? [];
        const isAdmin = hasAnyRole(roles, ['Admin', 'CompanyAdmin']);
        const isSupportStaff = hasAnyRole(roles, ['Psychologist', 'HSE', 'Admin', 'CompanyAdmin']);

        const defaultItems: FuseNavigationItem[] = [];
        const pushIf = (condition: boolean, item: FuseNavigationItem): void => {
            if (condition) defaultItems.push(item);
        };

        defaultItems.push({
            id: 'mis-evaluaciones',
            title: 'Mis Evaluaciones',
            type: 'basic',
            icon: 'emocheck:mis-evaluaciones',
            link: '/home',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        defaultItems.push({
            id: 'my-tracking',
            title: 'Mi Seguimiento',
            type: 'basic',
            icon: 'heroicons_outline:chart-bar-square',
            link: '/my-tracking',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3 nav-hover-green',
            },
        });

        defaultItems.push({
            id: 'mi-plan',
            title: 'Mi Plan',
            type: 'basic',
            icon: 'emocheck:mi-plan',
            link: '/home',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        pushIf(isSupportStaff, {
            id: 'seguimiento-colaboradores',
            title: 'Seguimiento Colaboradores',
            type: 'basic',
            icon: 'heroicons_outline:chart-bar-square',
            link: '/team-tracking',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3 nav-hover-green',
            },
        });

        defaultItems.push({
            id: 'mi-perfil',
            title: 'Mi Perfil',
            type: 'basic',
            icon: 'emocheck:mi-perfil',
            link: '/profile',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        defaultItems.push({
            id: 'recursos',
            title: 'Recursos',
            type: 'basic',
            icon: 'emocheck:recursos',
            link: '/resources',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        pushIf(isAdmin, {
            id: 'configuracion',
            title: 'Configuración',
            type: 'basic',
            icon: 'heroicons_outline:cog-8-tooth',
            link: '/admin',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        defaultItems.push({
            id: 'ayuda',
            title: 'Ayuda',
            type: 'basic',
            icon: 'heroicons_outline:question-mark-circle',
            link: '/support',
            classes: {
                icon: '!text-gray-500 !opacity-100',
                title: '!text-[17px] !font-normal !text-gray-500',
                wrapper: '!mb-3',
            },
        });

        const navigation: Navigation = {
            default: defaultItems,
            compact: [],
            futuristic: [],
            horizontal: [],
        };

        return of(navigation).pipe(
            tap((nav) => this._navigation.next(nav))
        );
    }
}
