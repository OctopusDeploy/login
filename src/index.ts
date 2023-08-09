import { info, getInput, setFailed, exportVariable, debug, getIDToken, error } from "@actions/core";
import { EOL } from "os";
import fetch from "node-fetch";

type InputParameters = {
    server?: string;
    serviceAccountId?: string;
    apiKey?: string;
};

const EnvironmentVariables = {
    URL: "OCTOPUS_URL",
    ApiKey: "OCTOPUS_API_KEY",
    AccessToken: "OCTOPUS_ACCESS_TOKEN",
};

type ExchangeOidcTokenCommand = {
    grant_type: string;
    audience: string;
    subject_token: string;
    subject_token_type: string;
};

type ExchangeOidcTokenResponse = {
    access_token: string;
    issued_token_type: string;
    token_type: string;
    expires_in: string;
};

const TokenExchangeGrantType = "urn:ietf:params:oauth:grant-type:token-exchange";
const TokenExchangeSubjectTokenType = "urn:ietf:params:oauth:token-type:jwt";

async function login() {
    const inputs: InputParameters = {
        server: getInput("server"),
        serviceAccountId: getInput("service_account_id"),
        apiKey: getInput("api_key"),
    };

    const errors: string[] = [];

    if (!inputs.server) errors.push("The Octopus instance URL is required, please specify using the 'server' input.");

    if (!inputs.serviceAccountId && !inputs.apiKey)
        errors.push("A Service Account Id or API Key is required. Please specify using either the 'service_account_id' or 'api_key' inputs.");

    if (errors.length > 0) {
        throw new Error(errors.join(EOL));
    }

    if (inputs.serviceAccountId) {
        // TODO: Discover the token endpoint using `.well-known/openid-configuration`
        info(`Logging in with OpenID Connect to '${inputs.server}' using service account '${inputs.serviceAccountId}'`);

        debug(`Obtaining OIDC token from GitHub for service account '${inputs.serviceAccountId}'`);

        let oidcToken: string | undefined = undefined;

        try {
            oidcToken = await getIDToken(inputs.serviceAccountId);
        } catch (err) {
            error(`Please make sure to give write permissions to id-token in the workflow.`);
            throw err;
        }

        debug(`Exchanging GitHub OIDC token for access token at '${inputs.server}' for service account '${inputs.serviceAccountId}'`);

        const tokenUrl = `${inputs.server}/token/v1`;
        const tokenExchangeBody: ExchangeOidcTokenCommand = {
            grant_type: TokenExchangeGrantType,
            audience: inputs.serviceAccountId,
            subject_token: oidcToken,
            subject_token_type: TokenExchangeSubjectTokenType,
        };

        const body = JSON.stringify(tokenExchangeBody);

        info(`Sending token exchange request to '${tokenUrl}' with body '${body}'`);

        const tokenExchangeResponse = await fetch(tokenUrl, {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // TODO: Proper error handling
        if (!tokenExchangeResponse.ok) throw new Error(JSON.stringify(await tokenExchangeResponse.json()));

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const responseBody: ExchangeOidcTokenResponse = (await tokenExchangeResponse.json()) as ExchangeOidcTokenResponse;

        info(`Configuring environment to use access token for Octopus Instance '${inputs.server}' on behalf of service account '${inputs.serviceAccountId}'`);

        exportVariable(EnvironmentVariables.URL, inputs.server);
        exportVariable(EnvironmentVariables.AccessToken, responseBody.access_token);
    } else if (inputs.apiKey) {
        // Set the OCTOPUS_URL and OCTOPUS_API_KEY environment variables so that future steps can use them
        info(`Configuring environment to use API Key for '${inputs.server}'`);
        exportVariable(EnvironmentVariables.URL, inputs.server);
        exportVariable(EnvironmentVariables.ApiKey, inputs.apiKey);
    }

    info(
        `🐙 Login successful, your GitHub actions environment has been configured to allow access to your Octopus Instance via the API without needing to supply credentials. Happy deployments!`
    );
}

login().catch((error) => {
    setFailed(error);
    process.exit(1);
});
