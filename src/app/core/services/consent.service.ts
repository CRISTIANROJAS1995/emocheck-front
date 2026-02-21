import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type ApiResponseShape<T> = { success?: boolean; message?: string | null; data?: T; errors?: string[] | null };
type HasAcceptedConsentShape = { hasAccepted?: boolean };

@Injectable({ providedIn: 'root' })
export class ConsentService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private parseBooleanLike(value: unknown): boolean | undefined {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') {
            if (value === 1) return true;
            if (value === 0) return false;
        }
        if (typeof value === 'string') {
            const lowered = value.trim().toLowerCase();
            if (lowered === 'true' || lowered === '1') return true;
            if (lowered === 'false' || lowered === '0') return false;
        }
        return undefined;
    }

    private parseHasAcceptedFromObject(obj: unknown): boolean | undefined {
        if (!obj || typeof obj !== 'object') return undefined;

        // Direct shape: { hasAccepted: boolean }
        const direct = obj as HasAcceptedConsentShape;
        if (typeof direct.hasAccepted === 'boolean') return direct.hasAccepted;

        // Wrapped: { success, data, errors }
        const wrapped = obj as ApiResponseShape<unknown>;
        if (typeof wrapped.success === 'boolean') {
            if (!wrapped.success) {
                throw {
                    status: 400,
                    message: wrapped.message || 'No fue posible validar el consentimiento',
                    errors: wrapped.errors,
                };
            }

            const fromData = this.parseBooleanLike(wrapped.data);
            if (typeof fromData === 'boolean') return fromData;

            const nested = wrapped.data as HasAcceptedConsentShape;
            if (nested && typeof nested === 'object' && typeof nested.hasAccepted === 'boolean') {
                return nested.hasAccepted;
            }
        }

        return undefined;
    }

    hasAccepted(): Observable<boolean> {
        // Deployed backend uses /consent/check (not /consent/has-accepted)
        // Response: { hasAccepted: boolean }
        return this.http
            .get(`${this.apiUrl}/consent/check`, { responseType: 'text' })
            .pipe(
                map((raw) => {
                    const text = String(raw ?? '').trim();
                    if (!text) {
                        throw { status: 400, message: 'No fue posible validar el consentimiento' };
                    }

                    const fromText = this.parseBooleanLike(text);
                    if (typeof fromText === 'boolean') return fromText;

                    // If backend returns JSON as text, parse it.
                    let parsed: unknown;
                    try {
                        parsed = JSON.parse(text);
                    } catch {
                        throw { status: 400, message: 'No fue posible validar el consentimiento' };
                    }

                    const fromParsed = this.parseBooleanLike(parsed);
                    if (typeof fromParsed === 'boolean') return fromParsed;

                    const fromObject = this.parseHasAcceptedFromObject(parsed);
                    if (typeof fromObject === 'boolean') return fromObject;

                    // Sometimes the API double-encodes booleans: "true" inside JSON
                    if (typeof parsed === 'string') {
                        const fromParsedString = this.parseBooleanLike(parsed);
                        if (typeof fromParsedString === 'boolean') return fromParsedString;
                    }

                    throw { status: 400, message: 'No fue posible validar el consentimiento' };
                })
            );
    }

    accept(consentVersion?: string | null): Observable<void> {
        // Backend: POST /api/consent/accept -> AcceptConsentDto { accepted: bool, consentVersion: string }
        const version = (consentVersion ?? environment.version ?? '').trim();

        // Some deployments may respond as text/plain or an empty body; avoid JSON parse errors.
        return this.http
            .post(`${this.apiUrl}/consent/accept`, {
                accepted: true,
                // The deployed backend expects "version" (not "consentVersion")
                version: version || '1.0',
            }, { responseType: 'text' })
            .pipe(
                map((raw) => {
                    const text = String(raw ?? '').trim();
                    if (!text) return undefined;

                    // If backend returns a JSON wrapper as text, honor success/errors.
                    try {
                        const parsed = JSON.parse(text) as unknown;
                        if (parsed && typeof parsed === 'object') {
                            const wrapped = parsed as ApiResponseShape<unknown>;
                            if (typeof wrapped.success === 'boolean' && !wrapped.success) {
                                throw {
                                    status: 400,
                                    message: wrapped.message || 'No fue posible aceptar el consentimiento',
                                    errors: wrapped.errors,
                                };
                            }
                        }
                    } catch {
                        // Non-JSON text; treat as success.
                    }

                    return undefined;
                })
            );
    }
}
