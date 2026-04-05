import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import {
    PsychosocialDataSheetService,
    GeneralDataCatalogsDto,
    DataSheetDto,
} from 'app/core/services/psychosocial-data-sheet.service';
import { UsersService } from 'app/core/services/users.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-general-data',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './general-data.component.html',
    styleUrl: './general-data.component.scss',
})
export class GeneralDataComponent implements OnInit {
    form!: FormGroup;
    catalogs: GeneralDataCatalogsDto | null = null;
    savedDataSheet: DataSheetDto | null = null;

    loading = signal(false);
    submitting = signal(false);
    error = signal<string | null>(null);

    /** Controls the visibility of the clarification block */
    clarificationExpanded = false;

    /** Special situations — multi-select stored as array */
    selectedSituations: string[] = [];

    /** Age calculated in real time from the birth date */
    calculatedAge: number | null = null;

    /** Maximum allowed birth date: Dec 31, 2012 */
    readonly maxBirthDate = '2012-12-31';

    private _maxBirthDateValidator() {
        return (control: AbstractControl) => {
            if (!control.value) return null;
            const selected = new Date(control.value);
            const max = new Date('2012-12-31');
            return selected > max ? { birthDateMax: true } : null;
        };
    }

    /** Job type options (Q21) that map to Form A */
    readonly JOB_TYPE_FORM_A = [
        'Jefatura - tiene personal a cargo',
        'Profesional, analista, técnico, tecnólogo',
    ];

    constructor(
        private readonly fb: FormBuilder,
        private readonly dataSheetService: PsychosocialDataSheetService,
        private readonly usersService: UsersService,
        private readonly router: Router,
    ) { }

    ngOnInit(): void {
        this._buildForm();
        this._loadCatalogsAndProfile();
    }

    private _buildForm(): void {
        this.form = this.fb.group({
            // Q1
            birthDate: [null, [Validators.required, this._maxBirthDateValidator()]],
            // Q3 — display only, not editable
            sex: [{ value: '', disabled: true }],

            // Q4-Q8 — Clarification block (optional)
            genderIdentity: [null],
            ethnicGroup: [null],
            disability: [null],
            disabilityDetail: [null],
            exclusiveCaregiver: [null],
            // specialSituation handled separately via selectedSituations[]

            // Q9-Q15 — Sociodemographic (required)
            maritalStatus: [null, Validators.required],
            educationLevel: [null, Validators.required],
            profession: [null, Validators.required],
            residenceCity: [null, Validators.required],
            residenceState: [null, Validators.required],
            stratum: [null, Validators.required],
            housingType: [null, Validators.required],
            dependents: [null, [Validators.required, Validators.min(0), Validators.max(20)]],

            // Q16-Q26 — Occupational
            workState: [null, Validators.required],
            jobRole: [null, Validators.required],
            positionType: [null, Validators.required],
            positionSeniorityType: [null, Validators.required],  // 'menosAnio' | 'masAnio'
            positionSeniorityYears: [null],
            roleSeniorityType: [null, Validators.required],
            roleSeniorityYears: [null],
            contractType: [null, Validators.required],
            salaryType: [null, Validators.required],
            dailyWorkHours: [null, Validators.required],

            // Q16a, Q17, Q18, Q19 — user-filled
            workCity: [null, Validators.required],
            companySeniorityType: [null, Validators.required],  // 'menosAnio' | 'masAnio'
            companySeniorityYears: [null],
            areaName: [null, Validators.required],
            jobTitle: [null, Validators.required],
        });

        // Clear disability detail when switching away from "Sí"
        this.form.get('disability')!.valueChanges.subscribe((v) => {
            if (v !== 'Sí') {
                this.form.get('disabilityDetail')!.setValue(null);
            }
        });

        // Recalculate age whenever birth date changes
        this.form.get('birthDate')!.valueChanges.subscribe((v) => {
            this.calculatedAge = v ? this._calculateAge(v) : null;
        });

        // Q17 — company seniority
        this.form.get('companySeniorityType')!.valueChanges.subscribe((tipo) => {
            const yearsCtrl = this.form.get('companySeniorityYears')!;
            if (tipo === 'masAnio') {
                yearsCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
                yearsCtrl.updateValueAndValidity();
            } else {
                yearsCtrl.clearValidators();
                yearsCtrl.setValue(null);
                yearsCtrl.setErrors(null);
            }
        });

        // Q22 — position seniority
        this.form.get('positionSeniorityType')!.valueChanges.subscribe((tipo) => {
            const yearsCtrl = this.form.get('positionSeniorityYears')!;
            if (tipo === 'masAnio') {
                yearsCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
                yearsCtrl.updateValueAndValidity();
            } else {
                yearsCtrl.clearValidators();
                yearsCtrl.setValue(null);
                yearsCtrl.setErrors(null);
            }
        });

        // Q23 — role seniority
        this.form.get('roleSeniorityType')!.valueChanges.subscribe((tipo) => {
            const yearsCtrl = this.form.get('roleSeniorityYears')!;
            if (tipo === 'masAnio') {
                yearsCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
                yearsCtrl.updateValueAndValidity();
            } else {
                yearsCtrl.clearValidators();
                yearsCtrl.setValue(null);
                yearsCtrl.setErrors(null);
            }
        });
    }

    _loadCatalogsAndProfile(): void {
        this.loading.set(true);
        this.error.set(null);

        const period = this.dataSheetService.getCurrentPeriod();

        this.dataSheetService.getCatalogs().pipe(take(1)).subscribe({
            next: (catalogs) => {
                this.catalogs = catalogs;
                this._loadUserProfile(period);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('No se pudieron cargar los catálogos. Por favor inténtalo de nuevo.');
            },
        });
    }

    private _loadUserProfile(period: string): void {
        this.usersService.getMyProfile().pipe(take(1)).subscribe({
            next: (profile) => {
                const sex = profile.gender === 'M' ? 'Masculino'
                    : profile.gender === 'F' ? 'Femenino' : (profile.gender ? 'Otro' : '');
                const birthDate = profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
                    : null;

                this.form.patchValue({
                    sex,
                    birthDate,
                });

                if (birthDate) {
                    this.calculatedAge = this._calculateAge(birthDate);
                }

                // Try to pre-fill from an existing data sheet for this period
                this.dataSheetService.getDataSheet(period).pipe(take(1)).subscribe({
                    next: (dataSheet) => {
                        this.savedDataSheet = dataSheet;
                        this._patchFromDataSheet(dataSheet);
                        this.loading.set(false);
                    },
                    error: () => {
                        // 404 = no saved data sheet yet — valid initial state
                        this.loading.set(false);
                    },
                });
            },
            error: () => {
                this.loading.set(false);
                this.error.set('No se pudo cargar tu perfil.');
            },
        });
    }

    private _patchFromDataSheet(dataSheet: DataSheetDto): void {
        this.form.patchValue({
            birthDate: dataSheet.fechaNacimiento ?? null,
            genderIdentity: dataSheet.identidadGenero ?? null,
            ethnicGroup: dataSheet.grupoEtnico ?? null,
            disability: dataSheet.discapacidad ?? null,
            disabilityDetail: dataSheet.discapacidadDetalle ?? null,
            exclusiveCaregiver: dataSheet.cuidadorExclusivo?.trim() ?? null,
            maritalStatus: dataSheet.estadoCivil,
            educationLevel: dataSheet.nivelEducacion,
            profession: dataSheet.profesion ?? null,
            residenceCity: dataSheet.lugarResidenciaCiudad ?? null,
            residenceState: dataSheet.lugarResidenciaDepartamento ?? null,
            stratum: dataSheet.estrato,
            housingType: dataSheet.tipoVivienda,
            dependents: dataSheet.personasACargo,
            workState: dataSheet.lugarTrabajoDepartamento ?? null,
            jobRole: dataSheet.nombreOficio ?? null,
            positionType: dataSheet.tipoCargo ?? null,
        });

        // Restore Q22 position seniority
        const posSeniority = dataSheet.antiguedadCargo;
        if (posSeniority === 0) {
            this.form.patchValue({ positionSeniorityType: 'menosAnio', positionSeniorityYears: null });
        } else if (posSeniority) {
            this.form.patchValue({ positionSeniorityType: 'masAnio', positionSeniorityYears: posSeniority });
        }

        // Restore Q23 role seniority
        const roleSeniority = dataSheet.antiguedadOficio;
        if (roleSeniority === 0) {
            this.form.patchValue({ roleSeniorityType: 'menosAnio', roleSeniorityYears: null });
        } else if (roleSeniority) {
            this.form.patchValue({ roleSeniorityType: 'masAnio', roleSeniorityYears: roleSeniority });
        }

        this.form.patchValue({
            contractType: dataSheet.tipoContrato,
            salaryType: dataSheet.tipoSalario ?? null,
            dailyWorkHours: String(dataSheet.horasLaboralesDiarias),
            workCity: dataSheet.ciudadTrabajo ?? null,
            areaName: dataSheet.areaNombre ?? null,
            jobTitle: dataSheet.nombreCargo ?? null,
        });

        // Restore Q17 company seniority
        const companySeniority = dataSheet.antiguedadEmpresa;
        if (companySeniority !== null && companySeniority !== undefined) {
            if (companySeniority === 0) {
                this.form.patchValue({ companySeniorityType: 'menosAnio', companySeniorityYears: null });
            } else {
                this.form.patchValue({ companySeniorityType: 'masAnio', companySeniorityYears: companySeniority });
            }
        }

        // Special situations: CSV → array
        if (dataSheet.situacionEspecial) {
            this.selectedSituations = dataSheet.situacionEspecial.split(',').map(s => s.trim());
        }

        if (dataSheet.fechaNacimiento) {
            this.calculatedAge = this._calculateAge(dataSheet.fechaNacimiento);
        }
    }

    // ── Special situations — multi-select ─────────────────────────────────────

    toggleSituation(option: string): void {
        const idx = this.selectedSituations.indexOf(option);
        if (option === 'Ninguna de las anteriores') {
            this.selectedSituations = idx >= 0 ? [] : ['Ninguna de las anteriores'];
            return;
        }
        this.selectedSituations = this.selectedSituations.filter(s => s !== 'Ninguna de las anteriores');
        if (idx >= 0) {
            this.selectedSituations.splice(idx, 1);
        } else {
            this.selectedSituations.push(option);
        }
    }

    isSituationSelected(option: string): boolean {
        return this.selectedSituations.includes(option);
    }

    // ── Age calculation ───────────────────────────────────────────────────────

    private _calculateAge(dateStr: string): number {
        const today = new Date();
        const birth = new Date(dateStr);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    // ── Detected psychosocial form (A or B) from Q21 ─────────────────────────

    get detectedForm(): 'A' | 'B' | null {
        const jobType = this.form.get('positionType')?.value;
        if (!jobType) return null;
        return this.JOB_TYPE_FORM_A.includes(jobType) ? 'A' : 'B';
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    /** Ensures the years sub-fields have the correct validators at submit time.
     *  Called just before form validity is checked so edge cases
     *  (load-existing + change radio) cannot leave stale validators behind.
     */
    private _syncSeniorityValidators(): void {
        const pairs: Array<[string, string]> = [
            ['companySeniorityType', 'companySeniorityYears'],
            ['positionSeniorityType', 'positionSeniorityYears'],
            ['roleSeniorityType', 'roleSeniorityYears'],
        ];
        for (const [typeKey, yearsKey] of pairs) {
            const type = this.form.get(typeKey)?.value;
            const yearsCtrl = this.form.get(yearsKey)!;
            if (type === 'masAnio') {
                yearsCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
                yearsCtrl.updateValueAndValidity({ emitEvent: false });
            } else {
                // clearValidators removes the validator function but Angular may still
                // have cached errors from a previous masAnio state. setErrors(null)
                // force-clears those cached errors so the control (and parent form)
                // is immediately marked VALID for this field.
                yearsCtrl.clearValidators();
                yearsCtrl.setValue(null, { emitEvent: false });
                yearsCtrl.setErrors(null);  // ← key: bypasses stale cached validation errors
            }
        }
    }

    onSubmit(): void {
        // Re-apply conditional validators before validating the form.
        this._syncSeniorityValidators();

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            // Log which controls are invalid to diagnose the issue
            const invalidControls = Object.entries(this.form.controls)
                .filter(([, ctrl]) => ctrl.invalid)
                .map(([name]) => name);
            console.warn('[GeneralData] Form invalid — controls:', invalidControls);
            return;
        }

        this.submitting.set(true);
        this.error.set(null);

        const v = this.form.getRawValue();
        const period = this.dataSheetService.getCurrentPeriod();

        const payload = {
            period,
            // Form controls (English) mapped to backend DTO fields (Spanish contract)
            fechaNacimiento: v.birthDate ?? null,
            identidadGenero: v.genderIdentity ?? null,
            grupoEtnico: v.ethnicGroup ?? null,
            discapacidad: v.disability ?? null,
            discapacidadDetalle: v.disabilityDetail ?? null,
            cuidadorExclusivo: v.exclusiveCaregiver ?? null,
            situacionEspecial: this.selectedSituations.length > 0
                ? this.selectedSituations.join(',')
                : null,
            estadoCivil: v.maritalStatus,
            nivelEducacion: v.educationLevel,
            profesion: v.profession ?? null,
            lugarResidenciaCiudad: v.residenceCity ?? null,
            lugarResidenciaDepartamento: v.residenceState ?? null,
            estrato: v.stratum,
            tipoVivienda: v.housingType,
            personasACargo: Number(v.dependents),
            lugarTrabajoDepartamento: v.workState ?? null,
            nombreOficio: v.jobRole ?? null,
            tipoCargo: v.positionType ?? null,
            antiguedadCargo: v.positionSeniorityType === 'menosAnio' ? 0 : (v.positionSeniorityYears ? Number(v.positionSeniorityYears) : null),
            antiguedadOficio: v.roleSeniorityType === 'menosAnio' ? 0 : (v.roleSeniorityYears ? Number(v.roleSeniorityYears) : null),
            tipoContrato: v.contractType,
            tipoSalario: v.salaryType ?? null,
            horasLaboralesDiarias: Number(v.dailyWorkHours),
            ciudadTrabajo: v.workCity ?? null,
            antiguedadEmpresa: v.companySeniorityType === 'menosAnio' ? 0 : (v.companySeniorityYears ? Number(v.companySeniorityYears) : null),
            areaNombre: v.areaName ?? null,
            nombreCargo: v.jobTitle ?? null,
        };

        this.dataSheetService.saveDataSheet(payload).pipe(take(1)).subscribe({
            next: () => {
                this.submitting.set(false);
                Swal.fire({
                    icon: 'success',
                    title: '¡Ficha guardada exitosamente!',
                    text: 'Tus datos han sido registrados correctamente. Ya puedes realizar los cuestionarios del módulo de riesgo psicosocial.',
                    confirmButtonText: 'Ir a cuestionarios',
                    confirmButtonColor: '#3085d6',
                    showCancelButton: true,
                    cancelButtonText: 'Cerrar',
                    cancelButtonColor: '#6c757d',
                }).then(() => {
                    this.router.navigate(['/psychosocial-risk']);
                });
            },
            error: (e) => {
                this.submitting.set(false);
                const msg = e?.error?.message || e?.error?.title || 'Error al guardar la ficha. Por favor inténtalo de nuevo.';
                this.error.set(msg);
            },
        });
    }

    onCancel(): void {
        this.router.navigate(['/psychosocial-risk']);
    }

    // ── Template validation helpers ───────────────────────────────────────────

    isInvalid(name: string): boolean {
        const ctrl = this.form.get(name);
        return !!(ctrl && ctrl.invalid && ctrl.touched);
    }

    ctrl(name: string): AbstractControl {
        return this.form.get(name)!;
    }
}
