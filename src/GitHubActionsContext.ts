export type InputOptions = {
    required?: boolean;
};

export interface GitHubActionsContext {
    getInput: (name: string, options?: InputOptions) => string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setOutput: (name: string, value: any) => void;
    setFailed: (message: string) => void;
    exportVariable: (name: string, val: unknown) => void;

    info: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;

    getIDToken: (aud?: string) => Promise<string>;
}
