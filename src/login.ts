import { EOL } from "os";
import fetch from "node-fetch";
import type { GitHubActionsContext } from "./GitHubActionsContext";

export type InputParameters = {
    server?: string;
    serviceAccountId?: string;
    apiKey?: string;
};

export const EnvironmentVariables = {
    URL: "OCTOPUS_URL",
    ApiKey: "OCTOPUS_API_KEY",
    AccessToken: "OCTOPUS_ACCESS_TOKEN",
};

export type ExchangeOidcTokenCommand = {
    grant_type: string;
    audience: string;
    subject_token: string;
    subject_token_type: string;
};

export type ExchangeOidcTokenResponse = {
    access_token: string;
    issued_token_type: string;
    token_type: string;
    expires_in: string;
};

export type ExchangeOidcTokenErrorResponse = {
    ErrorMessage: string;
    Errors: string[];
};

export const TokenExchangeGrantType = "urn:ietf:params:oauth:grant-type:token-exchange";
export const TokenExchangeSubjectTokenType = "urn:ietf:params:oauth:token-type:jwt";

export async function login(context: GitHubActionsContext) {
    const inputs: InputParameters = {
        server: context.getInput("server", { required: true }),
        serviceAccountId: context.getInput("service_account_id"),
        apiKey: context.getInput("api_key"),
    };

    const errors: string[] = [];

    if (!inputs.server) errors.push("The Octopus instance URL is required, please specify using the 'server' input.");

    if (!inputs.serviceAccountId && !inputs.apiKey)
        errors.push("A Service Account Id or API Key is required. Please specify using either the 'service_account_id' or 'api_key' inputs.");

    if (inputs.serviceAccountId && inputs.apiKey) errors.push("Only one of Service Account Id or API Key can be supplied.");

    if (errors.length > 0) {
        throw new Error(errors.join(EOL));
    }

    if (inputs.serviceAccountId) {
        context.info(`Logging in with OpenID Connect to '${inputs.server}' using service account '${inputs.serviceAccountId}'`);

        context.info(`Obtaining GitHub OIDC token for service account '${inputs.serviceAccountId}'`);

        let oidcToken: string | undefined = undefined;

        try {
            oidcToken = await context.getIDToken(inputs.serviceAccountId);
        } catch (err) {
            context.error(`Unable to obtain an ID token from GitHub, please make sure to give write permissions to id-token in the workflow.`);
            throw err;
        }

        context.info(`Exchanging GitHub OIDC token for access token at '${inputs.server}' for service account '${inputs.serviceAccountId}'`);

        const trimmedServerUrl = inputs.server?.endsWith("/") ? inputs.server.substring(0, inputs.server.length) : inputs.server;

        // TODO: Discover the token endpoint using `.well-known/openid-configuration`
        const tokenUrl = `${trimmedServerUrl}/token/v1`;
        const tokenExchangeBody: ExchangeOidcTokenCommand = {
            grant_type: TokenExchangeGrantType,
            audience: inputs.serviceAccountId,
            subject_token: oidcToken,
            subject_token_type: TokenExchangeSubjectTokenType,
        };

        const tokenExchangeResponse = await fetch(tokenUrl, {
            method: "POST",
            body: JSON.stringify(tokenExchangeBody),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!tokenExchangeResponse.ok) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            const errorBody: ExchangeOidcTokenErrorResponse = (await tokenExchangeResponse.json()) as ExchangeOidcTokenErrorResponse;
            throw new Error(errorBody.Errors.join(EOL));
        }

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const responseBody: ExchangeOidcTokenResponse = (await tokenExchangeResponse.json()) as ExchangeOidcTokenResponse;

        context.info(
            `Configuring environment to use access token for Octopus Instance '${inputs.server}' on behalf of service account '${inputs.serviceAccountId}'`
        );

        context.exportVariable(EnvironmentVariables.URL, inputs.server);
        context.exportVariable(EnvironmentVariables.AccessToken, responseBody.access_token);
        context.setOutput("access_token", responseBody.access_token);
    } else if (inputs.apiKey) {
        // Set the OCTOPUS_URL and OCTOPUS_API_KEY environment variables so that future steps can use them
        context.info(`Configuring environment to use API Key for '${inputs.server}'`);
        context.exportVariable(EnvironmentVariables.URL, inputs.server);
        context.exportVariable(EnvironmentVariables.ApiKey, inputs.apiKey);
        context.setOutput("api_key", inputs.apiKey);
    }

    context.setOutput("server", inputs.server);

    context.info(`🐙 Login successful, your GitHub actions environment has been configured to access to your Octopus Instance. Happy deployments!`);
}
