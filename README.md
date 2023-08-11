# login

GitHub action to login to your Octopus Server

## Changesets

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
