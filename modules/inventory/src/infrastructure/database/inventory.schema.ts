import { ColumnType } from 'kysely';

export interface InventoryDatabase {
  'inventory.categories': CategoriesTable;
  'inventory.warehouses': WarehousesTable;
  'inventory.products': ProductsTable;
  'inventory.stock_movements': StockMovementsTable;
}

export interface CategoriesTable {
  id: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  code: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  parent_id: ColumnType<string | null, string | null, string | null>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface WarehousesTable {
  id: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  code: ColumnType<string, string, string>;
  address: ColumnType<string | null, string | null, string | null>;
  location_id: ColumnType<string | null, string | null, string | null>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface ProductsTable {
  id: ColumnType<string, string, string>;
  sku: ColumnType<string, string, string>;
  name: ColumnType<string, string, string>;
  description: ColumnType<string | null, string | null, string | null>;
  category_id: ColumnType<string | null, string | null, string | null>;
  unit_of_measure: ColumnType<string, string, string>;
  base_price: ColumnType<number, number, number>;
  minimum_stock: ColumnType<number, number, number>;
  is_active: ColumnType<boolean, boolean, boolean>;
  created_at: ColumnType<Date, Date, Date>;
  updated_at: ColumnType<Date, Date, Date>;
}

export interface StockMovementsTable {
  id: ColumnType<string, string, string>;
  product_id: ColumnType<string, string, string>;
  warehouse_id: ColumnType<string, string, string>;
  movement_type: ColumnType<string, string, string>;
  quantity: ColumnType<number, number, number>;
  reference_type: ColumnType<string | null, string | null, string | null>;
  reference_id: ColumnType<string | null, string | null, string | null>;
  notes: ColumnType<string | null, string | null, string | null>;
  occurred_at: ColumnType<Date, Date, Date>;
  created_at: ColumnType<Date, Date, Date>;
}
