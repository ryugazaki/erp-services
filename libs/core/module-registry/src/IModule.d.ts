import { Router } from 'express';
export type EventHandlerMap = Record<string, (event: any) => Promise<void>>;
export interface IModule {
    name: string;
    version: string;
    dependencies: string[];
    register(container: any): Promise<void>;
    bootstrap(): Promise<void>;
    teardown(): Promise<void>;
    getRoutes(): Router;
    getEventHandlers(): EventHandlerMap;
}
