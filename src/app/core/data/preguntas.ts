import { Pregunta } from '../services/models/pregunta.model';

export const PREGUNTAS: Pregunta[] = [

  {
    id: 1,
    dominio: 'Desarrollo y Uso Responsable',
    pregunta: '¿La organización define requisitos de seguridad antes de desarrollar o implementar nuevas funcionalidades en la plataforma Text-to-SQL?',
    controlesISO27001: ['A.8.26'],
    controlesISO42001: ['A.6.1.3'],
    recomendaciones: {
        INEXISTENTE: 'Establecer un procedimiento formal de levantamiento de requisitos de seguridad (funcionales y no funcionales) antes de iniciar cualquier desarrollo o cambio en la plataforma, apoyado en un checklist alineado a A.8.26 y a los procesos de diseño responsable de IA (A.6.1.3).',
        PARCIAL: 'Formalizar y documentar el proceso existente de definición de requisitos de seguridad, asignando responsables y puntos de control (gates) dentro del ciclo de vida de desarrollo del sistema de IA.',
    },
    respuesta: null
  },

  {
    id: 2,
    dominio: 'Desarrollo y Uso Responsable',
    pregunta: '¿El desarrollo de la plataforma sigue prácticas de codificación segura y mantiene documentación técnica actualizada del sistema de IA?',
    controlesISO27001: ['A.8.28'],
    controlesISO42001: ['A.6.2.3'],
    recomendaciones: {
        INEXISTENTE: 'Adoptar un estándar de codificación segura (p. ej. OWASP Secure Coding Practices) y comenzar a documentar formalmente la arquitectura, algoritmos y decisiones de diseño del sistema de IA.',
        PARCIAL: 'Reforzar el cumplimiento del estándar de codificación segura mediante revisiones de código (code review) y actualizar la documentación técnica de forma periódica.',
    },
    respuesta: null
  },

  {
    id: 3,
    dominio: 'Desarrollo y Uso Responsable',
    pregunta: '¿Se realizan pruebas de seguridad y procesos de verificación del modelo de IA antes de su despliegue?',
    controlesISO27001: ['A.8.29'],
    controlesISO42001: ['A.6.2.4'],
    recomendaciones: {
        INEXISTENTE: 'Incorporar pruebas de seguridad (SAST/DAST) y pruebas de verificación y validación del modelo de IA (precisión, sesgo, robustez) como requisito obligatorio antes de cualquier despliegue.',
        PARCIAL: 'Estandarizar y automatizar las pruebas de seguridad y de verificación/validación del modelo dentro del pipeline CI/CD, con criterios de aceptación definidos.',
    },
    respuesta: null
  },

  {
    id: 4,
    dominio: 'Desarrollo y Uso Responsable',
    pregunta: '¿La organización mantiene separados los ambientes de desarrollo, pruebas y producción, además de gestionar formalmente los cambios realizados sobre la plataforma?',
    controlesISO27001: ['A.8.31','A.8.32'],
    controlesISO42001: ['A.6.2.5'],
    recomendaciones: {
        INEXISTENTE: 'Separar física o lógicamente los ambientes de desarrollo, pruebas y producción, y establecer un procedimiento formal de gestión de cambios para el despliegue del sistema de IA.',
        PARCIAL: 'Formalizar el flujo de aprobación de cambios (change advisory board) y reforzar los controles de acceso entre ambientes.',
    },
    respuesta: null
  },

  {
    id: 5,
    dominio: 'Desarrollo y Uso Responsable',
    pregunta: '¿La organización ha definido políticas para el uso responsable de la inteligencia artificial y limita el uso de la plataforma al propósito para el cual fue diseñada?',
    controlesISO27001: ['A.8.9'],
    controlesISO42001: ['A.9.2','A.9.4','A.8.9'],
    recomendaciones: {
        INEXISTENTE: 'Definir una política formal de uso responsable de IA que delimite el propósito autorizado de la plataforma, y establecer una gestión de configuración base (baseline) del sistema.',
        PARCIAL: 'Difundir y capacitar a los usuarios sobre la política de uso responsable, y controlar desviaciones del uso previsto mediante gestión de configuración activa.',
    },
    respuesta: null
  },

  {
    id: 6,
    dominio: 'Monitoreo y Respuesta',
    pregunta: '¿La organización monitorea continuamente la actividad de la plataforma y registra los eventos relevantes de seguridad?',
    controlesISO27001: ['A.8.16'],
    controlesISO42001: ['A.6.2.6'],
    recomendaciones: {
        INEXISTENTE: 'Implementar un sistema de monitoreo continuo (logs y eventos) de la actividad de la plataforma, incluyendo el comportamiento operativo del modelo de IA.',
        PARCIAL: 'Centralizar y correlacionar los eventos de seguridad y de operación del modelo en una herramienta de monitoreo (SIEM u equivalente).',
    },
    respuesta: null
  },

  {
    id: 7,
    dominio: 'Monitoreo y Respuesta',
    pregunta: '¿Se identifican nuevas amenazas relacionadas con IA y se evalúa periódicamente el impacto de estos riesgos sobre la organización?',
    controlesISO27001: ['A.5.7'],
    controlesISO42001: ['A.5.2'],
    recomendaciones: {
        INEXISTENTE: 'Establecer un proceso para identificar amenazas emergentes específicas de IA (p. ej. prompt injection, envenenamiento de datos) y evaluar su impacto sobre la organización.',
        PARCIAL: 'Formalizar la evaluación periódica de impacto de riesgos de IA e integrar fuentes de inteligencia de amenazas actualizadas.',
    },
    respuesta: null
  },

  {
    id: 8,
    dominio: 'Monitoreo y Respuesta',
    pregunta: '¿La organización dispone de procedimientos definidos para responder a incidentes de seguridad relacionados con la plataforma Text-to-SQL?',
    controlesISO27001: ['A.5.24','A.5.30'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Elaborar un plan formal de respuesta a incidentes de seguridad y un plan de continuidad de TI para la plataforma Text-to-SQL.',
        PARCIAL: 'Probar y actualizar periódicamente el plan de respuesta a incidentes y el plan de continuidad mediante simulacros.',
    },
    respuesta: null
  },

  {
    id: 9,
    dominio: 'Monitoreo y Respuesta',
    pregunta: '¿Se realizan revisiones independientes para verificar la eficacia de los controles de seguridad implementados?',
    controlesISO27001: ['A.5.35'],
    controlesISO42001: ['A.8.3'],
    recomendaciones: {
        INEXISTENTE: 'Programar revisiones independientes (auditorías internas o externas) de la eficacia de los controles de seguridad implementados.',
        PARCIAL: 'Formalizar la periodicidad de las revisiones independientes y establecer canales de reporte externo de hallazgos.',
    },
    respuesta: null
  },

  {
    id: 10,
    dominio: 'Monitoreo y Respuesta',
    pregunta: '¿La infraestructura de red y los mecanismos de monitoreo permiten detectar actividades anómalas o intentos de ataque contra la plataforma?',
    controlesISO27001: ['A.8.20'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Implementar controles de red (segmentación, firewalls, IDS/IPS) que permitan detectar actividad anómala contra la plataforma.',
        PARCIAL: 'Optimizar las reglas de detección de anomalías de red y reducir falsos positivos mediante ajuste continuo.',
    },
    respuesta: null
  },

  {
    id: 11,
    dominio: 'Protección de Datos',
    pregunta: '¿La organización clasifica la información y restringe el acceso únicamente a usuarios autorizados?',
    controlesISO27001: ['A.5.12','A.8.3','A.5.9'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Elaborar un inventario de activos de información y establecer un esquema de clasificación con controles de acceso basados en dicha clasificación.',
        PARCIAL: 'Mantener actualizado el inventario de activos y reforzar la aplicación de restricciones de acceso según el nivel de clasificación.',
    },
    respuesta: null
  },

  {
    id: 12,
    dominio: 'Protección de Datos',
    pregunta: '¿La plataforma implementa mecanismos para prevenir la fuga de información y proteger los datos personales o sensibles?',
    controlesISO27001: ['A.8.12','A.8.11','A.5.34'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Implementar mecanismos de prevención de fuga de información (DLP) y enmascaramiento de datos sensibles/PII utilizados por la plataforma.',
        PARCIAL: 'Ajustar y afinar las reglas de DLP y enmascaramiento, e incorporar controles de privacidad en el ciclo de vida del dato.',
    },
    respuesta: null
  },

  {
    id: 13,
    dominio: 'Protección de Datos',
    pregunta: '¿Los datos utilizados por el sistema de IA provienen de fuentes identificadas, confiables y cuentan con controles para garantizar su calidad?',
    controlesISO27001: [],
    controlesISO42001: ['A.7.5','A.7.4','A.7.3'],
    recomendaciones: {
        INEXISTENTE: 'Documentar formalmente las fuentes de datos utilizadas por el sistema de IA y establecer criterios mínimos de calidad y confiabilidad para su adquisición.',
        PARCIAL: 'Formalizar procesos de validación de calidad de datos y trazabilidad del origen antes de su uso en el modelo.',
    },
    respuesta: null
  },

  {
    id: 14,
    dominio: 'Protección de Datos',
    pregunta: '¿La organización documenta y prepara adecuadamente los datos utilizados para entrenar, ajustar o mejorar la plataforma de IA?',
    controlesISO27001: [],
    controlesISO42001: ['A.7.2','A.7.6','A.6.2.7'],
    recomendaciones: {
        INEXISTENTE: 'Documentar el proceso de preparación de datos (limpieza, transformación) utilizados para entrenar o mejorar la plataforma, y mantener documentación técnica del sistema.',
        PARCIAL: 'Estandarizar el proceso de preparación de datos y mantener la documentación técnica sincronizada con cada actualización del modelo.',
    },
    respuesta: null
  },

  {
    id: 15,
    dominio: 'Protección de Datos',
    pregunta: '¿La transferencia de información entre la plataforma, los usuarios y otros sistemas se realiza mediante mecanismos seguros?',
    controlesISO27001: ['A.5.14'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Formalizar acuerdos y protocolos de transferencia segura de información con terceros y sistemas internos.',
        PARCIAL: 'Auditar periódicamente los mecanismos de transferencia segura y actualizar protocolos criptográficos según buenas prácticas vigentes.',
    },
    respuesta: null
  },

  {
    id: 16,
    dominio: 'Gestion de Terceros',
    pregunta: '¿La organización establece requisitos de seguridad para los proveedores que participan en el desarrollo u operación de la plataforma?',
    controlesISO27001: ['A.5.19'],
    controlesISO42001: ['A.10.3'],
    recomendaciones: {
        INEXISTENTE: 'Formalizar la inclusión de estos requisitos en los contratos existentes y evaluar a los proveedores actuales contra dichos requisitos.',
        PARCIAL: 'Revisar y actualizar periódicamente los requisitos de seguridad para proveedores conforme cambien los riesgos y la normativa.',
    },
    respuesta: null
  },

  {
    id: 17,
    dominio: 'Gestion de Terceros',
    pregunta: '¿Se supervisa periódicamente el cumplimiento de los requisitos de seguridad establecidos para proveedores y servicios contratados?',
    controlesISO27001: ['A.5.22'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Formalizar la periodicidad e indicadores de supervisión, e incorporar gestión de cambios en los servicios de proveedores.',
        PARCIAL: 'Mantener supervisión continua con reportes periódicos y planes de acción ante incumplimientos.',
    },
    respuesta: null
  },

  {
    id: 18,
    dominio: 'Gestion de Terceros',
    pregunta: '¿La organización gestiona los riesgos de seguridad asociados a la cadena de suministro tecnológica utilizada por la plataforma?',
    controlesISO27001: ['A.5.21'],
    controlesISO42001: [],
    recomendaciones: {
        INEXISTENTE: 'Formalizar un proceso de gestión de riesgos de la cadena de suministro con revisiones periódicas.',
        PARCIAL: 'Mantener un proceso maduro de gestión de riesgos de cadena de suministro, integrado a la gestión de riesgos corporativa.',
    },
    respuesta: null
  },

  {
    id: 19,
    dominio: 'Gestion de Terceros',
    pregunta: '¿Se encuentran claramente definidas las responsabilidades relacionadas con la gestión de la plataforma de IA y los recursos tecnológicos utilizados?',
    controlesISO27001: [],
    controlesISO42001: ['A.10.2'],
    recomendaciones: {
        INEXISTENTE: 'Comunicar y validar periódicamente que los roles y responsabilidades asignados se cumplan efectivamente.',
        PARCIAL: 'Revisar y actualizar la matriz de roles y responsabilidades ante cambios organizacionales o tecnológicos.',
    },
    respuesta: null
  },

  {
    id: 20,
    dominio: 'Gestion de Terceros',
    pregunta: '¿Los recursos de datos y la infraestructura utilizada por la plataforma son gestionados y protegidos de acuerdo con políticas organizacionales?',
    controlesISO27001: [''],
    controlesISO42001: ['A.4.3','A.4.5'],
    recomendaciones: {
        INEXISTENTE: 'Formalizar el cumplimiento de dichas políticas mediante controles de gestión de recursos e infraestructura.',
        PARCIAL: 'Auditar periódicamente la gestión y protección de recursos de datos e infraestructura conforme a las políticas organizacionales.',
    },
    respuesta: null
  },
]
