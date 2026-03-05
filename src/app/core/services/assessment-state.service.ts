import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AssessmentModuleId, AssessmentResult } from 'app/core/models/assessment.model';

type StoredResults = Partial<Record<AssessmentModuleId, AssessmentResult>>;

@Injectable({
    providedIn: 'root',
})
export class AssessmentStateService {

    private readonly _results$ = new BehaviorSubject<StoredResults>({});
    readonly results$ = this._results$.asObservable();

    getResult(moduleId: AssessmentModuleId): AssessmentResult | undefined {
        return this._results$.value[moduleId];
    }

    getAllResults(): StoredResults {
        return { ...(this._results$.value ?? {}) };
    }

    setResult(result: AssessmentResult): void {
        this._results$.next({
            ...this._results$.value,
            [result.moduleId]: result,
        });
    }

    mergeResult(incoming: AssessmentResult): void {
        // Sin caché — simplemente reemplazar con lo que viene del backend
        this.setResult(incoming);
    }

    clearModule(moduleId: AssessmentModuleId): void {
        const next: StoredResults = { ...this._results$.value };
        delete next[moduleId];
        this._results$.next(next);
    }

    clearAll(): void {
        this._results$.next({});
    }
}
