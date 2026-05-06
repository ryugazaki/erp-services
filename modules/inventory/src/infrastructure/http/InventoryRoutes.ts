import { Router, RequestHandler } from 'express';
import { validate } from '@erp/core/http';
import { ProductController } from './ProductController';
import { CategoryController } from './CategoryController';
import { WarehouseController } from './WarehouseController';
import { StockMovementController } from './StockMovementController';
import { CreateProductSchema } from '../../application/dtos/product/CreateProductDTO';
import { UpdateProductSchema } from '../../application/dtos/product/UpdateProductDTO';
import { ListProductsSchema } from '../../application/dtos/product/ListProductsDTO';
import { CreateCategorySchema } from '../../application/dtos/category/CreateCategoryDTO';
import { UpdateCategorySchema } from '../../application/dtos/category/UpdateCategoryDTO';
import { ListCategoriesSchema } from '../../application/dtos/category/ListCategoriesDTO';
import { CreateWarehouseSchema } from '../../application/dtos/warehouse/CreateWarehouseDTO';
import { UpdateWarehouseSchema } from '../../application/dtos/warehouse/UpdateWarehouseDTO';
import { ListWarehousesSchema } from '../../application/dtos/warehouse/ListWarehousesDTO';
import { CreateStockMovementSchema } from '../../application/dtos/stock-movement/CreateStockMovementDTO';
import { ListStockMovementsSchema } from '../../application/dtos/stock-movement/ListStockMovementsDTO';

/**
 * @swagger
 * tags:
 *   - name: Inventory
 *     description: Product catalog, warehouses, and stock movement tracking
 */

export function createInventoryRoutes(
  productController: ProductController,
  categoryController: CategoryController,
  warehouseController: WarehouseController,
  stockMovementController: StockMovementController,
  authenticate: RequestHandler,
  requirePermission: (...permissions: string[]) => RequestHandler,
): Router {
  const router = Router();

  // ─── Product Routes ─────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/inventory/products:
   *   post:
   *     tags: [Inventory]
   *     summary: Create a new product
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductRequest'
   *     responses:
   *       201:
   *         description: Product created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: SKU already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/products',
    authenticate,
    requirePermission('inventory:products:write'),
    validate(CreateProductSchema),
    productController.create,
  );

  /**
   * @swagger
   * /v1/inventory/products:
   *   get:
   *     tags: [Inventory]
   *     summary: List products with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: categoryId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *       - in: query
   *         name: search
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Paginated list of products
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Product'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/products',
    authenticate,
    requirePermission('inventory:products:read'),
    validate(ListProductsSchema),
    productController.list,
  );

  /**
   * @swagger
   * /v1/inventory/products/{id}:
   *   get:
   *     tags: [Inventory]
   *     summary: Get product by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Product details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/products/:id',
    authenticate,
    requirePermission('inventory:products:read'),
    productController.getById,
  );

  /**
   * @swagger
   * /v1/inventory/products/{id}:
   *   put:
   *     tags: [Inventory]
   *     summary: Update product details
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProductRequest'
   *     responses:
   *       200:
   *         description: Product updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Product not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/products/:id',
    authenticate,
    requirePermission('inventory:products:write'),
    validate(UpdateProductSchema),
    productController.update,
  );

  /**
   * @swagger
   * /v1/inventory/products/{id}:
   *   delete:
   *     tags: [Inventory]
   *     summary: Delete (deactivate) a product
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Product deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Product already inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/products/:id',
    authenticate,
    requirePermission('inventory:products:write'),
    productController.delete,
  );

  // ─── Category Routes ────────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/inventory/categories:
   *   post:
   *     tags: [Inventory]
   *     summary: Create a new product category
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryRequest'
   *     responses:
   *       201:
   *         description: Category created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Category code already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/categories',
    authenticate,
    requirePermission('inventory:categories:write'),
    validate(CreateCategorySchema),
    categoryController.create,
  );

  /**
   * @swagger
   * /v1/inventory/categories:
   *   get:
   *     tags: [Inventory]
   *     summary: List all categories
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: List of categories
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Category'
   */
  router.get(
    '/categories',
    authenticate,
    requirePermission('inventory:categories:read'),
    validate(ListCategoriesSchema),
    categoryController.list,
  );

  /**
   * @swagger
   * /v1/inventory/categories/{id}:
   *   get:
   *     tags: [Inventory]
   *     summary: Get category by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Category details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       404:
   *         description: Category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/categories/:id',
    authenticate,
    requirePermission('inventory:categories:read'),
    categoryController.getById,
  );

  /**
   * @swagger
   * /v1/inventory/categories/{id}:
   *   put:
   *     tags: [Inventory]
   *     summary: Update category details
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCategoryRequest'
   *     responses:
   *       200:
   *         description: Category updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/categories/:id',
    authenticate,
    requirePermission('inventory:categories:write'),
    validate(UpdateCategorySchema),
    categoryController.update,
  );

  /**
   * @swagger
   * /v1/inventory/categories/{id}:
   *   delete:
   *     tags: [Inventory]
   *     summary: Delete (deactivate) a category
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Category deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Category'
   *       404:
   *         description: Category not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Category already inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/categories/:id',
    authenticate,
    requirePermission('inventory:categories:write'),
    categoryController.delete,
  );

  // ─── Warehouse Routes ───────────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/inventory/warehouses:
   *   post:
   *     tags: [Inventory]
   *     summary: Create a new warehouse
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateWarehouseRequest'
   *     responses:
   *       201:
   *         description: Warehouse created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Warehouse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Warehouse code already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/warehouses',
    authenticate,
    requirePermission('inventory:warehouses:write'),
    validate(CreateWarehouseSchema),
    warehouseController.create,
  );

  /**
   * @swagger
   * /v1/inventory/warehouses:
   *   get:
   *     tags: [Inventory]
   *     summary: List all warehouses
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema: { type: boolean }
   *     responses:
   *       200:
   *         description: List of warehouses
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Warehouse'
   */
  router.get(
    '/warehouses',
    authenticate,
    requirePermission('inventory:warehouses:read'),
    validate(ListWarehousesSchema),
    warehouseController.list,
  );

  /**
   * @swagger
   * /v1/inventory/warehouses/{id}:
   *   get:
   *     tags: [Inventory]
   *     summary: Get warehouse by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Warehouse details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Warehouse'
   *       404:
   *         description: Warehouse not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/warehouses/:id',
    authenticate,
    requirePermission('inventory:warehouses:read'),
    warehouseController.getById,
  );

  /**
   * @swagger
   * /v1/inventory/warehouses/{id}:
   *   put:
   *     tags: [Inventory]
   *     summary: Update warehouse details
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateWarehouseRequest'
   *     responses:
   *       200:
   *         description: Warehouse updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Warehouse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Warehouse not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.put(
    '/warehouses/:id',
    authenticate,
    requirePermission('inventory:warehouses:write'),
    validate(UpdateWarehouseSchema),
    warehouseController.update,
  );

  /**
   * @swagger
   * /v1/inventory/warehouses/{id}:
   *   delete:
   *     tags: [Inventory]
   *     summary: Delete (deactivate) a warehouse
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Warehouse deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/Warehouse'
   *       404:
   *         description: Warehouse not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Warehouse already inactive
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.delete(
    '/warehouses/:id',
    authenticate,
    requirePermission('inventory:warehouses:write'),
    warehouseController.delete,
  );

  // ─── Stock Movement Routes ──────────────────────────────────────────────────

  /**
   * @swagger
   * /v1/inventory/stock-movements:
   *   post:
   *     tags: [Inventory]
   *     summary: Record a stock movement
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateStockMovementRequest'
   *     responses:
   *       201:
   *         description: Stock movement recorded successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/StockMovement'
   *       400:
   *         description: Validation error or product/warehouse not active
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Product or warehouse not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    '/stock-movements',
    authenticate,
    requirePermission('inventory:stock-movements:write'),
    validate(CreateStockMovementSchema),
    stockMovementController.create,
  );

  /**
   * @swagger
   * /v1/inventory/stock-movements:
   *   get:
   *     tags: [Inventory]
   *     summary: List stock movements with pagination and filters
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20 }
   *       - in: query
   *         name: productId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: warehouseId
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: movementType
   *         schema: { type: string, enum: [IN, OUT, TRANSFER, ADJUSTMENT] }
   *       - in: query
   *         name: referenceType
   *         schema: { type: string }
   *       - in: query
   *         name: dateFrom
   *         schema: { type: string, format: date }
   *       - in: query
   *         name: dateTo
   *         schema: { type: string, format: date }
   *     responses:
   *       200:
   *         description: Paginated list of stock movements
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/StockMovement'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   */
  router.get(
    '/stock-movements',
    authenticate,
    requirePermission('inventory:stock-movements:read'),
    validate(ListStockMovementsSchema),
    stockMovementController.list,
  );

  /**
   * @swagger
   * /v1/inventory/stock-movements/{id}:
   *   get:
   *     tags: [Inventory]
   *     summary: Get stock movement by ID
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Stock movement details
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/StockMovement'
   *       404:
   *         description: Stock movement not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    '/stock-movements/:id',
    authenticate,
    requirePermission('inventory:stock-movements:read'),
    stockMovementController.getById,
  );

  return router;
}
