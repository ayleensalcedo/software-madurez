// Extrae el texto de un error HTTP del backend (cuerpo en texto o JSON con "message").
export function textoError(err: { error?: unknown } | null | undefined, porDefecto: string): string {
  const cuerpo = err?.error;
  if (typeof cuerpo === 'string' && cuerpo.trim()) return cuerpo;
  const mensaje = (cuerpo as { message?: string } | null | undefined)?.message;
  return mensaje?.trim() ? mensaje : porDefecto;
}

// El backend responde "El correo ya está registrado en el sistema" cuando el correo está repetido.
export const MENSAJE_CORREO_REPETIDO = 'El correo electrónico ya se encuentra registrado en el sistema';

export function esCorreoRepetido(texto: string): boolean {
  const t = texto.toLowerCase();
  return t.includes('correo') && (t.includes('registrado') || t.includes('existe'));
}
