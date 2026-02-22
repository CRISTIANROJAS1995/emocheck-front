import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Valores exactos que acepta el backend
export type ExportType = 'EVALUATIONS' | 'ALERTS' | 'USERS' | 'RESULTS' | 'CASE_TRACKING';
export type ExportFormat = 'XLSX' | 'CSV';

export interface ExportRequestDto {
    exportType: ExportType | string;
    format: ExportFormat | string;        // campo se llama "format" (no fileFormat)
    filters?: string;                     // JSON string, ej: '{"companyId":1,"startDate":"2026-01-01"}'
}

export interface DataExportDto {
    dataExportId: number;
    exportID?: number;                    // alias que puede venir del backend
    exportType?: string;
    format?: string;
    fileFormat?: string;                  // alias legacy
    status?: string;
    requestedAt?: string;
    completedAt?: string;
    expiresAt?: string;
    downloadUrl?: string;
    filePath?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminExportService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    /** POST /api/export — Solicitar exportación */
    requestExport(payload: ExportRequestDto): Observable<DataExportDto> {
        return this.http
            .post<unknown>(`${this.apiUrl}/export`, payload)
            .pipe(
                map((res) => this.unwrapObject<DataExportDto>(res)),
                // NO hacemos catchError aquí — dejamos que el error llegue al componente con el body completo
            );
    }

    /** GET /api/export/my-exports — Mis exportaciones */
    myExports(): Observable<DataExportDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/export/my-exports`)
            .pipe(
                map((res) => this.normalizeList(this.unwrapArray<DataExportDto>(res))),
                catchError(() => of([]))
            );
    }

    /** GET /api/export/{id} — Estado de una exportación */
    getExport(id: number): Observable<DataExportDto> {
        return this.http
            .get<unknown>(`${this.apiUrl}/export/${id}`)
            .pipe(map((res) => this.normalize(this.unwrapObject<DataExportDto>(res))));
    }

    /** GET /api/export/{id}/download — URL para descargar */
    getDownloadUrl(item: DataExportDto): string {
        const id = item.dataExportId ?? (item as any).exportID;
        if (item?.downloadUrl) {
            if (item.downloadUrl.startsWith('http://') || item.downloadUrl.startsWith('https://')) {
                return item.downloadUrl;
            }
            return `${this.apiUrl}${item.downloadUrl.startsWith('/') ? '' : '/'}${item.downloadUrl}`;
        }
        return `${this.apiUrl}/export/${id}/download`;
    }

    /** Normaliza campos que el backend puede devolver con nombres distintos */
    private normalize(item: DataExportDto): DataExportDto {
        const anyItem = item as any;
        return {
            ...item,
            dataExportId: item.dataExportId ?? anyItem.exportID ?? anyItem.id ?? 0,
            format: item.format ?? item.fileFormat ?? anyItem.fileFormat,
            fileFormat: item.format ?? item.fileFormat ?? anyItem.fileFormat,
        };
    }

    private normalizeList(items: DataExportDto[]): DataExportDto[] {
        return items.map(i => this.normalize(i));
    }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as any;
        if (anyRes && typeof anyRes === 'object' && 'data' in anyRes) {
            return Array.isArray(anyRes.data) ? anyRes.data : [];
        }
        return [];
    }
}
