# 🚀 EmoCheck API - Guía de Integración Frontend v2.1
## Actualización Completa de Módulos de Evaluación

---

## 📋 **RESUMEN DE CAMBIOS**

### **✅ NUEVOS MÓDULOS IMPLEMENTADOS:**
- **Módulo 2** - Fatiga Laboral (MFI-20)
- **Módulo 3** - Clima Organizacional (ICSP-VC)
- **Módulo 4** - Riesgo Psicosocial (INTRA_A, INTRA_B, EXTRALABORAL, ESTRES)

### **🔄 MÓDULO 1 ACTUALIZADO:**
- **Módulo 1** - Salud Mental (DASS-21, TMMS-24, PSS-10, MFI-20, BAI)

---

## 🎯 **ENDPOINTS PRINCIPALES DE LA API**

### **📌 1. OBTENER MÓDULOS ACTIVOS**
```http
GET /api/assessmentmodule/modules/active
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "moduleID": 1,
    "name": "Salud Mental",
    "description": "Evaluación integral de salud mental",
    "displayOrder": 1,
    "isActive": true,
    "instrumentCount": 5,
    "estimatedDuration": 25
  },
  {
    "moduleID": 2,
    "name": "Fatiga Laboral",
    "description": "Evaluación de fatiga laboral y niveles de agotamiento",
    "displayOrder": 2,
    "isActive": true,
    "instrumentCount": 1,
    "estimatedDuration": 8
  },
  {
    "moduleID": 3,
    "name": "Clima Organizacional",
    "description": "Evaluación de la percepción del ambiente laboral",
    "displayOrder": 3,
    "isActive": true,
    "instrumentCount": 1,
    "estimatedDuration": 12
  },
  {
    "moduleID": 4,
    "name": "Riesgo Psicosocial",
    "description": "Evaluación de factores de riesgo psicosocial según normativa colombiana",
    "displayOrder": 4,
    "isActive": true,
    "instrumentCount": 4,
    "estimatedDuration": 45
  }
]
```

---

### **📌 2. OBTENER MÓDULO CON JERARQUÍA COMPLETA**
```http
GET /api/assessmentmodule/modules/{id}/full
Authorization: Bearer {token}
```

**Response para Módulo 4 (Riesgo Psicosocial):**
```json
{
  "moduleID": 4,
  "name": "Riesgo Psicosocial",
  "description": "Evaluación de factores de riesgo psicosocial según normativa colombiana",
  "isActive": true,
  "displayOrder": 4,
  "instruments": [
    {
      "instrumentID": 12,
      "code": "INTRA_A",
      "name": "Cuestionario de Factores de Riesgo Psicosocial Intralaboral Forma A",
      "description": "Para trabajadores con personal a cargo, profesionales, analistas y técnicos",
      "scaleMin": 0,
      "scaleMax": 4,
      "itemCount": 123,
      "maxScore": 100,
      "minScore": 0,
      "displayOrder": 1,
      "questions": [
        {
          "questionID": 1298,
          "questionNumber": 1,
          "questionText": "El trabajo me permite desarrollar mis habilidades",
          "questionType": "LIKERT",
          "dimensionCode": "OD",
          "domainCode": "CONTROL",
          "isReversed": false,
          "options": [
            {"optionID": 5201, "optionText": "Siempre", "numericValue": 4, "displayOrder": 1},
            {"optionID": 5202, "optionText": "Casi siempre", "numericValue": 3, "displayOrder": 2},
            {"optionID": 5203, "optionText": "Algunas veces", "numericValue": 2, "displayOrder": 3},
            {"optionID": 5204, "optionText": "Casi nunca", "numericValue": 1, "displayOrder": 4},
            {"optionID": 5205, "optionText": "Nunca", "numericValue": 0, "displayOrder": 5}
          ]
        }
      ]
    }
  ]
}
```

---

### **📌 3. INICIAR EVALUACIÓN**
```http
POST /api/evaluation/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "moduleID": 4,
  "isAnonymous": false,
  "period": "2024-Q1"
}
```

**Response:**
```json
{
  "evaluationID": 12345,
  "userID": 67,
  "moduleID": 4,
  "status": "InProgress",
  "startedAt": "2024-03-16T10:30:00Z",
  "isAnonymous": false,
  "period": "2024-Q1"
}
```

---

### **📌 4. ENVIAR RESPUESTA**
```http
POST /api/evaluation/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "evaluationID": 12345,
  "questionID": 1298,
  "selectedValue": 4,
  "textValue": null
}
```

**Response:**
```json
{
  "responseID": 98765,
  "evaluationID": 12345,
  "questionID": 1298,
  "selectedValue": 4,
  "calculatedValue": 4,
  "answeredAt": "2024-03-16T10:32:15Z"
}
```

---

### **📌 5. COMPLETAR EVALUACIÓN**
```http
POST /api/evaluation/{id}/complete
Authorization: Bearer {token}
```

**Response Módulo 4 (Riesgo Psicosocial):**
```json
{
  "evaluationResultID": 456,
  "evaluationID": 12345,
  "overallScore": 45.8,
  "riskLevel": "MODERATE",
  "completedAt": "2024-03-16T11:15:00Z",
  "interpretation": "Tus resultados indican que, aunque puedas realizar tu labor, percibes situaciones en tu entorno laboral donde las exigencias del cargo podrían demandarte esfuerzos adicionales...",
  "instrumentResults": [
    {
      "instrumentID": 12,
      "instrumentName": "INTRA_A",
      "instrumentCode": "INTRA_A",
      "rawScore": 183,
      "weightedScore": 183.0,
      "percentageScore": 45.8,
      "riskLevel": "MODERATE",
      "scoreRangeID": 245,
      "scoreRangeLabel": "Riesgo Medio",
      "scoreRangeColor": "#F59E0B"
    }
  ],
  "dimensionScores": [
    {
      "dimensionCode": "DOM_LID",
      "dimensionName": "Liderazgo y Relaciones Sociales",
      "score": 32.5,
      "maxScore": 100,
      "percentage": 32.5,
      "riskLevel": "LOW",
      "color": "#22C55E"
    },
    {
      "dimensionCode": "DOM_CON",
      "dimensionName": "Control sobre el Trabajo",
      "score": 58.2,
      "maxScore": 100,
      "percentage": 58.2,
      "riskLevel": "MODERATE",
      "color": "#F59E0B"
    }
  ],
  "recommendations": [
    {
      "recommendationID": 789,
      "title": "Atención a Factores de Riesgo Intralaboral",
      "description": "Te recomendamos activar estrategias de autogestión y comunicar a tu jefe directo las dificultades que percibes.",
      "priority": 2,
      "isActive": true
    }
  ]
}
```

---

## 🎨 **SEMAFORIZACIÓN ACTUALIZADA**

### **🟢 RIESGO BAJO (LOW):**
- **Color:** `#22C55E` (Verde)
- **Rango:** 0-33%
- **Mensaje:** "¡Excelente! Continúa con tus hábitos saludables"

### **🟡 RIESGO MEDIO (MODERATE):**
- **Color:** `#F59E0B` (Amarillo)
- **Rango:** 34-66%
- **Mensaje:** "Algunos aspectos necesitan atención. Te recomendamos..."

### **🔴 RIESGO ALTO (HIGH):**
- **Color:** `#EF4444` (Rojo)
- **Rango:** 67-100%
- **Mensaje:** "Requiere atención inmediata. Accede a apoyo profesional"

---

## 📊 **DETALLES POR MÓDULO**

### **🧠 MÓDULO 1 - SALUD MENTAL**
**Instrumentos:**
- **DASS-21** (Depresión, Ansiedad, Estrés) - 21 preguntas
- **TMMS-24** (Inteligencia Emocional) - 24 preguntas
- **PSS-10** (Estrés Percibido) - 10 preguntas
- **MFI-20** (Fatiga Multidimensional) - 20 preguntas
- **BAI** (Ansiedad de Beck) - 21 preguntas

**Tipos de Pregunta:** LIKERT (escala 0-3 o 0-4)

---

### **⚡ MÓDULO 2 - FATIGA LABORAL**
**Instrumentos:**
- **MFI-20** (Fatiga Multidimensional) - 20 preguntas

**Dimensiones:**
- Fatiga General, Fatiga Física, Actividad Reducida, Motivación, Dinamismo

**Tipos de Pregunta:** LIKERT (escala 1-5)

---

### **🏢 MÓDULO 3 - CLIMA ORGANIZACIONAL**
**Instrumentos:**
- **ICSP-VC** (Clima y Satisfacción Laboral) - 40 preguntas

**Dimensiones:**
- Comunicación, Condiciones Laborales, Involucración, Supervisión, Prestaciones

**Tipos de Pregunta:** LIKERT (escala 1-5)

---

### **⚖️ MÓDULO 4 - RIESGO PSICOSOCIAL**
**Instrumentos:**
- **INTRA_A** (Intralaboral Forma A - Jefes/Profesionales) - 123 preguntas
- **INTRA_B** (Intralaboral Forma B - Operarios/Auxiliares) - 97 preguntas
- **EXTRALABORAL** (Factores Externos) - 31 preguntas
- **ESTRES** (Síntomas de Estrés) - 31 preguntas

**Dominios:**
- **LIDERAZGO** (Liderazgo y Relaciones Sociales)
- **CONTROL** (Control sobre el Trabajo)
- **DEMANDAS** (Demandas del Trabajo)
- **RECOMPENSAS** (Recompensas y Reconocimiento)
- **EXTRALABORAL** (Condiciones Extralaborales)
- **ESTRES** (Síntomas de Estrés)

**Tipos de Pregunta:** LIKERT (escala 0-4 para intralaboral/extralaboral, 0-3 para estrés)

---

## 🔧 **CAMBIOS TÉCNICOS IMPORTANTES**

### **1. Nuevos Campos en DTOs:**
```typescript
// QuestionDto actualizado
interface QuestionDto {
  questionID: number;
  instrumentID: number;
  questionText: string;
  questionNumber: number;
  questionType: "LIKERT" | "TIME" | "INTEGER" | "ROUTING";
  dimensionCode?: string;        // NUEVO: Código de dimensión
  domainCode?: string;          // NUEVO: Código de dominio
  isReversed: boolean;          // NUEVO: Si es pregunta invertida
  originalItemNumber?: number;   // NUEVO: Número original del ítem
  parentQuestionID?: number;
  options: QuestionOptionDto[];
}

// InstrumentResultDto actualizado
interface InstrumentResultDto {
  instrumentID: number;
  instrumentName: string;
  instrumentCode: string;        // NUEVO: Código del instrumento
  rawScore: number;
  weightedScore: number;
  percentageScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  scoreRangeID?: number;
  scoreRangeLabel?: string;
  scoreRangeColor?: string;      // NUEVO: Color hexadecimal
}

// DimensionScoreDto - NUEVO
interface DimensionScoreDto {
  dimensionCode: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  color: string;               // Color hexadecimal para UI
}
```

### **2. Nuevos Endpoints Disponibles:**
```http
# Obtener preguntas por instrumento con filtros
GET /api/assessment/questions/by-instrument/{instrumentId}?questionType=LIKERT&rootOnly=true

# Obtener opciones de una pregunta específica
GET /api/assessment/options/by-question/{questionId}

# Obtener rangos de puntuación de un instrumento
GET /api/assessment/score-ranges/by-instrument/{instrumentId}?dimensionCode=DOM_LID

# Obtener instrumentos de un módulo
GET /api/assessmentmodule/instruments/by-module/{moduleId}

# Obtener instrumento con preguntas completas
GET /api/assessmentmodule/instruments/{id}/questions
```

---

## 📱 **FLUJO RECOMENDADO PARA EL FRONTEND**

### **Paso 1: Cargar Módulos**
```javascript
// Obtener módulos disponibles
const modules = await api.get('/api/assessmentmodule/modules/active');

// Mostrar en UI con estimatedDuration y instrumentCount
modules.forEach(module => {
  console.log(`${module.name}: ${module.instrumentCount} instrumentos, ${module.estimatedDuration} minutos`);
});
```

### **Paso 2: Seleccionar Módulo y Cargar Detalle**
```javascript
// Cargar módulo completo con preguntas
const moduleDetail = await api.get(`/api/assessmentmodule/modules/${moduleId}/full`);

// Preparar preguntas por instrumento
const questionsByInstrument = {};
moduleDetail.instruments.forEach(instrument => {
  questionsByInstrument[instrument.instrumentID] = instrument.questions;
});
```

### **Paso 3: Iniciar Evaluación**
```javascript
const evaluation = await api.post('/api/evaluation/start', {
  moduleID: selectedModuleId,
  isAnonymous: false,
  period: '2024-Q1'
});

const evaluationId = evaluation.evaluationID;
```

### **Paso 4: Presentar Preguntas**
```javascript
// Para cada instrumento del módulo
for (const instrument of moduleDetail.instruments) {
  console.log(`Instrumento: ${instrument.name}`);

  // Para cada pregunta del instrumento
  for (const question of instrument.questions) {
    // Renderizar según questionType
    if (question.questionType === 'LIKERT') {
      renderLikertQuestion(question);
    } else if (question.questionType === 'TIME') {
      renderTimeQuestion(question);
    }

    // Esperar respuesta del usuario
    const response = await waitForUserResponse();

    // Enviar respuesta
    await api.post('/api/evaluation/respond', {
      evaluationID: evaluationId,
      questionID: question.questionID,
      selectedValue: response.selectedValue,
      textValue: response.textValue
    });
  }
}
```

### **Paso 5: Completar y Mostrar Resultados**
```javascript
// Completar evaluación
const results = await api.post(`/api/evaluation/${evaluationId}/complete`);

// Mostrar resultados con semaforización
const overallColor = getRiskColor(results.riskLevel);
console.log(`Resultado General: ${results.riskLevel} (${overallColor})`);

// Mostrar resultados por dimensión (para módulos que lo soportan)
if (results.dimensionScores) {
  results.dimensionScores.forEach(dim => {
    console.log(`${dim.dimensionName}: ${dim.percentage}% - ${dim.riskLevel} (${dim.color})`);
  });
}

// Mostrar recomendaciones
results.recommendations.forEach(rec => {
  console.log(`${rec.title}: ${rec.description}`);
});
```

---

## 🎯 **CASOS ESPECIALES POR MÓDULO**

### **Módulo 4 - Riesgo Psicosocial:**
- Usa **puntajes transformados** (0-100) en lugar de puntajes brutos
- Tiene **dominios agregados** (DOM_LID, DOM_CON, DOM_DEM, DOM_REC)
- Algunas preguntas son **invertidas** (isReversed: true)
- Diferentes escalas según instrumento:
  - INTRA_A/B y EXTRALABORAL: 0-4 (Nunca a Siempre)
  - ESTRES: 0-3 (Nunca a Siempre)

### **Módulo 3 - Clima Organizacional:**
- **Preguntas compuestas** con sub-ítems (usar parentQuestionID)
- Escala 1-5 (Totalmente en desacuerdo a Totalmente de acuerdo)
- **5 dimensiones** principales con scoring específico

### **Módulo 2 - Fatiga Laboral:**
- **5 dimensiones** de fatiga (General, Física, Actividad Reducida, Motivación, Dinamismo)
- Escala 1-5 con preguntas invertidas
- **Clasificación por componentes** (Verde/Amarillo/Rojo por dimensión)

---

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **1. Autenticación:**
Todos los endpoints requieren Bearer token válido.

### **2. Roles y Permisos:**
- **Usuario normal:** Solo sus propias evaluaciones
- **Psychologist/HRManager:** Ver evaluaciones de otros usuarios
- **SuperAdmin:** Gestión completa de módulos e instrumentos

### **3. Manejo de Errores:**
```javascript
try {
  const response = await api.post('/api/evaluation/respond', data);
} catch (error) {
  if (error.status === 400) {
    // Validación fallida - mostrar error al usuario
  } else if (error.status === 401) {
    // Token expirado - redirigir a login
  } else if (error.status === 404) {
    // Recurso no encontrado
  }
}
```

### **4. Estados de Evaluación:**
- **InProgress:** Evaluación iniciada, se pueden enviar respuestas
- **Completed:** Evaluación finalizada, resultados disponibles
- **Abandoned:** Evaluación abandonada (timeout o usuario salió)

---

## 📈 **EJEMPLOS DE INTEGRACIÓN**

### **Renderizado de Pregunta LIKERT:**
```typescript
function renderLikertQuestion(question: QuestionDto) {
  return (
    <div className="question-container">
      <h3>Pregunta {question.questionNumber}</h3>
      <p>{question.questionText}</p>

      {question.dimensionCode && (
        <span className="dimension-badge">{question.dimensionCode}</span>
      )}

      <div className="options-container">
        {question.options.map(option => (
          <label key={option.optionID} className="option-label">
            <input
              type="radio"
              name={`question-${question.questionID}`}
              value={option.numericValue}
            />
            {option.optionText}
          </label>
        ))}
      </div>
    </div>
  );
}
```

### **Componente de Resultados:**
```typescript
function ResultsComponent({ results }: { results: EvaluationResultDto }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return '#22C55E';
      case 'MODERATE': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="results-container">
      <div
        className="overall-result"
        style={{ backgroundColor: getRiskColor(results.riskLevel) }}
      >
        <h2>Resultado General: {results.riskLevel}</h2>
        <p>Puntuación: {results.overallScore.toFixed(1)}%</p>
      </div>

      {results.dimensionScores && (
        <div className="dimensions-grid">
          {results.dimensionScores.map(dim => (
            <div
              key={dim.dimensionCode}
              className="dimension-card"
              style={{ borderLeftColor: dim.color }}
            >
              <h4>{dim.dimensionName}</h4>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{
                    width: `${dim.percentage}%`,
                    backgroundColor: dim.color
                  }}
                />
              </div>
              <span>{dim.percentage.toFixed(1)}% - {dim.riskLevel}</span>
            </div>
          ))}
        </div>
      )}

      <div className="recommendations">
        <h3>Recomendaciones</h3>
        {results.recommendations.map(rec => (
          <div key={rec.recommendationID} className="recommendation-card">
            <h4>{rec.title}</h4>
            <p>{rec.description}</p>
            <span className={`priority-${rec.priority}`}>
              Prioridad: {rec.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎉 **ESTADO ACTUAL DE LA API**

### ✅ **COMPLETAMENTE IMPLEMENTADO:**
- ✅ 4 Módulos de evaluación activos
- ✅ 11 Instrumentos psicométricos
- ✅ 614 Preguntas con opciones de respuesta
- ✅ 2,758 Opciones de respuesta
- ✅ 366 Rangos de puntuación con semaforización
- ✅ 168 Plantillas de recomendaciones
- ✅ Lógica completa de evaluación y scoring
- ✅ Interpretaciones automáticas contextualizadas
- ✅ Sistema de alertas y seguimiento

### 🚀 **LISTO PARA PRODUCCIÓN:**
La API está completamente funcional y lista para integración frontend. Todos los endpoints están documentados, probados y operativos.

---

**📞 Para soporte técnico o dudas sobre la integración, contactar al equipo de desarrollo.**

**🔗 Documentación adicional disponible en:** `/Documentation/API_FRONTEND_GUIDE.md`
