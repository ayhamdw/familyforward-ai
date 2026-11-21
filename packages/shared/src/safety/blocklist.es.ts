import type { BlocklistFile } from "./types";

// Spanish equivalents, written to catch the same ideas. Matching ignores accents.
export const blocklistEs: BlocklistFile = {
  lang: "es",
  terms: [
    "TDAH", "déficit de atención", "autismo", "autista", "espectro", "dislexia", "disléxico", "disléxica",
    "discalculia", "disgrafía", "discapacidad de aprendizaje", "trastorno del aprendizaje",
    "retraso del desarrollo", "retraso en el desarrollo", "retraso del lenguaje", "retraso en el habla",
    "retraso en el lenguaje", "trastorno del lenguaje", "apraxia", "procesamiento sensorial", "oposicionista",
    "negativista desafiante", "trastorno de ansiedad", "depresión", "deprimido", "deprimida",
    "discapacidad intelectual", "deterioro cognitivo", "superdotado", "superdotada", "diagnóstico",
    "diagnosticar", "diagnosticado", "diagnosticada", "trastorno", "síndrome", "déficit", "retrasado",
    "retrasada", "atrasado", "atrasada", "atrasado para su edad", "por detrás de otros niños", "en riesgo de",
    "síntoma", "síntomas", "condición", "tamizaje", "cribado", "evaluación", "evaluación para",
    "señal de alerta", "señales de alerta", "señal de alarma", "bandera roja", "anormal", "no es normal",
    // Contract rule 2.
    "hito del desarrollo", "hitos del desarrollo", "en riesgo", "nivel de grado", "va bien encaminado",
    "aprendiz lento", "por debajo del promedio", "por encima del promedio",
  ],
  uppercaseOnly: ["TDA", "TOC"],
};
