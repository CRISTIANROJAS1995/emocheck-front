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
        const isCompanyScoped = this.auth.isCompanyScoped(); // HRManager o CompanyAdmin (no SuperAdmin)
        const isAdmin = hasAnyRole(roles, ['SuperAdmin', 'SystemAdmin', 'Admin']) && !isCompanyScoped;
        const isPsychologist = hasAnyRole(roles, ['Psychologist']) && !isAdmin && !isCompanyScoped;

        const defaultItems: FuseNavigationItem[] = [];
        const baseItemClasses = {
            icon: '!text-gray-500 !opacity-100',
            title: '!text-[17px] !font-normal !text-gray-500',
            wrapper: '!mb-3',
        } as const;

        // ── CompanyAdmin / HRManager ──────────────────────────────────────────
        if (isCompanyScoped) {
            defaultItems.push({
                id: 'company-menu',
                title: 'Mi Empresa',
                type: 'group',
                icon: 'heroicons_outline:building-office-2',
                classes: baseItemClasses,
                children: [
                    {
                        id: 'company-dashboard',
                        title: 'Seguimiento de Usuarios',
                        type: 'basic',
                        icon: 'heroicons_outline:chart-bar-square',
                        link: '/admin/company-tracking',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'company-users',
                        title: 'Usuarios',
                        type: 'basic',
                        icon: 'heroicons_outline:users',
                        link: '/admin/users',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'company-alerts',
                        title: 'Alertas',
                        type: 'basic',
                        icon: 'heroicons_outline:exclamation-triangle',
                        link: '/admin/alerts',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'company-reports',
                        title: 'Reportes y Exportaciones',
                        type: 'basic',
                        icon: 'heroicons_outline:document-text',
                        link: '/admin/reports',
                        classes: baseItemClasses,
                    },
                ],
            });

        // ── SuperAdmin / SystemAdmin / Admin ──────────────────────────────────
        } else if (isAdmin) {
            defaultItems.push({
                id: 'admin',
                title: 'Administración',
                type: 'group',
                icon: 'heroicons_outline:cog-8-tooth',
                classes: baseItemClasses,
                children: [
                    {
                        id: 'admin-center',
                        title: 'Centro de Control',
                        type: 'basic',
                        icon: 'heroicons_outline:squares-2x2',
                        link: '/admin',
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
                        id: 'admin-evaluations',
                        title: 'Evaluaciones',
                        type: 'basic',
                        icon: 'heroicons_outline:clipboard-document-check',
                        link: '/admin/evaluations',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-config',
                        title: 'Gestión de la Organización',
                        type: 'basic',
                        icon: 'heroicons_outline:building-office',
                        link: '/admin/config',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-recommendations',
                        title: 'Recomendaciones',
                        type: 'basic',
                        icon: 'heroicons_outline:light-bulb',
                        link: '/admin/recommendations',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-reports',
                        title: 'Seguimiento de Indicadores',
                        type: 'basic',
                        icon: 'heroicons_outline:presentation-chart-bar',
                        link: '/admin/reports',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-cases',
                        title: 'Seguimiento a Casos',
                        type: 'basic',
                        icon: 'heroicons_outline:clipboard-document-list',
                        link: '/admin/cases',
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
                        id: 'admin-resources',
                        title: 'Recursos',
                        type: 'basic',
                        icon: 'heroicons_outline:academic-cap',
                        link: '/admin/resources',
                        classes: baseItemClasses,
                    },
                    {
                        id: 'admin-catalogs',
                        title: 'Catálogos',
                        type: 'basic',
                        icon: 'heroicons_outline:tag',
                        link: '/admin/catalogs',
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
                ],
            });

        // ── Psychologist ──────────────────────────────────────────────────────
        } else if (isPsychologist) {
            defaultItems.push({
                id: 'psych-menu',
                title: 'Panel Psicólogo',
                type: 'group',
                icon: 'heroicons_outline:user-circle',
                classes: baseItemClasses,
                children: [
                    {
                        id: 'psych-alerts',
                        title: 'Alertas',
                        type: 'basic',
                        icon: 'heroicons_outline:exclamation-triangle',
                        link: '/admin/alerts',
                        classes: baseItemClasses,
                    },
                ],
            });

        // ── Employee ──────────────────────────────────────────────────────────
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
                link: '/my-plan',
                classes: baseItemClasses,
            });

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
