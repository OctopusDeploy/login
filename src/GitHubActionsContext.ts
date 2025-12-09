export type InputOptions = {
    required?: boolean;
};

export interface GitHubActionsContext {
    getInput: (name: string, options?: InputOptions) => string;

    setOutput: (name: string, value: any) => void;
    setSecret: (secret: string) => void;
    setFailed: (message: string) => void;
    exportVariable: (name: string, val: unknown) => void;

    info: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    debug: (message: string) => void;

    getIDToken: (aud?: string) => Promise<string>;
}
