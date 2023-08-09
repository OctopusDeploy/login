import { GitHubActionsContext, InputOptions } from "./GitHubActionsContext";

export class TestGitHubActionContext implements GitHubActionsContext {
    inputs: Record<string, string> = {};
    outputs: Record<string, unknown> = {};
    exportedVariables: Record<string, unknown> = {};
    failureMessage: string | undefined;
    idToken: string | undefined;

    addInput(name: string, value: string) {
        this.inputs[name] = value;
    }

    getOutputs() {
        return this.outputs;
    }

    getFailureMessage() {
        return this.failureMessage;
    }

    setIDToken(token: string) {
        this.idToken = token;
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

    debug(message: string): void {
        console.debug(message);
    }

    exportVariable(name: string, val: unknown) {
        this.exportedVariables[name] = val;
    }

    async getIDToken(aud?: string | undefined) {
        return this.idToken ?? "";
    }
}
