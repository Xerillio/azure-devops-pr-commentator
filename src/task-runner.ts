import { type IVariables } from "./variables";
import { validateAll } from "./validators/validator";
import { type ICommentator } from "./commentator";
import { type IValidatorFactory } from "./validators/validator-factory";

export class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;

    constructor(
        private readonly commentator: ICommentator,
        private readonly validatorFactory: IValidatorFactory,
        vars: IVariables
    ) {
        this.repoId = vars.repositoryId;
        this.prId = vars.pullRequestId;
    }

    public run = async(): Promise<ITaskResult> => {
        let resultMessage = "One or more conditions were not met";

        const result = await validateAll(this.validatorFactory);

        if (result.conditionMet) {
            const commentHash = await this.commentator.createComment(this.repoId, this.prId, result.context);
            resultMessage = `Conditions successfully met. Comment hash: ${commentHash}`;
        }

        return {
            succeeded: true,
            message: resultMessage
        };
    };
}

interface ITaskResult {
    /** True, if the task completed without problems, otherwise false. */
    succeeded: boolean
    /** An message with a status of the result. */
    message: string
}
