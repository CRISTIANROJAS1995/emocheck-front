import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CameraService } from 'app/core/services/camera.service';
import { EmotionalAnalysisService, EmotionalAnalysisResult } from 'app/core/services/emotional-analysis.service';
import { FaceEmotionDetectorService, FaceExpressionResult } from 'app/core/services/face-emotion-detector.service';
import { AuthService } from 'app/core/services/auth.service';
import { AdminAlertsService } from 'app/core/services/admin-alerts.service';

@Component({
    selector: 'app-emotional-analysis',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './emotional-analysis.component.html',
    styleUrls: ['./emotional-analysis.component.scss']
})
export class EmotionalAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

    userName: string = '';
    currentStep: number = 1;
    totalSteps: number = 5;
    progress: number = 0;
    isAnalyzing: boolean = true;
    showResults: boolean = false;
    cameraError: string = '';
    cameraErrorType: 'permission-denied' | 'in-use' | 'not-found' | 'not-supported' | 'https-required' | 'generic' | null = null;
    analysisError: string = '';

    // Estados de permiso de cámara
    // 'prompt'     → todavía no se ha pedido permiso (mostrar pantalla previa)
    // 'requesting' → esperando que el usuario acepte/rechace el diálogo del navegador
    // 'granted'    → cámara activa
    // 'denied'     → usuario rechazó o error irrecuperable
    cameraPermission: 'prompt' | 'requesting' | 'granted' | 'denied' = 'prompt';

    steps = [
        { id: 1, name: 'Atención', status: 'pending', percentage: 0 },
        { id: 2, name: 'Concentración', status: 'pending', percentage: 0 },
        { id: 3, name: 'Equilibrio', status: 'pending', percentage: 0 },
        { id: 4, name: 'Positividad', status: 'pending', percentage: 0 },
        { id: 5, name: 'Calma', status: 'pending', percentage: 0 }
    ];

    // Propiedades dinámicas para los resultados
    resultType: 'alert' | 'emotional-load' | 'normal' = 'emotional-load';

    // Contenido dinámico calculado al finalizar el análisis (emoción + estado)
    dynamicContent: {
        title: string;
        iconGradient: string;
        containerBorder: string;
        containerBackground: string;
        messageText: string;
        steps: Array<{ text: string; emoji?: string }>;
        finalMessage: string;
        buttonText: string;
        buttonEmoji: string;
        buttonGradient: string;
    } | null = null;

    // ─── Biblioteca de contenido por emoción × estado ───────────────────────
    private readonly CONTENT_LIBRARY: Record<string, Record<string, Array<{
        title: string;
        messageText: string;
        steps: Array<{ text: string; emoji?: string }>;
        finalMessage: string;
        buttonText: string;
        buttonEmoji: string;
    }>>> = {

        // ── VERDE (normal ≥70%) ─────────────────────────────────────────────
        normal: {
            happiness: [
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Tu estado emocional es saludable. Aprovechemos este momento para fortalecerlo.',
                    steps: [
                        { text: 'Respira profundo 4 segundos.' },
                        { text: 'Exhala lento 6 segundos. Repite 5 veces.' },
                        { text: '¿Qué estoy haciendo bien hoy? ¿Qué quiero repetir mañana?' },
                    ],
                    finalMessage: 'Sostener el bienestar también es autocuidado.',
                    buttonText: 'Continuar mi día',
                    buttonEmoji: '🌟',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Estás en un estado emocional saludable. Vamos a sostenerlo sin sobre-exigirte.',
                    steps: [
                        { text: 'Estira tus brazos hacia arriba.' },
                        { text: 'Sonríe conscientemente durante 10 segundos.' },
                    ],
                    finalMessage: 'Siente cómo tu cuerpo guarda esta emoción positiva.',
                    buttonText: 'Guardar bienestar',
                    buttonEmoji: '🎉',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Para cuidar este estado, elige una cosa y comprométete contigo.',
                    steps: [
                        { text: 'Repite hoy la misma acción que te hizo sentir bien.' },
                    ],
                    finalMessage: 'Consolida hábito emocional.',
                    buttonText: 'Definir límite',
                    buttonEmoji: '✔️',
                },
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: 'Este es un buen momento para fortalecer tu estado emocional.',
                    steps: [
                        { text: 'Presiona tu pulgar con tu dedo índice durante 10 segundos.' },
                        { text: 'Mientras lo haces, piensa: "Puedo volver a este estado cuando lo necesite."' },
                    ],
                    finalMessage: 'Este gesto será tu ancla emocional.',
                    buttonText: 'Crea un ancla somática',
                    buttonEmoji: '⚓',
                },
            ],
            default: [
                {
                    title: '¡Excelente! Tu estado emocional es saludable',
                    messageText: '¡Vas muy bien! 🌟 Tu bienestar emocional está en un gran nivel.',
                    steps: [
                        { text: 'Respira profundo y disfruta este momento.' },
                    ],
                    finalMessage: 'Sigue así y mantén tus buenos hábitos.',
                    buttonText: 'Seguir con mis evaluaciones',
                    buttonEmoji: '🌟',
                },
            ],
        },

        // ── NARANJA (emotional-load 50–69%) ────────────────────────────────
        'emotional-load': {
            neutral: [
                {
                    title: 'Estás en piloto automático. Hagamos un ajuste pequeño.',
                    messageText: 'Activación consciente (2 minutos).',
                    steps: [
                        { text: 'Endereza tu postura.', emoji: '🪑' },
                        { text: 'Inhala 3 segundos – exhala 5 segundos (5 veces).', emoji: '🌬️' },
                        { text: 'Elige una sola tarea y enfócate solo en esa por 2 minutos.', emoji: '🎯' },
                    ],
                    finalMessage: 'Pequeños ajustes cambian tu energía.',
                    buttonText: 'Regular ahora',
                    buttonEmoji: '🔄',
                },
                {
                    title: 'Tu energía está estable, pero en modo automático.',
                    messageText: 'No es un estado negativo. Es un momento perfecto para hacer un pequeño ajuste. Cambio de postura (1 minuto) — Tu cuerpo influye en tu mente.',
                    steps: [
                        { text: 'Endereza la espalda.', emoji: '🧍' },
                        { text: 'Apoya ambos pies firmes en el suelo.', emoji: '🦶' },
                        { text: 'Lleva hombros ligeramente hacia atrás.', emoji: '↩️' },
                        { text: 'Respira lento durante 60 segundos.', emoji: '🌬️' },
                    ],
                    finalMessage: 'Siente cómo cambia tu energía.',
                    buttonText: '✔ Sentí el cambio',
                    buttonEmoji: '',
                },
                {
                    title: 'Vamos a recuperar claridad. Micro-reto de foco (2 minutos)',
                    messageText: 'Hay algo de carga emocional, activa tu sistema suavemente.',
                    steps: [
                        { text: 'Elige una sola tarea pequeña.', emoji: '📌' },
                        { text: 'Activa un cronómetro de 2 minutos.', emoji: '⏱️' },
                        { text: 'Haz únicamente esa tarea. Sin interrupciones.', emoji: '🚫' },
                    ],
                    finalMessage: 'Cuando suene el tiempo, detente.',
                    buttonText: '▶ Iniciar 2 minutos',
                    buttonEmoji: '',
                },
                {
                    title: 'La dirección cambia la energía.',
                    messageText: 'Pregunta de intención (1 minuto). Pregúntate: ¿Qué intención quiero ponerle a la próxima hora?',
                    steps: [
                        { text: 'Elige una palabra: Enfoque. Calma. Claridad. Productividad. Presencia.', emoji: '💡' },
                        { text: 'Repítela mentalmente 3 veces.', emoji: '🔁' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Definir intención',
                    buttonEmoji: '',
                },
                {
                    title: 'Sal del piloto automático.',
                    messageText: 'Escaneo corporal rápido (1 minuto).',
                    steps: [
                        { text: 'Cierra los ojos si puedes.', emoji: '👁️' },
                        { text: 'Recorre mentalmente tu cuerpo: Frente — Mandíbula — Hombros — Pecho — Abdomen.', emoji: '🧠' },
                        { text: 'Si detectas tensión, suéltala.', emoji: '🌿' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Más consciente',
                    buttonEmoji: '',
                },
            ],
            surprise: [
                {
                    title: 'Tu sistema está activado por algo inesperado.',
                    messageText: 'La sorpresa activa tu energía rápidamente. Antes de reaccionar, vamos a estabilizar. Exhalación prolongada (1–2 minutos).',
                    steps: [
                        { text: 'Inhala durante 4 segundos.', emoji: '🌬️' },
                        { text: 'Exhala lentamente durante 8 segundos.', emoji: '💨' },
                        { text: 'Repite 5 veces. Concéntrate en hacer la exhalación más larga que la inhalación.', emoji: '🔁' },
                    ],
                    finalMessage: 'Este ejercicio baja activación simpática.',
                    buttonText: '✔ Más estable',
                    buttonEmoji: '',
                },
                {
                    title: 'Reorganiza tu ritmo interno.',
                    messageText: 'Movimiento lento (1 minuto). Reorganiza ritmo fisiológico.',
                    steps: [
                        { text: 'Ponte de pie.', emoji: '🧍' },
                        { text: 'Camina lentamente y más consciente durante 1 minuto.', emoji: '🚶' },
                        { text: 'Siente cada paso apoyarse en el suelo. No te apresures. Solo camina.', emoji: '🦶' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Regulé mi ritmo',
                    buttonEmoji: '',
                },
                {
                    title: 'Algunas emociones necesitan atención. Nombrarlas reduce intensidad.',
                    messageText: 'Nombrar la emoción (30 segundos). Di internamente:',
                    steps: [
                        { text: '"Estoy sorprendido, no en peligro." — Repite 3 veces.', emoji: '💬' },
                    ],
                    finalMessage: 'Disminuye reactividad límbica.',
                    buttonText: '✔ Entendido',
                    buttonEmoji: '',
                },
                {
                    title: 'Vamos a activar tu claridad mental.',
                    messageText: 'Chequeo de evidencia (1 minuto). Respira profundo mientras reflexionas. Este ejercicio activa la corteza prefrontal.',
                    steps: [
                        { text: '¿Qué datos reales tengo?', emoji: '🔍' },
                        { text: '¿Estoy interpretando o observando hechos?', emoji: '🤔' },
                        { text: '¿Necesito más información antes de actuar?', emoji: '⏸️' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Más claridad',
                    buttonEmoji: '',
                },
                {
                    title: 'Antes de reaccionar, repite.',
                    messageText: 'Autoinstrucción breve (30 segundos). Este ejercicio reduce impulsividad.',
                    steps: [
                        { text: '"Primero observo, luego reacciono."', emoji: '💬' },
                        { text: 'Siente la pausa antes de cualquier respuesta.', emoji: '⏸️' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Pausa aplicada',
                    buttonEmoji: '',
                },
            ],
            default: [
                {
                    title: 'Parece que hay algo de carga emocional.',
                    messageText: 'Está bien no estar al 100%. Te propongo una respiración 4-7-8 para soltar tensión.',
                    steps: [
                        { text: 'Inhala 4 segundos.', emoji: '🌬️' },
                        { text: 'Sostén 7 segundos.', emoji: '⏸️' },
                        { text: 'Exhala 8 segundos. Repite 3 veces.', emoji: '💨' },
                    ],
                    finalMessage: 'Tu cuerpo agradece este momento de pausa.',
                    buttonText: '✔ Comenzar respiración',
                    buttonEmoji: '',
                },
            ],
        },

        // ── ROJO (alert <50%) ───────────────────────────────────────────────
        alert: {
            anger: [
                {
                    title: 'Tu sistema está en alerta. Pausar ahora evita reacciones impulsivas.',
                    messageText: 'Relajación progresiva (2 min). Regula la activación simpática y reorienta intención.',
                    steps: [
                        { text: 'Aprieta puños 5 segundos → suelta (3 veces).', emoji: '✊' },
                        { text: 'Inhala 3 – exhala 7 (5 veces).', emoji: '🌬️' },
                        { text: 'Completa: "Lo que necesito realmente es ______."', emoji: '💭' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Más claridad',
                    buttonEmoji: '',
                },
                {
                    title: 'Tu sistema está en alta activación. Primero regulamos. Luego pensamos.',
                    messageText: 'Cambio de temperatura (1 min). Este ejercicio reduce la activación del sistema simpático rápidamente.',
                    steps: [
                        { text: 'Lava manos con agua fría o sostén algo frío.', emoji: '🧊' },
                        { text: 'Repite mentalmente: "Puedo pausar antes de reaccionar."', emoji: '💬' },
                        { text: 'Dilo 3 veces.', emoji: '🔁' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Me calmé',
                    buttonEmoji: '',
                },
                {
                    title: 'Tu cuerpo está en alerta. Vamos a liberar esa activación.',
                    messageText: 'Cuando aparece el enojo, el organismo libera adrenalina y tensión muscular. Mover el cuerpo cambia el estado. Esto tomará solo un minuto.',
                    steps: [
                        { text: 'Opción 1: 20 sentadillas. Baja despacio. Sube con fuerza. Siente cómo tus músculos trabajan.', emoji: '🏋️' },
                        { text: 'Opción 2: Camina rápido durante 1 minuto. Balancea los brazos. Respira profundo mientras caminas.', emoji: '🚶' },
                        { text: 'Mientras te mueves recuerda: No estás huyendo del enojo. Estás canalizando la energía que trae.', emoji: '💪' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Energía liberada',
                    buttonEmoji: '',
                },
                {
                    title: 'Estás enojado. Tu energía está alta y quiere salir.',
                    messageText: 'El enojo no es el problema. Reaccionar sin regularlo sí puede serlo. Toma 2 minutos conmigo.',
                    steps: [
                        { text: 'Inhala profundo por la nariz durante 4 segundos.', emoji: '🌬️' },
                        { text: 'Exhala lento por la boca durante 6 segundos. Deja que el cuerpo suelte tensión.', emoji: '💨' },
                        { text: 'Repite esta respiración 5 veces.', emoji: '🔁' },
                        { text: 'Repite mentalmente 3 veces: "Puedo pausar antes de reaccionar."', emoji: '💬' },
                    ],
                    finalMessage: 'No necesitas resolver nada ahora mismo. Solo recuperar el control de tu respuesta.',
                    buttonText: '✔ Estoy más calmado',
                    buttonEmoji: '',
                },
                {
                    title: 'Parece que tu enojo tiene energía. Vamos a usarla a tu favor.',
                    messageText: 'No la bloquees. Dirígela. Las emociones tienen un pico y luego descienden. Hoy elegiste esperar la bajada.',
                    steps: [
                        { text: 'Cierra los ojos (si puedes). Ubica el enojo en tu cuerpo. ¿Pecho? ¿Mandíbula? ¿Estómago?', emoji: '👁️' },
                        { text: 'No lo cambies. Solo obsérvalo. Imagina que es una ola que sube…', emoji: '🌊' },
                        { text: 'Mantente respirando lento. Observa cómo luego empieza a bajar sola.', emoji: '🌬️' },
                    ],
                    finalMessage: 'El problema no es el enojo. Es reaccionar en el punto más alto.',
                    buttonText: '✔ Estoy más calmado',
                    buttonEmoji: '',
                },
            ],
            fear: [
                {
                    title: 'Tu sistema está en alerta. El miedo intenta protegerte.',
                    messageText: 'Pero ahora necesitamos verificar si hay peligro real o solo anticipación. Pies al suelo (1 minuto) — Vamos a crear base segura.',
                    steps: [
                        { text: 'Apoya ambos pies firmemente en el piso.', emoji: '🦶' },
                        { text: 'Presiona ligeramente las plantas contra el suelo. Siente el contacto.', emoji: '⬇️' },
                        { text: 'Respira lento mientras presionas. Tu cuerpo necesita sentir estabilidad.', emoji: '🌬️' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Me siento más firme',
                    buttonEmoji: '',
                },
                {
                    title: 'Tu sistema está en alerta. El miedo intenta protegerte.',
                    messageText: 'Respiración con manos (1 minuto). Ahora enviamos señal de calma al sistema nervioso.',
                    steps: [
                        { text: 'Coloca una mano en el pecho. Otra en el abdomen.', emoji: '🤲' },
                        { text: 'Inhala lento.', emoji: '🌬️' },
                        { text: 'Exhala más largo que la inhalación. Hazlo 5 veces.', emoji: '💨' },
                    ],
                    finalMessage: 'Tu cuerpo empieza a entender que no hay peligro inmediato.',
                    buttonText: '✔ Más tranquilo',
                    buttonEmoji: '',
                },
                {
                    title: 'Tu cuerpo percibe amenaza. Vamos a enviarle seguridad.',
                    messageText: 'Chequeo de realidad (1 minuto). Activa claridad. Pregúntate: ¿Estoy a salvo ahora mismo? Responde solo Sí o No.',
                    steps: [
                        { text: 'Si la respuesta es "Sí" → Repite lentamente 3 veces: "Ahora mismo estoy a salvo." "Esto es incómodo, pero no es una amenaza real."', emoji: '✅' },
                        { text: 'Si la respuesta es "No" → Elige una acción pequeña y concreta: alejarte del lugar, llamar a alguien, pedir ayuda, establecer un límite.', emoji: '🚨' },
                        { text: 'Exhala más largo que la inhalación mientras decides.', emoji: '🌬️' },
                    ],
                    finalMessage: 'No necesitas resolver todo. Solo dar el siguiente paso seguro.',
                    buttonText: '✔ Me siento más claro',
                    buttonEmoji: '',
                },
                {
                    title: '"Tu sistema detecta amenaza. Vamos a enviarle seguridad."',
                    messageText: 'Antes de pensar más, vamos a ayudar al sistema nervioso a sentir estabilidad. Movimiento rítmico — Cuando el cuerpo se mueve con ritmo, el cerebro interpreta seguridad.',
                    steps: [
                        { text: 'Ponte de pie con los pies separados al ancho de tus hombros. Rodillas ligeramente flexionadas.', emoji: '🧍' },
                        { text: 'Comienza a balancear tu peso hacia la derecha… luego hacia la izquierda. Suave. Lento. Constante.', emoji: '↔️' },
                        { text: 'Coordina con tu respiración: inhala cuando te mueves a un lado, exhala cuando cambias.', emoji: '🌬️' },
                        { text: 'Puedes decirte: "Aquí estoy. Estoy estable."', emoji: '💬' },
                    ],
                    finalMessage: 'No todo miedo necesita más análisis. A veces necesita más suelo.',
                    buttonText: '✔ Más estable',
                    buttonEmoji: '',
                },
                {
                    title: 'Cuando hay miedo, tu atención se estrecha. Vamos a ampliar el campo visual.',
                    messageText: 'El cerebro necesita evidencia visual de seguridad. Cuando amplías la mirada, le muestras que no todo es amenaza.',
                    steps: [
                        { text: 'Sin mover la cabeza, amplía tu visión periférica. Intenta notar lo que está a los lados.', emoji: '👁️' },
                        { text: 'Gira lentamente la cabeza hacia la derecha. Observa detalles concretos (colores, formas). Haz lo mismo hacia la izquierda.', emoji: '↩️' },
                        { text: 'Identifica 3 señales de normalidad: algo estable, algo quieto, algo familiar.', emoji: '🔍' },
                    ],
                    finalMessage: 'Más campo visual = menos alarma interna.',
                    buttonText: '✔ Me siento más presente',
                    buttonEmoji: '',
                },
            ],
            sadness: [
                {
                    title: 'Hay carga emocional. No necesitas resolver todo ahora.',
                    messageText: 'No vamos a forzarte. Vamos a avanzar 1%. Exposición a luz (2 min) — Estimular sistema de alerta natural.',
                    steps: [
                        { text: 'Acércate a una ventana o fuente de luz.', emoji: '🪟' },
                        { text: 'Mira hacia el exterior.', emoji: '🌤️' },
                        { text: 'Respira profundo 5 veces. Si puedes, recibe luz directa en el rostro.', emoji: '🌬️' },
                    ],
                    finalMessage: 'La luz le dice a tu cerebro que el día continúa.',
                    buttonText: '✔ Conectado',
                    buttonEmoji: '',
                },
                {
                    title: 'Hay carga emocional. No necesitas resolver todo ahora.',
                    messageText: 'Activación corporal suave (2 min). El cuerpo influye en el ánimo. Moverte suavemente cambia la química interna.',
                    steps: [
                        { text: 'Ponte de pie.', emoji: '🧍' },
                        { text: 'Eleva brazos lentamente al inhalar.', emoji: '🙆' },
                        { text: 'Baja brazos al exhalar. Repite 6 veces.', emoji: '🌬️' },
                    ],
                    finalMessage: 'Siente cómo se activa tu respiración.',
                    buttonText: '✔ Más despierto',
                    buttonEmoji: '',
                },
                {
                    title: 'Hay carga emocional. No necesitas resolver todo ahora.',
                    messageText: 'Tener un contacto humano mínimo protege (2 min). No necesitas explicar nada. Solo mantener conexión.',
                    steps: [
                        { text: 'Piensa en una persona segura.', emoji: '👤' },
                        { text: 'Envía un mensaje breve: "Hola, solo quería saludarte."', emoji: '💬' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Mensaje enviado',
                    buttonEmoji: '',
                },
                {
                    title: 'Parece que estás triste. Esta emoción nos ayuda a reconocer necesidades internas.',
                    messageText: 'Diálogo autocompasivo. La tristeza se agrava con exigencia. La compasión regula. No es debilidad. Es estrategia emocional.',
                    steps: [
                        { text: 'Coloca una mano sobre el pecho. Respira lento.', emoji: '🤲' },
                        { text: 'Di: "Esto es difícil." "No tengo que resolver todo hoy." "Puedo cuidarme mientras avanzo."', emoji: '💬' },
                        { text: 'Mantén la respiración estable.', emoji: '🌬️' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Más contenido',
                    buttonEmoji: '',
                },
                {
                    title: 'La tristeza se siente grande porque está difusa. Vamos a darle forma.',
                    messageText: 'No la quites. Obsérvala. Tu historia no es solo tristeza. También has sido sostenido antes. Esa memoria sigue disponible.',
                    steps: [
                        { text: 'Piensa en un momento donde te sentiste comprendido. No perfecto. Solo acompañado.', emoji: '🧠' },
                        { text: 'Recuerda dónde estabas. Qué persona estaba allí. Qué palabras o gesto hubo.', emoji: '💭' },
                        { text: 'Respira mientras revives esa sensación.', emoji: '🌬️' },
                    ],
                    finalMessage: 'Tu cerebro puede reactivar esa red emocional.',
                    buttonText: '✔ Lo recordé',
                    buttonEmoji: '',
                },
            ],
            contempt: [
                {
                    title: 'Estás sintiendo desagrado. Antes de reaccionar, vamos a crear distancia mental.',
                    messageText: 'Cuando creamos distancia mental, el cerebro reduce la intensidad emocional y recupera claridad.',
                    steps: [
                        { text: 'Imagina la situación frente a ti como si estuviera en una pantalla.', emoji: '🖥️' },
                        { text: 'Obsérvala durante unos segundos sin intervenir. Ahora imagina que bajas el brillo de esa pantalla.', emoji: '🌫️' },
                        { text: 'Reduce también el volumen de lo que ocurre allí. Respira lentamente mientras observas.', emoji: '🔇' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Tomar distancia',
                    buttonEmoji: '',
                },
                {
                    title: 'El desagrado puede tensar el cuerpo sin que lo notes.',
                    messageText: 'Cuando la respiración se vuelve más lenta, el cerebro interpreta que no hay peligro inmediato y reduce la intensidad de la emoción.',
                    steps: [
                        { text: 'Inhala lentamente por la nariz contando 4 segundos.', emoji: '🌬️' },
                        { text: 'Exhala lentamente por la boca contando 6 segundos.', emoji: '💨' },
                        { text: 'Repite el ciclo 5 veces. Mientras respiras, suelta los hombros.', emoji: '🔁' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Regular respiración',
                    buttonEmoji: '',
                },
                {
                    title: 'El desagrado suele venir acompañado de juicios rápidos.',
                    messageText: 'Vamos a transformar ese lenguaje interno. Cambiar el lenguaje interno ayuda al cerebro a pasar del rechazo emocional a una evaluación más objetiva.',
                    steps: [
                        { text: 'Identifica el pensamiento automático. Ejemplo: "Esto es terrible."', emoji: '💭' },
                        { text: 'Cámbialo por una descripción neutral: "Esto es algo que no me gusta."', emoji: '🔄' },
                        { text: 'Repite mentalmente la nueva frase.', emoji: '🔁' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Reencuadrar pensamiento',
                    buttonEmoji: '',
                },
                {
                    title: 'Cuando sentimos desagrado, solemos enfocarnos en lo que no controlamos.',
                    messageText: 'Vamos a cambiar el foco. Enfocarnos en lo que sí podemos hacer reduce la frustración y devuelve sensación de control.',
                    steps: [
                        { text: '¿Qué parte de esta situación sí depende de mí?', emoji: '🔍' },
                        { text: '¿Qué pequeña acción puedo tomar ahora?', emoji: '🎯' },
                        { text: 'Elige una acción mínima: aclarar información, reorganizar una tarea, pedir apoyo.', emoji: '✅' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Elegir acción',
                    buttonEmoji: '',
                },
                {
                    title: 'El desagrado también se queda en el cuerpo.',
                    messageText: 'Vamos a liberar esa tensión. Liberar tensión física envía una señal de calma al sistema nervioso.',
                    steps: [
                        { text: 'Eleva los hombros hacia las orejas. Mantén la tensión 5 segundos. Suelta lentamente.', emoji: '🙆' },
                        { text: 'Repite 3 veces.', emoji: '🔁' },
                        { text: 'Luego mueve ligeramente el cuello.', emoji: '↩️' },
                    ],
                    finalMessage: '',
                    buttonText: '✔ Soltar tensión',
                    buttonEmoji: '',
                },
            ],
            default: [
                {
                    title: 'Tu cuerpo está en alerta.',
                    messageText: 'Vamos a bajarle el ritmo juntos. Haz una pausa guiada de 2 minutos para estabilizar tu mente.',
                    steps: [
                        { text: 'Respira profundo 4 segundos.', emoji: '🌬️' },
                        { text: 'Exhala lento 6 segundos. Repite 5 veces.', emoji: '💨' },
                    ],
                    finalMessage: 'Tu bienestar es la prioridad.',
                    buttonText: '✔ Iniciar pausa guiada',
                    buttonEmoji: '',
                },
            ],
        },
    };

    // ─── Estilos visuales por resultType ────────────────────────────────────
    get resultVisual(): {
        iconGradient: string;
        containerBorder: string;
        containerBackground: string;
        buttonGradient: string;
        titleColor: string;
    } {
        if (this.resultType === 'normal') {
            return {
                iconGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                containerBorder: '#6EE7B7',
                containerBackground: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%)',
                buttonGradient: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
                titleColor: '#059669',
            };
        } else if (this.resultType === 'alert') {
            return {
                iconGradient: 'linear-gradient(135deg, #FF6467 0%, #E7000B 100%)',
                containerBorder: '#FFA2A2',
                containerBackground: 'linear-gradient(135deg, #FEF2F2 0%, #FEF2F2 50%)',
                buttonGradient: 'linear-gradient(90deg, #FF6467 0%, #E7000B 100%)',
                titleColor: '#DC2626',
            };
        } else {
            return {
                iconGradient: 'linear-gradient(135deg, #FF8A00 0%, #FF6B00 100%)',
                containerBorder: '#FFB366',
                containerBackground: 'rgba(255, 228, 204, 0.35)',
                buttonGradient: 'linear-gradient(90deg, #FF8A00 0%, #FF6B00 100%)',
                titleColor: '#D97706',
            };
        }
    }

    analysisResult: EmotionalAnalysisResult | null = null;

    private captureInterval: any;
    private analysisTimeoutId: any;
    private readonly detectEveryMs = 4000;  // Face++ API: 1 llamada cada 4s (optimiza consumo: ~5 calls/sesión)
    private readonly minDetections = 3;    // Mínimo 3 detecciones antes de enviar (~12 seg)
    private readonly maxDetections = 5;    // Máximo 5 detecciones (~20 seg) — suficiente con quality weighting
    private readonly analysisTimeoutMs = 60000; // 60s máximo — si no hay detecciones, mostrar error
    private detections: FaceExpressionResult[] = [];
    private analysisStarted = false;
    private loadModelsRetryCount = 0;
    private readonly maxLoadModelsRetries = 10; // máx 5 seg esperando que loadModels termine
    modelLoadError: string = '';

    constructor(
        private _router: Router,
        private _cameraService: CameraService,
        private _emotionalAnalysisService: EmotionalAnalysisService,
        private _faceDetector: FaceEmotionDetectorService,
        private _authService: AuthService,
        private _alertsService: AdminAlertsService,
    ) { }

    ngOnInit(): void {
        // Cargar nombre real del usuario
        const cached = this._authService.getCurrentUser();
        if (cached?.name) {
            this.userName = cached.name;
        }

        this._authService
            .ensureCurrentUserLoaded()
            .pipe(take(1))
            .subscribe({
                next: (user) => {
                    if (user?.name) {
                        this.userName = user.name;
                    }
                },
                error: () => { /* Mantener nombre en caché o vacío */ },
            });

        // Verificar soporte de cámara
        if (!this._cameraService.isCameraSupported()) {
            this.cameraPermission = 'denied';
            this.cameraErrorType = 'not-supported';
            this.cameraError = 'Tu navegador no soporta acceso a la cámara. Usa Chrome, Firefox o Safari actualizado.';
            this.isAnalyzing = false;
            return;
        }

        // Consultar si ya hay permiso concedido previamente (solo en navegadores que soporten Permissions API)
        // IMPORTANTE: esta promesa resuelve de forma asíncrona, DESPUÉS de ngAfterViewInit.
        // Por eso, si el permiso ya estaba concedido, arrancamos la cámara directamente desde aquí.
        if (typeof navigator !== 'undefined' && navigator.permissions) {
            navigator.permissions.query({ name: 'camera' as PermissionName }).then((status) => {
                if (status.state === 'granted') {
                    // Ya tiene permiso — arrancar directo sin mostrar pantalla de solicitud.
                    // ngAfterViewInit ya pasó, así que iniciamos aquí mismo.
                    this.cameraPermission = 'granted';
                    this._faceDetector.loadModels()
                        .catch(() => {
                            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
                        })
                        .finally(() => {
                            this.initializeCamera();
                        });
                } else if (status.state === 'denied') {
                    this.cameraPermission = 'denied';
                    this.cameraErrorType = 'permission-denied';
                    this.cameraError = 'El permiso de cámara fue denegado anteriormente.';
                    this.isAnalyzing = false;
                }
                // Si 'prompt' → se queda en 'prompt' y espera el botón del usuario
            }).catch(() => {
                // Permissions API no disponible (p.ej. Safari antiguo) — quedarse en 'prompt'
            });
        }

        // Pre-cargar modelos en background (sin bloquear) para que estén listos cuando el usuario pulse el botón
        this._faceDetector.loadModels().catch(() => {
            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
        });
    }

    ngAfterViewInit(): void {
        // No arrancar cámara automáticamente — la lógica de arranque está en ngOnInit
        // para evitar la carrera entre la promesa de permissions y este hook.
    }

    ngOnDestroy(): void {
        this.cleanup();
    }
    private getCameraErrorMessage(error: unknown): string {
        const anyErr = error as any;
        const name: string | undefined = typeof anyErr?.name === 'string' ? anyErr.name : undefined;
        const message: string | undefined = typeof anyErr?.message === 'string' ? anyErr.message : undefined;

        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
            this.cameraErrorType = 'not-found';
            return 'No encontramos una cámara en tu dispositivo. Verifica que esté conectada y que no esté desactivada.';
        }
        if (name === 'NotAllowedError' || name === 'SecurityError') {
            this.cameraErrorType = 'permission-denied';
            return 'Permiso de cámara denegado. Toca el ícono de cámara en la barra de dirección de tu navegador y selecciona "Permitir".';
        }
        if (name === 'NotReadableError' || name === 'TrackStartError') {
            this.cameraErrorType = 'in-use';
            return 'La cámara está siendo usada por otra aplicación. Cierra videollamadas, Zoom, Teams u otras apps y vuelve a intentarlo.';
        }
        if (message?.toLowerCase().includes('https') || message?.toLowerCase().includes('secure')) {
            this.cameraErrorType = 'https-required';
            return 'Para usar la cámara se requiere una conexión segura (HTTPS). Accede a la app por HTTPS.';
        }
        if (message && message.trim().length > 0) {
            this.cameraErrorType = 'generic';
            return message;
        }

        this.cameraErrorType = 'generic';
        return 'No pudimos acceder a la cámara. Verifica los permisos e inténtalo de nuevo.';
    }

    /**
     * Pide permiso de cámara al usuario y arranca el análisis.
     * Llamado desde el botón "Permitir acceso a cámara" o automáticamente si ya hay permiso.
     */
    async initializeCamera(): Promise<void> {
        this.cameraPermission = 'requesting';
        this.cameraError = '';
        this.cameraErrorType = null;

        try {
            const videoEl = this.videoElement?.nativeElement;
            if (!videoEl) {
                throw new Error('El elemento de video no está disponible.');
            }
            await this._cameraService.startCamera(videoEl);

            this.cameraPermission = 'granted';

            if (!this.analysisStarted) {
                this.analysisStarted = true;
                this.startAnalysis();
            }

        } catch (error) {
            this.cameraError = this.getCameraErrorMessage(error);
            this.cameraPermission = 'denied';
            this.isAnalyzing = false;
        }
    }

    /**
     * Botón "Permitir acceso a cámara" — lanza el flujo completo desde cero.
     * CRÍTICO para iOS/Safari: getUserMedia DEBE ser llamado de forma síncrona
     * dentro del mismo event handler del gesto del usuario (click).
     * Por eso llamamos initializeCamera() PRIMERO sin await, y los modelos
     * se pre-cargan en parallel. Si los modelos aún no están listos cuando
     * el análisis arranca, startAnalysis() ya tiene el retry de hasta 10 veces.
     */
    requestCameraPermission(): void {
        // Arrancar cámara INMEDIATAMENTE (en el mismo tick del click — iOS/Safari requirement)
        this.initializeCamera();
        // Modelos: ya se pre-cargaron en ngOnInit en background, esto es seguro en parallel
        this._faceDetector.loadModels().catch(() => {
            this.modelLoadError = 'No se pudieron cargar los modelos de análisis facial.';
        });
    }

    /**
     * Inicia el proceso de análisis usando Face++ API (detección en la nube)
     */
    startAnalysis(): void {
        if (this.cameraError || this.modelLoadError) {
            this.isAnalyzing = false;
            return;
        }

        if (!this._faceDetector.isReady) {
            // Models still loading — retry máx 10 veces (5 seg total) y luego mostrar error
            if (this.loadModelsRetryCount >= this.maxLoadModelsRetries) {
                this.analysisError = 'No se pudo inicializar el análisis facial. Por favor, recarga la página.';
                this.isAnalyzing = false;
                return;
            }
            this.loadModelsRetryCount++;
            setTimeout(() => this.startAnalysis(), 500);
            return;
        }

        this.loadModelsRetryCount = 0;

        // Reset estado
        this.analysisError = '';
        this.showResults = false;
        this.isAnalyzing = true;
        this.currentStep = 1;
        this.progress = 0;
        this.detections = [];
        this._faceDetector.resetCalibration();
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });

        // Detectar expresiones faciales cada 4s
        const videoEl = this.videoElement?.nativeElement;
        if (!videoEl) return;

        // Timeout de seguridad: si tras 60s no hay detecciones suficientes, mostrar error claro
        this.analysisTimeoutId = setTimeout(() => {
            if (this.isAnalyzing && this.detections.length === 0) {
                if (this.captureInterval) {
                    clearInterval(this.captureInterval);
                    this.captureInterval = null;
                }
                this.analysisError = 'No se detectó un rostro durante el análisis. Verifica que tu cara esté bien iluminada y visible, y que la conexión a internet funcione correctamente.';
                this.isAnalyzing = false;
            } else if (this.isAnalyzing && this.detections.length >= 1) {
                // Hay algunas detecciones — finalizar con lo que tenemos
                this.finishAnalysis();
            }
        }, this.analysisTimeoutMs);

        this.captureInterval = setInterval(async () => {
            if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return;

            let result: FaceExpressionResult | null = null;
            try {
                result = await this._faceDetector.detectExpression(videoEl);
            } catch (e) {
                console.warn('[EmotionalAnalysis] Error en detectExpression:', e);
                return;
            }

            if (!result) {
                // Si se agotó el límite diario, parar inmediatamente
                if (this._faceDetector.isDailyLimitExhausted) {
                    if (this.captureInterval) {
                        clearInterval(this.captureInterval);
                        this.captureInterval = null;
                    }
                    this.analysisError = 'Se agotaron las llamadas gratuitas de Face++ por hoy (1000/día). El análisis estará disponible mañana.';
                    this.isAnalyzing = false;
                    return;
                }
                // Si la llamada fue bloqueada por CORS (producción sin proxy en backend)
                if (this._faceDetector.isCorsBlocked) {
                    if (this.captureInterval) {
                        clearInterval(this.captureInterval);
                        this.captureInterval = null;
                    }
                    if (this.analysisTimeoutId) {
                        clearTimeout(this.analysisTimeoutId);
                        this.analysisTimeoutId = null;
                    }
                    this.analysisError = 'El análisis facial no está disponible en este momento por una restricción de seguridad del navegador (CORS). Por favor, contacta al soporte técnico.';
                    this.isAnalyzing = false;
                    return;
                }
                return;
            }

            if (result.faceDetected) {
                this.detections.push(result);
            }

            // Progreso visual
            const got = Math.min(this.detections.length, this.minDetections);
            this.progress = Math.min(60, Math.round((got / this.minDetections) * 60));
            // Distribuir currentStep a lo largo de los 5 pasos según detecciones (1→5 en totalSteps)
            this.currentStep = Math.min(this.totalSteps, 1 + Math.round((got / this.minDetections) * (this.totalSteps - 1)));
            // Actualizar status de cada step para que el banner dinámico sea correcto
            this.steps.forEach((s, idx) => {
                if (idx < this.currentStep - 1) s.status = 'completed';
                else if (idx === this.currentStep - 1) s.status = 'active';
                else s.status = 'pending';
            });

            // Cuando tenemos suficientes detecciones, finalizar
            if (this.detections.length >= this.maxDetections ||
                (this.detections.length >= this.minDetections && this.detections.length > 0)) {
                this.finishAnalysis();
            }
        }, this.detectEveryMs);
    }

    /**
     * Finaliza el análisis: promedia las detecciones locales y envía al backend
     */
    async finishAnalysis(): Promise<void> {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        if (this.analysisTimeoutId) {
            clearTimeout(this.analysisTimeoutId);
            this.analysisTimeoutId = null;
        }

        // Estado visual: "analizando"
        this.progress = 70;
        this.currentStep = 4;
        this.steps.forEach((s, idx) => {
            if (idx < 3) s.status = 'completed';
            else if (idx === 3) s.status = 'active';
            else s.status = 'pending';
        });

        // Promediar las detecciones de Face++ API
        const validDetections = this.detections.filter(d => d.faceDetected);
        if (validDetections.length === 0) {
            this.analysisError = 'No se detectó un rostro. Asegúrate de que tu cara esté visible y bien iluminada.';
            this.isAnalyzing = false;
            return;
        }

        // ================================================================
        // SCORING: Agregar scores ponderados de todas las detecciones
        // con boost para emociones no-neutrales y supresión de neutral.
        // ================================================================
        const EMOTION_TO_BACKEND: Record<string, string> = {
            happy: 'happiness', sad: 'sadness', angry: 'anger',
            disgusted: 'contempt', fearful: 'fear', surprised: 'surprise',
            neutral: 'neutral',
        };

        // 1. Sumar scores ponderados por calidad del frame + peso temporal
        const sumScores: Record<string, number> = {};
        const peakScores: Record<string, number> = {};
        let totalWeight = 0;
        for (let i = 0; i < validDetections.length; i++) {
            const d = validDetections[i];
            const qualityWeight = d.quality?.frameWeight ?? 1.0;
            const temporalWeight = 1.0 + 0.5 * (i / Math.max(1, validDetections.length - 1));
            const combinedWeight = qualityWeight * temporalWeight;
            totalWeight += combinedWeight;

            for (const [emo, score] of Object.entries(d.expressions)) {
                sumScores[emo] = (sumScores[emo] || 0) + score * combinedWeight;
                peakScores[emo] = Math.max(peakScores[emo] || 0, score);
            }
        }

        // 2. Promedio ponderado
        const avgScores: Record<string, number> = {};
        for (const emo of Object.keys(sumScores)) {
            avgScores[emo] = sumScores[emo] / totalWeight;
        }

        // 2b. Micro-expresiones: detectar picos breves de emoción
        const MICRO_SPIKE_THRESHOLD = 2.5;
        const MICRO_NOISE_FLOOR = 0.02;
        for (const [emo, avg] of Object.entries(avgScores)) {
            if (emo === 'neutral') continue;
            let spikeCount = 0;
            let spikeIntensity = 0;
            for (const d of validDetections) {
                const frameScore = d.expressions[emo] || 0;
                if (frameScore > avg * MICRO_SPIKE_THRESHOLD && frameScore > MICRO_NOISE_FLOOR) {
                    spikeCount++;
                    spikeIntensity += frameScore - avg;
                }
            }
            const maxSpikes = Math.ceil(validDetections.length * 0.3);
            if (spikeCount >= 1 && spikeCount <= maxSpikes) {
                avgScores[emo] += (spikeIntensity / spikeCount) * 0.25;
            }
        }

        // 2c. Variabilidad emocional
        let totalVariance = 0;
        for (const [emo, avg] of Object.entries(avgScores)) {
            let sumSqDiff = 0;
            for (const d of validDetections) {
                const diff = (d.expressions[emo] || 0) - avg;
                sumSqDiff += diff * diff;
            }
            totalVariance += sumSqDiff / validDetections.length;
        }

        // 3. Boost + supresión neutral
        const negativeIntense = (avgScores['angry'] || 0) + (avgScores['fearful'] || 0) + (avgScores['disgusted'] || 0);
        let neutralMultiplier = 1.0;
        if (negativeIntense > 0.005) {
            const suppressFactor = Math.min(0.85, negativeIntense * 40);
            neutralMultiplier = 1 - suppressFactor;
        }

        let dominantEmotion = 'neutral';
        let maxScore = 0;
        for (const [emo, avg] of Object.entries(avgScores)) {
            let boost: number;
            if (emo === 'neutral') {
                boost = neutralMultiplier;
            } else if (emo === 'angry' || emo === 'fearful' || emo === 'disgusted') {
                boost = 30;
            } else {
                boost = 5.0;
            }
            const score = avg * boost;
            if (score > maxScore) {
                maxScore = score;
                dominantEmotion = emo;
            }
        }

        // 4. Mapear a nombre backend
        dominantEmotion = EMOTION_TO_BACKEND[dominantEmotion] || dominantEmotion;

        // 5. Confianza
        const rawKey = Object.entries(EMOTION_TO_BACKEND).find(([, v]) => v === dominantEmotion)?.[0] || dominantEmotion;
        const avgConfidence = dominantEmotion === 'neutral'
            ? (avgScores[rawKey] || 0.5)
            : Math.max(avgScores[rawKey] || 0, (peakScores[rawKey] || 0) * 0.85);

        // Enviar al backend para mapear a scores de bienestar
        this._emotionalAnalysisService.classifyEmotion(dominantEmotion, avgConfidence)
            .subscribe({
                next: (result) => {
                    this.analysisResult = result;

                    // El backend ya aplica scores correctos por emoción (ajustes verificados 05-mar-2026).
                    // Confiamos directamente en el estado calculado por evaluateEmotionalState()
                    // sin ninguna mitigación especial por emoción positiva.
                    const state = this._emotionalAnalysisService.evaluateEmotionalState(result);
                    const fatigueThreshold = 0.75;

                    const isRed =
                        result.alertCreated === true ||
                        (typeof result.fatigueScore === 'number' && result.fatigueScore >= fatigueThreshold) ||
                        state === 'critical';

                    let resolvedType: 'normal' | 'emotional-load' | 'alert';
                    if (isRed) {
                        resolvedType = 'alert';
                    } else if (state === 'normal') {
                        resolvedType = 'normal';
                    } else {
                        resolvedType = 'emotional-load';
                    }

                    this.resultType = resolvedType;
                    this.dynamicContent = this.buildDynamicContent(this.resultType, result.dominantEmotion ?? '');

                    // Crear alerta manual solo si el backend no la creó y el estado es crítico/alerta.
                    if (!result.alertCreated && (state === 'critical' || state === 'alert')) {
                        const severity = state === 'critical' ? 'HIGH' : 'MEDIUM';
                        const avg = Math.round(
                            (result.attention + result.concentration + result.balance + result.positivity + result.calm) / 5
                        );
                        const currentUser = this._authService.getCurrentUser();
                        this._alertsService.create({
                            userID: currentUser?.id ? Number(currentUser.id) : undefined,
                            severity,
                            alertType: 'EMOTIONAL_ANALYSIS',
                            title: state === 'critical'
                                ? 'Estado emocional crítico detectado'
                                : 'Estado emocional de alerta detectado',
                            description: `Análisis emocional detectó estado ${state === 'critical' ? 'crítico' : 'de alerta'}. Emoción dominante: ${result.dominantEmotion ?? 'N/A'}. Promedio de bienestar: ${avg}%. Scores — Atención: ${result.attention}%, Concentración: ${result.concentration}%, Equilibrio: ${result.balance}%, Positividad: ${result.positivity}%, Calma: ${result.calm}%.`,
                        }).subscribe({
                            next: (alert) => {
                                if (!alert) {
                                    console.error('[EmotionalAnalysis] POST /alert respondió null — posible 403 o error de BD.');
                                }
                            },
                            error: (e) => console.error('[EmotionalAnalysis] ❌ Error al crear alerta. Status:', e?.status, e?.error),
                        });
                    }

                    // Actualizar porcentajes en los steps
                    this.steps[0].percentage = result.attention;
                    this.steps[1].percentage = result.concentration;
                    this.steps[2].percentage = result.balance;
                    this.steps[3].percentage = result.positivity;
                    this.steps[4].percentage = result.calm;

                    this.steps.forEach((s) => (s.status = 'completed'));
                    this.progress = 100;
                    this.currentStep = this.totalSteps;
                    this.isAnalyzing = false;

                    setTimeout(() => {
                        this.showResults = true;
                    }, 300);
                },
                error: (err) => {
                    const backendMsg: string =
                        err?.error?.Message ??
                        err?.error?.message ??
                        err?.error?.title ??
                        err?.error?.detail ??
                        err?.message ??
                        '';
                    this.analysisError = backendMsg.trim() || 'No se pudo analizar el rostro. Asegúrate de que tu cara esté visible y bien iluminada.';
                    this.isAnalyzing = false;
                },
            });
    }

    /**
     * Limpia recursos
     */
    cleanup(): void {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        if (this.analysisTimeoutId) {
            clearTimeout(this.analysisTimeoutId);
            this.analysisTimeoutId = null;
        }
        this._cameraService.stopCamera();
    }

    /**
     * Reinicia el análisis después de un error de backend.
     */
    retryAnalysis(): void {
        this.analysisError = '';
        this.detections = [];
        this.analysisStarted = false;
        this.progress = 0;
        this.currentStep = 1;
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });
        this.startAnalysis();
    }

    /**
     * Reintenta acceder a la cámara después de un error de hardware/permisos.
     */
    retryCamera(): void {
        this.cameraError = '';
        this.cameraErrorType = null;
        this.analysisError = '';
        this.detections = [];
        this.analysisStarted = false;
        this.isAnalyzing = true;
        this.progress = 0;
        this.currentStep = 1;
        this.steps.forEach((s, i) => {
            s.status = i === 0 ? 'active' : 'pending';
            s.percentage = 0;
        });
        // Liberar stream previo antes de reintentar
        this._cameraService.stopCamera();
        // Si el error fue permiso denegado, volver a pantalla de solicitud
        if (this.cameraPermission === 'denied') {
            this.cameraPermission = 'prompt';
            return;
        }
        if (this.videoElement?.nativeElement) {
            this.requestCameraPermission();
        }
    }

    skipAnalysis(): void {
        this.cleanup();
        this._router.navigate(['/home']);
    }

    goToEvaluations(): void {
        this.cleanup();
        this._router.navigate(['/resources']);
    }

    goToHome(): void {
        this.cleanup();
        this._router.navigate(['/home']);
    }

    startGuidedPause(): void {
        this.cleanup();
        this._router.navigate(['/resources']);
    }

    /**
     * Selecciona el contenido dinámico según resultType + dominantEmotion.
     * Elige aleatoriamente una variante de la lista disponible.
     */
    buildDynamicContent(
        resultType: 'normal' | 'emotional-load' | 'alert',
        dominantEmotion: string
    ): typeof this.dynamicContent {
        const typeKey = resultType === 'emotional-load' ? 'emotional-load' : resultType;
        const bank = this.CONTENT_LIBRARY[typeKey];
        if (!bank) return null;

        // Normalizar nombre de emoción del backend → clave interna
        const emotionMap: Record<string, string> = {
            happiness: 'happiness', happy: 'happiness',
            neutral: 'neutral',
            surprise: 'surprise', surprised: 'surprise',
            anger: 'anger', angry: 'anger',
            sadness: 'sadness', sad: 'sadness',
            fear: 'fear', fearful: 'fear',
            contempt: 'contempt', disgust: 'contempt', disgusted: 'contempt',
        };
        const key = emotionMap[dominantEmotion?.toLowerCase()] ?? 'default';
        const variants = bank[key] ?? bank['default'] ?? [];
        if (variants.length === 0) return null;

        const variant = variants[Math.floor(Math.random() * variants.length)];
        const visual = this.resultVisual;

        return {
            title: variant.title,
            iconGradient: visual.iconGradient,
            containerBorder: visual.containerBorder,
            containerBackground: visual.containerBackground,
            buttonGradient: visual.buttonGradient,
            messageText: variant.messageText,
            steps: variant.steps,
            finalMessage: variant.finalMessage,
            buttonText: variant.buttonText,
            buttonEmoji: variant.buttonEmoji,
        };
    }

    /**
     * Obtiene el color de fondo según el índice de la emoción
     */
    getStepColor(index: number): string {
        const colors = [
            '#00BBA7', // Atención - turquesa
            '#9AE600', // Concentración - verde lima
            '#00D5BE', // Equilibrio - turquesa claro
            '#B8E600', // Positividad - verde amarillo
            '#00D1C1'  // Calma - turquesa
        ];
        return colors[index] || '#00BBA7';
    }

    /**
     * Obtiene el color del texto según el índice de la emoción
     */
    getStepTextColor(index: number): string {
        const colors = [
            '#00BBA7', // Atención
            '#9AE600', // Concentración
            '#00D5BE', // Equilibrio
            '#B8E600', // Positividad
            '#00D1C1'  // Calma
        ];
        return colors[index] || '#00BBA7';
    }

    /**
     * Obtiene el icono según el ID del paso
     */
    getStepIcon(id: number): string {
        const icons = {
            1: 'icons/Icon (17).svg',
            2: 'icons/Icon (18).svg',
            3: 'icons/Icon (19).svg',
            4: 'icons/Icon (20).svg',
            5: 'icons/Icon (21).svg'
        };
        return icons[id as keyof typeof icons] || 'icons/Icon (17).svg';
    }
}
