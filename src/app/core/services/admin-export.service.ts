import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ExportRequestDto {
    exportType: 'Full' | 'Partial' | 'EvaluationsOnly' | 'PersonalDataOnly' | string;
    fileFormat: 'JSON' | 'CSV' | 'PDF' | string;
    startDate?: string;
    endDate?: string;
    reason?: string;
}

export interface DataExportDto {
    dataExportId: number;
    exportType?: string;
    fileFormat?: string;
    status?: string;
    requestedAt?: string;
    completedAt?: string;
    expiresAt?: string;
    downloadUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminExportService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    requestExport(payload: ExportRequestDto): Observable<DataExportDto> {
        return this.http
            .post<unknown>(`${this.apiUrl}/export`, payload)
            .pipe(map((res) => this.unwrapObject<DataExportDto>(res)));
    }

    myExports(): Observable<DataExportDto[]> {
        return this.http
            .get<unknown>(`${this.apiUrl}/export/my-exports`)
            .pipe(map((res) => this.unwrapArray<DataExportDto>(res)));
    }

    getDownloadUrl(item: DataExportDto): string {
        if (item?.downloadUrl) {
            if (item.downloadUrl.startsWith('http://') || item.downloadUrl.startsWith('https://')) {
                return item.downloadUrl;
            }
            return `${this.apiUrl}${item.downloadUrl.startsWith('/') ? '' : '/'}${item.downloadUrl}`;
        }
        return `${this.apiUrl}/export/${item.dataExportId}/download`;
    }

    private unwrapObject<T>(res: unknown): T {
        const anyRes = res as ApiResponse<T>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return anyRes.data as T;
        }
        return res as T;
    }

    private unwrapArray<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const anyRes = res as ApiResponse<T[]>;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes && 'data' in anyRes) {
            return Array.isArray(anyRes.data) ? anyRes.data : [];
        }
        return [];
    }
}
