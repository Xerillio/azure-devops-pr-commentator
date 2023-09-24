import { type IGitApi } from "azure-devops-node-api/GitApi";
import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { minimatch } from "minimatch";
import { type IInputs } from "../inputs";
import { hasId } from "../type-guards";
import type { IResultContext, IValidationResult, IValidator } from "./validator";
import { type IVariables } from "../variables";

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
        if (this.inputs.fileGlob === undefined) {
            return { conditionMet: true, context: resultContext };
        }

        const matchingChanges = await this.getMatchingChanges(this.inputs.fileGlob);
        if (matchingChanges.length > 0) {
            console.log("Found the following matches for the glob expression:\n    " +
                matchingChanges.map(c => c.item?.path).join("\n    "));
            return {
                conditionMet: true,
                context: {
                    ...resultContext,
                    files: matchingChanges.map(change => change.item?.path ?? "")
                }
            };
        }

        console.log("No match found for the glob expression");
        return { conditionMet: false, context: resultContext };
    };

    private readonly getMatchingChanges = async(fileGlob: string): Promise<GitInterfaces.GitPullRequestChange[]> => {
        const lastIterationId = await this.getLastIterationId();
        let changes: GitInterfaces.GitPullRequestIterationChanges | undefined;
        const matchingChanges: GitInterfaces.GitPullRequestChange[] = [];
        const matchesGlob = (changeEntry: GitInterfaces.GitPullRequestChange): boolean =>
            minimatch(changeEntry.item?.path ?? "", fileGlob);

        do {
            changes = await this.client.getPullRequestIterationChanges(
                this.repositoryId,
                this.prId,
                lastIterationId,
                undefined,
                changes?.nextTop,
                changes?.nextSkip);

            const matches = changes.changeEntries?.filter(matchesGlob) ?? [];
            matchingChanges.push(...matches);
        } while (changes.nextTop !== undefined && changes.nextTop > 0);

        return matchingChanges;
    };

    private readonly getLastIterationId = async(): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(this.repositoryId, this.prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };
}
