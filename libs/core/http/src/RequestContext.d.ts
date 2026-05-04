export declare class RequestContext {
    static run<T>(fn: () => T): T;
    static getId(): string;
    static setId(id: string): void;
}
