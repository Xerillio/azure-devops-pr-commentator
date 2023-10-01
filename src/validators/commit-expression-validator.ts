import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IInputs } from "../inputs";
import { type IWellFormedCommit, isWellFormedCommit } from "../type-guards";
import type { IResultContext, IValidationResult, IValidator } from "./validator";
import { type IGitApiExtension } from "../git-api-extension";

/**
 * Runs validation against all commit messages in a pull request using the regular expression from {@link IInputs.commitExpr};
 * if any message **does not** match the expression, the validation succeeds.
 */
export class CommitExpressionValidator implements IValidator {
    constructor(
        private readonly client: IGitApiExtension,
        private readonly inputs: IInputs
    ) { }

    public readonly check = async(resultContext: IResultContext): Promise<IValidationResult> => {
        if (this.inputs.commitExpr === undefined) {
            return { conditionMet: true, context: resultContext };
        }

        const matchingCommits = await this.getMatchingCommits(this.inputs.commitExpr);
        if (matchingCommits.length === 0) {
            console.log("No match found for the commit expression");
            return { conditionMet: false, context: resultContext };
        }

        console.log("Found the following matches for the commit expression:\n    " +
            matchingCommits.map(c => `${c.commitId} ${c.comment}`).join("\n    "));
        return {
            conditionMet: true,
            context: {
                ...resultContext,
                commits: matchingCommits.map(commit => ({
                    hash: commit.commitId,
                    message: commit.comment
                }))
            }
        };
    };

    private readonly getMatchingCommits = async(commitExpr: string): Promise<Array<GitInterfaces.GitCommitRef & IWellFormedCommit>> => {
        const commits = await this.client.getAllPullRequestCommits();
        const rex = new RegExp(commitExpr);

        const matches = commits.filter(isWellFormedCommit)
            .filter(commit => !rex.test(commit.comment));

        return matches;
    };
}
