import 'reflect-metadata';
import { Router } from 'express';
import { Kysely } from 'kysely';
import { container, injectable } from 'tsyringe';
import { IModule, EventHandlerMap } from '@erp/core/module-registry';
import { IEventBus } from '@erp/core/event-bus';
import { AUTH_TOKENS, createAuthMiddleware, requirePermission, ITokenService } from '@erp/module/auth';
import { TOKENS } from './tokens';
import { IProductRepository } from './domain/repositories/IProductRepository';
import { ICategoryRepository } from './domain/repositories/ICategoryRepository';
import { IWarehouseRepository } from './domain/repositories/IWarehouseRepository';
import { IStockMovementRepository } from './domain/repositories/IStockMovementRepository';
import { KyselyProductRepository } from './infrastructure/repositories/KyselyProductRepository';
import { KyselyCategoryRepository } from './infrastructure/repositories/KyselyCategoryRepository';
import { KyselyWarehouseRepository } from './infrastructure/repositories/KyselyWarehouseRepository';
import { KyselyStockMovementRepository } from './infrastructure/repositories/KyselyStockMovementRepository';
import { CreateProductUseCase } from './application/use-cases/product/CreateProductUseCase';
import { GetProductUseCase } from './application/use-cases/product/GetProductUseCase';
import { ListProductsUseCase } from './application/use-cases/product/ListProductsUseCase';
import { UpdateProductUseCase } from './application/use-cases/product/UpdateProductUseCase';
import { DeleteProductUseCase } from './application/use-cases/product/DeleteProductUseCase';
import { CreateCategoryUseCase } from './application/use-cases/category/CreateCategoryUseCase';
import { GetCategoryUseCase } from './application/use-cases/category/GetCategoryUseCase';
import { ListCategoriesUseCase } from './application/use-cases/category/ListCategoriesUseCase';
import { UpdateCategoryUseCase } from './application/use-cases/category/UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from './application/use-cases/category/DeleteCategoryUseCase';
import { CreateWarehouseUseCase } from './application/use-cases/warehouse/CreateWarehouseUseCase';
import { GetWarehouseUseCase } from './application/use-cases/warehouse/GetWarehouseUseCase';
import { ListWarehousesUseCase } from './application/use-cases/warehouse/ListWarehousesUseCase';
import { UpdateWarehouseUseCase } from './application/use-cases/warehouse/UpdateWarehouseUseCase';
import { DeleteWarehouseUseCase } from './application/use-cases/warehouse/DeleteWarehouseUseCase';
import { CreateStockMovementUseCase } from './application/use-cases/stock-movement/CreateStockMovementUseCase';
import { GetStockMovementUseCase } from './application/use-cases/stock-movement/GetStockMovementUseCase';
import { ListStockMovementsUseCase } from './application/use-cases/stock-movement/ListStockMovementsUseCase';
import { ProductController } from './infrastructure/http/ProductController';
import { CategoryController } from './infrastructure/http/CategoryController';
import { WarehouseController } from './infrastructure/http/WarehouseController';
import { StockMovementController } from './infrastructure/http/StockMovementController';
import { createInventoryRoutes } from './infrastructure/http/InventoryRoutes';

export interface InventoryModuleConfig {
  db: Kysely<any>;
  eventBus: IEventBus;
}

@injectable()
export class InventoryModule implements IModule {
  name = 'inventory';
  version = '1.0.0';
  dependencies: string[] = [];

  private router!: Router;
  private config: InventoryModuleConfig;

  constructor(config: InventoryModuleConfig) {
    this.config = config;
  }

  async register(_container: any): Promise<void> {
    container.registerInstance(TOKENS.ProductRepository, new KyselyProductRepository(this.config.db));
    container.registerInstance(TOKENS.CategoryRepository, new KyselyCategoryRepository(this.config.db));
    container.registerInstance(TOKENS.WarehouseRepository, new KyselyWarehouseRepository(this.config.db));
    container.registerInstance(TOKENS.StockMovementRepository, new KyselyStockMovementRepository(this.config.db));
    container.registerInstance(TOKENS.EventBus, this.config.eventBus);
  }

  async bootstrap(): Promise<void> {
    const productRepo = container.resolve<IProductRepository>(TOKENS.ProductRepository);
    const categoryRepo = container.resolve<ICategoryRepository>(TOKENS.CategoryRepository);
    const warehouseRepo = container.resolve<IWarehouseRepository>(TOKENS.WarehouseRepository);
    const stockMovementRepo = container.resolve<IStockMovementRepository>(TOKENS.StockMovementRepository);
    const eventBus = container.resolve<IEventBus>(TOKENS.EventBus);

    const tokenService = container.resolve<ITokenService>(AUTH_TOKENS.TokenService);

    // Product use cases
    const createProductUseCase = new CreateProductUseCase(productRepo, categoryRepo, eventBus);
    const getProductUseCase = new GetProductUseCase(productRepo);
    const listProductsUseCase = new ListProductsUseCase(productRepo);
    const updateProductUseCase = new UpdateProductUseCase(productRepo, categoryRepo, eventBus);
    const deleteProductUseCase = new DeleteProductUseCase(productRepo, eventBus);

    // Category use cases
    const createCategoryUseCase = new CreateCategoryUseCase(categoryRepo, eventBus);
    const getCategoryUseCase = new GetCategoryUseCase(categoryRepo);
    const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepo);
    const updateCategoryUseCase = new UpdateCategoryUseCase(categoryRepo, eventBus);
    const deleteCategoryUseCase = new DeleteCategoryUseCase(categoryRepo, eventBus);

    // Warehouse use cases
    const createWarehouseUseCase = new CreateWarehouseUseCase(warehouseRepo, eventBus);
    const getWarehouseUseCase = new GetWarehouseUseCase(warehouseRepo);
    const listWarehousesUseCase = new ListWarehousesUseCase(warehouseRepo);
    const updateWarehouseUseCase = new UpdateWarehouseUseCase(warehouseRepo, eventBus);
    const deleteWarehouseUseCase = new DeleteWarehouseUseCase(warehouseRepo, eventBus);

    // Stock movement use cases
    const createStockMovementUseCase = new CreateStockMovementUseCase(stockMovementRepo, productRepo, warehouseRepo, eventBus);
    const getStockMovementUseCase = new GetStockMovementUseCase(stockMovementRepo);
    const listStockMovementsUseCase = new ListStockMovementsUseCase(stockMovementRepo);

    // Controllers
    const productController = new ProductController(
      createProductUseCase,
      getProductUseCase,
      listProductsUseCase,
      updateProductUseCase,
      deleteProductUseCase,
    );
    const categoryController = new CategoryController(
      createCategoryUseCase,
      getCategoryUseCase,
      listCategoriesUseCase,
      updateCategoryUseCase,
      deleteCategoryUseCase,
    );
    const warehouseController = new WarehouseController(
      createWarehouseUseCase,
      getWarehouseUseCase,
      listWarehousesUseCase,
      updateWarehouseUseCase,
      deleteWarehouseUseCase,
    );
    const stockMovementController = new StockMovementController(
      createStockMovementUseCase,
      getStockMovementUseCase,
      listStockMovementsUseCase,
    );

    const authenticate = createAuthMiddleware(tokenService);

    this.router = createInventoryRoutes(
      productController,
      categoryController,
      warehouseController,
      stockMovementController,
      authenticate,
      requirePermission,
    );
  }

  getRoutes(): Router {
    return this.router;
  }

  getEventHandlers(): EventHandlerMap {
    return {};
  }

  async teardown(): Promise<void> {}
}
