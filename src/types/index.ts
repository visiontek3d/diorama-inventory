export interface Diorama {
  id: number;
  sku: string;
  description: string;
  photo_url: string | null;
  walls_qty: number;
  open_door_qty: number;
  lift_qty: number;
  one_off_qty: number;
  one_off_lift_qty: number;
  one_off_od_qty: number;
  carry_stock: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  sku: string;
  component: Component;
  delta: number;
  user_email: string | null;
  created_at: string;
}

export type Component = 'walls' | 'open_door' | 'lift' | 'one_off';

export const COMPONENT_LABELS: Record<Component, string> = {
  walls: 'Walls',
  open_door: 'Open Door',
  lift: 'Lift',
  one_off: 'One Off',
};

export type RootStackParamList = {
  Home: undefined;
  SkuList: undefined;
  SkuDetail: { sku: string };
  AddEditSku: { sku?: string };
  Scan: undefined;
  OneOffScan: undefined;
  BulkImport: undefined;
  Config: undefined;
  LiftList: undefined;
  LiftScan: undefined;
  LiftColorSettings: undefined;
  LiftColorAddEdit: { colorId?: number };
};

export interface Lift {
  id: number;
  size: '2high' | '3high';
  variation: 'primary' | 'extender';
  color: string;
  qty: number;
}

export interface LiftTransaction {
  id: number;
  lift_id: number;
  delta: number;
  user_email: string | null;
  created_at: string;
}

export interface LiftColor {
  id: number;
  name: string;
  has_2high: boolean;
  has_3high: boolean;
  color_hex: string;
  photo_url: string | null;
  sort_order: number;
}
