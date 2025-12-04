export interface OSMElement {
  type: string;
  id: number;
  timestamp: string;
  version: number;
  changeset: number;
  user: string;
  uid: number;
  visible?: boolean;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  nodes?: number[];
  members?: OSMMember[];
}

export interface OSMMember {
  type: string;
  ref: number;
  role: string;
}

export interface CellInfo {
  clz: string;
  val: string | number | boolean;
  url?: string | null;
}

export type PropLine = [string, CellInfo[]];
export type TagLine = [string, CellInfo[]];
export type NodeLine = [number, CellInfo[]];
export type MemberLine = [OSMMember, CellInfo[]];
