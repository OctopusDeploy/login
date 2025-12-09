import js from "@eslint/js";
import jest from "eslint-plugin-jest";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import prettierConfig from "eslint-config-prettier";

export default [
    {
        ignores: ["**/node_modules/**", "**/dist/**", "**/*.config.js", "**/jest.config.js", "**/renovate-config.js"],
    },
    // ESLint recommended
    js.configs.recommended,
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
            jest,
            prettier,
            import: importPlugin,
            "unused-imports": unusedImports,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },

            parser: tsParser,
            ecmaVersion: 2018,
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.eslint.json",
            },
        },

        rules: {
            // Extend recommended configs
            ...typescriptEslint.configs.recommended.rules,
            ...jest.configs.recommended.rules,
            ...prettierConfig.rules,

            // Core ESLint rules from old config
            "init-declarations": "off",
            "no-case-declarations": "off",
            "no-dupe-class-members": "off",
            "no-eq-null": ["error"],
            "no-extra-boolean-cast": "off",
            "no-irregular-whitespace": "off",
            "no-multi-spaces": "error",
            "no-prototype-builtins": "off",
            "no-undef": "off",
            "prefer-rest-params": "off",
            "prefer-spread": "off",

            // TypeScript ESLint rules from old config
            "@typescript-eslint/adjacent-overload-signatures": "error",
            "@typescript-eslint/array-type": ["off", { default: "array-simple" }],
            "@typescript-eslint/consistent-type-assertions": "error", // Allows "as" assertions
            "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/init-declarations": "off", // Less strict
            "@typescript-eslint/no-dupe-class-members": "error",
            "@typescript-eslint/no-explicit-any": "off", // Allow any types
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-non-null-assertion": "warn", // Downgrade to warning
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/no-var-requires": "off",

            // Jest rules from old config
            "jest/expect-expect": ["error", { assertFunctionNames: ["expect", "**.*should*", "assert*", "**.assert*"] }],
            "jest/no-standalone-expect": "off",
            "jest/valid-expect": ["error", { maxArgs: 2 }],

            // Import rules from old config
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

            // Unused imports from old config
            "unused-imports/no-unused-imports": "error",

            // Prettier from old config
            "prettier/prettier": "error",
            "arrow-body-style": "off",
            "prefer-arrow-callback": "off",
        },
    },
];