import { rest } from "msw";
import { setupServer } from "msw/node";
import { TestGitHubActionContext } from "../TestGitHubActionContext";
import type { OctopusErrorResponse, ExchangeOidcTokenResponse, OpenIdConfiguration, ExchangeOidcTokenErrorResponse } from "../login";
import { login } from "../login";

test("Login with API Key sets correct environment variables and output", async () => {
    const context = new TestGitHubActionContext();
    const server = "https://my.octopus.app";
    const apiKey = "API-MYAPIKEY";
    context.addInput("server", server);
    context.addInput("api_key", apiKey);

    await login(context);

    expect(context.getExportedVariables()).toEqual({
        OCTOPUS_URL: server,
        OCTOPUS_API_KEY: apiKey,
    });

    expect(context.getOutputs()).toEqual({
        server: server,
        api_key: apiKey,
    });
});

test("Successful login with OIDC sets correct environment variables, outputs and masks the access token", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);

    const accessToken = "an-access-token-that-is-valid-woohoo";

    const server = setupServer(
        rest.get("https://my.octopus.app/.well-known/openid-configuration", (_req, res, ctx) => {
            return res(
                ctx.json<OpenIdConfiguration>({
                    issuer: "https://my.octopus.app",
                    token_endpoint: "https://my.octopus.app/token/v1",
                })
            );
        }),
        rest.post("https://my.octopus.app/token/v1", (_req, res, ctx) => {
            return res(
                ctx.json<ExchangeOidcTokenResponse>({
                    access_token: accessToken,
                    expires_in: "300",
                    issued_token_type: "jwt",
                    token_type: "Bearer",
                })
            );
        })
    );

    server.listen();

    context.setIDToken(async () => "id-token-from-github");

    try {
        await login(context);

        expect(context.getExportedVariables()).toEqual({
            OCTOPUS_URL: serverUrl,
            OCTOPUS_ACCESS_TOKEN: accessToken,
        });

        expect(context.getOutputs()).toEqual({
            server: serverUrl,
            access_token: accessToken,
        });

        expect(context.getSecrets()).toEqual([accessToken]);
    } finally {
        server.close();
    }
});

test("Error from OIDC configuration endpoint returns error", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);

    const server = setupServer(
        rest.get("https://my.octopus.app/.well-known/openid-configuration", (_req, res, ctx) => {
            return res(
                ctx.status(400),
                ctx.json<OctopusErrorResponse>({
                    ErrorMessage: "This is the error",
                    Errors: ["This is the error"],
                })
            );
        })
    );

    server.listen();

    context.setIDToken(async () => "id-token-from-github");

    try {
        await expect(() => login(context)).rejects.toThrow(new Error("This is the error"));
    } finally {
        server.close();
    }
});

test("When token exchange request from Server returns error response in Octopus format, login returns the error correctly", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);
    const error = "This is the error in the Octopus format";

    const server = setupServer(
        rest.get("https://my.octopus.app/.well-known/openid-configuration", (_req, res, ctx) => {
            return res(
                ctx.json<OpenIdConfiguration>({
                    issuer: "https://my.octopus.app",
                    token_endpoint: "https://my.octopus.app/token/v1",
                })
            );
        }),
        rest.post("https://my.octopus.app/token/v1", (_req, res, ctx) => {
            return res(
                ctx.status(400),
                ctx.json<OctopusErrorResponse>({
                    ErrorMessage: error,
                    Errors: [error],
                })
            );
        })
    );

    server.listen();

    context.setIDToken(async () => "id-token-from-github");

    try {
        await expect(() => login(context)).rejects.toThrow(new Error(error));
    } finally {
        server.close();
    }
});

test("When token exchange request from Server returns error response in rfc8693 format, login returns the error correctly", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);
    const error = "This is the error in the rfc8693 spec format";

    const server = setupServer(
        rest.get("https://my.octopus.app/.well-known/openid-configuration", (_req, res, ctx) => {
            return res(
                ctx.json<OpenIdConfiguration>({
                    issuer: "https://my.octopus.app",
                    token_endpoint: "https://my.octopus.app/token/v1",
                })
            );
        }),
        rest.post("https://my.octopus.app/token/v1", (_req, res, ctx) => {
            return res(
                ctx.status(400),
                ctx.json<ExchangeOidcTokenErrorResponse>({
                    error: "invalid_request",
                    error_description: error,
                })
            );
        })
    );

    server.listen();

    context.setIDToken(async () => "id-token-from-github");

    try {
        await expect(() => login(context)).rejects.toThrow(new Error(error));
    } finally {
        server.close();
    }
});

test("When server input is not supplied an error is returned", async () => {
    const context = new TestGitHubActionContext();
    context.addInput("api_key", "API-MYAPIKEY");

    await expect(() => login(context)).rejects.toThrow(new Error("The Octopus instance URL is required, please specify using the 'server' input."));
});

test("When neither service_account_id nor api_key are supplied an error is returned", async () => {
    const context = new TestGitHubActionContext();
    context.addInput("server", "https://my.octopus.app");

    await expect(() => login(context)).rejects.toThrow(
        new Error("A Service Account Id or API Key is required. Please specify using either the 'service_account_id' or 'api_key' inputs.")
    );
});

test("When both service_account_id and api_key are supplied an error is returned", async () => {
    const context = new TestGitHubActionContext();
    context.addInput("server", "https://my.octopus.app");
    context.addInput("api_key", "API-MYAPIKEY");
    context.addInput("service_account_id", "my-service-account-id");

    await expect(() => login(context)).rejects.toThrow(new Error("Only one of Service Account Id or API Key can be supplied."));
});

test("When ID token cannot be obtained from GitHub an error is returned", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);

    const accessToken = "an-access-token-that-is-valid-woohoo";

    const server = setupServer(
        rest.post("https://my.octopus.app/token/v1", (_req, res, ctx) => {
            return res(
                ctx.json<ExchangeOidcTokenResponse>({
                    access_token: accessToken,
                    expires_in: "300",
                    issued_token_type: "jwt",
                    token_type: "Bearer",
                })
            );
        })
    );

    server.listen();

    context.setIDToken(async () => {
        throw new Error("Could not get ID token from GitHub");
    });

    try {
        await expect(() => login(context)).rejects.toThrow("Could not get ID token from GitHub");
    } finally {
        server.close();
    }
});
