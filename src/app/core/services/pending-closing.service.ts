import { Injectable } from '@angular/core';
import { RichAnswer } from 'app/core/services/assessment.service';
import { AssessmentModuleId } from 'app/core/models/assessment.model';

export interface PendingClosing {
    richAnswers: RichAnswer[];
    instrumentCode: string;
    instrumentId?: number;
    moduleId: AssessmentModuleId;
}

/**
 * Servicio de estado transitorio para el modal de cierre post-cuestionario.
 * Los cuestionarios especializados (ICSP_VC, TMMS24, MFI20) guardan aquí las
 * respuestas pendientes antes de navegar de vuelta al instrument-selector,
 * que las recoge y muestra el modal de cierre correspondiente.
 */
@Injectable({ providedIn: 'root' })
export class PendingClosingService {
    private _pending: PendingClosing | null = null;

    set(data: PendingClosing): void {
        this._pending = data;
    }

    consume(): PendingClosing | null {
        const data = this._pending;
        this._pending = null;
        return data;
    }

    hasPending(): boolean {
        return this._pending !== null;
    }
}
