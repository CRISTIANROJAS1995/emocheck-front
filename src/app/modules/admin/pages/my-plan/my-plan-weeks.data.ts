/**
 * Contenido semanal del Plan de Intervención de Salud Mental.
 * Cada nivel de riesgo (outcome) tiene 12 semanas personalizadas.
 *
 * Nivel de riesgo → `outcome` de AssessmentResult:
 *  • 'adequate'  → contenido preventivo / bienestar general (verde)
 *  • 'mild'      → intervención moderada (amarillo)
 *  • 'high-risk' → intervención intensiva (rojo)
 *
 * NOTA: La asignación de semanas por nivel fue determinada a partir de la
 * columna W (color de fondo) del documento "Pantalla de plan de intervención
 * (Salud mental).rtf". Ajustar si el equipo clínico realiza cambios.
 */

export type WeekRiskTier = 'adequate' | 'mild' | 'high-risk';

export interface PlanWeekData {
    /** Número de semana dentro del nivel (1–12) */
    weekNum: number;
    /** Nivel de riesgo al que pertenece esta semana */
    riskTier: WeekRiskTier;
    /** Tema clínico (columna Tema del RTF) */
    tema: string;
    /** Nombre de la actividad (columna Nombre del RTF) */
    nombre: string;
    /** Tipo de medio sugerido (columna Conecta — referencia) */
    mediaType: string;
    /** URLs públicas de recursos multimedia (S3) */
    conecta: string[];
    /** Texto psicoeducativo (columna Aprende) */
    aprende: string;
    /** Tarea de la semana (columna Actúa) */
    actua: string;
    /** Emoji representativo para la UI */
    emoji: string;
}

// ─────────────────────────────────────────────────────────────────
//  SALUD MENTAL — nivel: ADECUADO
//  Contenido preventivo / bienestar general
// ─────────────────────────────────────────────────────────────────
const MH_ADEQUATE: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'adequate',
        tema: 'Estados de ánimo', nombre: 'El universo del ánimo',
        mediaType: 'Imágenes',
        conecta: [
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I01_E.ANIMO_CONOCIMIENTO_ANSIEDAD+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I01_E.ANIMO_CONOCIMIENTO_ANSIEDAD+02.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I02_E.ANIMO_CONOCIMIENTO_DEPRESION+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I02_E.ANIMO_CONOCIMIENTO_DEPRESION+02.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I03_E.ANIMO_CONOCIMIENTO_ESTRES+01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I03_E.ANIMO_CONOCIMIENTO_ESTRES+02.png',
        ], emoji: '🌌',
        aprende: `Los estados de ánimo son experiencias emocionales más duraderas que las emociones y pueden influir en la forma en que percibes la realidad. Según la psicología afectiva, estos estados se construyen a partir de pensamientos, experiencias y condiciones biológicas.`,
        actua: `Observa tu estado de ánimo hoy y nómbralo sin juzgarlo. Puedes nombrarlo o compararlo con algo que te recuerde o asemeje esa sensación; esto facilitará las cosas a la hora de hablarlo.`,
    },
    {
        weekNum: 2, riskTier: 'adequate',
        tema: 'Calidad de sueño', nombre: 'El santuario',
        mediaType: 'Audio',
        conecta: [], emoji: '🏠',
        aprende: `El entorno influye directamente en la calidad del sueño. La higiene del sueño propone crear espacios tranquilos, oscuros y cómodos para favorecer el descanso.`,
        actua: `Ajusta tu espacio de descanso hoy; puede mejorar significativamente tu descanso. No tiene que ser el espacio ideal, solo cómodo y acorde a ti.`,
    },
    {
        weekNum: 3, riskTier: 'adequate',
        tema: 'Depresión', nombre: 'Decodificación',
        mediaType: 'Video',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/videos/V28_E.ANIMO_DESCODIFICACION.mp4'], emoji: '🔓',
        aprende: `A veces nuestra mente nos juega una mala pasada y nos dice cosas que no son ciertas, plasmando emociones como el miedo o la angustia. Tómate el tiempo y empieza a ver las cosas con otro enfoque.`,
        actua: `Antes de que asumas un pensamiento como cierto, pásalo por tu filtro de la verdad.`,
    },
    {
        weekNum: 4, riskTier: 'adequate',
        tema: 'Calidad de sueño', nombre: 'Las etapas del sueño',
        mediaType: 'Imagen',
        conecta: [
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I09_LATENCIA+DEL+SUENO_LAS+ETAPAS+DEL+SUENO-01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I09_LATENCIA+DEL+SUENO_LAS+ETAPAS+DEL+SUENO-02.png',
        ], emoji: '🌙',
        aprende: `El sueño se divide en fases (REM y No REM) que cumplen funciones clave en la recuperación física y mental. Dormir bien implica completar estos ciclos.`,
        actua: `Respetar tu horario de sueño puede cambiar tu energía durante el día. ¡Haz la prueba!`,
    },
    {
        weekNum: 5, riskTier: 'adequate',
        tema: 'Empatía', nombre: 'Si yo fuera tú',
        mediaType: 'Audio',
        conecta: [], emoji: '🤝',
        aprende: `La empatía implica comprender la experiencia emocional del otro sin perder tu propia perspectiva. No significa estar de acuerdo, sino validar que el otro siente desde su realidad. Es clave en la construcción de relaciones saludables.`,
        actua: `Hoy, ante una situación con otra persona, completa mentalmente: "Si yo estuviera en su lugar, probablemente me sentiría ____________".`,
    },
    {
        weekNum: 6, riskTier: 'adequate',
        tema: 'Escucha activa', nombre: 'Oídos despiertos',
        mediaType: 'Audio',
        conecta: [], emoji: '👂',
        aprende: `La escucha activa va más allá de oír; implica atención plena, interés genuino y ausencia de juicio. Requiere dejar de pensar en responder para enfocarse en comprender.`,
        actua: `Ponlo en práctica: escucha a alguien durante dos minutos sin interrumpir, sin aconsejar y sin distraerte. Antes de responderle, piensa cómo te gustaría que te respondieran si fueras tú quien dijo todo esto.`,
    },
    {
        weekNum: 7, riskTier: 'adequate',
        tema: 'Depresión', nombre: 'El bucle del ánimo',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I08_E.ANIMO_BUCLE+DEL+ANIMO.png'], emoji: '🔁',
        aprende: `La depresión puede mantenerse a través de un ciclo donde los pensamientos negativos, las emociones persistentes y el descuido de las rutinas se refuerzan entre sí. Identificar este bucle es el primer paso para intervenirlo y generar cambios.`,
        actua: `Identifica hoy en cuál de estos puntos estás: pensamiento, emoción o conducta. Elige uno y haz una acción pequeña para romper el ciclo (ej: cambiar un pensamiento, moverte o retomar una rutina básica).`,
    },
    {
        weekNum: 8, riskTier: 'adequate',
        tema: 'Duración del sueño / Vigilancia', nombre: 'Cronotipos',
        mediaType: 'Imágenes (carrusel)',
        conecta: [
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I10_DURACION+DEL+SUENO_CRONOTIPOS-01.png',
            'https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I10_DURACION+DEL+SUENO_CRONOTIPOS-02.png',
        ], emoji: '⏰',
        aprende: `El cuerpo funciona con ritmos circadianos que regulan el sueño y la vigilia. Reconocerlos puede ayudar a identificar los momentos más adecuados para tu descanso.`,
        actua: `Las rutinas son una de las estrategias más efectivas para nuestro organismo. Intenta dormir y despertar a la misma hora hoy.`,
    },
    {
        weekNum: 9, riskTier: 'adequate',
        tema: 'Inteligencia emocional', nombre: 'El arte de sentir',
        mediaType: 'Audio / Descargable',
        conecta: [], emoji: '🎨',
        aprende: `Así como un artista elige sus colores, el arte de sentir nos invita a reconocer cada matiz de nuestra existencia, entendiendo que las emociones son trazos necesarios para completar nuestra propia obra maestra.`,
        actua: `Toma una hoja en blanco y expresa lo que estás sintiendo, ya sea con un dibujo, un cuento o un poema. Dale libertad a tu mente. Al finalizar, observa tu creación y pregúntate: ¿Cómo me siento ahora?`,
    },
    {
        weekNum: 10, riskTier: 'adequate',
        tema: 'Los 4 pasos de la IE', nombre: 'La escalera',
        mediaType: 'Video',
        conecta: [], emoji: '🪜',
        aprende: `La inteligencia emocional se desarrolla en cuatro niveles: autoconciencia (reconocer lo que siento), autorregulación (gestionar mis reacciones), empatía (comprender al otro) y habilidades sociales (relacionarme de forma efectiva). Este proceso no es automático, se entrena y fortalece con la práctica consciente.`,
        actua: `Antes de reaccionar en una situación emocional hoy, haz una pausa de 5 segundos e identifica en qué "escalón" estás.`,
    },
    {
        weekNum: 11, riskTier: 'adequate',
        tema: 'Confianza', nombre: 'Vitamina C',
        mediaType: 'Imagen / Tarjetas frase',
        conecta: [], emoji: '✨',
        aprende: `La confianza en uno mismo se construye a partir de pequeñas experiencias de logro y coherencia entre lo que piensas, dices y haces. No es innata, se fortalece con la acción repetida.`,
        actua: `Elige una tarea que has estado evitando y da el primer paso hoy, aunque sea pequeño.`,
    },
    {
        weekNum: 12, riskTier: 'adequate',
        tema: 'Calidad del sueño', nombre: 'Tres pasos para el descanso',
        mediaType: 'Imagen (carrusel)',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I11_CALIDAD+DEL+SUENO_TRES+PASOS+PARA+EL+DESCANSO.png'], emoji: '🛌',
        aprende: `La postura al dormir influye directamente en la calidad del descanso. Mantener una adecuada alineación de la columna ayuda a reducir tensiones musculares, prevenir molestias y favorecer un sueño más reparador.`,
        actua: `Antes de dormir hoy, revisa tu postura: elige una posición cómoda (boca arriba o de lado) y ajusta tu almohada para mantener tu columna alineada. Haz un pequeño cambio y observa cómo responde tu cuerpo.`,
    },
];

// ─────────────────────────────────────────────────────────────────
//  SALUD MENTAL — nivel: LEVE (mild)
//  Intervención moderada: habilidades cognitivo-emocionales
// ─────────────────────────────────────────────────────────────────
const MH_MILD: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'mild',
        tema: 'Estrés', nombre: 'P.A.C.O.',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I37_E.ANIMO_PACO.png'], emoji: '📋',
        aprende: `El estrés muchas veces surge de la sobrecarga y la desorganización. Estrategias como planear, administrar el tiempo, comunicar necesidades y operar con orden permiten reducir la sensación de desborde.`,
        actua: `Toma una tarea pendiente y divídela en 4 pasos usando P.A.C.O. Escríbelos y empieza el primero.`,
    },
    {
        weekNum: 2, riskTier: 'mild',
        tema: 'Calidad de sueño', nombre: 'Reglas del sueño',
        mediaType: 'Imagen (carrusel)',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I13_RUTINA_10+-+3+-+2+-+1+-+0.png'], emoji: '📏',
        aprende: `A veces priorizamos ciertos hábitos sobre el descanso, agotando nuestra energía sin darnos cuenta. Pequeños cambios en nuestra rutina nocturna pueden marcar una gran diferencia.`,
        actua: `Aplica al menos dos de estas reglas hoy antes de dormir. Puedes determinar cuáles son las que más afectan tu sueño.`,
    },
    {
        weekNum: 3, riskTier: 'mild',
        tema: 'Musculoesquelético', nombre: 'La caminata',
        mediaType: 'Audio',
        conecta: [], emoji: '🚶',
        aprende: `El movimiento físico favorece la liberación de tensión muscular y mejora el estado de ánimo al activar procesos fisiológicos asociados al bienestar.`,
        actua: `Si estás pasando por algo parecido, sal y toma la caminata. Puedes usar este audio si te es de ayuda. Recuerda siempre prestar atención a tu respiración y pasos.`,
    },
    {
        weekNum: 4, riskTier: 'mild',
        tema: 'Ansiedad', nombre: 'Descarga 180°',
        mediaType: 'Video',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/videos/mindfulness/VM03_Permanece+m%C3%A1s+all%C3%A1+del+cambio.mp4'], emoji: '⚡',
        aprende: `La ansiedad no es solo un estado mental; es una respuesta física conocida como "lucha o huida". Cuando te sientes ansioso, tu sistema nervioso simpático inunda el cuerpo de cortisol y adrenalina, preparándote para la acción. Esa energía se queda "atrapada" en tus músculos y respiración — aprende a descargarla.`,
        actua: `No necesitas un entrenamiento intenso; un minuto de movimiento consciente es suficiente para cambiar tu química interna.`,
    },
    {
        weekNum: 5, riskTier: 'mild',
        tema: 'Reestructuración cognitiva', nombre: 'Agenda de preocupaciones',
        mediaType: 'Video',
        conecta: [], emoji: '📓',
        aprende: `Escribir los pensamientos permite identificarlos, cuestionarlos y reducir su impacto emocional. Externalizar la preocupación evita que se mantenga en bucle.`,
        actua: `Emocheck te recomienda: dedica 10 minutos del día a escribir todo lo que te preocupa. Al final, subraya qué sí puedes controlar.`,
    },
    {
        weekNum: 6, riskTier: 'mild',
        tema: 'Claridad emocional', nombre: 'Tiro al blanco',
        mediaType: 'Imagen / Doble cara',
        conecta: [], emoji: '🎯',
        aprende: `Nombrar con precisión una emoción permite comprenderla mejor. No es lo mismo sentirse "mal" que identificar si es tristeza, frustración o miedo. La claridad emocional mejora la regulación.`,
        actua: `Cambia la expresión "estoy mal" por una emoción específica cada vez que la uses hoy. Esto te ayudará a comprender con exactitud qué es lo que tu cuerpo está sintiendo.`,
    },
    {
        weekNum: 7, riskTier: 'mild',
        tema: 'Ansiedad', nombre: 'La habitación',
        mediaType: 'Audio',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/audios/A23_E.ANIMO_LA+HABITACION.mp4'], emoji: '🏡',
        aprende: `La ansiedad puede disminuir cuando activamos la imaginación guiada, ya que el cerebro responde a estos escenarios como si fueran reales. Crear un "lugar seguro" mental ayuda a reducir la activación del sistema nervioso y generar sensación de calma.`,
        actua: `Cada vez que sientas ansiedad hoy, haz una pausa, cierra los ojos y visualiza un solo elemento de tu habitación segura (una pared, un objeto o un sonido). Sostén esa imagen durante 5 segundos y pregúntate cómo puede ayudarte en este momento.`,
    },
    {
        weekNum: 8, riskTier: 'mild',
        tema: 'Habilidades sociales en la IE', nombre: 'Las habilidades sociales',
        mediaType: 'Audio',
        conecta: [], emoji: '🤲',
        aprende: `Las habilidades sociales son un conjunto de conductas aprendidas que facilitan relaciones sanas, basadas en el respeto, la comunicación y la empatía. Incluyen expresar opiniones, escuchar activamente y gestionar conflictos sin agresividad.`,
        actua: `En una conversación hoy, expresa una idea personal de forma clara y respetuosa, sin evitarla ni imponerla.`,
    },
    {
        weekNum: 9, riskTier: 'mild',
        tema: 'Depresión', nombre: 'Pirámide de logros',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I04_E.ANIMO_PIRAMIDE+DE+LOGROS.png'], emoji: '🏛️',
        aprende: `Como las grandes pirámides, para ser majestuoso tuviste que ser construido bloque por bloque; y así eres tú, necesitas ir elaborando cada ladrillo de tu vida.`,
        actua: `Tómate el espacio para cerrar los ojos y visualizarte como una gran escultura que se ha pulido todo este tiempo. Recuerda los materiales que te sostienen y plásmalo en un pequeño dibujo que puedas cargar en tu cartera, porque allí siempre va lo más valioso.`,
    },
    {
        weekNum: 10, riskTier: 'mild',
        tema: 'Claridad de las emociones', nombre: 'Emocionario',
        mediaType: 'Video',
        conecta: [], emoji: '📖',
        aprende: `Ampliar el vocabulario emocional aumenta la capacidad de autoconocimiento. Cuantas más palabras tengas para describir lo que sientes, mayor control tendrás sobre tus respuestas.`,
        actua: `Aprende hoy una emoción nueva (ej: melancolía, frustración, alivio) y úsala para describirte ante una situación que hayas vivido en el pasado y cómo hubieras actuado si la hubieras reconocido en ese instante.`,
    },
    {
        weekNum: 11, riskTier: 'mild',
        tema: 'Ansiedad', nombre: '¿Ansiedad al tope? Reseteo de sesenta segundos',
        mediaType: 'Secuencia musical / Video',
        conecta: [], emoji: '🔄',
        aprende: `La respiración consciente no es solo un ejercicio de calma; es el interruptor manual de tu sistema nervioso.`,
        actua: `Repite esta práctica siempre que necesites renovar tu energía para comenzar una nueva etapa con claridad.`,
    },
    {
        weekNum: 12, riskTier: 'mild',
        tema: 'Reconocimiento de la IE', nombre: 'Y tú emoción habla ¿La escuchas?',
        mediaType: 'Imagen / Caricatura',
        conecta: [], emoji: '💬',
        aprende: `Ignorar lo que sentimos no hace que desaparezca, solo lo intensifica. Reconocer las emociones permite procesarlas y tomar decisiones más alineadas con nuestro bienestar. La autoconciencia emocional es la base de la regulación.`,
        actua: `Cuando sientas una emoción intensa hoy, nómbrala en voz baja y completa la frase: "Esto que siento es ________ y es válido porque ___________".`,
    },
];

// ─────────────────────────────────────────────────────────────────
//  SALUD MENTAL — nivel: ALTO RIESGO (high-risk)
//  Intervención intensiva: ansiedad, depresión, manejo somático
// ─────────────────────────────────────────────────────────────────
const MH_HIGH_RISK: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'high-risk',
        tema: 'Depresión', nombre: 'La llamada del futuro',
        mediaType: 'Audio',
        conecta: [], emoji: '📞',
        aprende: `En ciertos momentos de nuestra vida la percepción de futuro nos limita, generando desesperanza. Por eso es bueno recordarnos a nosotros mismos todo lo que hemos caminado para estar en este punto.`,
        actua: `Ahora que te has escuchado, escribe una meta pequeña que te gustaría cumplir en los próximos días, que sabes que te hará feliz.`,
    },
    {
        weekNum: 2, riskTier: 'high-risk',
        tema: 'Musculoesquelético / Ocular', nombre: 'Reset Visual',
        mediaType: 'Video',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/videos/V01_CALIDAD+DE+SUENO_RESET+VISUAL.mp4'], emoji: '👁️',
        aprende: `La exposición prolongada a pantallas genera fatiga ocular y tensión muscular. Realizar pausas con ejercicios oculares y parpadeo consciente ayuda a relajar los ojos, mejorar su lubricación y favorecer el descanso mental.`,
        actua: `Haz una pausa de 3 minutos: con ojos cerrados mueve la mirada arriba/abajo, luego a los lados y en círculos. Cubre tus ojos con las manos 1 minuto y finaliza con parpadeos lentos.`,
    },
    {
        weekNum: 3, riskTier: 'high-risk',
        tema: 'Depresión', nombre: 'Círculos de protección',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I05_E.ANIMO_CIRCULOS+DE+PROTECCION.png'], emoji: '🔵',
        aprende: `En la vida, siempre estaremos reforzados por grandes círculos que nos rodean, espacios habitados por personas que actúan como espejos y cimientos de nuestra identidad. Estos círculos se expanden desde nuestro centro hacia el mundo, y cada uno cumple una función vital en nuestro bienestar.`,
        actua: `El diálogo externo es una herramienta poderosa para entender nuestra realidad interna. Te invitamos a llamar a alguien de confianza para transformar tus circunstancias en una reflexión compartida.`,
    },
    {
        weekNum: 4, riskTier: 'high-risk',
        tema: 'Estados de ánimo', nombre: 'Nudo en la garganta',
        mediaType: 'Video',
        conecta: [], emoji: '🔇',
        aprende: `Las expresiones no manifestadas pueden surgir en síntomas físicos. La tensión en la garganta suele estar asociada a emociones contenidas como tristeza o miedo.`,
        actua: `Te invitamos a que escribas o digas en voz alta aquello que has estado callando y que está surgiendo de otras maneras.`,
    },
    {
        weekNum: 5, riskTier: 'high-risk',
        tema: 'Estrés', nombre: 'El lenguaje corporal del estrés',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I06_E.ANIMO_EL+LENGUAJE+CORPORAL+DEL+ESTRES.png'], emoji: '💪',
        aprende: `El estrés no solo se piensa, también se expresa en el cuerpo: tensión muscular, mandíbula apretada, respiración superficial. Tomar conciencia corporal es clave para regularlo.`,
        actua: `Haz una pausa ahora: relaja hombros, suelta la mandíbula y respira profundo 3 veces.`,
    },
    {
        weekNum: 6, riskTier: 'high-risk',
        tema: 'Musculoesquelético', nombre: 'Interruptores del sueño',
        mediaType: 'Video',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/videos/V02_CALIDAD+DE+SUENO_INTERRUPTORES+DEL+SUENO.mp4'], emoji: '🌙',
        aprende: `La relajación muscular progresiva ayuda a reducir la activación del cuerpo, facilitando el descanso. El cuerpo necesita "desconectarse" para dormir mejor.`,
        actua: `Antes de dormir, tensa y relaja cada grupo muscular desde los pies hasta la cabeza como una lista en donde apagas cada interruptor de luz en tu casa.`,
    },
    {
        weekNum: 7, riskTier: 'high-risk',
        tema: 'Calidad del sueño', nombre: 'Reloj Nocturno',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I14_CALIDAD+DEL+SUENO_RELOJ+NOCTURNO-19.png'], emoji: '🌜',
        aprende: `La cantidad de horas que duermes influye directamente en tu bienestar físico y mental. Dormir poco o en exceso puede generar síntomas como fatiga, irritabilidad, dificultad para concentrarte o cambios en el estado de ánimo.`,
        actua: `Observa cuántas horas dormiste anoche y cómo te sientes hoy. Ajusta tu rutina para acercarte a un descanso reparador.`,
    },
    {
        weekNum: 8, riskTier: 'high-risk',
        tema: 'Musculoesquelético', nombre: 'Zumbido Bharami',
        mediaType: 'Video guiado',
        conecta: [], emoji: '🕉️',
        aprende: `Esta técnica de respiración proveniente del yoga genera vibraciones que ayudan a calmar el sistema nervioso, reduciendo el estrés y la ansiedad.`,
        actua: `Practícalo siempre que sientas que no puedes conciliar el sueño; puede convertirse en la llave de la relajación y el descanso de ahora en adelante.`,
    },
    {
        weekNum: 9, riskTier: 'high-risk',
        tema: 'Inteligencia emocional', nombre: 'El arte de sentir',
        mediaType: 'Audio',
        conecta: [], emoji: '🎭',
        aprende: `Así como un artista elige sus colores, el arte de sentir nos invita a reconocer cada matiz de nuestra existencia, entendiendo que las emociones son trazos necesarios para completar nuestra propia obra maestra.`,
        actua: `Toma una hoja en blanco y expresa lo que estás sintiendo, ya sea con un dibujo, un cuento o un poema. Dale libertad a tu mente. Al finalizar, observa tu creación y pregúntate: ¿Cómo me siento ahora?`,
    },
    {
        weekNum: 10, riskTier: 'high-risk',
        tema: 'Atención a las emociones', nombre: 'El semáforo',
        mediaType: 'Imagen',
        conecta: [], emoji: '🚦',
        aprende: `Esta técnica ayuda a regular impulsos: detenerse antes de reaccionar permite evaluar la situación y elegir una respuesta más consciente. Es una herramienta clave en la autorregulación.`,
        actua: `Aplica el semáforo en una situación real hoy: detente (rojo), reflexiona (amarillo), responde con calma (verde).`,
    },
    {
        weekNum: 11, riskTier: 'high-risk',
        tema: 'Educación del sueño', nombre: 'Ruta hacia el buen dormir',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I12_EDUCACION_RUTA+HACIA+EL+DORMIR.png'], emoji: '🗺️',
        aprende: `El buen descanso no depende solo de acostarse temprano, sino de hábitos previos que preparan el cuerpo y la mente. Mantener rutinas, reducir estímulos y cuidar el entorno facilita un sueño más profundo y reparador.`,
        actua: `Elige 2 hábitos de esta ruta (horario, desconexión, ambiente, cuerpo o mente) y aplícalos hoy antes de dormir. Observa cómo cambia tu descanso.`,
    },
    {
        weekNum: 12, riskTier: 'high-risk',
        tema: 'Ansiedad', nombre: 'La frecuencia de la ansiedad',
        mediaType: 'Imagen',
        conecta: ['https://material-adjunto.s3.us-east-2.amazonaws.com/imagenes/I07_E.ANIMO_LA+FRECUENCIA+DE+LA+ANSIEDAD.png'], emoji: '📡',
        aprende: `La ansiedad puede aumentar con pensamientos repetitivos y anticipatorios, volviéndose una ola de ruido. En este momento es importante enfocar tu atención en el presente usando tus sentidos.`,
        actua: `Cada vez que sientas que no comprendes lo que está pasando, separa cada cosa por medio de tus sentidos: identifica qué escuchas, qué hueles, qué ves y qué saboreas. Esta técnica es excelente para cuando la mente se siente abrumada por la incertidumbre.`,
    },
];

/** Todas las semanas de Salud Mental (36 entradas: 12 por nivel de riesgo) */
export const MH_WEEKS: PlanWeekData[] = [
    ...MH_ADEQUATE,
    ...MH_MILD,
    ...MH_HIGH_RISK,
];

// ─────────────────────────────────────────────────────────────────
//  FATIGA LABORAL — nivel: ADECUADO (verde)
//  Contenido preventivo / hábitos generales de bienestar
//  Semanas según tabla RTF (clcbpat19)
// ─────────────────────────────────────────────────────────────────
const FL_ADEQUATE: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'adequate',
        tema: 'Fatiga mental', nombre: 'Reduciendo la fatiga',
        mediaType: 'Imagen / Audio',
        conecta: [], emoji: '🧠',
        aprende: `La fatiga mental se produce cuando la capacidad de procesamiento cognitivo se ve sobrecargada por demandas continuas de atención, información o toma de decisiones. La mente tiene un límite en la cantidad de información que puede manejar de forma simultánea. Cuando este límite se supera, disminuye el rendimiento, aparecen errores, dificultad para concentrarse y sensación de saturación. Si esta sobrecarga se mantiene en el tiempo sin pausas adecuadas, puede evolucionar hacia un agotamiento más profundo.`,
        actua: `Durante el día aplica una estrategia de reducción de carga cognitiva en tres momentos: primero, elige una tarea y realízala sin multitarea. Segundo, programa una pausa consciente de al menos un minuto cada 90 minutos. Y tercero, al finalizar la jornada, identifica qué momento del día tuviste mayor saturación y qué hiciste frente a ello.`,
    },
    {
        weekNum: 2, riskTier: 'adequate',
        tema: 'Fatiga física (Visual)', nombre: 'Regla 20-20-20',
        mediaType: 'Imagen',
        conecta: [], emoji: '👁️',
        aprende: `El descanso ocular es fundamental porque nuestros ojos, al igual que el resto del cuerpo, se fatigan con el uso continuo, especialmente frente a pantallas. Mantener la vista fija durante largos periodos genera tensión en los músculos oculares, disminuye el parpadeo y puede provocar sequedad, ardor y dificultad para concentrarse. Incorporar pausas visuales permite relajar la vista, mejorar el enfoque y prevenir molestias que, a largo plazo, pueden afectar tu bienestar y desempeño.`,
        actua: `Durante tu jornada, aplica la regla 20-20-20: cada 20 minutos, detente por 20 segundos y mira un punto a 6 metros de distancia. Hazlo al menos 5 veces al día y observa cómo cambia la sensación en tus ojos y tu nivel de concentración.`,
    },
    {
        weekNum: 3, riskTier: 'adequate',
        tema: 'Motivación', nombre: 'El motor interno',
        mediaType: 'Audio',
        conecta: [], emoji: '⚙️',
        aprende: `La Teoría de la Autodeterminación plantea que la motivación no depende únicamente de factores externos, sino de tres necesidades psicológicas básicas: la autonomía (sentir que tenemos control sobre nuestras decisiones), la competencia (sentirnos capaces de realizar nuestras tareas) y la relación (sentirnos conectados con otros). Cuando estas necesidades están cubiertas, aumenta la motivación y el bienestar; cuando no, es más probable experimentar desmotivación y fatiga, especialmente en entornos laborales exigentes.`,
        actua: `Durante tu jornada, detente un momento y reflexiona: ¿En qué tarea puedo tomar una decisión propia hoy? (autonomía) ¿Qué habilidad estoy utilizando o fortaleciendo? (competencia) ¿Con quién puedo conectar o pedir apoyo? (relación). Elige una acción concreta en cada aspecto y aplícala en tu día.`,
    },
    {
        weekNum: 4, riskTier: 'adequate',
        tema: 'Dinamismo', nombre: 'Activa tu dinamismo',
        mediaType: 'Imagen',
        conecta: [], emoji: '🚀',
        aprende: `El dinamismo es la capacidad interna que nos permite mantenernos en movimiento frente a las demandas de la vida, adaptándonos a los cambios sin perder dirección. No se trata de hacer más en menos tiempo, sino de sostener una actitud activa, flexible y orientada al avance, incluso en momentos de cansancio o dificultad. Cultivar el dinamismo fortalece la motivación, la toma de decisiones y la capacidad de transformar los retos en oportunidades de crecimiento.`,
        actua: `Hoy elige una tarea que hayas estado postergando. Divídela en una acción pequeña y concreta. Dedícale solo 2 minutos con total atención. Antes de iniciar, toma una respiración profunda (inhala en 3, exhala en 3). Al finalizar, reconoce ese paso como un avance. Recuerda: el dinamismo no está en hacer todo, sino en no quedarte quieto.`,
    },
    {
        weekNum: 5, riskTier: 'adequate',
        tema: 'Fatiga general', nombre: 'Comida para tu cerebro',
        mediaType: 'Imagen',
        conecta: [], emoji: '🥗',
        aprende: `La forma en que nos alimentamos impacta directamente la eficiencia con la que respondemos a las demandas diarias. Más allá de "tener energía", una nutrición adecuada favorece procesos como la atención, la toma de decisiones y la regulación emocional. Cuando el cuerpo no recibe los nutrientes necesarios, aumenta la sensación de cansancio, disminuye el rendimiento y se incrementa la probabilidad de errores. Por ello, la alimentación se convierte en una herramienta clave para sostener el equilibrio físico y mental durante la jornada laboral.`,
        actua: `Durante tu jornada laboral, pon a prueba un ingrediente que favorezca tu energía (como frutos secos, fruta o alimentos ricos en proteína). Prepara un snack sencillo antes de iniciar tu día. Consúmelo en un momento donde normalmente sientas mayor cansancio. Observa cómo influye en tu nivel de energía, concentración y disposición. No olvides siempre hidratarte.`,
    },
    {
        weekNum: 6, riskTier: 'adequate',
        tema: 'Dinamismo', nombre: 'La alegría de hacer',
        mediaType: 'Imagen',
        conecta: [], emoji: '🎉',
        aprende: `El bienestar no depende únicamente de cómo nos sentimos, sino también de lo que hacemos cada día. Desde la psicología positiva, Martin Seligman propone el modelo PERMA, el cual plantea que el bienestar se construye al activar emociones positivas (P), involucrarnos en actividades que generan concentración y disfrute (E), fortalecer nuestras relaciones (R), encontrar sentido en lo que hacemos (M) y alcanzar logros, incluso pequeños (A). Muchas veces no actuamos porque nos sentimos bien, sino que empezamos a sentirnos mejor porque actuamos.`,
        actua: `Observa la variedad de actividades que puedes realizar. Elige una y llévala a la práctica. Luego, evalúa tu experiencia: P (Emoción positiva): ¿Qué emoción positiva me generó? E (Compromiso): ¿Cómo me ayudó a enfocarme? R (Relaciones): ¿Cómo me permitió conectar con otros? M (Sentido): ¿Por qué fue importante para mí? A (Logro): ¿Qué logré?`,
    },
    {
        weekNum: 7, riskTier: 'adequate',
        tema: 'Fatiga mental', nombre: 'Sonidos del espacio',
        mediaType: 'Audio',
        conecta: [], emoji: '🎵',
        aprende: `La fatiga mental no aparece solo por trabajar mucho, sino por sostener la atención durante largos periodos sin pausas reales. Cuando esto pasa, el cerebro entra en saturación: cuesta concentrarse, aumenta la irritabilidad y disminuye la claridad para pensar. En lugar de forzarte a seguir, lo más efectivo es hacer una pausa distinta, una que no implique más estímulos ni más exigencia. Los sonidos suaves o imaginados ayudan a que el cerebro baje el ritmo, se desconecte del exceso de información y comience a reorganizarse de manera natural.`,
        actua: `Hoy vas a practicar esta pausa al menos dos veces: una en medio de tu jornada laboral y otra cuando sientas saturación. No necesitas más de un minuto, pero es clave que lo hagas sin distracciones. La intención no es desconectarte del mundo, sino permitir que tu mente descanse de verdad.`,
    },
    {
        weekNum: 8, riskTier: 'adequate',
        tema: 'Fatiga física', nombre: 'Escaneo corporal activo',
        mediaType: 'Audio / Video',
        conecta: [], emoji: '🔎',
        aprende: `Durante la jornada laboral, el cuerpo acumula tensión de manera progresiva, especialmente cuando se mantienen posturas prolongadas o se trabaja bajo presión. Esta tensión muchas veces pasa desapercibida hasta que se manifiesta en molestias físicas o fatiga general. El escaneo corporal es una herramienta que permite reconectar con el cuerpo, identificar señales tempranas de sobrecarga y liberar tensión de forma consciente.`,
        actua: `Durante tu jornada tómate unos segundos para hacer una revisión corporal cada 2-3 horas. Identifica al menos una zona de tensión. Realiza un ajuste inmediato (relajar, mover, cambiar postura). No esperes al dolor para intervenir; tu cuerpo no solo trabaja contigo, también necesita que lo escuches.`,
    },
    {
        weekNum: 9, riskTier: 'adequate',
        tema: 'Motivación', nombre: 'Auto conociéndome',
        mediaType: 'Imagen',
        conecta: [], emoji: '🔍',
        aprende: `Muchas veces sentimos cansancio sin entender de dónde viene. No siempre es por la cantidad de tareas, sino por hacer cosas que no están alineadas con nuestras necesidades o por no poner límites. El autoconocimiento no es solo saber quién eres, sino reconocer qué te desgasta, qué toleras y qué necesitas cambiar. Cuando identificas esto, puedes tomar decisiones más coherentes contigo y proteger tu energía.`,
        actua: `Hoy vas a elegir una sola acción concreta basada en lo que identificaste. Puede ser decir "no", posponer algo, pedir ayuda o simplemente reducir una exigencia contigo. No busques cambiar todo de una vez. Al final del día, revisa cómo te sentiste al hacerlo.`,
    },
    {
        weekNum: 10, riskTier: 'adequate',
        tema: 'Fatiga general', nombre: 'Semáforo del cansancio',
        mediaType: 'Imagen',
        conecta: [], emoji: '🚦',
        aprende: `No todos los momentos del día tienen la misma energía, pero muchas veces actuamos como si sí. Esto genera mayor desgaste porque exigimos lo mismo incluso cuando estamos agotados. Reconocer tu nivel de energía te permite tomar decisiones más inteligentes: cuándo avanzar, cuándo sostener y cuándo parar.`,
        actua: `Durante el día, haz este ejercicio tres veces: mañana, tarde y noche. Cada vez que identifiques tu color, ajusta una acción. Si estás en rojo, reduce una tarea. Si estás en amarillo, organiza. Si estás en verde, avanza en algo importante. La clave es actuar según tu energía, no en contra de ella.`,
    },
    {
        weekNum: 11, riskTier: 'adequate',
        tema: 'Motivación', nombre: 'Sala de control',
        mediaType: 'Imagen',
        conecta: [], emoji: '🕹️',
        aprende: `En la jornada laboral no siempre podemos controlar lo que sucede, pero sí cómo respondemos desde nuestros pensamientos, emociones y acciones, siempre van a estar conectados a las soluciones que brindamos en cada situación. Tomar conciencia de estos elementos permite hacer ajustes que favorecen el bienestar y el desempeño, además de reconocer que existen factores que no tienes a tu disposición y tienes que aprender a solventarlos sin dejarte afectar.`,
        actua: `Cada vez que te encuentres en una situación donde no sabes cómo reaccionar, recuerda cuáles son los botones que tienes a tu alcance y cómo pueden ayudarte para solucionarlo.`,
    },
    {
        weekNum: 12, riskTier: 'adequate',
        tema: 'Fatiga mental', nombre: 'Descarga cognitiva',
        mediaType: 'Imagen',
        conecta: [], emoji: '📤',
        aprende: `El cerebro no está diseñado para almacenar múltiples pendientes sin organizarlos. Cuando mantienes muchas tareas en mente al mismo tiempo, se activa de forma constante la memoria de trabajo, un sistema con capacidad limitada. Cuando esta se sobrecarga, aparecen señales como dificultad para concentrarte, olvidos, sensación de saturación y mayor fatiga mental. El cerebro tiende a mantener activas las tareas inconclusas (efecto Zeigarnik), lo que genera un "ruido mental" constante. Escribir y organizar lo pendiente permite liberar esa carga interna.`,
        actua: `Antes de iniciar tu jornada escribe todos tus pendientes, elige una forma simple de organizarlos: agrupar, ordenar o clasificar. Regla clave: No empieces tu día con la mente saturada.`,
    },
];

// ─────────────────────────────────────────────────────────────────
//  FATIGA LABORAL — nivel: LEVE (amarillo)
//  Manejo del cansancio, autoconciencia y organización cognitiva
//  Semanas según tabla RTF (clcbpat7)
// ─────────────────────────────────────────────────────────────────
const FL_MILD: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'mild',
        tema: 'Fatiga mental', nombre: 'Agrupar para recordar',
        mediaType: 'Imagen',
        conecta: [], emoji: '📊',
        aprende: `Cuando intentas manejar demasiada información al mismo tiempo, tu mente no se vuelve más eficiente, se sobrecarga. La fatiga mental no siempre está relacionada con la cantidad de trabajo, sino con la forma en que lo organizas. El desorden obliga a tu cerebro a hacer un esfuerzo adicional para entender, priorizar y recordar, lo que aumenta el cansancio y reduce la claridad. Por el contrario, cuando estructuras la información en grupos simples, reduces la carga mental y facilitas la toma de decisiones.`,
        actua: `Utiliza la Matriz de Eisenhower: ten en cuenta esta matriz, trata de organizar las diferentes tareas y clasifica en qué parte de la cuadrícula está cada una. Así mismo puedes determinar cuándo priorizar y cuándo se puede delegar.`,
    },
    {
        weekNum: 2, riskTier: 'mild',
        tema: 'Fatiga física', nombre: 'Micro-recuperación',
        mediaType: 'Audio',
        conecta: [], emoji: '⏸️',
        aprende: `Durante la jornada laboral, las personas suelen mantenerse en un estado constante de exigencia física y mental sin espacios de recuperación. Desde la evidencia en salud ocupacional, se ha demostrado que la falta de pausas incrementa la fatiga, disminuye el rendimiento y aumenta el riesgo de molestias musculares. Las micro-recuperaciones, como las pausas activas, permiten interrumpir esta acumulación de carga, favoreciendo la circulación, reduciendo la tensión muscular y restaurando la energía.`,
        actua: `Haz una pausa breve de 1 minuto: estírate, muévete, respira. Cada vez que sientas carga o lleves mucho tiempo sin moverte. No se trata de dejar de trabajar, sino de sostener el trabajo de manera más saludable.`,
    },
    {
        weekNum: 3, riskTier: 'mild',
        tema: 'Motivación', nombre: 'La escalera de la autoestima',
        mediaType: 'Imagen',
        conecta: [], emoji: '🪜',
        aprende: `La autoestima no es algo que simplemente se tiene o no se tiene; es un proceso que se construye en la forma en que te percibes, te hablas y actúas contigo mismo cada día. No empieza en la confianza, empieza en el conocimiento y se fortalece cuando pasas de juzgarte a tratarte con mayor conciencia y respeto. No es un punto de llegada, es una construcción continua.`,
        actua: `Sube un escalón hoy. Elige uno de los niveles de la escalera y trabájalo de forma intencional: Autoconocimiento: escribe 3 cosas que identificas de ti hoy. Autoconcepto: descríbete sin usar críticas. Autoevaluación: detecta un juicio duro y cámbialo por uno más justo. Autoaceptación: reconoce algo que te cuesta aceptar. Autorespeto: toma una decisión que te cuide.`,
    },
    {
        weekNum: 4, riskTier: 'mild',
        tema: 'Dinamismo', nombre: 'Anclaje atencional',
        mediaType: 'Imagen',
        conecta: [], emoji: '⚓',
        aprende: `La atención no es un recurso constante, fluctúa según el entorno, la carga de trabajo y el estado mental. En contextos laborales, es común experimentar distracción, sobrecarga o dificultad para mantener el enfoque. Intentar eliminar todas las distracciones no es realista; en cambio, entrenar la capacidad de regresar al foco resulta más efectivo. Los anclajes atencionales son herramientas simples que permiten estabilizar la atención, facilitando la continuidad en las tareas y reduciendo el desgaste mental.`,
        actua: `Cuando sientas que pierdes el foco, elige un elemento cercano y conviértelo en tu ancla de atención. Puede ser cualquier objeto dentro de tu entorno: una pantalla, una libreta, un objeto en tu escritorio o tu propia respiración. Cada vez que ese elemento esté en tu campo visual, úsalo como señal para regresar al presente y retomar tu tarea.`,
    },
    {
        weekNum: 5, riskTier: 'mild',
        tema: 'Fatiga general', nombre: 'Chequeo de energía',
        mediaType: 'Imagen',
        conecta: [], emoji: '⚡',
        aprende: `La fatiga no siempre se manifiesta de la misma forma. A veces sientes el cuerpo cansado, otras veces es tu mente la que no se enfoca, o tus emociones las que afectan tu energía. Evaluarte como si siempre estuvieras igual puede llevarte a exigirte de más o a no entender lo que realmente necesitas. Reconocer cómo está tu energía en diferentes dimensiones te permite tomar decisiones más ajustadas y evitar un desgaste innecesario.`,
        actua: `Antes de iniciar tu jornada o una tarea importante tómate el tiempo y pon a prueba el radar, dibújalo en una hoja y evalúa cada nivel, identifica cuál es el más bajo y proponte una estrategia que más se adecua a ti. Si es físico: haz una pausa o baja el ritmo.`,
    },
    {
        weekNum: 6, riskTier: 'mild',
        tema: 'Fatiga mental', nombre: 'Tomando las decisiones',
        mediaType: 'Imagen (flujograma)',
        conecta: [], emoji: '🗺️',
        aprende: `La toma de decisiones es un proceso cognitivo que depende de la corteza prefrontal, la cual se encarga de analizar información, priorizar y elegir entre opciones. Sin embargo, cuando existe fatiga mental, esta capacidad se ve afectada, generando mayor dificultad para decidir, tendencia a postergar o elección de alternativas más simples. Reducir la cantidad de decisiones simultáneas y aplicar criterios básicos de priorización permite mantener la claridad y disminuir el desgaste cognitivo.`,
        actua: `Usa el flujograma si te llegas a sentir perdido. A veces tener una guía nos enfoca con mayor rapidez ante las situaciones. Aplícalo para la siguiente decisión importante que debas tomar hoy.`,
    },
    {
        weekNum: 7, riskTier: 'mild',
        tema: 'Fatiga mental', nombre: 'El lienzo',
        mediaType: 'Imagen',
        conecta: [], emoji: '🎨',
        aprende: `Cuando te sientes cansado, es común pensar que necesitas detenerte o exigirle más a tu mente para avanzar. Sin embargo, el exceso de pensamiento puede aumentar la fatiga. El cerebro también se regula a través de la acción. Actividades simples como doblar, dibujar o mover el cuerpo permiten cambiar el tipo de esfuerzo mental, facilitando la recuperación.`,
        actua: `"Activa sin pensar": cuando te sientas saturado, elige una de estas acciones: crear, doblar, pintar, mover o moldear. Hazla durante 3 a 5 minutos. Evita analizar o evaluar, solo haz la actividad. Condición clave: no debe tener un objetivo productivo, solo activación. Al terminar, pregúntate: ¿Mi mente se siente igual o más ligera?`,
    },
    {
        weekNum: 8, riskTier: 'mild',
        tema: 'Fatiga física', nombre: 'Liberación muscular',
        mediaType: 'Audio / Video',
        conecta: [], emoji: '🧘',
        aprende: `El cuerpo acumula el estrés que no expresamos. La tensión muscular sostenida es una respuesta fisiológica al estrés. Cuando se mantiene en el tiempo, genera fatiga, dolor y disminución del rendimiento. La relajación progresiva permite diferenciar entre tensión y distensión, facilitando la regulación del sistema nervioso y promoviendo estados de reposo.`,
        actua: `Realiza este ejercicio al finalizar tu jornada o cuando sientas tensión acumulada. Hazlo con calma, sin prisa, prestando atención a las sensaciones. Tensa y relaja cada grupo muscular progresivamente. Con la práctica, aprenderás a reconocer más rápido cuándo tu cuerpo necesita soltar.`,
    },
    {
        weekNum: 9, riskTier: 'mild',
        tema: 'Motivación', nombre: 'El jardín',
        mediaType: 'Imagen',
        conecta: [], emoji: '🌱',
        aprende: `Muchas veces asociamos la motivación con sentir ganas de hacer las cosas, pero en la práctica, esa motivación es inestable. Hay días en los que aparece y otros en los que no. Si dependes solo de ella, tu avance también será inestable. Al igual que un jardín, los resultados no dependen de un momento de esfuerzo, sino de acciones repetidas en el tiempo. La constancia, incluso en días sin motivación, es lo que realmente genera cambios visibles y sostenibles.`,
        actua: `Cuando la motivación no se asoma, la constancia es una buena aliada. Toma una acción pequeña, clara y repetible (ej: 10 minutos de una tarea). Define el momento fijo: hazla siempre en el mismo momento del día. Reduce la exigencia: debe ser tan simple que puedas hacerlo incluso en un mal día. La constancia vale más que la intensidad.`,
    },
    {
        weekNum: 10, riskTier: 'mild',
        tema: 'Fatiga general', nombre: 'Chequeo emocional antes de decidir',
        mediaType: 'Audio (60 seg)',
        conecta: [], emoji: '🧪',
        aprende: `Las decisiones tomadas desde el cansancio o la carga emocional suelen ser impulsivas o poco acertadas. Las emociones pueden gestionarse antes de que aparezcan completamente (selección de la situación, modificación, atención) o después, mediante la reinterpretación y la modulación de la respuesta. Aplicar un chequeo emocional permite intervenir en ese proceso, favoreciendo respuestas más adaptativas.`,
        actua: `Aplica este chequeo hoy antes de cualquier decisión importante. Pregúntate qué estás sintiendo en este momento: ¿hay cansancio, molestia o frustración? Observa tu cuerpo: ¿está tenso, agotado o inquieto? Si identificas que estás alterado o cansado, pospone la decisión unos minutos. Decidir desde la calma siempre será más acertado.`,
    },
    {
        weekNum: 11, riskTier: 'mild',
        tema: 'Motivación', nombre: 'Vida saludable',
        mediaType: 'Audio (45 seg)',
        conecta: [], emoji: '🌿',
        aprende: `Los estilos de vida saludable se refieren al conjunto de hábitos y comportamientos cotidianos que influyen directamente en la salud y el bienestar. Estos incluyen dimensiones como el descanso, la alimentación, la actividad física, la gestión emocional y las relaciones interpersonales. La evidencia muestra que no es un solo hábito el que genera bienestar, sino la interacción entre varios de ellos. Cuando alguno se ve afectado, puede aparecer fatiga, desmotivación o sensación de desequilibrio.`,
        actua: `Hoy identifica una dimensión de tu estilo de vida que esté descuidada: puede ser el descanso, la alimentación, el movimiento o tu estado emocional. Elige una acción concreta y realista para intervenirla. Lo importante no es hacerlo perfecto, sino empezar a construir un cambio sostenible.`,
    },
    {
        weekNum: 12, riskTier: 'mild',
        tema: 'Fatiga física', nombre: 'Batería corporal',
        mediaType: 'Imagen',
        conecta: [], emoji: '🔋',
        aprende: `El cansancio físico no aparece de un momento a otro; se acumula a lo largo del día. Permanecer en la misma postura, ignorar las señales del cuerpo o continuar sin pausas hace que tu energía disminuya progresivamente. Muchas veces se intenta rendir más sin recuperar, cuando en realidad el cuerpo necesita pequeñas intervenciones para mantenerse activo.`,
        actua: `Cada vez que sientas una señal de cansancio (rigidez, tensión, pesadez), haz una sola acción física durante 1-2 minutos: estirarte, ponerte de pie, caminar un poco, mover hombros o cuello. Regla clave: No ignores la señal. Responde en el momento.`,
    },
];

// ─────────────────────────────────────────────────────────────────
//  FATIGA LABORAL — nivel: ALTO RIESGO (rojo)
//  Intervención intensiva: fatiga física, regulación y recuperación
//  Semanas según tabla RTF (clcbpat6)
// ─────────────────────────────────────────────────────────────────
const FL_HIGH_RISK: PlanWeekData[] = [
    {
        weekNum: 1, riskTier: 'high-risk',
        tema: 'Fatiga mental', nombre: 'Conoce tu control de mando',
        mediaType: 'Imagen',
        conecta: [], emoji: '🧠',
        aprende: `Nuestro cuerpo funciona como un sistema integrado, donde cada órgano cumple una función coordinada bajo la dirección del sistema nervioso central, formado por el cerebro y la médula espinal. Por su parte, el sistema nervioso periférico conecta este centro con el resto del cuerpo, permitiendo percibir estímulos, generar respuestas y regular funciones como el movimiento, las emociones y los procesos automáticos.`,
        actua: `Escucharte es el primer paso para mantener tu bienestar. Tu sistema nervioso cumple un papel fundamental al brindarte información sobre cómo te sientes. Cuando sientas que está bloqueado o que no logras identificar lo que ocurre, detente un momento, toma una pausa y presta atención a las señales que tu cuerpo y emociones están transmitiendo.`,
    },
    {
        weekNum: 2, riskTier: 'high-risk',
        tema: 'Fatiga física', nombre: 'Ritmo personal',
        mediaType: 'Imagen',
        conecta: [], emoji: '🎵',
        aprende: `La fatiga física no solo se manifiesta como cansancio extremo, sino como una serie de cambios progresivos en el cuerpo y el rendimiento. Alteraciones en la respiración, la coordinación, la energía y la percepción del esfuerzo son señales de que el organismo está perdiendo capacidad de respuesta. Reconocer estas señales permite intervenir a tiempo y evitar un mayor desgaste.`,
        actua: `Tu cuerpo funciona como una canción, no siempre estás al mismo ritmo. ¿Qué hacer según el ritmo con el que se mueve tu cuerpo en este momento? Ritmo alto: Aprovecha para tareas importantes o complejas. Ritmo medio: Mantén tareas operativas. Ritmo bajo: Reduce la exigencia, haz pausas o tareas simples.`,
    },
    {
        weekNum: 3, riskTier: 'high-risk',
        tema: 'Motivación', nombre: 'Más allá de la motivación',
        mediaType: 'Imagen',
        conecta: [], emoji: '💡',
        aprende: `No toda la motivación funciona igual. En muchos casos, las personas realizan sus tareas por factores externos como el salario, el cumplimiento o la presión, lo cual puede ser útil en el corto plazo. Sin embargo, cuando no existe una conexión personal con lo que se hace, la motivación tiende a disminuir rápidamente. Por el contrario, cuando encuentras sentido, interés o satisfacción en la actividad, la motivación se vuelve más estable. Comprender qué te mueve te permite sostener mejor tu esfuerzo y reducir el desgaste.`,
        actua: `Antes de iniciar una tarea, pregúntate: ¿Qué parte de esto puede tener sentido para mí? No necesitas amar la tarea, solo encontrar una razón personal para hacerla. Si no puedes cambiar la tarea, cambia la forma en que la interpretas.`,
    },
    {
        weekNum: 4, riskTier: 'high-risk',
        tema: 'Fatiga general', nombre: 'La regla de 3',
        mediaType: 'Imagen',
        conecta: [], emoji: '3️⃣',
        aprende: `La visualización funcional es una estrategia cognitiva que permite anticipar mentalmente una acción antes de ejecutarla. Este proceso activa redes neuronales relacionadas con la planificación y el movimiento, facilitando la organización de la tarea y reduciendo la incertidumbre. En contextos de fatiga mental, visualizar los pasos a seguir ayuda a disminuir la carga cognitiva, mejorar la toma de decisiones y aumentar la eficiencia en la ejecución.`,
        actua: `Antes de empezar, recorre mentalmente la tarea y luego ejecútala con claridad. Identifica las 3 acciones clave del día y enfócate en completarlas una a la vez.`,
    },
    {
        weekNum: 5, riskTier: 'high-risk',
        tema: 'Motivación', nombre: 'Autoeficacia',
        mediaType: 'Audio (45 seg)',
        conecta: [], emoji: '💪',
        aprende: `La autoeficacia se refiere a la creencia que tiene una persona sobre su capacidad para organizar y ejecutar acciones necesarias para manejar situaciones. Esta percepción influye directamente en la motivación, el esfuerzo y la persistencia. Sin embargo, la autoeficacia no implica autosuficiencia absoluta; incluye la capacidad de reconocer límites, gestionar recursos y apoyarse en otros cuando es necesario.`,
        actua: `Hoy identifica una situación en la que estés asumiendo más de lo que puedes sostener cómodamente. Elige una acción concreta: delegar, pedir ayuda o simplemente expresar que necesitas apoyo. Hazlo sin justificarte ni minimizarlo. Al final del día, reflexiona cómo cambió tu nivel de carga al permitirte no hacerlo todo solo.`,
    },
    {
        weekNum: 6, riskTier: 'high-risk',
        tema: 'Fatiga física', nombre: 'Movimiento consciente',
        mediaType: 'Imagen (dado)',
        conecta: [], emoji: '🎲',
        aprende: `Permanecer en la misma postura durante largos periodos genera acumulación de tensión en músculos y articulaciones. Este tipo de fatiga no siempre se percibe de inmediato, pero con el tiempo afecta la comodidad, la energía y el rendimiento. El cuerpo necesita movimiento para mantenerse funcional. Incorporar pausas activas no implica dejar de trabajar, sino permitir que el cuerpo recupere movilidad y reduzca la carga acumulada.`,
        actua: `Cada vez que sientas rigidez o lleves mucho tiempo en la misma posición, lanza el dado y realiza el movimiento indicado durante 1-2 minutos. Movimientos simples, realizados de forma consciente, pueden marcar una diferencia significativa en tu bienestar físico.`,
    },
    {
        weekNum: 7, riskTier: 'high-risk',
        tema: 'Fatiga mental', nombre: '5-4-3-2-1',
        mediaType: 'Audio / Video',
        conecta: [], emoji: '🎯',
        aprende: `Cuando la mente está saturada, intentar pensar más o esforzarte más no siempre es la solución. La fatiga mental reduce tu capacidad de concentración, claridad y toma de decisiones. En estos momentos, dirigir la atención hacia estímulos simples y presentes permite que el cerebro reduzca la sobrecarga y recupere el equilibrio. Esta técnica no busca que hagas más, sino que cambies el foco de tu atención para facilitar la recuperación cognitiva.`,
        actua: `Cuando te sientas saturado, aplica la secuencia 5-4-3-2-1 completa, sin prisa, enfocándote en cada paso. Identifica: 5 cosas que ves, 4 que puedes tocar, 3 que escuchas, 2 que hueles, 1 que saboreas. Tu mente no siempre necesita avanzar, a veces necesita volver al presente.`,
    },
    {
        weekNum: 8, riskTier: 'high-risk',
        tema: 'Motivación', nombre: 'Los muros de protección',
        mediaType: 'Imagen',
        conecta: [], emoji: '🏰',
        aprende: `La dificultad para establecer límites en el entorno laboral es una de las principales causas de fatiga y sobrecarga. Cuando una persona asume más tareas de las que puede gestionar, su energía se dispersa, disminuye la calidad de su trabajo y aumenta el desgaste físico y mental. Los límites personales permiten regular la interacción con el entorno, organizar las demandas y proteger el rendimiento.`,
        actua: `Haz una pausa, evalúa y decide con intención. Elegir cuándo decir sí también implica saber cuándo decir no. Identifica hoy una situación donde puedas establecer un límite saludable y practica comunicarlo de forma asertiva.`,
    },
    {
        weekNum: 9, riskTier: 'high-risk',
        tema: 'Fatiga general', nombre: 'Armando el cansancio',
        mediaType: 'Imagen',
        conecta: [], emoji: '🧩',
        aprende: `La fatiga laboral no aparece de un momento a otro; se va construyendo, pieza a pieza, como si fuéramos armando el cansancio sin darnos cuenta. A nivel mental se evidencia en la dificultad para concentrarse, olvidos frecuentes y sensación de saturación. A nivel físico, en tensión muscular, cansancio persistente y somnolencia. A nivel emocional, en irritabilidad, desmotivación y frustración. Reconocer cómo se va armando este cansancio es clave para intervenir a tiempo y recuperar el equilibrio.`,
        actua: `Hoy identifica qué tipo de fatiga predomina en ti y escribe una señal clara que la represente (por ejemplo: "me cuesta concentrarme" o "me siento sin energía"). Define una acción concreta: puede ser hacer una pausa, ajustar una carga o hablar con un profesional. El objetivo no es resolver todo hoy, sino dar un paso consciente hacia tu bienestar.`,
    },
    {
        weekNum: 10, riskTier: 'high-risk',
        tema: 'Fatiga general', nombre: 'Avanzando',
        mediaType: 'Imagen',
        conecta: [], emoji: '🏁',
        aprende: `La fatiga es una respuesta multidimensional que puede manifestarse a nivel físico, mental, emocional o generalizado. No solo implica cansancio, sino una disminución en la capacidad de funcionamiento. Identificar el tipo de fatiga es clave para intervenir de manera adecuada. Cuando esta se mantiene en el tiempo, puede afectar el bienestar y el desempeño, por lo que reconocer sus señales tempranas y considerar apoyo profesional se convierte en una estrategia de prevención y recuperación.`,
        actua: `Hoy vas a hacer un ejercicio de reconocimiento: identifica qué tipo de fatiga predomina en ti y escribe una señal clara que la represente. Define una acción concreta: puede ser hacer una pausa, ajustar una carga o considerar hablar con un profesional. El objetivo no es resolver todo hoy, sino dar un paso consciente hacia tu bienestar.`,
    },
    {
        weekNum: 11, riskTier: 'high-risk',
        tema: 'Motivación', nombre: 'Diálogo consciente',
        mediaType: 'Imagen',
        conecta: [], emoji: '💬',
        aprende: `En el entorno laboral, muchas reacciones emocionales no provienen directamente de lo que otros dicen, sino de la interpretación que hacemos de esos mensajes. Cuando existe fatiga o sobrecarga, el cerebro tiende a responder de forma automática, priorizando la emoción sobre el análisis. Aprender a diferenciar entre el mensaje real y la interpretación permite reducir conflictos, mejorar la comunicación y tomar decisiones más conscientes en la interacción con otros.`,
        actua: `Reconocer lo que está sintiendo tu cuerpo y cómo manifiesta el agotamiento es una señal para hacer una pausa consciente e identificar qué necesitas para recargar tu energía interna. Toma una caminata que te permita recargar y organizar todas las fichas que están sueltas o en el lugar equivocado.`,
    },
    {
        weekNum: 12, riskTier: 'high-risk',
        tema: 'Dinamismo', nombre: 'Bloques de enfoque',
        mediaType: 'Animación',
        conecta: [], emoji: '🧱',
        aprende: `La atención sostenida es una capacidad limitada del cerebro que permite concentrarse en una tarea durante un periodo de tiempo. Sin embargo, las interrupciones constantes y la multitarea generan un alto costo cognitivo, ya que el cerebro debe reorganizarse cada vez que cambia de actividad. Este proceso aumenta la fatiga mental y reduce la eficiencia. Trabajar en bloques de enfoque permite optimizar la energía, disminuir la dispersión y mejorar el rendimiento en las tareas.`,
        actua: `Trabaja en un solo bloque, sin interrupciones, y permite que tu atención se mantenga en una sola tarea hasta lograr un avance real. Elige un bloque de 25-45 minutos y compromete toda tu atención a una única tarea.`,
    },
];
/** Todas las semanas de Fatiga Laboral (36 entradas: 12 por nivel de riesgo) */
export const FL_WEEKS: PlanWeekData[] = [
    ...FL_ADEQUATE,
    ...FL_MILD,
    ...FL_HIGH_RISK,
];
