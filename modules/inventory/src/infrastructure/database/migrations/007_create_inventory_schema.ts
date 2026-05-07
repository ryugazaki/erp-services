import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create inventory schema
  await sql`CREATE SCHEMA IF NOT EXISTS inventory`.execute(db);

  // Create categories table
  await sql`
    CREATE TABLE inventory.categories (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name        varchar(100) NOT NULL,
      code        varchar(20) NOT NULL UNIQUE,
      description text,
      parent_id   uuid REFERENCES inventory.categories(id),
      is_active   boolean NOT NULL DEFAULT true,
      created_at  timestamp NOT NULL DEFAULT now(),
      updated_at  timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  // Create warehouses table
  await sql`
    CREATE TABLE inventory.warehouses (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name        varchar(100) NOT NULL,
      code        varchar(20) NOT NULL UNIQUE,
      address     text,
      location_id varchar(50),
      is_active   boolean NOT NULL DEFAULT true,
      created_at  timestamp NOT NULL DEFAULT now(),
      updated_at  timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  // Create products table
  await sql`
    CREATE TABLE inventory.products (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      sku            varchar(50) NOT NULL UNIQUE,
      name           varchar(200) NOT NULL,
      description    text,
      category_id    uuid REFERENCES inventory.categories(id),
      unit_of_measure varchar(20) NOT NULL,
      base_price     decimal(15,2) NOT NULL DEFAULT 0,
      minimum_stock  integer NOT NULL DEFAULT 0,
      is_active      boolean NOT NULL DEFAULT true,
      created_at     timestamp NOT NULL DEFAULT now(),
      updated_at     timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  // Create indexes for products
  await sql`CREATE INDEX idx_products_sku ON inventory.products(sku)`.execute(db);
  await sql`CREATE INDEX idx_products_category ON inventory.products(category_id)`.execute(db);
  await sql`CREATE INDEX idx_products_active ON inventory.products(is_active)`.execute(db);

  // Create stock_movements table
  await sql`
    CREATE TABLE inventory.stock_movements (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id     uuid NOT NULL REFERENCES inventory.products(id),
      warehouse_id   uuid NOT NULL REFERENCES inventory.warehouses(id),
      movement_type  varchar(20) NOT NULL,
      quantity       integer NOT NULL,
      reference_type varchar(50),
      reference_id   uuid,
      notes          text,
      occurred_at    timestamp NOT NULL DEFAULT now(),
      created_at     timestamp NOT NULL DEFAULT now()
    )
  `.execute(db);

  // Create indexes for stock_movements
  await sql`CREATE INDEX idx_stock_movements_product_warehouse ON inventory.stock_movements(product_id, warehouse_id)`.execute(db);
  await sql`CREATE INDEX idx_stock_movements_type ON inventory.stock_movements(movement_type)`.execute(db);
  await sql`CREATE INDEX idx_stock_movements_reference ON inventory.stock_movements(reference_type, reference_id)`.execute(db);
  await sql`CREATE INDEX idx_stock_movements_occurred_at ON inventory.stock_movements(occurred_at)`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE IF EXISTS inventory.stock_movements CASCADE`.execute(db);
  await sql`DROP TABLE IF EXISTS inventory.products CASCADE`.execute(db);
  await sql`DROP TABLE IF EXISTS inventory.warehouses CASCADE`.execute(db);
  await sql`DROP TABLE IF EXISTS inventory.categories CASCADE`.execute(db);
  await sql`DROP SCHEMA IF EXISTS inventory CASCADE`.execute(db);
}
