export function normalizePwaBaseUrl(
  baseUrl: string,
): string {
  const leading = baseUrl.startsWith('/')
    ? baseUrl
    : `/${baseUrl}`;

  return leading.endsWith('/')
    ? leading
    : `${leading}/`;
}

export function pwaServiceWorkerUrl(
  baseUrl: string,
): string {
  return `${normalizePwaBaseUrl(baseUrl)}sw.js`;
}

export function pwaServiceWorkerScope(
  baseUrl: string,
): string {
  return normalizePwaBaseUrl(baseUrl);
}

export function pwaManifestUrl(
  baseUrl: string,
): string {
  return `${normalizePwaBaseUrl(baseUrl)}manifest.webmanifest`;
}
