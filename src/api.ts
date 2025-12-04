import type { OSMElement, CellInfo } from './types';

const API_URL = 'https://api.openstreetmap.org/api/0.6';

export class ElementDoesntExistException extends Error {
  url: string;
  status: number;

  constructor(url: string, status: number) {
    super(`Element not found: ${url}`);
    this.url = url;
    this.status = status;
  }
}

async function fetchAndParseJson(urlSuffix: string): Promise<OSMElement[]> {
  const url = `${API_URL}${urlSuffix}`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new ElementDoesntExistException(url, response.status);
  }

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json() as { elements: OSMElement[] };
  return data.elements;
}

export async function fetchNodeHistory(id: number): Promise<OSMElement[]> {
  return fetchAndParseJson(`/node/${id}/history.json`);
}

export async function fetchWayHistory(id: number): Promise<OSMElement[]> {
  return fetchAndParseJson(`/way/${id}/history.json`);
}

export async function fetchRelationHistory(id: number): Promise<OSMElement[]> {
  return fetchAndParseJson(`/relation/${id}/history.json`);
}

export function computeAllTagKeys(versions: OSMElement[]): string[] {
  const allKeys: string[] = [];
  for (const v of versions) {
    for (const t of Object.keys(v.tags || {})) {
      if (!allKeys.includes(t)) {
        allKeys.push(t);
      }
    }
  }
  return allKeys;
}

function* pairwise<T>(iterable: T[]): Generator<[T | null, T]> {
  const arr = [null, ...iterable] as (T | null)[];
  for (let i = 0; i < arr.length - 1; i++) {
    yield [arr[i], arr[i + 1] as T];
  }
}

export function changeRow(
  versions: OSMElement[],
  attrGetter: (v: OSMElement) => unknown,
  urlTemplate?: string
): CellInfo[] {
  const row: CellInfo[] = [];

  for (const [prevVer, curVer] of pairwise(versions)) {
    const prevVal = prevVer !== null ? attrGetter(prevVer) : null;
    const curVal = attrGetter(curVer);

    let clz: string;
    if (prevVal === null && curVal === null) {
      clz = 'notpresent';
    } else if (prevVal === null && curVal !== null) {
      clz = 'new';
    } else if (prevVal !== null && curVal === null) {
      clz = 'removed';
    } else if (prevVal !== curVal) {
      clz = 'changed';
    } else {
      clz = 'unchanged';
    }

    row.push({
      clz,
      val: curVal !== null && curVal !== undefined ? curVal as string | number | boolean : '',
      url: urlTemplate && curVal ? urlTemplate.replace('{val}', String(curVal)) : null,
    });
  }

  return row;
}
