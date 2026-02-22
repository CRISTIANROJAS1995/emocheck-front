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
    userName?: string | null;
    moduleID?: number;
    moduleName?: string | null;
    status?: string | null;
    isAnonymous?: boolean;
    period?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
}

export interface EvaluationResultDto {
    evaluationResultID?: number;
    resultID?: number;
    evaluationID?: number;
    userID?: number;
    userName?: string | null;
    moduleID?: number;
    moduleName?: string | null;
    totalScore?: number;
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
    questionID?: number;
    questionText?: string | null;
    selectedValue?: number;
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
    loadingResults = false;
    loadingDetail = false;

    users: AdminUserListItemDto[] = [];
    selectedUserId = 0;
    userSearch = '';

    evaluations: EvaluationDto[] = [];
    results: EvaluationResultDto[] = [];

    selectedEvaluationId: number | null = null;
    evaluationDetail: EvaluationDetailDto | null = null;

    selectedResultId: number | null = null;
    selectedResult: EvaluationResultDto | null = null;

    activeView: 'evaluations' | 'results' = 'evaluations';

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
        this.results = [];
        this.evaluationDetail = null;
        this.selectedEvaluationId = null;
        this.selectedResultId = null;
        this.selectedResult = null;
        this.loadEvaluations();
        this.loadResults();
    }

    loadEvaluations(): void {
        if (!this.selectedUserId) return;
        this.loadingEvals = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/user/${this.selectedUserId}`).pipe(
            map(r => this.unwrap<EvaluationDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingEvals = false)
        ).subscribe(evals => this.evaluations = evals);
    }

    loadResults(): void {
        if (!this.selectedUserId) return;
        this.loadingResults = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/results/user/${this.selectedUserId}`).pipe(
            map(r => this.unwrap<EvaluationResultDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingResults = false)
        ).subscribe(results => this.results = results);
    }

    viewDetail(evaluationId: number): void {
        this.selectedEvaluationId = evaluationId;
        this.loadingDetail = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/${evaluationId}/details`).pipe(
            map(r => this.unwrapOne<EvaluationDetailDto>(r)),
            catchError(() => of(null)),
            finalize(() => this.loadingDetail = false)
        ).subscribe(detail => this.evaluationDetail = detail);
    }

    viewResult(r: EvaluationResultDto): void {
        const resultId = r.evaluationResultID ?? r.resultID;
        if (!resultId) return;
        this.selectedResultId = resultId;
        this.selectedResult = r;
        this.loadingDetail = true;
        this.http.get<unknown>(`${this.apiUrl}/evaluation/results/${resultId}`).pipe(
            map(res => this.unwrapOne<EvaluationResultDto>(res)),
            catchError(() => of(r)),
            finalize(() => this.loadingDetail = false)
        ).subscribe(result => this.selectedResult = result);
    }

    closeDetail(): void {
        this.evaluationDetail = null;
        this.selectedEvaluationId = null;
        this.selectedResult = null;
        this.selectedResultId = null;
    }

    selectedUserName(): string {
        return this.users.find(u => u.userId === this.selectedUserId)?.fullName ?? '';
    }

    riskColor(level: string | null | undefined): string {
        const map: Record<string, string> = {
            LOW: 'badge--green', MODERATE: 'badge--yellow', HIGH: 'badge--orange', SEVERE: 'badge--red',
        };
        return map[(level ?? '').toUpperCase()] ?? 'badge--gray';
    }

    statusColor(status: string | null | undefined): string {
        const map: Record<string, string> = {
            COMPLETED: 'badge--green', IN_PROGRESS: 'badge--blue', PENDING: 'badge--gray',
        };
        return map[(status ?? '').toUpperCase()] ?? 'badge--gray';
    }
}
