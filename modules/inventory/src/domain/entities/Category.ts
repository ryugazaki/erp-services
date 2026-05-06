import { AggregateRoot, Result } from '@erp/shared/kernel';

export interface CategoryState {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCategoryProps {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}

export class Category extends AggregateRoot {
  private constructor(private state: CategoryState) {
    super();
  }

  get id(): string { return this.state.id; }
  get name(): string { return this.state.name; }
  get code(): string { return this.state.code; }
  get description(): string | null { return this.state.description; }
  get parentId(): string | null { return this.state.parentId; }
  get isActive(): boolean { return this.state.isActive; }
  get createdAt(): Date { return this.state.createdAt; }
  get updatedAt(): Date { return this.state.updatedAt; }

  static create(props: CreateCategoryProps): Result<Category> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('CATEGORY_NAME_REQUIRED');
    }
    if (!props.code || props.code.trim().length === 0) {
      return Result.fail('CATEGORY_CODE_REQUIRED');
    }

    const now = new Date();
    const category = new Category({
      id: crypto.randomUUID(),
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      parentId: props.parentId || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(category);
  }

  static reconstitute(state: CategoryState): Category {
    return new Category(state);
  }

  updateDetails(props: { name?: string; description?: string; parentId?: string }): Result<void> {
    if (props.name !== undefined) {
      if (props.name.trim().length === 0) return Result.fail('CATEGORY_NAME_REQUIRED');
      this.state.name = props.name.trim();
    }
    if (props.description !== undefined) {
      this.state.description = props.description.trim() || null;
    }
    if (props.parentId !== undefined) {
      this.state.parentId = props.parentId || null;
    }
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  deactivate(): Result<void> {
    if (!this.state.isActive) return Result.fail('CATEGORY_ALREADY_INACTIVE');
    this.state.isActive = false;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }

  activate(): Result<void> {
    if (this.state.isActive) return Result.fail('CATEGORY_ALREADY_ACTIVE');
    this.state.isActive = true;
    this.state.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
