import { IModule } from './IModule';
export declare class ModuleRegistry {
    private modules;
    register(module: IModule): Promise<void>;
    unregister(moduleName: string): Promise<void>;
    getModule(name: string): IModule | undefined;
    getAllRoutes(): {
        prefix: string;
        router: ReturnType<IModule['getRoutes']>;
    }[];
    getAllEventHandlers(): Record<string, ((event: any) => Promise<void>)[]>;
    private validateDependencies;
}
