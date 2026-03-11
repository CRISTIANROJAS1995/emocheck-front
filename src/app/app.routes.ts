import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { RoleGuard } from 'app/core/auth/guards/role.guard';
import { LayoutComponent } from 'app/layout/layout.component';

export const appRoutes: Route[] = [

    // Redirect empty path → welcome para usuarios no autenticados
    { path: '', pathMatch: 'full', redirectTo: 'welcome' },

    { path: 'signed-in-redirect', canActivate: [AuthGuard], loadChildren: () => import('app/modules/auth/signed-in-redirect/signed-in-redirect.routes') },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'welcome',
                data: {
                    seo: {
                        title: 'Bienvenido',
                        description: 'Descubre EmoCheck, la plataforma de bienestar emocional y salud mental laboral. Evalúa el estado emocional de tu equipo con tecnología de análisis facial e instrumentos psicológicos validados.',
                        keywords: 'bienestar emocional, salud mental laboral, evaluación emocional, EmoCheck, bienvenida',
                        canonical: '/welcome',
                    }
                },
                loadChildren: () => import('app/modules/landing/welcome/welcome.routes'),
            },
            {
                path: 'sign-in',
                data: {
                    seo: {
                        title: 'Iniciar Sesión',
                        description: 'Accede a EmoCheck con tu cuenta para monitorear el bienestar emocional de tu organización.',
                        canonical: '/sign-in',
                    }
                },
                loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes'),
            },
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'sign-out',
                data: { seo: { title: 'Cerrando Sesión' } },
                loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes'),
            },
            {
                path: 'informed-consent',
                data: {
                    seo: {
                        title: 'Consentimiento Informado',
                        canonical: '/informed-consent',
                    }
                },
                loadChildren: () => import('app/modules/admin/pages/informed-consent/informed-consent.routes'),
            },
            {
                path: 'complete-profile',
                data: {
                    seo: {
                        title: 'Completar Perfil',
                        canonical: '/complete-profile',
                    }
                },
                loadChildren: () => import('app/modules/admin/pages/complete-profile/complete-profile.routes'),
            },
            {
                path: 'emotional-instructions',
                data: {
                    seo: {
                        title: 'Instrucciones de Análisis Emocional',
                        canonical: '/emotional-instructions',
                    }
                },
                loadChildren: () => import('app/modules/admin/pages/emotional-instructions/emotional-instructions.routes'),
            },
            {
                path: 'emotional-analysis',
                data: {
                    seo: {
                        title: 'Análisis Emocional',
                        canonical: '/emotional-analysis',
                    }
                },
                loadChildren: () => import('app/modules/admin/pages/emotional-analysis/emotional-analysis.routes'),
            },
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'classic' },
        resolve: { initialData: initialDataResolver },
        children: [
            {
                path: 'home',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin', 'Employee', 'HSE'],
                    seo: { title: 'Mis Evaluaciones', canonical: '/home' }
                },
                loadChildren: () => import('app/modules/admin/home/home.routes'),
            },
            {
                path: 'my-tracking',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin', 'Employee', 'HSE'],
                    seo: { title: 'Mi Seguimiento', canonical: '/my-tracking' }
                },
                loadChildren: () => import('app/modules/admin/pages/my-tracking/my-tracking.routes'),
            },
            {
                path: 'support',
                data: { seo: { title: 'Soporte', canonical: '/support' } },
                loadChildren: () => import('app/modules/admin/pages/support/support.routes'),
            },
            {
                path: 'profile',
                data: { seo: { title: 'Mi Perfil', canonical: '/profile' } },
                loadChildren: () => import('app/modules/admin/pages/profile/profile.routes'),
            },
            {
                path: 'resources',
                data: { seo: { title: 'Recursos de Bienestar', canonical: '/resources' } },
                loadChildren: () => import('app/modules/admin/pages/resources/resources.routes'),
            },
            {
                path: 'team-tracking',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Psychologist', 'HSE', 'Admin', 'CompanyAdmin'],
                    seo: { title: 'Seguimiento del Equipo', canonical: '/team-tracking' }
                },
                loadChildren: () => import('app/modules/admin/pages/team-tracking/team-tracking.routes'),
            },
            {
                path: 'admin',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin'],
                    seo: { title: 'Panel de Administración', canonical: '/admin' }
                },
                loadChildren: () => import('app/modules/admin/pages/admin-workspace/admin-workspace.routes'),
            },
            {
                path: 'mental-health',
                data: { seo: { title: 'Evaluación de Salud Mental', canonical: '/mental-health' } },
                loadChildren: () => import('app/modules/admin/pages/questions/mental-health/mental-health.routes'),
            },
            {
                path: 'work-fatigue',
                data: { seo: { title: 'Evaluación de Fatiga Laboral', canonical: '/work-fatigue' } },
                loadChildren: () => import('app/modules/admin/pages/questions/work-fatigue/work-fatigue.routes'),
            },
            {
                path: 'organizational-climate',
                data: { seo: { title: 'Evaluación de Clima Organizacional', canonical: '/organizational-climate' } },
                loadChildren: () => import('app/modules/admin/pages/questions/organizational-climate/organizational-climate.routes'),
            },
            {
                path: 'psychosocial-risk',
                data: { seo: { title: 'Evaluación de Riesgo Psicosocial', canonical: '/psychosocial-risk' } },
                loadChildren: () => import('app/modules/admin/pages/questions/psychosocial-risk/psychosocial-risk.routes'),
            },
        ]
    }
];
