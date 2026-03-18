import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { AdminUsersService, AdminUserListItemDto } from '../../../../../../core/services/admin-users.service';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface EvaluationDto {
    evaluationID?: number;
    userID?: number;
    userFullName?: string | null;
    userName?: string | null;
    moduleID?: number;
    moduleName?: string | null;
    instrumentID?: number;
    instrumentCode?: string | null;
    instrumentName?: string | null;
    status?: string | null;
    isAnonymous?: boolean;
    period?: string | null;
    // Resultado plano (confirmado por backend V5)
    totalScore?: number | null;
    percentageScore?: number | null;
    riskLevel?: string | null;
    // Org
    companyID?: number;
    siteID?: number;
    areaID?: number;
    // Tiempos
    startedAt?: string | null;
    completedAt?: string | null;
    durationSeconds?: number | null;
    totalQuestions?: number;
    answeredQuestions?: number;
    // Respuestas embebidas
    responses?: ResponseDto[];
}

export interface EvaluationResultDto {
    evaluationResultID?: number;
    resultID?: number;
    evaluationID?: number;
    userID?: number;
    userName?: string | null;
    moduleID?: number;
    moduleName?: string | null;
    instrumentName?: string | null;
    totalScore?: number;
    scorePercentage?: number;
    riskLevel?: string | null;
    completedAt?: string | null;
    instrumentResults?: InstrumentResultDto[];
}

export interface InstrumentResultDto {
    instrumentID?: number;
    instrumentName?: string | null;
    score?: number;
    riskLevel?: string | null;
}

export interface EvaluationDetailDto {
    evaluationID?: number;
    status?: string;
    responses?: ResponseDto[];
}

export interface ResponseDto {
    evaluationResponseID?: number;
    evaluationID?: number;
    questionID?: number;
    questionText?: string | null;
    selectedValue?: number;
    calculatedValue?: number;
    respondedAt?: string | null;
}

@Component({
    selector: 'app-admin-evaluations',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-evaluations.component.html',
    styleUrls: ['./admin-evaluations.component.scss'],
})
export class AdminEvaluationsComponent implements OnInit {
    private readonly apiUrl = environment.apiUrl;

    loadingUsers = false;
    loadingEvals = false;
    loadingDetail = false;

    users: AdminUserListItemDto[] = [];
    selectedUserId = 0;
    userSearch = '';

    evaluations: EvaluationDto[] = [];

    selectedEvaluationId: number | null = null;
    evaluationDetail: EvaluationDetailDto | null = null;

    constructor(
        private readonly http: HttpClient,
        private readonly usersService: AdminUsersService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.loadingUsers = true;
        this.usersService.listUsers().pipe(
            catchError(() => of([])),
            finalize(() => this.loadingUsers = false)
        ).subscribe(u => this.users = u);
    }

    private unwrap<T>(res: unknown): T[] {
        if (Array.isArray(res)) return res as T[];
        const r = res as any;
        if (r && 'data' in r) return Array.isArray(r.data) ? r.data : [];
        return [];
    }

    private unwrapOne<T>(res: unknown): T {
        const r = res as any;
        if (r && 'data' in r) return r.data as T;
        return res as T;
    }

    get filteredUsers(): AdminUserListItemDto[] {
        if (!this.userSearch) return this.users;
        const q = this.userSearch.toLowerCase();
        return this.users.filter(u =>
            u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }

    selectUser(userId: number): void {
        this.selectedUserId = userId;
        this.evaluations = [];
        this.evaluationDetail = null;
        this.selectedEvaluationId = null;
        this.loadEvaluations();
    }

    loadEvaluations(): void {
        if (!this.selectedUserId) return;
        this.loadingEvals = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/user/${this.selectedUserId}`).pipe(
            map(r => this.unwrap<EvaluationDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingEvals = false)
        ).subscribe(evals => {
            this.evaluations = evals;
        });
    }

    viewDetail(evaluationId: number): void {
        const cached = this.evaluations.find(e => e.evaluationID === evaluationId);
        if (cached?.responses && cached.responses.length > 0) {
            this.selectedEvaluationId = evaluationId;
            this.evaluationDetail = { evaluationID: evaluationId, status: cached.status ?? undefined, responses: cached.responses };
            return;
        }
        this.selectedEvaluationId = evaluationId;
        this.loadingDetail = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/${evaluationId}/details`).pipe(
            map(r => this.unwrapOne<EvaluationDetailDto>(r)),
            catchError(() => of(null)),
            finalize(() => this.loadingDetail = false)
        ).subscribe(detail => this.evaluationDetail = detail);
    }

    closeDetail(): void {
        this.evaluationDetail = null;
        this.selectedEvaluationId = null;
    }

    selectedUserName(): string {
        return this.users.find(u => u.userId === this.selectedUserId)?.fullName ?? '';
    }

    riskColor(level: string | null | undefined): string {
        const map: Record<string, string> = {
            LOW: 'badge--green', MODERATE: 'badge--yellow', HIGH: 'badge--orange', SEVERE: 'badge--red',
            GREEN: 'badge--green', YELLOW: 'badge--yellow', RED: 'badge--red',
        };
        return map[(level ?? '').toUpperCase()] ?? 'badge--gray';
    }

    riskLabel(level: string | null | undefined): string {
        const map: Record<string, string> = {
            LOW: 'Bajo', GREEN: 'Bajo',
            MODERATE: 'Moderado', MEDIUM: 'Moderado', YELLOW: 'Moderado',
            HIGH: 'Alto', RED: 'Alto',
            SEVERE: 'Severo',
        };
        return map[(level ?? '').toUpperCase()] ?? (level || 'N/A');
    }

    statusColor(status: string | null | undefined): string {
        const map: Record<string, string> = {
            COMPLETED: 'badge--green', IN_PROGRESS: 'badge--blue', PENDING: 'badge--gray',
        };
        return map[(status ?? '').toUpperCase()] ?? 'badge--gray';
    }
}
