const assetModules = import.meta.glob("./**/*.{webp,jpg,jpeg,png}", {
  eager: true,
  import: "default",
  query: "?url",
});

const assetUrlByPath = new Map<string, string>(
  Object.entries(assetModules).map(([path, url]) => [
    normalizeAssetPath(path),
    String(url),
  ]),
);

/**
 * JSON에 저장된 asset 경로를 Vite가 번들링한 실제 URL로 변환한다.
 *
 * @param assetPath JSON에 저장된 asset 상대 경로
 * @returns 브라우저에서 사용할 수 있는 asset URL
 * @throws 등록되지 않은 asset 경로를 요청한 경우
 */
export function resolveAssetUrl(assetPath: string): string {
  const normalizedPath = normalizeAssetPath(assetPath);
  const assetUrl = assetUrlByPath.get(normalizedPath);

  if (assetUrl === undefined) {
    throw new Error(`Asset path was not found: ${assetPath}`);
  }

  return assetUrl;
}

/**
 * 여러 기준으로 입력될 수 있는 asset 경로를 registry 키로 정규화한다.
 *
 * @param assetPath 정규화할 asset 경로
 * @returns registry 조회용 asset 경로
 */
function normalizeAssetPath(assetPath: string): string {
  return assetPath.replace(/^\.?\/*(?:src\/)?assets\//, "").replace(/^\.\//, "");
}
