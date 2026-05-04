import { IModule } from './IModule';

export class ModuleRegistry {
  private modules = new Map<string, IModule>();

  async register(module: IModule): Promise<void> {
    this.validateDependencies(module);
    this.modules.set(module.name, module);
    await module.bootstrap();
  }

  async unregister(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);
    if (module) {
      await module.teardown();
      this.modules.delete(moduleName);
    }
  }

  getModule(name: string): IModule | undefined {
    return this.modules.get(name);
  }

  getAllRoutes(): { prefix: string; router: ReturnType<IModule['getRoutes']> }[] {
    const routes: { prefix: string; router: ReturnType<IModule['getRoutes']> }[] = [];
    for (const module of this.modules.values()) {
      routes.push({ prefix: module.name, router: module.getRoutes() });
    }
    return routes;
  }

  getAllEventHandlers(): Record<string, ((event: any) => Promise<void>)[]> {
    const handlers: Record<string, ((event: any) => Promise<void>)[]> = {};
    for (const module of this.modules.values()) {
      const moduleHandlers = module.getEventHandlers();
      for (const [eventType, handler] of Object.entries(moduleHandlers)) {
        if (!handlers[eventType]) handlers[eventType] = [];
        handlers[eventType].push(handler);
      }
    }
    return handlers;
  }

  private validateDependencies(module: IModule): void {
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(
          `Module "${module.name}" requires "${dep}" but it is not registered. ` +
          `Register "${dep}" before "${module.name}".`,
        );
      }
    }
  }
}
