function normalizeBaseUrl(baseUrl: string): string {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function normalizeAssetPath(path: string): string {
  return path.replace(/^\/+/, '');
}

export class AssetLoader {
  private readonly baseUrl: string;

  public constructor(baseUrl = import.meta.env.BASE_URL) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  public resolve(path: string): string {
    return `${this.baseUrl}${normalizeAssetPath(path)}`;
  }

  public async fetchText(path: string, signal?: AbortSignal): Promise<string> {
    const url = this.resolve(path);
    const response = signal ? await fetch(url, { signal }) : await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load asset: ${path} (${response.status})`);
    }

    return response.text();
  }

  public async fetchArrayBuffer(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    const url = this.resolve(path);
    const response = signal ? await fetch(url, { signal }) : await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load asset: ${path} (${response.status})`);
    }

    return response.arrayBuffer();
  }
}

export const assetLoader = new AssetLoader();
