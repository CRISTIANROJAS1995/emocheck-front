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
        const isSupportStaff = hasAnyRole(roles, ['Psychologist', 'HSE']);

        const defaultItems: FuseNavigationItem[] = [];
        const baseItemClasses = {
            icon: '!text-gray-500 !opacity-100',
            title: '!text-[17px] !font-normal !text-gray-500',
            wrapper: '!mb-3',
        } as const;

        // Menú por rol:
        // - Admin/CompanyAdmin: SOLO opciones de administración (+ ayuda)
        // - Otros: menú de employee (+ soporte si aplica)
        if (isAdmin) {
            defaultItems.push({
                id: 'admin',
                title: 'Administración',
                type: 'group',
                icon: 'heroicons_outline:cog-8-tooth',
                classes: baseItemClasses,
                children: [
                    {
                        id: 'admin-center',
                        title: 'Centro Admin',
                        type: 'basic',
                        icon: 'heroicons_outline:squares-2x2',
                        link: '/admin',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-alerts',
                        title: 'Alertas',
                        type: 'basic',
                        icon: 'heroicons_outline:exclamation-triangle',
                        link: '/admin/alerts',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-cases',
                        title: 'Casos',
                        type: 'basic',
                        icon: 'heroicons_outline:briefcase',
                        link: '/admin/cases',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-reports',
                        title: 'Reportes',
                        type: 'basic',
                        icon: 'heroicons_outline:document-text',
                        link: '/admin/reports',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-modules',
                        title: 'Módulos',
                        type: 'basic',
                        icon: 'heroicons_outline:cube',
                        link: '/admin/modules',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-users',
                        title: 'Usuarios',
                        type: 'basic',
                        icon: 'heroicons_outline:users',
                        link: '/admin/users',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-audit',
                        title: 'Auditoría',
                        type: 'basic',
                        icon: 'heroicons_outline:clipboard-document-list',
                        link: '/admin/audit',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-config',
                        title: 'Organización',
                        type: 'basic',
                        icon: 'heroicons_outline:cog-6-tooth',
                        link: '/admin/config',
                        classes: baseItemClasses,
                    },
                ],
            });
        } else {
            defaultItems.push({
                id: 'mis-evaluaciones',
                title: 'Mis Evaluaciones',
                type: 'basic',
                icon: 'emocheck:mis-evaluaciones',
                link: '/home',
                classes: baseItemClasses,
            });

            defaultItems.push({
                id: 'my-tracking',
                title: 'Mi Seguimiento',
                type: 'basic',
                icon: 'heroicons_outline:chart-bar-square',
                link: '/my-tracking',
                classes: {
                    ...baseItemClasses,
                    wrapper: '!mb-3 nav-hover-green',
                },
            });

            defaultItems.push({
                id: 'mi-plan',
                title: 'Mi Plan',
                type: 'basic',
                icon: 'emocheck:mi-plan',
                link: '/home',
                classes: baseItemClasses,
            });

            if (isSupportStaff) {
                defaultItems.push({
                    id: 'seguimiento-colaboradores',
                    title: 'Seguimiento Colaboradores',
                    type: 'basic',
                    icon: 'heroicons_outline:chart-bar-square',
                    link: '/team-tracking',
                    classes: {
                        ...baseItemClasses,
                        wrapper: '!mb-3 nav-hover-green',
                    },
                });
            }

            defaultItems.push({
                id: 'mi-perfil',
                title: 'Mi Perfil',
                type: 'basic',
                icon: 'emocheck:mi-perfil',
                link: '/profile',
                classes: baseItemClasses,
            });

            defaultItems.push({
                id: 'recursos',
                title: 'Recursos',
                type: 'basic',
                icon: 'emocheck:recursos',
                link: '/resources',
                classes: baseItemClasses,
            });
        }

        defaultItems.push({
            id: 'ayuda',
            title: 'Ayuda',
            type: 'basic',
            icon: 'heroicons_outline:question-mark-circle',
            link: '/support',
            classes: baseItemClasses,
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
