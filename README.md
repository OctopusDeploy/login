# login

GitHub action to login to your Octopus Server

## Changesets

This repository uses [changesets](https://github.com/changesets/changesets) to manage package versions.

This means, that any changes should be accompanied by a change set.

In order to add a change set, run `npm run changeset` which will:

Ask you what sort of version bump is required for this change (Major, Minor or Patch)
Prompt you to supply release notes for the change.
These details will automatically be captured in the `.changesets` folder within your PR.

Once your PR is merged, the build will use the changesets Github Action to create a separate Version Packages PR which includes updating the changelog with the release notes and associated version bump which you will need to review.

Upon merging the release PR, the package version will be updated and the repo will be tagged and a release made with the release notes.
