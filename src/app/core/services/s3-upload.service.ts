import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type S3Folder = 'recursos/videos' | 'recursos/audios' | 'recursos/articles' | 'recursos/images' | 'thumbs' | 'avatars';

export interface S3UploadResult {
    /** URL pública del archivo subido */
    url: string;
    /** Key (ruta) dentro del bucket */
    key: string;
}

/**
 * Servicio para subir archivos directamente a AWS S3.
 *
 * El bucket `emocheck-storage` es público (ACL: public-read).
 * Se usa Signature Version 4 (AWS4-HMAC-SHA256) para autenticar el PUT.
 *
 * Estructura en S3:
 *   recursos/videos/   → contentUrl de tipo VIDEO
 *   recursos/audios/   → contentUrl de tipo AUDIO
 *   recursos/articles/ → contentUrl de tipo ARTICLE (PDF, etc.)
 *   thumbs/            → thumbnailUrl de todos los recursos
 */
@Injectable({ providedIn: 'root' })
export class S3UploadService {
    private readonly bucket = environment.awsBucket;
    private readonly region = environment.awsRegion;
    private readonly baseUrl = environment.awsS3BaseUrl;
    private readonly accessKeyId = environment.awsAccessKeyId;
    private readonly secretAccessKey = environment.awsSecretAccessKey;

    constructor(private readonly http: HttpClient) { }

    /**
     * Sube un archivo a S3 y devuelve la URL pública resultante.
     *
     * @param file     Archivo a subir
     * @param folder   Carpeta destino en el bucket
     * @param fileName Nombre del archivo (sin incluir la carpeta). Si se omite, se genera uno único.
     */
    upload(file: File, folder: S3Folder, fileName?: string): Observable<S3UploadResult> {
        if (!file) {
            return throwError(() => new Error('No se proporcionó ningún archivo.'));
        }

        const ext = this.getExtension(file.name);
        const key = `${folder}/${fileName ?? this.generateKey(ext)}`;
        const url = `${this.baseUrl}/${key}`;

        return from(this.buildAuthHeaders(file, key)).pipe(
            switchMap((headers) =>
                this.http.put(url, file, {
                    headers,
                    responseType: 'text',
                })
            ),
            map(() => ({ url, key })),
            catchError((err) => {
                const msg =
                    err?.error?.trim?.() ||
                    err?.message ||
                    'Error al subir el archivo a S3.';
                return throwError(() => new Error(msg));
            })
        );
    }

    /**
     * Construye los headers de autenticación AWS Signature V4 para un PUT directo a S3.
     * Dado que el bucket es público, también funciona con una firma pre-construida.
     */
    private async buildAuthHeaders(file: File, key: string): Promise<HttpHeaders> {
        const now = new Date();
        const amzDate = this.formatAmzDate(now);         // yyyyMMddTHHmmssZ
        const dateStamp = amzDate.substring(0, 8);       // yyyyMMdd

        const contentType = file.type || 'application/octet-stream';
        const payloadHash = await this.sha256Hex(await file.arrayBuffer());

        const canonicalHeaders =
            `content-type:${contentType}\n` +
            `host:${this.bucket}.s3.${this.region}.amazonaws.com\n` +
            `x-amz-content-sha256:${payloadHash}\n` +
            `x-amz-date:${amzDate}\n`;

        const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

        const canonicalRequest = [
            'PUT',
            `/${key}`,
            '',
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join('\n');

        const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            await this.sha256Hex(new TextEncoder().encode(canonicalRequest).buffer as ArrayBuffer),
        ].join('\n');

        const signingKey = await this.buildSigningKey(dateStamp);
        const signature = await this.hmacHex(signingKey, stringToSign);

        const authorization =
            `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, ` +
            `SignedHeaders=${signedHeaders}, ` +
            `Signature=${signature}`;

        return new HttpHeaders({
            'Content-Type': contentType,
            'x-amz-date': amzDate,
            'x-amz-content-sha256': payloadHash,
            'Authorization': authorization,
        });
    }

    private async buildSigningKey(dateStamp: string): Promise<CryptoKey> {
        // Derivamos la clave paso a paso usando HMAC sobre los bytes de la clave anterior.
        // Nunca exportamos una CryptoKey — usamos sign() para obtener los bytes intermedios
        // y luego importamos esos bytes como nueva clave (extractable: false es incompatible
        // con exportKey, de ahí el error "key is not extractable").
        const kDate    = await this.deriveHmacKey(new TextEncoder().encode(`AWS4${this.secretAccessKey}`), dateStamp);
        const kRegion  = await this.deriveHmacKey(kDate, this.region);
        const kService = await this.deriveHmacKey(kRegion, 's3');
        return this.deriveHmacKey(kService, 'aws4_request');
    }

    /**
     * Deriva una nueva CryptoKey HMAC-SHA256 firmando `data` con `key`.
     * - Si `key` es un ArrayBuffer/Uint8Array, se importa directamente como material de clave.
     * - Si `key` es una CryptoKey, se usa sign() para obtener los bytes del HMAC
     *   (sin necesidad de exportar la clave, lo que requeriría extractable:true).
     */
    private async deriveHmacKey(key: CryptoKey | ArrayBuffer | Uint8Array, data: string): Promise<CryptoKey> {
        let keyBytes: ArrayBuffer;

        if (key instanceof CryptoKey) {
            // Usamos sign() sobre un input vacío-equivalente para extraer los bytes HMAC derivados.
            // El material de la nueva clave son los bytes HMAC(key, data).
            keyBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
            // Los bytes resultantes son el material de la próxima clave
            return crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
        } else {
            // key ya es raw bytes (primera iteración con el secret)
            const rawBytes: ArrayBuffer = key instanceof Uint8Array
                ? key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer
                : key as ArrayBuffer;
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                rawBytes,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            const signedBytes = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
            return crypto.subtle.importKey(
                'raw',
                signedBytes,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
        }
    }

    private async hmacHex(key: CryptoKey, data: string): Promise<string> {
        const sig = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(data)
        );
        return this.bufToHex(sig);
    }

    private async sha256Hex(data: ArrayBuffer): Promise<string> {
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.bufToHex(hash);
    }

    private bufToHex(buffer: ArrayBuffer): string {
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private formatAmzDate(date: Date): string {
        return date.toISOString().replace(/[:\-]|\.\d{3}/g, '').replace('Z', 'Z').slice(0, 16) + '00Z';
    }

    private getExtension(filename: string): string {
        const parts = (filename ?? '').split('.');
        return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
    }

    private generateKey(ext: string): string {
        const ts = Date.now();
        const rand = Math.random().toString(36).substring(2, 8);
        return `${ts}-${rand}${ext}`;
    }
}
