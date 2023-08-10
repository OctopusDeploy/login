module.exports = {
    env: {
        browser: false,
        node: true,
        es6: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:jest/recommended", "plugin:prettier/recommended"],
    ignorePatterns: ["node_modules/**/*", "dist/**/*"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["./packages/*/tsconfig.json", "./packages/*/*.tsconfig.json"],
        sourceType: "module",
    },
    plugins: ["prefer-arrow", "@typescript-eslint", "prettier", "import", "unused-imports"],
    rules: {
        "init-declarations": "off", // explicitly disable to prefer the TS version: https://typescript-eslint.io/rules/init-declarations/
        "no-case-declarations": "off", //should consider enabling
        "no-dupe-class-members": "off", // explicitly disable to prefer the TS version: https://typescript-eslint.io/rules/no-dupe-class-members
        "no-eq-null": ["error"],
        "no-extra-boolean-cast": "off",
        "no-irregular-whitespace": "off",
        "no-multi-spaces": "error",
        "no-prototype-builtins": "off", //should enable, although very unlikely to break in our case
        "no-undef": "off", //typescript will catch these
        "prefer-rest-params": "off", //should consider setting this to warn
        "prefer-spread": "off", //should consider setting this to warn

        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": ["off", { default: "array-simple" }], //consider enabling as error
        "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
        "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/init-declarations": "error", // The typescript version adds extra checks on top of the eslint version, so we disable the eslint version, https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/init-declarations.md
        "@typescript-eslint/interface-name-prefix": "off", //deprecated in favor of naming-convention rule
        "@typescript-eslint/no-dupe-class-members": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
        "@typescript-eslint/no-unused-vars": "off", //this rule is a bit buggy atm, it picks up things as unused when they are
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "off", //https://github.com/typescript-eslint/typescript-eslint/issues/1856
        "@typescript-eslint/quotes": [
            "error",
            "double",
            {
                avoidEscape: true,
                allowTemplateLiterals: true,
            },
        ],

        "jest/expect-expect": ["error", { assertFunctionNames: ["expect", "**.*should*", "assert*", "**.assert*"] }],
        "jest/no-standalone-expect": "off",
        "jest/valid-expect": ["error", { maxArgs: 2 }],

        "import/no-duplicates": "error",
        "import/order": [
            "error",
            {
                groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
                pathGroups: [{ pattern: "~/**", group: "internal" }],
                pathGroupsExcludedImportTypes: [],
                "newlines-between": "never",
                alphabetize: { order: "asc", caseInsensitive: false },
            },
        ],
        "unused-imports/no-unused-imports": "error",
        "prettier/prettier": "error",
    },
};
