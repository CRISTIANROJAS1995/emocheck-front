import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface ActionPlanModuleDto {
    moduleID: number;
    moduleName: string;
    moduleCode: string | null;
    iconName: string | null;
    colorHex: string | null;
    totalSteps: number;
    completedSteps: number;
    progressPercent: number;
}

export interface ActionPlanStepDto {
    actionPlanStepID: number;
    moduleID: number;
    stepOrder: number;
    stepKey: string;
    title: string;
    subtitle: string | null;
    description: string;
    durationWeeks: number | null;
    topicsCount: number | null;
    resourcesCount: number | null;
    hasCertification: boolean;
    isCompleted: boolean;
    completedAt: string | null;
}

export interface ActionPlanStepDetailDto extends ActionPlanStepDto {
    totalSteps: number;
    previousStepID: number | null;
    nextStepID: number | null;
}

export interface CompleteStepResultDto {
    actionPlanStepID: number;
    isCompleted: boolean;
    completedAt: string | null;
    moduleProgressPercent: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ActionPlanService {
    private readonly _http = inject(HttpClient);
    private readonly _base = environment.apiUrl;

    /** GET /api/action-plan/modules — módulos con progreso del usuario */
    getModules(): Observable<ActionPlanModuleDto[]> {
        return this._http.get<ActionPlanModuleDto[]>(`${this._base}/action-plan/modules`);
    }

    /** GET /api/action-plan/{moduleId}/steps — pasos del módulo */
    getSteps(moduleId: number): Observable<ActionPlanStepDto[]> {
        return this._http.get<ActionPlanStepDto[]>(`${this._base}/action-plan/${moduleId}/steps`);
    }

    /** GET /api/action-plan/{moduleId}/steps/{stepId} — detalle de un paso con prev/next */
    getStepDetail(moduleId: number, stepId: number): Observable<ActionPlanStepDetailDto> {
        return this._http.get<ActionPlanStepDetailDto>(
            `${this._base}/action-plan/${moduleId}/steps/${stepId}`
        );
    }

    /** POST /api/action-plan/{moduleId}/steps/{stepId}/complete — marcar paso como completado */
    completeStep(moduleId: number, stepId: number): Observable<CompleteStepResultDto> {
        return this._http.post<CompleteStepResultDto>(
            `${this._base}/action-plan/${moduleId}/steps/${stepId}/complete`,
            null
        );
    }

    /** DELETE /api/action-plan/{moduleId}/steps/{stepId}/complete — desmarcar paso */
    uncompleteStep(moduleId: number, stepId: number): Observable<CompleteStepResultDto> {
        return this._http.delete<CompleteStepResultDto>(
            `${this._base}/action-plan/${moduleId}/steps/${stepId}/complete`
        );
    }
}
