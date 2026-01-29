export interface ModuleCardData {
    id: string;
    title: string;
    description: string;
    icon: string;
    colorClass: string;
    iconClass: string;
    disabled?: boolean;
    /** Puntaje obtenido (0-100) cuando el módulo ya fue evaluado */
    points?: number;
    status?: {
        label: string;
        tone: 'success' | 'warning' | 'danger';
        /** Icono del outcome (mismo que en resultados) */
        icon: 'check' | 'warn' | 'alert';
    };
}
