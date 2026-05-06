export const TOKENS = {
  ProductRepository: Symbol('IProductRepository'),
  CategoryRepository: Symbol('ICategoryRepository'),
  WarehouseRepository: Symbol('IWarehouseRepository'),
  StockMovementRepository: Symbol('IStockMovementRepository'),
  EventBus: Symbol('IEventBus'),
} as const;
