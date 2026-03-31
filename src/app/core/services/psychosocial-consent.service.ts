import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PsychosocialConsentDto {
    psychosocialConsentID: number;
    userID: number;
    fullName: string;
    documentNumber: string;
    /** 'ACCEPTED' | 'REJECTED' | '' */
    decision: string;
    consentVersion: string;
    signedAt: string;
    hasResponded: boolean;
    isAccepted: boolean;
}

@Injectable({ providedIn: 'root' })
export class PsychosocialConsentService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    /**
     * Returns the consent record for the current user.
     * If hasResponded = false the user hasn't signed yet.
     */
    getStatus(): Observable<PsychosocialConsentDto> {
        return this.http.get<PsychosocialConsentDto>(`${this.apiUrl}/psychosocial-consent/status`);
    }

    /**
     * Signs the consent with decision 'ACCEPTED' or 'REJECTED'.
     * Can only be called once; returns 409 if already signed.
     */
    sign(decision: 'ACCEPTED' | 'REJECTED'): Observable<PsychosocialConsentDto> {
        return this.http.post<PsychosocialConsentDto>(`${this.apiUrl}/psychosocial-consent/sign`, { decision });
    }
}
