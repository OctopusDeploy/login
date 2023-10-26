# login

A GitHub action to login to your [Octopus Deploy](https://octopus.com/) server.

After successful login, the GitHub Actions environment will be configured so that credentials do not need to be supplied to later Octopus actions (e.g. [`create-release-action`](https://github.com/OctopusDeploy/create-release-action)) or the [Octopus CLI](https://github.com/OctopusDeploy/cli).

This action supports two ways of logging in:

## OpenID Connect (OIDC)

> Support for OpenID Connect is currently in development and may not be available in your Octopus version just yet.

Using OpenID Connect (OIDC) is the recommended way to login to Octopus from GitHub Actions. It allows the granting of short-lived access tokens for a service account in Octopus that can be used during your GitHub Actions workflow run, without needing to provision or store an API key.

See [About security hardening with OpenID Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) for more information.

To login using OIDC:

-   Create a service account in Octopus with the permissions required.
-   Configure an OIDC identity that matches the GitHub Actions subject claim for your repository and workflow. See the [GitHub documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#defining-trust-conditions-on-cloud-roles-using-oidc-claims) for examples of the subject claim.
-   Copy the `Service Account Id` value from the Octopus service account. This will be a GUID.
-   Add the `OctopusDeploy/login` action to your workflow, specifying the `server` and `service_account_id` inputs.

### Inputs

| Name                 | Description                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `server`             | The URL of your Octopus server. This input is required.                                            |
| `service_account_id` | The id of the service account you wish to login as. This input is required if using OIDC to login. |

### Outputs

| Name           | Description                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`       | The URL of your Octopus server that has been logged into. The environment variable `OCTOPUS_URL` will also be set with this value.                          |
| `access_token` | An access token that can be use to authenticate when making API requests. The environment variable `OCTOPUS_ACCESS_TOKEN` will also be set with this value. |

### Example

```yaml
- name: Login to Octopus
  uses: OctopusDeploy/login@v1
  with:
      server: https://my.octopus.app
      service_account_id: 5be4ac10-2679-4041-a8b0-7b05b445e19e
```

## API Key

To login using an API Key:

-   Provision an API key in Octopus. See [How to create an API key](https://octopus.com/docs/octopus-rest-api/how-to-create-an-api-key) for more information. It is recommended that a service account is used instead of a user account.
-   Add the `OctopusDeploy/login` action to your workflow, specifying the `server` and `api_key` inputs.

### Inputs

| Name      | Description                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server`  | The URL of your Octopus server. This input is required.                                                                                                              |
| `api_key` | The API key you wish to login in with. It is **strongly recommended** to store this as a secret in GitHub Actions. This input is required if using API Key to login. |

### Outputs

| Name      | Description                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `server`  | The URL of your Octopus server that has been logged into. The environment variable `OCTOPUS_URL` will also be set with this value. |
| `api_key` | The API key that was used to login in with. The environment variable `OCTOPUS_API_KEY` will also be set with this value.           |

### Example

```yaml
- name: Login to Octopus
  uses: OctopusDeploy/login@v1
  with:
      server: https://my.octopus.app
      api_key: ${{ secrets.OCTOPUS_API_KEY }}
```

## Development

### Changesets

This repository uses [changesets](https://github.com/changesets/changesets) to manage package versions.

This means, that any changes should be accompanied by a changeset. Multiple sets of changes, each with their own changeset can make up a new release.

In order to add a changeset, run `npm run changeset` which will:

-   Ask you what sort of version bump is required for this change (Major, Minor or Patch)
-   Prompt you to supply release notes for the change.

These details will automatically be captured in a file within the `.changesets` folder which can be included within your PR. You can edit the contents of this file as needed e.g. fix up a typo.

Once your PR is merged, a changesets Github Action will run to create a separate Version Packages PR which will include:

-   Bumping the version in `package.json` for consistency (we don't publish packages)
-   Update the changelog with the release notes from your change (and others if there have been any).

Upon merging the release PR, the package version will be updated and the repo will be tagged and a release made with the release notes.
