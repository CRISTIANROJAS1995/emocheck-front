import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { RoleGuard } from 'app/core/auth/guards/role.guard';
import { ModuleGuard } from 'app/core/auth/guards/module.guard';
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
                        title: 'EmoCheck - Tecnología que Escucha, Analiza y Cuida la Mente | Análisis Facial IA',
                        description: '✨ Descubre EmoCheck, la plataforma líder en bienestar emocional y salud mental laboral. Análisis facial por IA, evaluación de riesgo psicosocial, clima organizacional y fatiga laboral. 🛡️ 100% SG-SST Normativo. Transforma el bienestar de tu equipo con ciencia de datos.',
                        keywords: 'EmoCheck, bienestar emocional laboral, análisis facial IA, salud mental empresarial, riesgo psicosocial, clima organizacional, burnout, fatiga laboral, SG-SST, wellness corporativo, tecnología bienestar, evaluación emocional, análisis predictivo',
                        canonical: '/welcome',
                    }
                },
                loadChildren: () => import('app/modules/landing/welcome/welcome.routes'),
            },
            { path: 'sign-in', redirectTo: '/welcome', pathMatch: 'full' },
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
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin', 'Employee', 'HSE', 'Psychologist'],
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
                path: 'my-plan',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin', 'Employee', 'HSE', 'Psychologist'],
                    seo: { title: 'Mi Plan de Acción', canonical: '/my-plan' }
                },
                loadChildren: () => import('app/modules/admin/pages/my-plan/my-plan.routes'),
            },
            {
                path: 'admin',
                canActivate: [RoleGuard],
                data: {
                    roles: ['SuperAdmin', 'SystemAdmin', 'Admin', 'CompanyAdmin', 'HRManager', 'Psychologist'],
                    seo: { title: 'Panel de Administración', canonical: '/admin' }
                },
                loadChildren: () => import('app/modules/admin/pages/admin-workspace/admin-workspace.routes'),
            },
            {
                path: 'mental-health',
                canActivate: [ModuleGuard],
                data: { moduleId: 1, seo: { title: 'Evaluación de Salud Mental', canonical: '/mental-health' } },
                loadChildren: () => import('app/modules/admin/pages/questions/mental-health/mental-health.routes'),
            },
            {
                path: 'work-fatigue',
                canActivate: [ModuleGuard],
                data: { moduleId: 2, seo: { title: 'Evaluación de Fatiga Laboral', canonical: '/work-fatigue' } },
                loadChildren: () => import('app/modules/admin/pages/questions/work-fatigue/work-fatigue.routes'),
            },
            {
                path: 'organizational-climate',
                canActivate: [ModuleGuard],
                data: { moduleId: 3, seo: { title: 'Evaluación de Clima Organizacional', canonical: '/organizational-climate' } },
                loadChildren: () => import('app/modules/admin/pages/questions/organizational-climate/organizational-climate.routes'),
            },
            {
                path: 'psychosocial-risk',
                canActivate: [ModuleGuard],
                data: { moduleId: 4, seo: { title: 'Evaluación de Riesgo Psicosocial', canonical: '/psychosocial-risk' } },
                loadChildren: () => import('app/modules/admin/pages/questions/psychosocial-risk/psychosocial-risk.routes'),
            },
        ]
    }
];
