import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';

/**
 * AuthInterceptor
 * - Adjunta Bearer token si existe
 * - Maneja 401/403 forzando logout y redirección al sign-in con redirectURL
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/refresh-token') ||
    req.url.includes('/users/register');

  const token = authService.getToken();

  let authReq = req;
  if (!isAuthEndpoint && token && !req.headers.has('Authorization')) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint) {
        // 403 = autenticado pero sin permisos. No forzamos logout ni redirección a sign-in.
        // El control de acceso de pantallas se maneja con RoleGuard.
        return throwError(() => error);
      }

      return refreshTokenOnce(authService).pipe(
        switchMap((newToken) => {
          const retryReq = authReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
          return next(retryReq);
        }),
        catchError((refreshErr) => {
          authService.logout();
          const current = router.routerState.snapshot.url || '';
          router.navigate(['/sign-in'], { queryParams: { redirectURL: current } });
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

let refresh$: Observable<string> | null = null;

function refreshTokenOnce(authService: AuthService): Observable<string> {
  if (refresh$) {
    return refresh$;
  }

  refresh$ = authService.refreshSession().pipe(
    map((data) => data.token),
    shareReplay({ bufferSize: 1, refCount: false }),
    finalize(() => {
      refresh$ = null;
    })
  );

  return refresh$;
}
