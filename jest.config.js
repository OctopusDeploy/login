module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["jest-expect-message", "jest-extended"],
    testMatch: ["**/__tests__/**/*.spec.ts"],
    resetMocks: true,
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/jest.tsconfig.json",
            },
        ],
    },
};
