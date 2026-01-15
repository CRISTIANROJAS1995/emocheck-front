import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * AuthInterceptor
 * - Adjunta Bearer token si existe
 * - Maneja 401/403 forzando logout y redirección al sign-in con redirectURL
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        const current = router.routerState.snapshot.url || '';
        router.navigate(['/sign-in'], { queryParams: { redirectURL: current } });
      }
      return throwError(() => error);
    })
  );
};