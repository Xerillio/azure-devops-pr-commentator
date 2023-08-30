import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type IInputs } from "./inputs";
import { type IVariables } from "./variables";
import { validateAll } from "./validators/validator";
import { type ICommentator } from "./commentator";

export class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;

    constructor(
        private readonly client: IGitApi,
        private readonly commentator: ICommentator,
        private readonly inputs: IInputs,
        vars: IVariables
    ) {
        this.repoId = vars.repositoryId;
        this.prId = vars.pullRequestId;
    }

    public run = async(): Promise<ITaskResult> => {
        let resultMessage = "One or more conditions were not met";

        const result = await validateAll(this.client, this.inputs, this.repoId, this.prId);

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
