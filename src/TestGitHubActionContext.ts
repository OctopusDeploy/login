import type { GitHubActionsContext, InputOptions } from "./GitHubActionsContext";

type GetIDTokenFactory = (aud?: string) => Promise<string>;

export class TestGitHubActionContext implements GitHubActionsContext {
    inputs: Record<string, string> = {};
    outputs: Record<string, unknown> = {};
    exportedVariables: Record<string, unknown> = {};
    failureMessage: string | undefined;
    idTokenFactory: GetIDTokenFactory | undefined;

    addInput(name: string, value: string) {
        this.inputs[name] = value;
    }

    getOutputs() {
        return this.outputs;
    }

    getExportedVariables() {
        return this.exportedVariables;
    }

    getFailureMessage() {
        return this.failureMessage;
    }

    setIDToken(factory: GetIDTokenFactory) {
        this.idTokenFactory = factory;
    }

    getInput(name: string, options?: InputOptions): string {
        const inputValue = this.inputs[name];
        if (inputValue === undefined && options?.required === true) throw new Error(`Input required and not supplied: ${name}`);
        return inputValue || "";
    }

    setOutput(name: string, value: unknown): void {
        this.outputs[name] = value;
    }

    setFailed(message: string): void {
        this.failureMessage = message;
    }

    info(message: string): void {
        console.log(message);
    }

    error(message: string): void {
        console.error(message);
    }

    warning(message: string): void {
        console.warn(message);
    }

    debug(message: string): void {
        console.debug(message);
    }

    exportVariable(name: string, val: unknown) {
        this.exportedVariables[name] = val;
    }

    async getIDToken(aud?: string | undefined) {
        if (this.idTokenFactory === undefined) throw new Error("No id token factory method set, please use setIDToken to configure");
        return this.idTokenFactory(aud);
    }
}
