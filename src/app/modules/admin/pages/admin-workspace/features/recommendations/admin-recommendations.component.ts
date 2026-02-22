import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import { AlertService } from 'app/core/swal/sweet-alert.service';
import { AdminUsersService, AdminUserListItemDto } from '../../../../../../core/services/admin-users.service';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface RecommendationDto {
    recommendationID?: number;
    evaluationResultID?: number;
    recommendationTypeID?: number;
    instrumentID?: number | null;
    title?: string | null;
    description?: string | null;
    priority?: string | null;
    resourceUrl?: string | null;
    isViewed?: boolean;
    createdAt?: string | null;
    // extra info joined
    userName?: string | null;
    instrumentName?: string | null;
}

export interface CreateRecommendationPayload {
    evaluationResultID: number;
    recommendationTypeID: number;
    instrumentID?: number | null;
    title: string;
    description?: string;
    priority?: string;
    resourceUrl?: string;
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
}

@Component({
    selector: 'app-admin-recommendations',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './admin-recommendations.component.html',
    styleUrls: ['./admin-recommendations.component.scss'],
})
export class AdminRecommendationsComponent implements OnInit {
    private readonly apiUrl = environment.apiUrl;

    loading = false;
    saving = false;
    search = '';
    filterPriority = '';
    filterUser = 0;

    recommendations: RecommendationDto[] = [];
    filteredRecs: RecommendationDto[] = [];
    users: AdminUserListItemDto[] = [];

    // For viewing by user
    selectedUserId = 0;
    userRecommendations: RecommendationDto[] = [];
    loadingUserRecs = false;

    // Create form
    showCreateForm = false;
    form: Partial<CreateRecommendationPayload> = this.emptyForm();

    // Result lookup for creating
    lookupResultId = 0;
    lookupResults: EvaluationResultDto[] = [];
    loadingResults = false;

    priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    recTypes = [
        { id: 1, name: 'Psicológica' },
        { id: 2, name: 'Bienestar' },
        { id: 3, name: 'Médica' },
        { id: 4, name: 'Social' },
    ];

    constructor(
        private readonly http: HttpClient,
        private readonly usersService: AdminUsersService,
        private readonly notify: AlertService,
    ) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.loading = true;
        this.usersService.listUsers().pipe(
            catchError(() => of([])),
            finalize(() => this.loading = false)
        ).subscribe(users => {
            this.users = users;
        });
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

    loadRecommendationsForUser(): void {
        if (!this.selectedUserId) return;
        this.loadingUserRecs = true;
        // Load user evaluations first, then get results, then get recommendations
        this.http.get<unknown>(`${this.apiUrl}/evaluation/results/user/${this.selectedUserId}`).pipe(
            map(r => this.unwrap<EvaluationResultDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingUserRecs = false)
        ).subscribe(results => {
            this.lookupResults = results;
            // Load recommendations for each result
            if (results.length === 0) {
                this.userRecommendations = [];
                return;
            }
            const resultId = results[0]?.evaluationResultID ?? results[0]?.resultID;
            if (!resultId) {
                this.userRecommendations = [];
                return;
            }
            this.loadRecommendationsByResult(resultId);
        });
    }

    loadRecommendationsByResult(resultId: number): void {
        this.loadingUserRecs = true;
        this.http.get<unknown>(`${this.apiUrl}/recommendation/by-result/${resultId}`).pipe(
            map(r => this.unwrap<RecommendationDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingUserRecs = false)
        ).subscribe(recs => {
            this.userRecommendations = recs;
        });
    }

    loadActiveRecommendationsForUser(userId: number): void {
        this.loadingUserRecs = true;
        this.http.get<unknown>(`${this.apiUrl}/recommendation/active/${userId}`).pipe(
            map(r => this.unwrap<RecommendationDto>(r)),
            catchError(() => of([])),
            finalize(() => this.loadingUserRecs = false)
        ).subscribe(recs => {
            this.userRecommendations = recs;
        });
    }

    openCreate(): void {
        this.form = this.emptyForm();
        this.showCreateForm = true;
    }

    saveRecommendation(): void {
        if (!this.form.evaluationResultID || !this.form.recommendationTypeID || !this.form.title) {
            this.notify.warning('Completa los campos obligatorios', '');
            return;
        }
        this.saving = true;
        this.http.post<unknown>(`${this.apiUrl}/recommendation`, this.form).pipe(
            map(r => this.unwrapOne<RecommendationDto>(r)),
            finalize(() => this.saving = false)
        ).subscribe({
            next: () => {
                this.showCreateForm = false;
                this.notify.success('Recomendación creada', '');
                if (this.selectedUserId) {
                    this.loadRecommendationsForUser();
                }
            },
            error: () => this.notify.error('Error al crear recomendación', ''),
        });
    }

    getUserName(userId: number): string {
        return this.users.find(u => u.userId === userId)?.fullName ?? `Usuario #${userId}`;
    }

    priorityColor(p: string | null | undefined): string {
        const map: Record<string, string> = {
            LOW: 'badge--gray', MEDIUM: 'badge--blue', HIGH: 'badge--orange', URGENT: 'badge--red',
        };
        return map[p ?? ''] ?? 'badge--gray';
    }

    private emptyForm(): Partial<CreateRecommendationPayload> {
        return {
            evaluationResultID: 0,
            recommendationTypeID: 1,
            instrumentID: null,
            title: '',
            description: '',
            priority: 'MEDIUM',
            resourceUrl: '',
        };
    }
}
