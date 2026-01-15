import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    constructor() { }

    success(message: string, title: string = '¡Éxito!') {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonColor: '#3085d6',
        });
    }

    error(message: string, title: string = '¡Upps...!') {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonColor: '#d33',
        });
    }

    warning(message: string, title: string = 'Atención') {
        Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            confirmButtonColor: '#f0ad4e',
        });
    }

    info(message: string, title: string = 'Información') {
        Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            confirmButtonColor: '#17a2b8',
        });
    }

    confirm(
        message: string,
        title: string = '¿Estás seguro?',
        confirmButtonText: string = 'Sí',
        cancelButtonText: string = 'Cancelar'
    ): Promise<boolean> {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText,
        }).then((result) => result.isConfirmed);
    }
}
