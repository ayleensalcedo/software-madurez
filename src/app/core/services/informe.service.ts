import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface InformeRecomendacion {
  prioridad: string;
  pregunta: number;
  dominio: string;
  pesoDominio: number;
  texto: string;
  accion: string;
}

export interface InformeDatos {
  titulo: string;
  organizacion: string;
  fecha: Date;
  coberturaGlobal: number;
  nivel: string;
  tendencia?: string;
  porDominio: { nombre: string; cobertura: number; peso: number }[];
  recomendaciones: InformeRecomendacion[];
  // Solo en el informe final (evaluación validada)
  analista?: string;
  estado?: string;
  observaciones?: string;
}

// Anchos de Helvetica (AFM) para los caracteres ASCII 32..126, en milésimas de em
const ANCHOS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

type Color = [number, number, number];

/** Escritor mínimo de PDF (A4, Helvetica) para generar el informe sin librerías externas. */
class PdfSimple {
  readonly ancho = 595.28;
  readonly alto = 841.89;
  readonly margen = 44;

  private paginas: string[] = [];
  private actual = '';
  y = 0;

  constructor() { this.nuevaPagina(); }

  nuevaPagina(): void {
    if (this.actual) this.paginas.push(this.actual);
    this.actual = '';
    this.y = this.alto - this.margen;
  }

  asegurarEspacio(alto: number): void {
    if (this.y - alto < this.margen + 20) this.nuevaPagina();
  }

  medir(texto: string, tam: number, negrita = false): number {
    let w = 0;
    for (const ch of texto) {
      const c = ch.charCodeAt(0);
      w += c >= 32 && c <= 126 ? ANCHOS[c - 32] : 556;
    }
    return (w / 1000) * tam * (negrita ? 1.06 : 1);
  }

  /** Divide el texto en líneas que caben en `ancho` puntos. */
  ajustar(texto: string, tam: number, ancho: number, negrita = false): string[] {
    const lineas: string[] = [];
    let linea = '';
    for (const palabra of texto.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (linea && this.medir(prueba, tam, negrita) > ancho) {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea = prueba;
      }
    }
    if (linea) lineas.push(linea);
    return lineas.length ? lineas : [''];
  }

  private codificar(texto: string): string {
    let salida = '';
    for (const ch of texto) {
      const c = ch.charCodeAt(0);
      let b: number;
      if (c === 0x2014) b = 0x97;
      else if (c === 0x2013) b = 0x96;
      else if (c === 0x2022) b = 0x95;
      else if (c >= 32 && c <= 255) b = c;
      else b = 63;
      if (b === 40 || b === 41 || b === 92) salida += '\\';
      salida += String.fromCharCode(b);
    }
    return salida;
  }

  private rgb(c: Color): string {
    return c.map(v => (v / 255).toFixed(3)).join(' ');
  }

  /** Escribe texto con la línea base en (x, y). */
  texto(txt: string, x: number, y: number, tam: number, color: Color = [11, 42, 74], negrita = false): void {
    this.actual += `BT /${negrita ? 'F2' : 'F1'} ${tam} Tf ${this.rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${this.codificar(txt)}) Tj ET\n`;
  }

  rect(x: number, y: number, w: number, h: number, color: Color): void {
    this.actual += `${this.rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;
  }

  /** Párrafo con salto de línea y de página automáticos; devuelve el alto usado. */
  parrafo(txt: string, tam: number, opts: { x?: number; ancho?: number; color?: Color; negrita?: boolean; interlineado?: number } = {}): void {
    const x = opts.x ?? this.margen;
    const ancho = opts.ancho ?? this.ancho - this.margen - x;
    const paso = (opts.interlineado ?? 1.35) * tam;
    for (const linea of this.ajustar(txt, tam, ancho, opts.negrita)) {
      this.asegurarEspacio(paso);
      this.y -= paso;
      this.texto(linea, x, this.y, tam, opts.color, opts.negrita);
    }
  }

  espacio(alto: number): void {
    this.y -= alto;
    if (this.y < this.margen + 20) this.nuevaPagina();
  }

  /** Genera el archivo PDF. */
  construir(): Blob {
    if (this.actual) { this.paginas.push(this.actual); this.actual = ''; }

    const total = this.paginas.length;
    // Objetos: 1 catálogo, 2 páginas, 3 y 4 fuentes, luego (página, contenido) por cada página
    const objetos: string[] = [];
    const idsPagina = this.paginas.map((_, i) => 5 + i * 2);

    objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objetos[2] = `<< /Type /Pages /Kids [${idsPagina.map(id => `${id} 0 R`).join(' ')}] /Count ${total} >>`;
    objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objetos[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    this.paginas.forEach((contenido, i) => {
      const pie = `BT /F1 8 Tf 0.5 0.55 0.6 rg ${this.margen} 24 Td (Página ${i + 1} de ${total}) Tj ET\n`;
      const flujo = contenido + pie;
      objetos[5 + i * 2] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.ancho} ${this.alto}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
      objetos[6 + i * 2] = `<< /Length ${flujo.length} >>\nstream\n${flujo}endstream`;
    });

    let pdf = '%PDF-1.4\n';
    const posiciones: number[] = [];
    for (let id = 1; id < objetos.length; id++) {
      posiciones[id] = pdf.length;
      pdf += `${id} 0 obj\n${objetos[id]}\nendobj\n`;
    }
    const inicioXref = pdf.length;
    pdf += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objetos.length; id++) {
      pdf += `${String(posiciones[id]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

    // Cada carácter ya es un byte (0-255)
    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: 'application/pdf' });
  }
}

@Injectable({
  providedIn: 'root'
})
export class InformeService {

  private platformId = inject(PLATFORM_ID);

  private readonly AZUL: Color = [11, 42, 74];
  private readonly GRIS: Color = [113, 132, 148];
  private readonly VERDE: Color = [18, 163, 111];
  private readonly ROJO: Color = [192, 57, 43];
  private readonly AMBAR: Color = [184, 114, 10];

  descargar(datos: InformeDatos, nombreArchivo: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const blob = this.generar(datos).construir();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private fechaTexto(fecha: Date): string {
    const d = String(fecha.getDate()).padStart(2, '0');
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${fecha.getFullYear()}`;
  }

  private colorCobertura(c: number): Color {
    if (c <= 40) return this.ROJO;
    if (c <= 60) return this.AMBAR;
    return this.VERDE;
  }

  private generar(d: InformeDatos): PdfSimple {
    const pdf = new PdfSimple();
    const x = pdf.margen;
    const ancho = pdf.ancho - pdf.margen * 2;

    // Encabezado
    pdf.rect(0, pdf.alto - 96, pdf.ancho, 96, this.AZUL);
    pdf.texto(d.titulo.toUpperCase(), x, pdf.alto - 40, 10, [120, 220, 230], true);
    pdf.texto('Dashboard de Madurez', x, pdf.alto - 66, 22, [255, 255, 255], true);
    pdf.y = pdf.alto - 96 - 12;

    // Datos generales
    const filas: [string, string][] = [
      ['Organización', d.organizacion],
      ['Fecha de evaluación', this.fechaTexto(d.fecha)]
    ];
    if (d.analista) filas.push(['Analista', d.analista]);
    if (d.estado) filas.push(['Estado', d.estado]);

    for (const [etiqueta, valor] of filas) {
      pdf.y -= 18;
      pdf.texto(etiqueta + ':', x, pdf.y, 10, this.GRIS, true);
      pdf.texto(valor, x + 130, pdf.y, 10, this.AZUL);
    }

    // Resultado global
    pdf.espacio(14);
    this.titulo(pdf, 'Resultado global');
    pdf.y -= 34;
    pdf.texto(`${Math.round(d.coberturaGlobal)}%`, x, pdf.y, 30, this.colorCobertura(d.coberturaGlobal), true);
    pdf.texto(`Nivel de madurez: ${d.nivel}`, x + 110, pdf.y + 12, 13, this.AZUL, true);
    pdf.texto('Cobertura global ponderada', x + 110, pdf.y - 4, 9, this.GRIS);
    if (d.tendencia) {
      pdf.y -= 18;
      pdf.texto(d.tendencia, x, pdf.y, 9, this.GRIS);
    }

    // Cobertura por dominio
    pdf.espacio(16);
    this.titulo(pdf, 'Cobertura por dominio');
    for (const dom of d.porDominio) {
      pdf.asegurarEspacio(34);
      pdf.y -= 18;
      pdf.texto(dom.nombre, x, pdf.y, 10, this.AZUL, true);
      const pct = `${Math.round(dom.cobertura)}%  (peso ${dom.peso.toFixed(1).replace(/\.0$/, '')}%)`;
      pdf.texto(pct, x + ancho - pdf.medir(pct, 10), pdf.y, 10, this.AZUL);
      pdf.y -= 10;
      pdf.rect(x, pdf.y, ancho, 6, [230, 236, 241]);
      pdf.rect(x, pdf.y, ancho * Math.min(100, Math.max(0, dom.cobertura)) / 100, 6, this.colorCobertura(dom.cobertura));
    }

    // Observaciones (informe final)
    if (d.observaciones !== undefined) {
      pdf.espacio(16);
      this.titulo(pdf, 'Observaciones');
      pdf.parrafo(d.observaciones.trim() || 'Sin observaciones registradas.', 10, { color: this.AZUL });
    }

    // Recomendaciones
    pdf.espacio(16);
    this.titulo(pdf, `Recomendaciones de mejora (${d.recomendaciones.length})`);
    if (d.recomendaciones.length === 0) {
      pdf.parrafo('No se identificaron brechas.', 10, { color: this.AZUL });
    }
    for (const r of d.recomendaciones) {
      pdf.asegurarEspacio(70);
      pdf.espacio(8);
      const color = r.prioridad === 'ALTA' ? this.ROJO : this.AMBAR;
      pdf.y -= 12;
      pdf.texto(`[${r.prioridad}]`, x, pdf.y, 9, color, true);
      pdf.texto(`Pregunta ${r.pregunta}  ·  ${r.dominio}  ·  Peso del dominio ${r.pesoDominio.toFixed(1).replace(/\.0$/, '')}%`, x + 52, pdf.y, 9, this.GRIS);
      pdf.parrafo(r.texto, 10, { color: this.AZUL, negrita: true });
      pdf.parrafo('Acción recomendada: ' + r.accion, 9.5, { color: [74, 97, 118], x: x + 10 });
    }

    pdf.espacio(20);
    pdf.parrafo('La cobertura de cada dominio se calcula dividiendo el puntaje obtenido entre el puntaje máximo; la cobertura global es la suma ponderada de las coberturas por dominio.', 8, { color: this.GRIS });

    return pdf;
  }

  private titulo(pdf: PdfSimple, texto: string): void {
    pdf.asegurarEspacio(40);
    pdf.y -= 16;
    pdf.texto(texto, pdf.margen, pdf.y, 13, this.AZUL, true);
    pdf.y -= 4;
    pdf.rect(pdf.margen, pdf.y, pdf.ancho - pdf.margen * 2, 1, [211, 224, 232]);
  }
}
