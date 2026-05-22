/** Converte File de imagem em data URI base64 (data:image/...;base64,...). */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

/** Limite de imagem aceito p/ upload inline (bytes do arquivo original). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
