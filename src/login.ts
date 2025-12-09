import { EOL } from "os";
import fetch from "node-fetch";
import type { GitHubActionsContext } from "./GitHubActionsContext";

export type InputParameters = {
    server: string;
    serviceAccountId?: string;
    apiKey?: string;
};

export const EnvironmentVariables = {
    URL: "OCTOPUS_URL",
    ApiKey: "OCTOPUS_API_KEY",
    AccessToken: "OCTOPUS_ACCESS_TOKEN",
};

export type OpenIdConfiguration = {
    issuer: string;
    token_endpoint: string;
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
    error: string;
    error_description: string;
};

export type OctopusErrorResponse = {
    ErrorMessage: string;
    Errors: string[];
};

export const TokenExchangeGrantType = "urn:ietf:params:oauth:grant-type:token-exchange";
export const TokenExchangeSubjectTokenType = "urn:ietf:params:oauth:token-type:jwt";

export async function login(context: GitHubActionsContext) {
    const inputs: InputParameters = {
        server: context.getInput("server"),
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
            context.warning("Unable to obtain an ID token from GitHub, please make sure to give write permissions to id-token in the workflow.");
            throw new Error(err);
        }

        context.info(`Exchanging GitHub OIDC token for access token at '${inputs.server}' for service account '${inputs.serviceAccountId}'`);

        const openIdConfiguration = await getOpenIdConfiguration(inputs);

        const exchangeOidcTokenResponse = await exchangeOidcTokenForAccessToken(inputs, oidcToken, openIdConfiguration, context);

        context.info(
            `Configuring environment to use access token for Octopus Instance '${inputs.server}' on behalf of service account '${inputs.serviceAccountId}'`
        );

        // Set the value as a secret so we can be 100% sure its masked in any logs
        context.setSecret(exchangeOidcTokenResponse.access_token);

        context.exportVariable(EnvironmentVariables.URL, inputs.server);
        context.exportVariable(EnvironmentVariables.AccessToken, exchangeOidcTokenResponse.access_token);
        context.setOutput("access_token", exchangeOidcTokenResponse.access_token);
    } else if (inputs.apiKey) {
        // Set the OCTOPUS_URL and OCTOPUS_API_KEY environment variables so that future steps can use them
        context.info(`Configuring environment to use API Key for Octopus Instance '${inputs.server}'`);
        context.exportVariable(EnvironmentVariables.URL, inputs.server);
        context.exportVariable(EnvironmentVariables.ApiKey, inputs.apiKey);
        context.setOutput("api_key", inputs.apiKey);
    }

    context.setOutput("server", inputs.server);

    context.info(`🐙 Login successful, the GitHub actions environment has been configured to access your Octopus Instance. Happy deployments!`);
}

async function exchangeOidcTokenForAccessToken(
    inputs: InputParameters,
    oidcToken: string,
    openIdConfiguration: OpenIdConfiguration,
    context: GitHubActionsContext
) {
    const tokenExchangeBody: ExchangeOidcTokenCommand = {
        grant_type: TokenExchangeGrantType,
        audience: inputs.serviceAccountId ?? "",
        subject_token: oidcToken,
        subject_token_type: TokenExchangeSubjectTokenType,
    };

    const tokenExchangeResponse = await fetch(openIdConfiguration.token_endpoint, {
        method: "POST",
        body: JSON.stringify(tokenExchangeBody),
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "GitHubActions (login;v0)",
        },
    });

    context.debug(`Token exchange response - Status: ${tokenExchangeResponse.status}`);

    if (!tokenExchangeResponse.ok) {
        // Some versions of Octopus Server return errors in the "Octopus" format,
        // whereas later versions will return errors in the spec format from https://www.rfc-editor.org/rfc/rfc8693#section-2.2.2.
        // In order to support both we'll test for the spec version and if we don't find any data we'll fall back to the Octopus version.
        const errorBody = await tokenExchangeResponse.json();

        context.debug(`Token exchange error response: ${JSON.stringify(errorBody)}`);

        const specErrorBody: ExchangeOidcTokenErrorResponse = errorBody as ExchangeOidcTokenErrorResponse;

        if (specErrorBody.error) {
            throw new Error(specErrorBody.error_description);
        }

        const octopusErrorBody: OctopusErrorResponse = errorBody as OctopusErrorResponse;

        throw new Error(octopusErrorBody.Errors.join(EOL));
    }

    return (await tokenExchangeResponse.json()) as ExchangeOidcTokenResponse;
}

async function getOpenIdConfiguration(inputs: InputParameters) {
    const openIdConfigurationEndpointUrl = `${normalizeServerUrl(inputs.server)}/.well-known/openid-configuration`;

    const openIdConfigurationResponse = await fetch(openIdConfigurationEndpointUrl, {
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "GitHubActions (login;v0)",
        },
    });

    if (!openIdConfigurationResponse.ok) {
        const errorBody: OctopusErrorResponse = (await openIdConfigurationResponse.json()) as OctopusErrorResponse;
        throw new Error(errorBody.Errors.join(EOL));
    }

    return (await openIdConfigurationResponse.json()) as OpenIdConfiguration;
}

function normalizeServerUrl(server: string) {
    return server.endsWith("/") ? server.substring(0, server.length) : server;
}
