export interface Diorama {
  id: number;
  sku: string;
  description: string;
  photo_uri: string | null;
  walls_qty: number;
  open_door_qty: number;
  lift_qty: number;
  one_off_qty: number;
  carry_stock: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  sku: string;
  component: Component;
  qty: number;
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
  SkuList: undefined;
  SkuDetail: { sku: string };
  AddEditSku: { sku?: string };
  Scan: undefined;
  BulkImport: undefined;
  Config: undefined;
};
