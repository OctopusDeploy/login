import { setFailed } from "@actions/core";
import { GitHubActionsContextImpl } from "GitHubActionsContextImpl";
import { login } from "./login";

login(new GitHubActionsContextImpl()).catch((error) => {
    setFailed(error);
    process.exit(1);
});
