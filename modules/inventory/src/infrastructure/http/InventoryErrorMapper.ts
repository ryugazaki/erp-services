interface ErrorMapping {
  status: number;
  message: string;
  code: string;
}

const errorMap: Record<string, Omit<ErrorMapping, 'code'>> = {
  PRODUCT_NOT_FOUND: { status: 404, message: 'Product not found' },
  SKU_ALREADY_EXISTS: { status: 409, message: 'SKU already exists' },
  CATEGORY_NOT_FOUND: { status: 404, message: 'Category not found' },
  CATEGORY_CODE_ALREADY_EXISTS: { status: 409, message: 'Category code already exists' },
  PARENT_CATEGORY_NOT_FOUND: { status: 404, message: 'Parent category not found' },
  CANNOT_BE_SELF_PARENT: { status: 400, message: 'Category cannot be its own parent' },
  WAREHOUSE_NOT_FOUND: { status: 404, message: 'Warehouse not found' },
  WAREHOUSE_CODE_ALREADY_EXISTS: { status: 409, message: 'Warehouse code already exists' },
  WAREHOUSE_NOT_ACTIVE: { status: 400, message: 'Warehouse is not active' },
  PRODUCT_NOT_ACTIVE: { status: 400, message: 'Product is not active' },
  STOCK_MOVEMENT_NOT_FOUND: { status: 404, message: 'Stock movement not found' },
  PRODUCT_NAME_REQUIRED: { status: 400, message: 'Product name is required' },
  CATEGORY_NAME_REQUIRED: { status: 400, message: 'Category name is required' },
  CATEGORY_CODE_REQUIRED: { status: 400, message: 'Category code is required' },
  WAREHOUSE_NAME_REQUIRED: { status: 400, message: 'Warehouse name is required' },
  WAREHOUSE_CODE_REQUIRED: { status: 400, message: 'Warehouse code is required' },
  PRODUCT_ID_REQUIRED: { status: 400, message: 'Product ID is required' },
  WAREHOUSE_ID_REQUIRED: { status: 400, message: 'Warehouse ID is required' },
  MOVEMENT_TYPE_REQUIRED: { status: 400, message: 'Movement type is required' },
  QUANTITY_REQUIRED: { status: 400, message: 'Quantity is required' },
  INVALID_QUANTITY: { status: 400, message: 'Invalid quantity' },
  INVALID_BASE_PRICE: { status: 400, message: 'Invalid base price' },
  INVALID_MINIMUM_STOCK: { status: 400, message: 'Invalid minimum stock' },
  CATEGORY_ALREADY_INACTIVE: { status: 400, message: 'Category is already inactive' },
  CATEGORY_ALREADY_ACTIVE: { status: 400, message: 'Category is already active' },
  WAREHOUSE_ALREADY_INACTIVE: { status: 400, message: 'Warehouse is already inactive' },
  WAREHOUSE_ALREADY_ACTIVE: { status: 400, message: 'Warehouse is already active' },
  PRODUCT_ALREADY_INACTIVE: { status: 400, message: 'Product is already inactive' },
  PRODUCT_ALREADY_ACTIVE: { status: 400, message: 'Product is already active' },
};

export function mapInventoryError(error: unknown): ErrorMapping {
  if (typeof error === 'string' && errorMap[error]) {
    return { ...errorMap[error], code: error };
  }
  return { status: 500, message: error instanceof Error ? error.message : 'An error occurred', code: 'INTERNAL_ERROR' };
}
