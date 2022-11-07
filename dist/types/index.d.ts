declare class ApplicationConfiguration {
    config: Record<string, any>;
    private configStore;
    constructor();
    getEnv(): string;
    load(path: string): void;
    update<T>(data: Partial<T>): void;
    /**
     * Stringify the config as a JSON document
     */
    toJson(): string;
    /**
     * Stringify the config as a YAML document
     */
    toYaml(): string;
    save(format?: string): void;
    query(path: string): any;
}
export default ApplicationConfiguration;
