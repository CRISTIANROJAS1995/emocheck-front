import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AssessmentModuleId, AssessmentResult } from 'app/core/models/assessment.model';

type StoredResults = Partial<Record<AssessmentModuleId, AssessmentResult>>;

@Injectable({
    providedIn: 'root',
})
export class AssessmentStateService {
    private readonly storageKey = 'emocheck.assessmentResults.v1';

    private readonly _results$ = new BehaviorSubject<StoredResults>(this.loadFromStorage());
    readonly results$ = this._results$.asObservable();

    getResult(moduleId: AssessmentModuleId): AssessmentResult | undefined {
        return this._results$.value[moduleId];
    }

    setResult(result: AssessmentResult): void {
        const next: StoredResults = {
            ...this._results$.value,
            [result.moduleId]: result,
        };
        this._results$.next(next);
        this.saveToStorage(next);
    }

    clearModule(moduleId: AssessmentModuleId): void {
        const next: StoredResults = { ...this._results$.value };
        delete next[moduleId];
        this._results$.next(next);
        this.saveToStorage(next);
    }

    clearAll(): void {
        const next: StoredResults = {};
        this._results$.next(next);
        this.saveToStorage(next);
    }

    private loadFromStorage(): StoredResults {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return {};
            const parsed = JSON.parse(raw) as StoredResults;
            if (!parsed || typeof parsed !== 'object') return {};
            return parsed;
        } catch {
            return {};
        }
    }

    private saveToStorage(results: StoredResults): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(results));
        } catch {
            // ignore
        }
    }
}
