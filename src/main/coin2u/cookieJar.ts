export class CookieJar {
  private cookies = new Map<string, string>();

  set(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  setFromHeader(setCookieHeader: string | null): void {
    if (!setCookieHeader) return;
    const parts = setCookieHeader.split(/,(?=\s*[A-Za-z0-9_.\-]+=)/);
    for (const part of parts) {
      const first = part.split(';')[0]?.trim();
      if (!first) continue;
      const eq = first.indexOf('=');
      if (eq <= 0) continue;
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      this.cookies.set(name, value);
    }
  }

  toHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  size(): number {
    return this.cookies.size;
  }

  clear(): void {
    this.cookies.clear();
  }

  toRecord(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  loadRecord(record: Record<string, string> | undefined): void {
    if (!record) return;
    this.cookies.clear();
    for (const [k, v] of Object.entries(record)) this.cookies.set(k, v);
  }
}
