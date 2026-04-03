import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface DataSheetRequest {
    period: string; // 'YYYY-MM'

    // Q1
    fechaNacimiento?: string | null; // 'YYYY-MM-DD'

    // Q4-Q8 — Clarification block (optional)
    identidadGenero?: string | null;
    grupoEtnico?: string | null;
    discapacidad?: string | null;
    discapacidadDetalle?: string | null;
    cuidadorExclusivo?: string | null;
    situacionEspecial?: string | null; // CSV

    // Q9-Q15 — Sociodemographic (required except profesion and residence)
    estadoCivil: string;
    nivelEducacion: string;
    profesion?: string | null;
    lugarResidenciaCiudad?: string | null;
    lugarResidenciaDepartamento?: string | null;
    estrato: string;
    tipoVivienda: string;
    personasACargo: number;

    // Q16-Q26 — Occupational
    ciudadTrabajo?: string | null;
    lugarTrabajoDepartamento?: string | null;
    antiguedadEmpresa?: number | null;
    areaNombre?: string | null;
    nombreCargo?: string | null;
    nombreOficio?: string | null;
    tipoCargo?: string | null; // determines Form A or B
    antiguedadCargo?: number | null; // 0 = menos de 1 año
    antiguedadOficio?: number | null; // 0 = menos de 1 año
    tipoContrato: string;
    tipoSalario?: string | null;
    horasLaboralesDiarias: number; // 1-3
}

export interface DataSheetDto {
    fichaID: number;
    userID: number;
    period: string;

    // Q1-Q2
    fechaNacimiento?: string | null;
    edad?: number | null;

    // Q3
    sexo: string;

    // Q4-Q8 optional
    identidadGenero?: string | null;
    grupoEtnico?: string | null;
    discapacidad?: string | null;
    discapacidadDetalle?: string | null;
    cuidadorExclusivo?: string | null;
    situacionEspecial?: string | null;

    // Q9-Q15
    estadoCivil: string;
    nivelEducacion: string;
    profesion?: string | null;
    lugarResidenciaCiudad?: string | null;
    lugarResidenciaDepartamento?: string | null;
    estrato: string;
    tipoVivienda: string;
    personasACargo: number;

    // Q16-Q26
    ciudadTrabajo: string;
    lugarTrabajoDepartamento?: string | null;
    antiguedadEmpresa: number;
    areaNombre: string;
    nombreCargo: string;
    nombreOficio?: string | null;
    tipoCargo?: string | null;
    psicosocialForma: string; // 'A' | 'B'
    antiguedadCargo: number;
    antiguedadOficio?: number | null;
    tipoContrato: string;
    tipoSalario?: string | null;
    horasLaboralesDiarias: number;

    createdAt: string;
}

export interface AssignedEvaluationDto {
    evaluationID: number;
    instrumentID: number;
    instrumentCode: string; // INTRA_A | INTRA_B | EXTRALABORAL | ESTRES
    instrumentName: string;
    status: string; // PENDING | IN_PROGRESS | COMPLETED
}

export interface DataSheetResultDto {
    dataSheet: DataSheetDto;
    assignedEvaluations: AssignedEvaluationDto[];
}

export interface GeneralDataCatalogsDto {
    estadoCivil: string[];
    nivelEducacion: string[];
    tipoVivienda: string[];
    tipoContrato: string[];
    horasLaboralesDiarias: string[];
    antiguedad: string[];
    estratos: string[];
    identidadGenero: string[];
    grupoEtnico: string[];
    discapacidad: string[];
    situacionEspecial: string[];
    tipoCargo: string[];
    tipoSalario: string[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PsychosocialDataSheetService {
    private readonly base = `${environment.apiUrl}/psicosocial`;

    constructor(private readonly http: HttpClient) { }

    /** Saves the data sheet and automatically creates module evaluations */
    saveDataSheet(request: DataSheetRequest): Observable<DataSheetResultDto> {
        return this.http.post<DataSheetResultDto>(`${this.base}/ficha`, request);
    }

    /** Retrieves the saved data sheet for the given period (to pre-fill the form) */
    getDataSheet(period: string): Observable<DataSheetDto> {
        return this.http.get<DataSheetDto>(`${this.base}/ficha/${period}`);
    }

    /** Lists all periods for which the user has a saved data sheet */
    getPeriods(): Observable<string[]> {
        return this.http.get<string[]>(`${this.base}/ficha/periodos`);
    }

    /** Returns the form option catalogs */
    getCatalogs(): Observable<GeneralDataCatalogsDto> {
        return this.http.get<GeneralDataCatalogsDto>(`${this.base}/catalogos`);
    }

    /** Returns the current period as YYYY-MM */
    getCurrentPeriod(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}
