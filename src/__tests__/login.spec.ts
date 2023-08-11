import { TestGitHubActionContext } from "../TestGitHubActionContext";
import { login } from "../login";

test("Login with API Key sets correct environment variables and output", async () => {
    const context = new TestGitHubActionContext();
    context.addInput("server", "https://my.octopus.app");
    context.addInput("api_key", "API-MYAPIKEY");

    await login(context);

    expect(context.exportedVariables).toEqual({
        OCTOPUS_URL: "https://my.octopus.app",
        OCTOPUS_API_KEY: "API-MYAPIKEY",
    });
});
