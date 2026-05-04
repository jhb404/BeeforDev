import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from '../../main/logger';
import {
  loadStorageStateIfExists,
  persistStorageState,
} from './beeforSession';

/**
 * Singleton Playwright lifecycle owner.
 * One browser, one context, one page reused across actions.
 */
export class BeeforClient {
  private static _instance: BeeforClient | null = null;

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private storageStatePath: string | undefined;

  static instance(): BeeforClient {
    if (!this._instance) this._instance = new BeeforClient();
    return this._instance;
  }

  async getPage(storageStatePath?: string): Promise<Page> {
    if (this.page && !this.page.isClosed()) return this.page;
    await this.launch(storageStatePath);
    return this.page!;
  }

  private async launch(storageStatePath?: string): Promise<void> {
    logger.info('Launching Chromium');
    this.storageStatePath = storageStatePath ?? this.storageStatePath;
    const headless = process.env.BEEFOR_HEADED !== '1';
    this.browser = await chromium.launch({
      headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
    logger.info(`Chromium launched (headless=${headless})`);

    const stateToLoad = this.storageStatePath
      ? await loadStorageStateIfExists(this.storageStatePath)
      : undefined;

    this.context = await this.browser.newContext({
      storageState: stateToLoad,
      viewport: { width: 1280, height: 800 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    });

    this.page = await this.context.newPage();

    this.page.on('close', () => {
      logger.warn('Page closed');
      this.page = null;
    });
    this.browser.on('disconnected', () => {
      logger.warn('Browser disconnected');
      this.browser = null;
      this.context = null;
      this.page = null;
    });
  }

  async persistSession(filePath: string): Promise<void> {
    if (!this.context) return;
    this.storageStatePath = filePath;
    await persistStorageState(this.context, filePath);
  }

  async close(): Promise<void> {
    try {
      await this.context?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.browser?.close();
    } catch {
      /* ignore */
    }
    this.page = null;
    this.context = null;
    this.browser = null;
  }
}
