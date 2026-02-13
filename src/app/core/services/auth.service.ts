import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ApiResponse, LoginRequest, LoginResponse, User } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

    /** Alias para compatibilidad con el interceptor */
    signOut(): void {
        this.logout();
    }
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    private lastAuthErrorSubject = new BehaviorSubject<string | null>(null);
    public lastAuthError$ = this.lastAuthErrorSubject.asObservable();

    private readonly apiUrl = environment.apiUrl;

    private currentUserLoad$?: Observable<User>;

    private mapApiUserToAuthUser(data: any): User {
        const normalizeRole = (roleName: string): string => {
            const v = (roleName ?? '').trim();
            const k = v.toLowerCase();

            if (k === 'system admin') return 'SystemAdmin';
            if (k === 'company admin') return 'CompanyAdmin';
            if (k === 'hse leader') return 'HSE';
            if (k === 'arl admin') return 'Admin';

            // Para nombres ya compatibles (Employee, Psychologist, HSE, Admin, CompanyAdmin)
            return v;
        };

        const expandedRoles: string[] = Array.isArray(data?.roles)
            ? data.roles
                .flatMap((r: any) => {
                    const raw = String(r?.name ?? r ?? '').trim();
                    const normalized = normalizeRole(raw);
                    if (!normalized) return [];
                    // SystemAdmin must be able to bypass onboarding, but still behave as Admin
                    // for existing RoleGuards / navigation.
                    if (normalized === 'SystemAdmin') return ['SystemAdmin', 'Admin'];
                    return [normalized];
                })
                .filter(Boolean)
            : [];

        const roles = Array.from(new Set(expandedRoles));

        return {
            id: Number(data?.userID ?? data?.userId ?? 0),
            name: String(data?.fullName ?? data?.name ?? ''),
            email: String(data?.email ?? ''),
            roles,
            companyId: data?.company?.id ?? undefined,
            companyName: data?.company?.name ?? undefined,
        };
    }

    private fetchCurrentUserFromApi(): Observable<User> {
        return this.httpClient.get<ApiResponse<any>>(`${this.apiUrl}/users/current`).pipe(
            map((res) => {
                if (!res?.success) {
                    throw { status: 400, message: res?.message || 'No fue posible obtener el usuario actual', errors: res?.errors };
                }

                const user = this.mapApiUserToAuthUser(res.data ?? {});
                if (!user?.id || user.id <= 0) {
                    throw { status: 500, message: 'Respuesta inválida de /users/current (userID)' };
                }
                return user;
            })
        );
    }

    /**
     * Garantiza que `currentUser` proviene de `/users/current`.
     * - Si ya está cargado, retorna el usuario actual.
     * - Si no, llama a la API y actualiza storage + subjects.
     */
    ensureCurrentUserLoaded(): Observable<User> {
        const existing = this.currentUserSubject.value;
        if (existing) return of(existing);

        const token = this.getToken();
        if (!token) {
            return throwError(() => ({ status: 401, message: 'No autenticado' }));
        }

        if (this.currentUserLoad$) return this.currentUserLoad$;

        this.currentUserLoad$ = this.fetchCurrentUserFromApi().pipe(
            tap((user) => {
                localStorage.setItem(environment.userStorageKey, JSON.stringify(user));
                this.currentUserSubject.next(user);
                this.isAuthenticatedSubject.next(true);
                this.lastAuthErrorSubject.next(null);
            }),
            finalize(() => {
                this.currentUserLoad$ = undefined;
            }),
            shareReplay(1)
        );

        return this.currentUserLoad$;
    }

    /** Fuerza recarga del usuario desde la API */
    reloadCurrentUser(): Observable<User> {
        this.currentUserSubject.next(null);
        return this.ensureCurrentUserLoaded();
    }

    constructor(
        private router: Router,
        private httpClient: HttpClient,
    ) {
        this.initializeAuth();
    }

    /** Inicializar estado de autenticación */
    private initializeAuth(): void {
        const token = localStorage.getItem(environment.tokenStorageKey);
        if (!token) {
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
            return;
        }

        // Hay token: marcamos sesión como activa y rehidratamos usuario desde la API.
        // (No construimos usuario desde JWT: la fuente de verdad es `/users/current`.)
        this.isAuthenticatedSubject.next(true);
        this.ensureCurrentUserLoaded().subscribe({
            error: () => {
                // Si el token es inválido/expirado, limpiamos sesión.
                this.logout();
            },
        });
    }

    /** Método signIn para compatibilidad con el componente de login */
    signIn(credentials: { email: string, password: string }): Observable<LoginResponse> {
        return this.login({ email: credentials.email, password: credentials.password });
    }

    /** Realizar login con credenciales */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        const email = (credentials?.email ?? '').toString().trim();
        const passwordRaw = (credentials?.password ?? '').toString();
        const passwordForValidation = passwordRaw.trim();

        if (!email || !passwordForValidation) {
            const message = 'Credenciales inválidas';
            this.lastAuthErrorSubject.next(message);
            return throwError(() => ({ status: 400, message }));
        }

        type BackendLoginResponse = {
            token?: string;
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: number;
            expiresAt?: string;
            user?: any;
        };

        return this.httpClient
            .post<ApiResponse<BackendLoginResponse>>(`${this.apiUrl}/auth/login`, {
                email,
                password: passwordRaw,
            })
            .pipe(
                map((response) => {
                    if (!response?.success) {
                        const msg = response?.message || 'No fue posible iniciar sesión';
                        throw { status: 401, message: msg, errors: response?.errors };
                    }

                    const data = response.data;
                    const token = (data?.accessToken || data?.token || '').trim();
                    if (!token) {
                        throw { status: 500, message: 'El backend no devolvió un token válido' };
                    }

                    const refreshToken = (data?.refreshToken || '').trim();
                    const expiresIn = typeof data?.expiresIn === 'number' ? data.expiresIn : 0;

                    return { token, refreshToken, expiresIn };
                }),
                tap(({ token, refreshToken }) => {
                    // Prevent stale user-bound caches (e.g. assessment local state) from
                    // being attributed to the previous logged-in user while we fetch `/users/current`.
                    localStorage.removeItem(environment.userStorageKey);
                    localStorage.setItem(environment.tokenStorageKey, token);
                    if (refreshToken) localStorage.setItem(environment.refreshTokenStorageKey, refreshToken);
                    else localStorage.removeItem(environment.refreshTokenStorageKey);
                    this.isAuthenticatedSubject.next(true);
                }),
                switchMap(({ token, refreshToken, expiresIn }) =>
                    this.reloadCurrentUser().pipe(
                        map((user) => ({ token, refreshToken, expiresIn, user } as LoginResponse))
                    )
                ),
                catchError((error) => {
                    const body = error?.error;
                    const msgFromBody =
                        body?.message ||
                        body?.title ||
                        body?.detail ||
                        (Array.isArray(body?.errors) && body.errors.length ? body.errors.join('\n') : null);

                    const msg =
                        msgFromBody ||
                        (error?.status === 401 ? 'Credenciales inválidas' : null) ||
                        'Error de autenticación';
                    this.lastAuthErrorSubject.next(msg);

                    return throwError(() => ({
                        status: typeof error?.status === 'number' ? error.status : 0,
                        message: msg,
                        body,
                        raw: error,
                    }));
                })
            );
    }

    /** Cerrar sesión */
    logout(): void {
        localStorage.removeItem(environment.tokenStorageKey);
        localStorage.removeItem(environment.refreshTokenStorageKey);
        localStorage.removeItem(environment.userStorageKey);
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/sign-in']);
    }

    /** Verificar si el usuario está autenticado */
    isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    /** Obtener el token JWT */
    getToken(): string | null {
        return localStorage.getItem(environment.tokenStorageKey);
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(environment.refreshTokenStorageKey);
    }

    refreshSession(): Observable<{ token: string; refreshToken: string; expiresIn: number }> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return throwError(() => ({ status: 401, message: 'No refresh token' }));
        }

        type RefreshData = {
            accessToken?: string;
            token?: string;
            refreshToken?: string;
            expiresAt?: string;
            userID?: number;
            fullName?: string;
            email?: string;
            roles?: string[];
        };

        return this.httpClient
            .post<ApiResponse<RefreshData>>(`${this.apiUrl}/auth/refresh`, {
                refreshToken,
            })
            .pipe(
                map((response) => {
                    if (!response?.success) {
                        const msg = response?.message || 'No fue posible renovar la sesión';
                        throw { status: 401, message: msg, errors: response?.errors };
                    }

                    const data = response.data;
                    const nextToken = (data?.accessToken || data?.token || '').trim();
                    const nextRefresh = (data?.refreshToken || '').trim();

                    if (!nextToken || !nextRefresh) {
                        throw { status: 401, message: 'Respuesta de refresh inválida' };
                    }

                    // expiresIn no está en Swagger para refresh; mantenemos 0 (no usado en UI)
                    return { token: nextToken, refreshToken: nextRefresh, expiresIn: 0 };
                }),
                switchMap((data) => {
                    localStorage.setItem(environment.tokenStorageKey, data.token);
                    localStorage.setItem(environment.refreshTokenStorageKey, data.refreshToken);
                    this.isAuthenticatedSubject.next(true);

                    // Fuente de verdad: /users/current
                    return this.reloadCurrentUser().pipe(map(() => data));
                })
            );
    }

    /** Obtener el usuario actual */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }


}
