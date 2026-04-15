/**
 * JSON 값을 canonical 문자열로 변환한다.
 *
 * @param value canonicalize할 JSON 값
 * @returns 키 정렬이 적용된 JSON 문자열
 */
export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValue(item));
  }

  if (value != null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    const sortedObject: Record<string, unknown> = {};
    entries.forEach(([key, entryValue]) => {
      sortedObject[key] = sortJsonValue(entryValue);
    });

    return sortedObject;
  }

  return value;
}
