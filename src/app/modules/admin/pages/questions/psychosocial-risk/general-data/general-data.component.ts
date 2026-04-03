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
            fechaNacimiento: [null],
            // Q3 — display only, not editable
            sexo: [{ value: '', disabled: true }],

            // Q4-Q8 — Clarification block (optional)
            identidadGenero: [null],
            grupoEtnico: [null],
            discapacidad: [null],
            discapacidadDetalle: [null],
            cuidadorExclusivo: [null],
            // situacionEspecial handled separately via selectedSituations[]

            // Q9-Q15 — Sociodemographic (required)
            estadoCivil: [null, Validators.required],
            nivelEducacion: [null, Validators.required],
            profesion: [null],
            lugarResidenciaCiudad: [null],
            lugarResidenciaDepartamento: [null],
            estrato: [null, Validators.required],
            tipoVivienda: [null, Validators.required],
            personasACargo: [null, [Validators.required, Validators.min(0), Validators.max(20)]],

            // Q16-Q26 — Occupational
            lugarTrabajoDepartamento: [null],
            nombreOficio: [null],
            tipoCargo: [null, Validators.required],
            antiguedadCargoTipo: [null, Validators.required],  // 'menosAnio' | 'masAnio'
            antiguedadCargoAnios: [null],
            antiguedadOficioTipo: [null],                       // optional, same pattern
            antiguedadOficioAnios: [null],
            tipoContrato: [null, Validators.required],
            tipoSalario: [null],
            horasLaboralesDiarias: [null, Validators.required],

            // Q16a, Q17, Q18, Q19 — user-filled
            ciudadTrabajo: [null],
            antiguedadTipo: [null, Validators.required],  // 'menosAnio' | 'masAnio'
            antiguedadAnios: [null],                       // number of years (shown when masAnio)
            areaNombre: [null],
            nombreCargo: [null],
        });

        // Clear disability detail when switching away from "Sí"
        this.form.get('discapacidad')!.valueChanges.subscribe((v) => {
            if (v !== 'Sí') {
                this.form.get('discapacidadDetalle')!.setValue(null);
            }
        });

        // Recalculate age whenever birth date changes
        this.form.get('fechaNacimiento')!.valueChanges.subscribe((v) => {
            this.calculatedAge = v ? this._calculateAge(v) : null;
        });

        // Toggle required validator on antiguedadAnios based on selection
        this.form.get('antiguedadTipo')!.valueChanges.subscribe((tipo) => {
            const aniosCtrl = this.form.get('antiguedadAnios')!;
            if (tipo === 'masAnio') {
                aniosCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
            } else {
                aniosCtrl.clearValidators();
                aniosCtrl.setValue(null);
            }
            aniosCtrl.updateValueAndValidity();
        });

        // Q22 — cargo seniority
        this.form.get('antiguedadCargoTipo')!.valueChanges.subscribe((tipo) => {
            const aniosCtrl = this.form.get('antiguedadCargoAnios')!;
            if (tipo === 'masAnio') {
                aniosCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
            } else {
                aniosCtrl.clearValidators();
                aniosCtrl.setValue(null);
            }
            aniosCtrl.updateValueAndValidity();
        });

        // Q23 — oficio seniority
        this.form.get('antiguedadOficioTipo')!.valueChanges.subscribe((tipo) => {
            const aniosCtrl = this.form.get('antiguedadOficioAnios')!;
            if (tipo === 'masAnio') {
                aniosCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(99)]);
            } else {
                aniosCtrl.clearValidators();
                aniosCtrl.setValue(null);
            }
            aniosCtrl.updateValueAndValidity();
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
                const sexo = profile.gender === 'M' ? 'Masculino'
                    : profile.gender === 'F' ? 'Femenino' : (profile.gender ? 'Otro' : '');
                const birthDate = profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
                    : null;

                this.form.patchValue({
                    sexo,
                    fechaNacimiento: birthDate,
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
            fechaNacimiento: dataSheet.fechaNacimiento ?? null,
            identidadGenero: dataSheet.identidadGenero ?? null,
            grupoEtnico: dataSheet.grupoEtnico ?? null,
            discapacidad: dataSheet.discapacidad ?? null,
            discapacidadDetalle: dataSheet.discapacidadDetalle ?? null,
            cuidadorExclusivo: dataSheet.cuidadorExclusivo?.trim() ?? null,
            estadoCivil: dataSheet.estadoCivil,
            nivelEducacion: dataSheet.nivelEducacion,
            profesion: dataSheet.profesion ?? null,
            lugarResidenciaCiudad: dataSheet.lugarResidenciaCiudad ?? null,
            lugarResidenciaDepartamento: dataSheet.lugarResidenciaDepartamento ?? null,
            estrato: dataSheet.estrato,
            tipoVivienda: dataSheet.tipoVivienda,
            personasACargo: dataSheet.personasACargo,
            lugarTrabajoDepartamento: dataSheet.lugarTrabajoDepartamento ?? null,
            nombreOficio: dataSheet.nombreOficio ?? null,
            tipoCargo: dataSheet.tipoCargo ?? null,
        });

        // Restore Q22 cargo seniority
        const ac = dataSheet.antiguedadCargo;
        if (ac === 0) {
            this.form.patchValue({ antiguedadCargoTipo: 'menosAnio', antiguedadCargoAnios: null });
        } else if (ac) {
            this.form.patchValue({ antiguedadCargoTipo: 'masAnio', antiguedadCargoAnios: ac });
        }

        // Restore Q23 oficio seniority
        const ao = dataSheet.antiguedadOficio;
        if (ao === 0) {
            this.form.patchValue({ antiguedadOficioTipo: 'menosAnio', antiguedadOficioAnios: null });
        } else if (ao) {
            this.form.patchValue({ antiguedadOficioTipo: 'masAnio', antiguedadOficioAnios: ao });
        }

        this.form.patchValue({
            tipoContrato: dataSheet.tipoContrato,
            tipoSalario: dataSheet.tipoSalario ?? null,
            horasLaboralesDiarias: String(dataSheet.horasLaboralesDiarias),
            ciudadTrabajo: dataSheet.ciudadTrabajo ?? null,
            areaNombre: dataSheet.areaNombre ?? null,
            nombreCargo: dataSheet.nombreCargo ?? null,
        });

        // Restore Q17 seniority
        const ae = dataSheet.antiguedadEmpresa;
        if (ae !== null && ae !== undefined) {
            if (ae === 0) {
                this.form.patchValue({ antiguedadTipo: 'menosAnio', antiguedadAnios: null });
            } else {
                this.form.patchValue({ antiguedadTipo: 'masAnio', antiguedadAnios: ae });
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
        const jobType = this.form.get('tipoCargo')?.value;
        if (!jobType) return null;
        return this.JOB_TYPE_FORM_A.includes(jobType) ? 'A' : 'B';
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        this.error.set(null);

        const v = this.form.getRawValue();
        const period = this.dataSheetService.getCurrentPeriod();

        const payload = {
            period,
            fechaNacimiento: v.fechaNacimiento ?? null,
            identidadGenero: v.identidadGenero ?? null,
            grupoEtnico: v.grupoEtnico ?? null,
            discapacidad: v.discapacidad ?? null,
            discapacidadDetalle: v.discapacidadDetalle ?? null,
            cuidadorExclusivo: v.cuidadorExclusivo ?? null,
            situacionEspecial: this.selectedSituations.length > 0
                ? this.selectedSituations.join(',')
                : null,
            estadoCivil: v.estadoCivil,
            nivelEducacion: v.nivelEducacion,
            profesion: v.profesion ?? null,
            lugarResidenciaCiudad: v.lugarResidenciaCiudad ?? null,
            lugarResidenciaDepartamento: v.lugarResidenciaDepartamento ?? null,
            estrato: v.estrato,
            tipoVivienda: v.tipoVivienda,
            personasACargo: Number(v.personasACargo),
            lugarTrabajoDepartamento: v.lugarTrabajoDepartamento ?? null,
            nombreOficio: v.nombreOficio ?? null,
            tipoCargo: v.tipoCargo ?? null,
            antiguedadCargo: v.antiguedadCargoTipo === 'menosAnio' ? 0 : (v.antiguedadCargoAnios ? Number(v.antiguedadCargoAnios) : null),
            antiguedadOficio: v.antiguedadOficioTipo === 'menosAnio' ? 0 : (v.antiguedadOficioAnios ? Number(v.antiguedadOficioAnios) : null),
            tipoContrato: v.tipoContrato,
            tipoSalario: v.tipoSalario ?? null,
            horasLaboralesDiarias: Number(v.horasLaboralesDiarias),
            ciudadTrabajo: v.ciudadTrabajo ?? null,
            antiguedadEmpresa: v.antiguedadTipo === 'menosAnio' ? 0 : (v.antiguedadAnios ? Number(v.antiguedadAnios) : null),
            areaNombre: v.areaNombre ?? null,
            nombreCargo: v.nombreCargo ?? null,
        };

        this.dataSheetService.saveDataSheet(payload).pipe(take(1)).subscribe({
            next: () => {
                this.submitting.set(false);
                this.router.navigate(['/psychosocial-risk']);
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
