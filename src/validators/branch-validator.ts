import type { IInputs } from "../inputs";
import type { IValidator, IResultContext, IValidationResult } from "../interfaces/validator";
import type { IGitApi } from "azure-devops-node-api/GitApi";
import type { IVariables } from "../variables";

abstract class BranchNameValidator implements IValidator {
    protected abstract readonly branchType: "source" | "target";
    protected abstract readonly inputName: "sourceBranch" | "targetBranch";

    protected readonly projectName: string;
    protected readonly prId: number;

    constructor(
        protected readonly client: IGitApi,
        protected readonly inputs: IInputs,
        variables: IVariables
    ) {
        this.projectName = variables.projectName;
        this.prId = variables.pullRequestId;
    }

    public readonly check = async(resultContext: IResultContext): Promise<IValidationResult> => {
        const branchExpr = this.inputs[this.inputName];
        if (branchExpr === undefined) {
            return { conditionMet: true, context: resultContext };
        }

        const branchName = await this.getBranchName();
        if (branchName === undefined) {
            console.log(`No ${this.branchType} branch found for the pull request`);
            return { conditionMet: true, context: resultContext };
        }

        const rex = new RegExp(branchExpr);
        if (!rex.test(branchName)) {
            console.log(`The ${this.branchType} '${branchName}' does not match the expression`);
            return { conditionMet: true, context: resultContext };
        }

        return { conditionMet: false, context: resultContext };
    };

    protected readonly getBranchName = async(): Promise<string | undefined> => {
        const pullRequest = await this.client.getPullRequestById(this.prId, this.projectName);

        const refName = this.branchType === "source"
            ? pullRequest.sourceRefName
            : pullRequest.targetRefName;

        return refName?.replace(/^refs\/heads\//, "") ?? undefined;
    };
}

/**
 * Runs validation against the pull request source branch using the regular expression from {@link IInputs.sourceBranch};
 * if the source branch name does **not** match the expression, the validation succeeds.
 */
export class SourceBranchValidator extends BranchNameValidator {
    protected readonly branchType = "source" as const;
    protected readonly inputName = "sourceBranch" as const;
}

/**
 * Runs validation against the pull request target branch using the regular expression from {@link IInputs.targetBranch};
 * if the target branch name does **not** match the expression, the validation succeeds.
 */
export class TargetBranchValidator extends BranchNameValidator {
    protected readonly branchType = "target" as const;
    protected readonly inputName = "targetBranch" as const;
}
