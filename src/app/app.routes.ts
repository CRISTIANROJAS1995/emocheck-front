import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

export const appRoutes: Route[] = [

    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'welcome' },

    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'informed-consent' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'welcome', loadChildren: () => import('app/modules/landing/welcome/welcome.routes') },
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },

        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
            { path: 'informed-consent', loadChildren: () => import('app/modules/admin/pages/informed-consent/informed-consent.routes') },
            { path: 'complete-profile', loadChildren: () => import('app/modules/admin/pages/complete-profile/complete-profile.routes') },
            { path: 'emotional-instructions', loadChildren: () => import('app/modules/admin/pages/emotional-instructions/emotional-instructions.routes') },
            { path: 'emotional-analysis', loadChildren: () => import('app/modules/admin/pages/emotional-analysis/emotional-analysis.routes') }
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'classic'
        },
        resolve: {
            initialData: initialDataResolver
        },
        children: [
            { path: 'home', loadChildren: () => import('app/modules/admin/home/home.routes') },
            { path: 'my-tracking', loadChildren: () => import('app/modules/admin/pages/my-tracking/my-tracking.routes') },
            {
                path: 'mental-health',
                loadChildren: () => import('app/modules/admin/pages/questions/mental-health/mental-health.routes'),
                data: { layout: 'empty' }
            },
            {
                path: 'work-fatigue',
                loadChildren: () => import('app/modules/admin/pages/questions/work-fatigue/work-fatigue.routes'),
                data: { layout: 'empty' }
            },
            {
                path: 'organizational-climate',
                loadChildren: () => import('app/modules/admin/pages/questions/organizational-climate/organizational-climate.routes'),
                data: { layout: 'empty' }
            },
            {
                path: 'psychosocial-risk',
                loadChildren: () => import('app/modules/admin/pages/questions/psychosocial-risk/psychosocial-risk.routes'),
                data: { layout: 'empty' }
            },
        ]
    }
];
