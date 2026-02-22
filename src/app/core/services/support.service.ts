import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from 'app/core/models/auth.model';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface ProfessionalSupportDto {
    professionalSupportId: number;
    fullName: string;
    email?: string;
    phone?: string;
    specialties?: string[];
    licenseNumber?: string;
    bio?: string;
    profileImageUrl?: string;
    isEmergencyContact?: boolean;
    rating?: number;
    totalSessions?: number;
}

export interface EmergencyContactDto {
    professionalSupportId: number;
    fullName: string;
    phone?: string;
    emergencyLine?: string;
    email?: string;
    isEmergencyContact: boolean;
    availability?: string;
}

export type SupportRequestType = 'PSYCHOLOGICAL' | 'HR' | 'TECHNICAL' | string;
export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;

export interface CreateSupportRequestDto {
    requestType: SupportRequestType;
    subject: string;
    description: string;
    priority: SupportPriority;
    evaluationID?: number;
}

export interface SupportRequestDto {
    supportRequestId: number;
    requestType: SupportRequestType;
    priority: SupportPriority;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED' | string;
    subject: string;
    description?: string;
    requestedAt: string;
    assignedAt?: string | null;
    assignedToPsychologistName?: string | null;
    assignedToPsychologistPhone?: string | null;
    resolvedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private normalizeResponse(res: unknown): unknown {
        if (typeof res !== 'string') return res;
        const trimmed = res.trim();
        if (!trimmed) return res;
        try {
            return JSON.parse(trimmed);
        } catch {
            return res;
        }
    }

    private unwrapApiResponse<T>(res: unknown, fallbackErrorMessage: string): T {
        const anyRes = this.normalizeResponse(res) as any;
        if (anyRes && typeof anyRes === 'object' && 'success' in anyRes) {
            const api = anyRes as Partial<ApiResponse<T>>;
            if (!api.success) throw new Error((api as any)?.message || fallbackErrorMessage);
            return (api.data as T) ?? (undefined as any);
        }

        return anyRes as T;
    }

    private toProfessionalDto(raw: any): ProfessionalSupportDto {
        return {
            professionalSupportId: Number(raw?.professionalSupportID ?? raw?.professionalSupportId ?? 0),
            fullName: String(raw?.fullName ?? raw?.name ?? ''),
            email: raw?.email ?? undefined,
            phone: raw?.phone ?? undefined,
            specialties: Array.isArray(raw?.specialties)
                ? raw.specialties
                : raw?.specialty
                    ? [String(raw.specialty)]
                    : undefined,
            licenseNumber: raw?.licenseNumber ?? undefined,
            bio: raw?.bio ?? undefined,
            profileImageUrl: raw?.profileImageUrl ?? undefined,
            isEmergencyContact: Boolean(raw?.isEmergencyContact ?? raw?.isEmergency ?? false),
            rating: typeof raw?.rating === 'number' ? raw.rating : undefined,
            totalSessions: typeof raw?.totalSessions === 'number' ? raw.totalSessions : undefined,
        };
    }

    private toEmergencyContactDto(raw: any): EmergencyContactDto {
        return {
            professionalSupportId: Number(raw?.professionalSupportID ?? raw?.professionalSupportId ?? 0),
            fullName: String(raw?.fullName ?? raw?.name ?? ''),
            phone: raw?.phone ?? undefined,
            emergencyLine: raw?.emergencyLine ?? (raw?.is24Hours ? '24/7' : undefined),
            email: raw?.email ?? undefined,
            isEmergencyContact: Boolean(raw?.isEmergencyContact ?? raw?.isEmergency ?? true),
            availability: raw?.availability ?? raw?.availableHours ?? undefined,
        };
    }

    private toSupportRequestDto(raw: any): SupportRequestDto {
        return {
            supportRequestId: Number(raw?.supportRequestID ?? raw?.supportRequestId ?? 0),
            requestType: (raw?.requestType ?? 'PSYCHOLOGICAL') as SupportRequestType,
            priority: (raw?.priority ?? 'MEDIUM') as SupportPriority,
            status: String(raw?.status ?? 'OPEN'),
            subject: String(raw?.subject ?? ''),
            description: raw?.description ?? undefined,
            requestedAt: String(raw?.requestedAt ?? raw?.createdAt ?? ''),
            assignedAt: raw?.assignedAt ?? null,
            assignedToPsychologistName: raw?.assignedToPsychologistName ?? raw?.psychologistName ?? null,
            assignedToPsychologistPhone: raw?.assignedToPsychologistPhone ?? null,
            resolvedAt: raw?.resolvedAt ?? raw?.completedAt ?? null,
        };
    }

    getProfessionals(): Observable<ProfessionalSupportDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/support/professionals`).pipe(
            map((res) => {
                const list = this.unwrapApiResponse<any[]>(res, 'No fue posible obtener profesionales') ?? [];
                return (list ?? []).map((item) => this.toProfessionalDto(item));
            })
        );
    }

    getEmergencyContacts(): Observable<EmergencyContactDto[]> {
        // No dedicated emergency endpoint — filter professionals by isEmergencyContact flag
        return this.getProfessionals().pipe(
            map((list) =>
                list
                    .filter((p) => p.isEmergencyContact)
                    .map((p) => ({
                        professionalSupportId: p.professionalSupportId,
                        fullName: p.fullName,
                        phone: p.phone,
                        emergencyLine: undefined,
                        email: p.email,
                        isEmergencyContact: true,
                        availability: undefined,
                    } as EmergencyContactDto))
            )
        );
    }

    createRequest(payload: CreateSupportRequestDto): Observable<{ supportRequestId: number } & Record<string, unknown>> {
        return this.http.post<unknown>(`${this.apiUrl}/support`, payload).pipe(
            map((res) => {
                const created = this.unwrapApiResponse<any>(res, 'No fue posible crear la solicitud') ?? {};
                return {
                    ...created,
                    supportRequestId: Number(created?.supportRequestID ?? created?.supportRequestId ?? 0),
                };
            })
        );
    }

    getMyRequests(): Observable<SupportRequestDto[]> {
        return this.http.get<unknown>(`${this.apiUrl}/support/my-requests`).pipe(
            map((res) => {
                const list = this.unwrapApiResponse<any[]>(res, 'No fue posible obtener solicitudes') ?? [];
                return (list ?? []).map((item) => this.toSupportRequestDto(item));
            })
        );
    }
}
