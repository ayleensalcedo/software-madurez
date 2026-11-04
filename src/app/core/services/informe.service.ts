import { Injectable } from '@angular/core';

export interface DominioInforme {
  nombre: string;
  cobertura: number;
  /** Peso relativo del dominio, en porcentaje (0-100). */
  peso: number;
}

export interface RecomendacionInforme {
  prioridad: string;
  dominio: string;
  /** Peso relativo del dominio, en porcentaje (0-100). */
  pesoDominio: number;
  preguntaId: number;
  pregunta: string;
  recomendacion: string;
  controles: string[];
}

export interface DatosInforme {
  organizacion: string;
  plataforma: string;
  fecha: Date;
  coberturaGlobal: number;
  nivel: string;
  dominios: DominioInforme[];
  recomendaciones: RecomendacionInforme[];
  // Solo en el informe final (evaluaciones validadas)
  analista?: string;
  estado?: string;
  observaciones?: string;
}

type Color = [number, number, number];

const NAVY: Color = [11, 42, 74];
const TEAL: Color = [8, 127, 152];
const GRIS: Color = [93, 114, 136];
const GRIS_CLARO: Color = [227, 235, 241];
const TEXTO: Color = [11, 22, 40];
const COLOR_PRIORIDAD: Record<string, Color> = {
  ALTA: [192, 57, 43],
  MEDIA: [217, 120, 10]
};

/**
 * Genera el informe de madurez en PDF directamente en el navegador.
 * La librería se carga solo al pedir el informe, para no aumentar el peso inicial de la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class InformeService {

  async generar(datos: DatosInforme, final: boolean): Promise<string> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const margen = 16;
    const util = ancho - margen * 2;
    let y = 0;

    const color = (c: Color) => doc.setTextColor(c[0], c[1], c[2]);
    const relleno = (c: Color) => doc.setFillColor(c[0], c[1], c[2]);

    // Salto de página si el siguiente bloque no cabe
    const asegurar = (necesario: number) => {
      if (y + necesario > alto - 18) {
        doc.addPage();
        y = margen;
      }
    };

    const seccion = (titulo: string) => {
      asegurar(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      color(NAVY);
      doc.text(titulo, margen, y);
      doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2]);
      doc.setLineWidth(0.6);
      doc.line(margen, y + 2, margen + 14, y + 2);
      y += 9;
    };

    // ---------- Cabecera ----------
    relleno(NAVY);
    doc.rect(0, 0, ancho, 36, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    doc.text(final ? 'Informe final de madurez' : 'Informe de madurez', margen, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(180, 200, 220);
    doc.text(`Seguridad y gobernanza de IA · ${datos.plataforma}`, margen, 24);
    doc.text('IA Governance · Security Platform', margen, 30);

    y = 48;

    // ---------- Datos generales ----------
    const filas: [string, string][] = [
      ['Organización', datos.organizacion],
      ['Fecha de la evaluación', this.fecha(datos.fecha)]
    ];
    if (final) {
      filas.push(['Analista', datos.analista || '—']);
      filas.push(['Estado', datos.estado || 'Validada']);
    }

    doc.setFontSize(10);
    filas.forEach(([etiqueta, valor]) => {
      doc.setFont('helvetica', 'normal');
      color(GRIS);
      doc.text(etiqueta, margen, y);
      doc.setFont('helvetica', 'bold');
      color(TEXTO);
      doc.text(this.limpio(valor), margen + 48, y);
      y += 6.5;
    });

    y += 4;

    // ---------- Resumen ----------
    const caja = (x: number, w: number, titulo: string, valor: string) => {
      relleno([244, 248, 251]);
      doc.setDrawColor(GRIS_CLARO[0], GRIS_CLARO[1], GRIS_CLARO[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, 24, 3, 3, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      color(GRIS);
      doc.text(titulo, x + 5, y + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      color(NAVY);
      doc.text(valor, x + 5, y + 19);
    };

    caja(margen, util / 2 - 3, 'Cobertura global ponderada', `${Math.round(datos.coberturaGlobal)}%`);
    caja(margen + util / 2 + 3, util / 2 - 3, 'Nivel de madurez', datos.nivel);
    y += 34;

    // ---------- Cobertura por dominio ----------
    seccion('Cobertura por dominio');

    datos.dominios.forEach(d => {
      asegurar(13);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      color(TEXTO);
      doc.text(this.limpio(d.nombre), margen, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      color(GRIS);
      doc.text(`Peso ${this.numero(d.peso)}%`, margen + util - 28, y, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      color(NAVY);
      doc.text(`${Math.round(d.cobertura)}%`, margen + util, y, { align: 'right' });

      relleno(GRIS_CLARO);
      doc.roundedRect(margen, y + 2.5, util, 3, 1.5, 1.5, 'F');
      relleno(this.colorCobertura(d.cobertura));
      const llenado = Math.max(0, Math.min(100, d.cobertura)) / 100 * util;
      if (llenado > 0.5) doc.roundedRect(margen, y + 2.5, llenado, 3, 1.5, 1.5, 'F');

      y += 12;
    });

    y += 2;

    // ---------- Observaciones (informe final) ----------
    if (final) {
      seccion('Observaciones');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      color(TEXTO);
      const texto = datos.observaciones?.trim() || 'Sin observaciones registradas.';
      const lineas = doc.splitTextToSize(this.limpio(texto), util) as string[];
      lineas.forEach(l => {
        asegurar(6);
        doc.text(l, margen, y);
        y += 5.2;
      });
      y += 6;
    }

    // ---------- Recomendaciones ----------
    seccion(`Recomendaciones de mejora (${datos.recomendaciones.length})`);

    if (datos.recomendaciones.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      color(GRIS);
      doc.text('No se identificaron brechas: todas las preguntas fueron evaluadas como implementadas.', margen, y);
      y += 8;
    }

    datos.recomendaciones.forEach(r => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const preguntaLineas = doc.splitTextToSize(this.limpio(r.pregunta), util - 4) as string[];
      doc.setFont('helvetica', 'normal');
      const accionLineas = doc.splitTextToSize(this.limpio(r.recomendacion), util - 4) as string[];
      const controles = r.controles.length ? `Controles: ${r.controles.join(', ')}` : '';

      const bloque = 9 + preguntaLineas.length * 5 + (controles ? 5 : 0) + 7 + accionLineas.length * 5 + 6;
      asegurar(bloque);

      // Barra lateral de prioridad
      const col = COLOR_PRIORIDAD[r.prioridad] ?? GRIS;
      relleno(col);
      doc.rect(margen, y - 3.5, 1.2, bloque - 4, 'F');

      // Encabezado de la recomendación
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(col[0], col[1], col[2]);
      doc.text(r.prioridad, margen + 4, y);
      doc.setFont('helvetica', 'normal');
      color(GRIS);
      doc.text(
        `Pregunta ${r.preguntaId} · ${this.limpio(r.dominio)} · Peso del dominio ${this.numero(r.pesoDominio)}%`,
        margen + 18,
        y
      );
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      color(TEXTO);
      preguntaLineas.forEach(l => { doc.text(l, margen + 4, y); y += 5; });

      if (controles) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        color(GRIS);
        doc.text(this.limpio(controles), margen + 4, y);
        y += 5;
      }

      y += 1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      color(TEAL);
      doc.text('Acción recomendada', margen + 4, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      color(TEXTO);
      accionLineas.forEach(l => { doc.text(l, margen + 4, y); y += 5; });

      y += 6;
    });

    // ---------- Pie de página ----------
    const paginas = doc.getNumberOfPages();
    for (let i = 1; i <= paginas; i++) {
      doc.setPage(i);
      doc.setDrawColor(GRIS_CLARO[0], GRIS_CLARO[1], GRIS_CLARO[2]);
      doc.setLineWidth(0.3);
      doc.line(margen, alto - 13, ancho - margen, alto - 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      color(GRIS);
      doc.text(`IA Governance · Informe generado el ${this.fechaHora(new Date())}`, margen, alto - 8);
      doc.text(`Página ${i} de ${paginas}`, ancho - margen, alto - 8, { align: 'right' });
    }

    const nombre = this.nombreArchivo(datos, final);
    doc.save(nombre);
    return nombre;
  }

  // ===== Ayudas =====

  private colorCobertura(cobertura: number): Color {
    if (cobertura <= 40) return [224, 90, 90];
    if (cobertura <= 60) return [232, 161, 58];
    if (cobertura <= 80) return [58, 143, 214];
    return [18, 163, 111];
  }

  private numero(valor: number): string {
    return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
  }

  private fecha(f: Date): string {
    return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
  }

  private fechaHora(f: Date): string {
    return `${this.fecha(f)} ${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
  }

  // El PDF usa una fuente estándar: se evitan caracteres que no soporta
  private limpio(texto: string): string {
    return texto.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\u0000-ÿ–—•]/g, '?');
  }

  private nombreArchivo(datos: DatosInforme, final: boolean): string {
    const org = datos.organizacion
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'organizacion';

    const f = datos.fecha;
    const dia = `${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}`;

    return `${final ? 'informe-final' : 'informe-madurez'}-${org}-${dia}.pdf`;
  }
}
