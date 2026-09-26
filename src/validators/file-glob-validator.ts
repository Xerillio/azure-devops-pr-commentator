import { type IGitApi } from "azure-devops-node-api/GitApi";
import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { minimatch } from "minimatch";
import { type IInputs } from "../inputs";
import { hasId } from "../type-guards";
import type { IResultContext, IValidationResult, IValidator } from "./validator";
import { type IVariables } from "../variables";

/** The supported matching modes for a single {@link FileGlobEntry}. */
type FileGlobMode = "any" | "all" | "none";

/** A single parsed line of the `fileGlob` input, e.g. `any:` followed by a glob pattern. */
interface FileGlobEntry {
    readonly mode: FileGlobMode
    readonly pattern: string
}

const FILE_GLOB_PREFIX_PATTERN = /^(any|all|none):(.*)$/;

export class FileGlobValidator implements IValidator {
    private readonly repositoryId: string;
    private readonly prId: number;

    constructor(
        private readonly client: IGitApi,
        private readonly inputs: IInputs,
        private readonly variables: IVariables
    ) {
        this.repositoryId = variables.repositoryId;
        this.prId = variables.pullRequestId;
    }

    public readonly check = async(resultContext: IResultContext): Promise<IValidationResult> => {
        const fileGlobEntries = this.getFileGlobs();
        if (fileGlobEntries.length === 0) {
            return { conditionMet: true, context: resultContext };
        }

        const changedPaths = (await this.getAllChanges()).map(change => change.item?.path ?? "");
        const matchingFiles = new Set<string>();

        for (const entry of fileGlobEntries) {
            const matchedPaths = changedPaths.filter(path => minimatch(path, entry.pattern));
            const conditionMet = this.isConditionMet(entry.mode, changedPaths, matchedPaths);

            console.log(this.describeEntryResult(entry, conditionMet, matchedPaths));
            if (!conditionMet) {
                return { conditionMet: false, context: resultContext };
            }

            matchedPaths.forEach(path => matchingFiles.add(path));
        }

        return {
            conditionMet: true,
            context: { ...resultContext, files: [...matchingFiles] }
        };
    };

    private readonly getFileGlobs = (): FileGlobEntry[] => (this.inputs.fileGlob ?? "")
        .split(/\r?\n/)
        .map(glob => glob.trim())
        .filter(glob => glob.length > 0)
        .map(this.parseFileGlobEntry);

    private readonly parseFileGlobEntry = (line: string): FileGlobEntry => {
        const match = FILE_GLOB_PREFIX_PATTERN.exec(line);
        if (match === null) {
            return { mode: "any", pattern: line };
        }

        return { mode: match[1] as FileGlobMode, pattern: match[2] };
    };

    /**
     * Evaluates whether the changed paths satisfy the given matching {@link mode} for a single
     * `fileGlob` entry.
     * @param mode The matching mode of the entry, i.e. `any`, `all`, or `none`.
     * @param changedPaths All file paths changed in the pull request.
     * @param matchedPaths The subset of {@link changedPaths} that matched the entry's pattern.
     */
    private readonly isConditionMet = (mode: FileGlobMode, changedPaths: string[], matchedPaths: string[]): boolean => {
        switch (mode) {
            case "any":
                return matchedPaths.length > 0;
            case "all":
                return changedPaths.length > 0 && matchedPaths.length === changedPaths.length;
            case "none":
                return matchedPaths.length === 0;
        }
    };

    private readonly describeEntryResult = (entry: FileGlobEntry, conditionMet: boolean, matchedPaths: string[]): string => {
        const label = `${entry.mode}:${entry.pattern}`;
        if (!conditionMet) {
            return `Condition '${label}' was not met. Remaining conditions will be skipped.`;
        }

        return matchedPaths.length > 0
            ? `Condition '${label}' was met for:\n    ${matchedPaths.join("\n    ")}`
            : `Condition '${label}' was met`;
    };

    private readonly getAllChanges = async(): Promise<GitInterfaces.GitPullRequestChange[]> => {
        const lastIterationId = await this.getLastIterationId();
        let changes: GitInterfaces.GitPullRequestIterationChanges | undefined;
        const allChanges: GitInterfaces.GitPullRequestChange[] = [];

        do {
            changes = await this.client.getPullRequestIterationChanges(
                this.repositoryId,
                this.prId,
                lastIterationId,
                undefined,
                changes?.nextTop,
                changes?.nextSkip);

            allChanges.push(...changes.changeEntries ?? []);
        } while (changes.nextTop !== undefined && changes.nextTop > 0);

        return allChanges;
    };

    private readonly getLastIterationId = async(): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(this.repositoryId, this.prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };
}
