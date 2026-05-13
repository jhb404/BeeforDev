import type { Page } from 'playwright';
import { logger } from '../../../../main/logger';
import type { SavePayloads } from './shared';

async function waitForSaveEndpoint(
  page: Page,
  endpointPath: string,
): Promise<unknown | null> {
  const response = await page
    .waitForResponse(
      (response) => {
        const method = response.request().method();
        const pathname = new URL(response.url()).pathname;
        return ['POST', 'PUT', 'PATCH'].includes(method) && pathname === endpointPath;
      },
      { timeout: 15_000 },
    )
    .catch(() => {
      logger.warn(
        `Salvar lançamento: nenhuma resposta HTTP detectada para ${endpointPath}`,
      );
      return null;
    });

  if (!response) return null;

  const body = await response.text().catch(() => '');
  if (response.status() >= 400) {
    throw new Error(
      `Beefor recusou ${endpointPath} (${response.status()}): ${body.slice(0, 300)}`,
    );
  }
  if (!body) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

export async function waitForSaveResponses(
  page: Page,
  expectCommentResponse: boolean,
): Promise<SavePayloads> {
  const main = waitForSaveEndpoint(page, '/timesheet-beefor/api/apontamento');
  let comment: Promise<unknown | null> = Promise.resolve(null);
  if (expectCommentResponse) {
    comment = waitForSaveEndpoint(
      page,
      '/timesheet-beefor/api/apontamento/comentario',
    );
  }
  const [mainPayload, commentPayload] = await Promise.all([main, comment]);
  return { main: mainPayload, comment: commentPayload };
}
