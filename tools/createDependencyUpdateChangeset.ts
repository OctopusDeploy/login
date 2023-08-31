import { existsSync } from "fs";
import { mkdir, readFile } from "fs/promises";
import path from "path";
import type { Changeset, Release } from "@changesets/types";
import write from "@changesets/write";
import { globSync } from "glob";

type PackageJson = {
    name: string;
};

const loadProjectPackageJson = async (packageJsonPath: string): Promise<PackageJson> => {
    if (!existsSync(packageJsonPath)) {
        throw new Error(`Could not locate package.json in ${packageJsonPath}`);
    }

    const contents = await readFile(packageJsonPath);

    return JSON.parse(contents.toString());
};

type CreateDependencyUpdateChangesetParameters = {
    dependencyName: string;
    currentVersion: string;
    newVersion: string;
};

async function createDependencyUpdateChangeset({ dependencyName, currentVersion, newVersion }: CreateDependencyUpdateChangesetParameters) {
    const packageJsonFilePaths = globSync("package.json");

    if (packageJsonFilePaths.length === 0) return;

    const packageJsonFilePath = packageJsonFilePaths[0];

    if (!packageJsonFilePath) return;

    const releases: Release[] = [];

    const packageJson = await loadProjectPackageJson(packageJsonFilePath);

    releases.push({
        name: packageJson.name,
        type: "patch",
    });

    console.log(`Creating changeset for dependency update ${dependencyName} from ${currentVersion} to ${newVersion}`);

    const changeset: Changeset = {
        summary: `Update dependency ${dependencyName} to v${newVersion}`,
        releases,
    };

    const changesetDirectory = path.join(process.cwd(), ".changeset");

    if (!existsSync(changesetDirectory)) {
        await mkdir(changesetDirectory);
    }

    const changesetName = await write(changeset, process.cwd());

    const changesetPath = path.join(changesetDirectory, `${changesetName}.md`);

    console.log(`Changeset '${changesetName}' created at '${changesetPath}'`);

    return { name: changesetName, path: changesetPath };
}

if (process.argv.length !== 5) throw new Error("Script should be called with 3 arguments: {dependencyName} {currentVersion} {newVersion}");

const dependencyName = process.argv[2];

if (!dependencyName) throw new Error("Script should be called with 3 arguments: {dependencyName} {currentVersion} {newVersion}");

const currentVersion = process.argv[3];

if (!currentVersion) throw new Error("Script should be called with 3 arguments: {dependencyName} {currentVersion} {newVersion}");

const newVersion = process.argv[4];

if (!newVersion) throw new Error("Script should be called with 3 arguments: {dependencyName} {currentVersion} {newVersion}");

createDependencyUpdateChangeset({ dependencyName, currentVersion, newVersion }).catch(() => process.exit(1));
