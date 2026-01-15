import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { LoginRequest, LoginResponse, User, UserRole } from '../models/auth.model';
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

    constructor(
        private router: Router,
        private httpClient: HttpClient,
    ) {
        this.initializeAuth();
    }

    /** Inicializar estado de autenticación */
    private initializeAuth(): void {
        // Inicialización silenciosa (logs removidos para producción)
        const token = localStorage.getItem(environment.tokenStorageKey);
        const userData = localStorage.getItem(environment.userStorageKey);
        if (token && userData) {
            try {
                const user: User = JSON.parse(userData);
                this.currentUserSubject.next(user);
                this.isAuthenticatedSubject.next(true);
                // Usuario autenticado restaurado
            } catch (error) {
                this.currentUserSubject.next(null);
                this.isAuthenticatedSubject.next(false);
                this.logout();
                // Error parseando usuario almacenado
            }
        } else {
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
            // No hay token persistido
        }
    }

    /** Método signIn para compatibilidad con el componente de login */
    signIn(credentials: { email: string, password: string }): Observable<LoginResponse> {
        return this.login({ email: credentials.email, password: credentials.password });
    }

    /** Realizar login con credenciales */
    login(credentials: LoginRequest): Observable<LoginResponse> {
        const email = (credentials?.email ?? '').trim();
        const password = (credentials?.password ?? '').trim();

        // Mock validation (simple): require non-empty email/password
        if (!email || !password) {
            const message = 'Credenciales inválidas';
            this.lastAuthErrorSubject.next(message);
            return throwError(() => ({ status: 401, message }));
        }

        const nowIso = new Date().toISOString();
        const user: User = {
            id: 1,
            name: 'Administrador',
            email,
            role: UserRole.Admin,
            company: 'EmoCheck',
            isActive: true,
            createdAt: nowIso,
        };

        const token = 'mock-token';

        // Persistir sesión
        localStorage.setItem(environment.tokenStorageKey, token);
        localStorage.setItem(environment.userStorageKey, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.lastAuthErrorSubject.next(null);

        return of({ token, user } as LoginResponse);
    }

    /** Cerrar sesión */
    logout(): void {
        localStorage.removeItem(environment.tokenStorageKey);
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

    /** Obtener el usuario actual */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }


}
