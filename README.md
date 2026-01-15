# Motion IQ — Plataforma de Gestión Predictiva de Sistemas de Transmisión de Potencia Industrial

**Motion IQ** es una plataforma web diseñada para la gestión eficiente y predictiva de sistemas de transmisión de potencia industrial. Permite a los equipos de mantenimiento monitorear en tiempo real el estado operativo de los equipos, planificar mantenimientos, optimizar repuestos y tomar decisiones basadas en datos actualizados. Gracias a sus dashboards intuitivos y a su arquitectura moderna, ayuda a reducir costos, evitar fallas inesperadas y mejorar la eficiencia energética en plantas de producción.

---

## 🚀 Funcionalidades Principales

- **Inventario inteligente de sistemas de transmisión de potencia:**  
  Registro y visualización de motores, reductores, acoplamientos, etc., con características técnicas y condiciones de operación.

- **Evaluación del estado en condiciones reales de trabajo:**  
  Diagnóstico del estado operativo considerando carga, horas de uso, temperatura y más.

- **Mantenimiento predictivo en tiempo real:**  
  Alertas, programación automática y análisis de tendencias para anticipar fallas.

- **Recomendaciones para actualización tecnológica:**  
  Sugerencias de mejoras y reemplazos basadas en eficiencia energética y confiabilidad.

- **Historial técnico completo:**  
  Registro detallado de mantenimientos, fallas, repuestos utilizados e intervenciones.

- **Gestión de repuestos mínimos críticos:**  
  Identificación y propuesta de inventario mínimo necesario para evitar paros de planta.

- **Dashboards intuitivos y precisos:**  
  Visualización clara y moderna para la toma de decisiones técnicas y gerenciales.

- **Acceso en línea y en tiempo real:**  
  Información actualizada y disponible para todos los usuarios autorizados.

---

## 🛠️ Tecnologías Utilizadas

- **Framework Frontend:** [Angular 19](https://angular.io/)  
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)  
- **Template Base:** [Fuse Angular 19](https://angular-material.fusetheme.com/dashboards/project)  
- **Arquitectura:** Modular, escalable y orientada a buenas prácticas.  
- **Gestión de Estado y Datos:** Angular Services y Reactive Forms (prácticas recomendadas).

---

## 🛠️ Buenas Prácticas de Código

✅ Uso de **Standalone Components** para mayor modularidad y rendimiento.  
✅ **Arquitectura modular**: separación clara entre core, features y shared.  
✅ Uso de **Tailwind CSS** para estilos limpios, responsivos y personalizables.  
✅ Uso de **Reactive Forms** y **RxJS** para manejo eficiente de datos y suscripciones.  
✅ **Angular Services** centralizados para lógica de negocio y consumo de APIs.  
✅ **Lazy Loading** en módulos funcionales para optimizar el rendimiento.  
✅ Integración con **Fuse Template** para layouts modernos y personalizables.  
✅ Uso de **SCSS/SASS** para mantener un sistema de estilos limpio y escalable.  
✅ Estrictas reglas de linting y formateo automático de código (Prettier/ESLint).

---

## 📦 Despliegue
ng build --configuration=production

## 📦 Estructura del Proyecto

```text
motion-iq/
│
├── src/
│   ├── app/
│   │   ├── core/                  → Servicios centrales (autenticación, interceptores, guards)
│   │   │   ├── auth/              → Servicios de autenticación y guards de acceso
│   │   │   ├── interceptors/      → HTTP interceptors (tokens, errores)
│   │   │   └── services/          → Servicios compartidos (API, notificaciones, logs)
│   │   │
│   │   ├── features/              → Módulos funcionales de la aplicación
│   │   │   ├── dashboard/         → Dashboards e informes
│   │   │   ├── inventory/         → Inventario inteligente de equipos
│   │   │   ├── maintenance/       → Módulo de mantenimiento predictivo
│   │   │   ├── recommendations/   → Recomendaciones de actualización
│   │   │   └── reports/           → Reportes y análisis de tendencias
│   │   │
│   │   ├── shared/                → Componentes, directivas y pipes reutilizables
│   │   │
│   │   ├── styles/                → Configuración de Tailwind y estilos globales
│   │   │
│   │   ├── layout/                → Layouts generales (Fuse)
│   │   │
│   │   └── app.module.ts          → Módulo raíz de la aplicación
│   │
│   ├── assets/                    → Logos, íconos, imágenes y fuentes
│   │
│   └── environments/              → Configuración de entornos (dev, prod)
│
├── angular.json                   → Configuración de Angular CLI
├── tailwind.config.js             → Configuración de Tailwind CSS
├── package.json                   → Dependencias y scripts
└── README.md                      → Documentación del proyecto
