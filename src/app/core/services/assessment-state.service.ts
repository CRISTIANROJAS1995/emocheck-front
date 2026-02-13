import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { AssessmentModuleId, AssessmentResult } from 'app/core/models/assessment.model';
import { AuthService } from 'app/core/services/auth.service';
import { environment } from '../../../environments/environment';

type StoredResults = Partial<Record<AssessmentModuleId, AssessmentResult>>;

@Injectable({
    providedIn: 'root',
})
export class AssessmentStateService {
    private readonly storageKeyPrefix = 'emocheck.assessmentResults.v2';
    private readonly legacyGlobalStorageKey = 'emocheck.assessmentResults.v1';
    private readonly initialUserIdFromStorage: number | null = this.readUserIdFromStorage();
    private currentUserId: number | null = this.initialUserIdFromStorage;
    private legacyMigrationAttempted = false;

    private readonly _results$ = new BehaviorSubject<StoredResults>(this.loadFromStorage(this.currentUserId));
    readonly results$ = this._results$.asObservable();

    constructor(private readonly auth: AuthService) {
        // Keep state isolated per-user so different logins do not leak module completion.
        this.auth.currentUser$
            .pipe(
                map((u) => (u?.id && u.id > 0 ? u.id : null)),
                distinctUntilChanged()
            )
            .subscribe((userId) => {
                this.currentUserId = userId;

                // On logout (userId null) we clear in-memory results.
                if (!userId) {
                    this._results$.next({});
                    return;
                }

                // Best-effort migration: only when the user we saw in storage at service creation
                // matches the authenticated user. This prevents copying legacy data into a different user.
                if (!this.legacyMigrationAttempted && this.initialUserIdFromStorage === userId) {
                    this.legacyMigrationAttempted = true;
                    this.migrateLegacyGlobalToUser(userId);
                }

                // Load current user's stored results.
                this._results$.next(this.loadFromStorage(userId));
            });
    }

    getResult(moduleId: AssessmentModuleId): AssessmentResult | undefined {
        return this._results$.value[moduleId];
    }

    getAllResults(): StoredResults {
        return { ...(this._results$.value ?? {}) };
    }

    setResult(result: AssessmentResult): void {
        const next: StoredResults = {
            ...this._results$.value,
            [result.moduleId]: result,
        };
        this._results$.next(next);
        this.saveToStorage(next, this.currentUserId);
    }

    clearModule(moduleId: AssessmentModuleId): void {
        const next: StoredResults = { ...this._results$.value };
        delete next[moduleId];
        this._results$.next(next);
        this.saveToStorage(next, this.currentUserId);
    }

    clearAll(): void {
        const next: StoredResults = {};
        this._results$.next(next);
        this.saveToStorage(next, this.currentUserId);
    }

    private loadFromStorage(userId: number | null): StoredResults {
        try {
            const raw = localStorage.getItem(this.storageKeyForUser(userId));
            if (!raw) return {};
            const parsed = JSON.parse(raw) as StoredResults;
            if (!parsed || typeof parsed !== 'object') return {};
            return parsed;
        } catch {
            return {};
        }
    }

    private saveToStorage(results: StoredResults, userId: number | null): void {
        try {
            // If we don't know the user yet, don't persist (avoids leaking state across logins).
            if (!userId || userId <= 0) return;
            localStorage.setItem(this.storageKeyForUser(userId), JSON.stringify(results));
        } catch {
            // ignore
        }
    }

    private storageKeyForUser(userId: number | null): string {
        const safe = userId && userId > 0 ? String(userId) : 'anonymous';
        return `${this.storageKeyPrefix}.${safe}`;
    }

    private readUserIdFromStorage(): number | null {
        try {
            const raw = localStorage.getItem(environment.userStorageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as any;
            const id = Number(parsed?.id ?? parsed?.userId ?? parsed?.userID ?? 0);
            return Number.isFinite(id) && id > 0 ? id : null;
        } catch {
            return null;
        }
    }

    private migrateLegacyGlobalToUser(currentUserId: number): void {
        // If the current user's v2 bucket already exists, we do nothing.
        // If legacy exists, and v2 is empty, we copy and remove legacy.
        // This is best-effort; legacy data cannot be reliably attributed to a specific user.
        try {
            const userKey = this.storageKeyForUser(currentUserId);
            const already = localStorage.getItem(userKey);
            if (already) return;

            const legacy = localStorage.getItem(this.legacyGlobalStorageKey);
            if (!legacy) return;

            localStorage.setItem(userKey, legacy);
            localStorage.removeItem(this.legacyGlobalStorageKey);
        } catch {
            // ignore
        }
    }
}
