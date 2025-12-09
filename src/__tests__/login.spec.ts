import fetch from "node-fetch";
import { TestGitHubActionContext } from "../TestGitHubActionContext";
import type { OctopusErrorResponse, ExchangeOidcTokenResponse, OpenIdConfiguration, ExchangeOidcTokenErrorResponse } from "../login";
import { login } from "../login";

jest.mock("node-fetch");
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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

    mockFetch.mockImplementation((url) => {
        if (url === `${serverUrl}/.well-known/openid-configuration`) {
            return Promise.resolve({
                ok: true,
                json: async () =>
                    ({
                        issuer: serverUrl,
                        token_endpoint: `${serverUrl}/token/v1`,
                    }) as OpenIdConfiguration,
            } as any);
        }
        if (url === `${serverUrl}/token/v1`) {
            return Promise.resolve({
                ok: true,
                status: 200,
                json: async () =>
                    ({
                        access_token: accessToken,
                        expires_in: "300",
                        issued_token_type: "jwt",
                        token_type: "Bearer",
                    }) as ExchangeOidcTokenResponse,
            } as any);
        }
        return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });

    context.setIDToken(async () => "id-token-from-github");

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
});

test("Error from OIDC configuration endpoint returns error", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);

    mockFetch.mockImplementation((url) => {
        if (url === `${serverUrl}/.well-known/openid-configuration`) {
            return Promise.resolve({
                ok: false,
                status: 400,
                json: async () =>
                    ({
                        ErrorMessage: "This is the error",
                        Errors: ["This is the error"],
                    }) as OctopusErrorResponse,
            } as any);
        }
        return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });

    context.setIDToken(async () => "id-token-from-github");

    await expect(() => login(context)).rejects.toThrow(new Error("This is the error"));
});

test("When token exchange request from Server returns error response in Octopus format, login returns the error correctly", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);
    const error = "This is the error in the Octopus format";

    mockFetch.mockImplementation((url) => {
        if (url === `${serverUrl}/.well-known/openid-configuration`) {
            return Promise.resolve({
                ok: true,
                json: async () =>
                    ({
                        issuer: serverUrl,
                        token_endpoint: `${serverUrl}/token/v1`,
                    }) as OpenIdConfiguration,
            } as any);
        }
        if (url === `${serverUrl}/token/v1`) {
            return Promise.resolve({
                ok: false,
                status: 400,
                json: async () =>
                    ({
                        ErrorMessage: error,
                        Errors: [error],
                    }) as OctopusErrorResponse,
            } as any);
        }
        return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });

    context.setIDToken(async () => "id-token-from-github");

    await expect(() => login(context)).rejects.toThrow(new Error(error));
});

test("When token exchange request from Server returns error response in rfc8693 format, login returns the error correctly", async () => {
    const context = new TestGitHubActionContext();
    const serverUrl = "https://my.octopus.app";
    const serviceAccountId = "my-service-account-id";
    context.addInput("server", serverUrl);
    context.addInput("service_account_id", serviceAccountId);
    const error = "This is the error in the rfc8693 spec format";

    mockFetch.mockImplementation((url) => {
        if (url === `${serverUrl}/.well-known/openid-configuration`) {
            return Promise.resolve({
                ok: true,
                json: async () =>
                    ({
                        issuer: serverUrl,
                        token_endpoint: `${serverUrl}/token/v1`,
                    }) as OpenIdConfiguration,
            } as any);
        }
        if (url === `${serverUrl}/token/v1`) {
            return Promise.resolve({
                ok: false,
                status: 400,
                json: async () =>
                    ({
                        error: "invalid_request",
                        error_description: error,
                    }) as ExchangeOidcTokenErrorResponse,
            } as any);
        }
        return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });

    context.setIDToken(async () => "id-token-from-github");

    await expect(() => login(context)).rejects.toThrow(new Error(error));
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

    context.setIDToken(async () => {
        throw new Error("Could not get ID token from GitHub");
    });

    await expect(() => login(context)).rejects.toThrow("Could not get ID token from GitHub");
});
