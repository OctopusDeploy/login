import { getInput, setOutput, setFailed, info, exportVariable, getIDToken, error, debug, warning } from "@actions/core";
import type { GitHubActionsContext, InputOptions } from "./GitHubActionsContext";

export class GitHubActionsContextImpl implements GitHubActionsContext {
    error(message: string) {
        error(message);
    }

    debug(message: string) {
        debug(message);
    }

    exportVariable(name: string, val: unknown) {
        exportVariable(name, val);
    }

    getIDToken(aud?: string | undefined): Promise<string> {
        return getIDToken(aud);
    }

    getInput(name: string, options?: InputOptions): string {
        return getInput(name, options);
    }

    setOutput(name: string, value: unknown): void {
        return setOutput(name, value);
    }

    setFailed(message: string): void {
        return setFailed(message);
    }

    info(message: string): void {
        return info(message);
    }

    warning(message: string): void {
        return warning(message);
    }
}
