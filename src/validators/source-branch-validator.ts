import { type IInputs } from "../inputs";
import type { IResultContext, IValidationResult, IValidator } from "./validator";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type IVariables } from "../variables";

/**
 * Runs validation against the pull request source branch using the regular expression from {@link IInputs.sourceBranch};
 * if the source branch name does **not** match the expression, the validation succeeds.
 */
export class SourceBranchValidator implements IValidator {
    private readonly projectName: string;
    private readonly prId: number;

    constructor(
        private readonly client: IGitApi,
        private readonly inputs: IInputs,
        variables: IVariables
    ) {
        this.projectName = variables.projectName;
        this.prId = variables.pullRequestId;
    }

    public readonly check = async(resultContext: IResultContext): Promise<IValidationResult> => {
        if (this.inputs.sourceBranch === undefined) {
            return { conditionMet: true, context: resultContext };
        }

        const sourceBranch = await this.getSourceBranch();
        if (sourceBranch === undefined) {
            console.log("No source branch found for the pull request");
            return { conditionMet: true, context: resultContext };
        }

        const rex = new RegExp(this.inputs.sourceBranch);
        if (!rex.test(sourceBranch)) {
            console.log(`Source branch '${sourceBranch}' does not match the expression`);
            return { conditionMet: true, context: resultContext };
        }

        return { conditionMet: false, context: resultContext };
    };

    private readonly getSourceBranch = async(): Promise<string | undefined> => {
        const pullRequest = await this.client.getPullRequestById(this.prId, this.projectName);
        return pullRequest.sourceRefName?.replace(/^refs\/heads\//, "") ?? undefined;
    };
}
