module.exports = {
    extends: [
        "config:base",
        ":disableMajorUpdates",
        ":ignoreModulesAndTests",
        ":pinVersions",
        ":rebaseStalePrs",
        ":automergeDigest",
        ":automergePatch",
        ":automergePr",
        ":automergeRequireAllStatusChecks",
        ":automergeLinters",
        ":automergeTesters",
        ":automergeTypes",
        "packages:eslint",
        "workarounds:typesNodeVersioning",
        "github>whitesource/merge-confidence:beta",
    ],
    branchPrefix: "renovate/",
    platform: "github",
    repositories: ["OctopusDeploy/login"],
    packageRules: [],
    timezone: "Australia/Brisbane",
    onboarding: false,
    requireConfig: false,
    allowedPostUpgradeCommands: [".*"],
    postUpgradeTasks: {
        commands: ["npm install && npm run build"],
        fileFilters: ["**/index.js"],
        executionMode: "update",
    },
};
