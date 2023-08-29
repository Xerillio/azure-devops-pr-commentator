import { setResult, TaskResult } from "azure-pipelines-task-lib/task";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { createGitClient } from "./azure-helpers";
import { Inputs, type IInputs } from "./inputs";
import { Variables, type IVariables } from "./variables";
import { validateAll } from "./validators/validator";
import { Commentator } from "./commentator";

class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;
    private readonly commentator = new Commentator(this.inputs, this.client);

    constructor(
        private readonly client: IGitApi,
        private readonly inputs: IInputs,
        vars: IVariables
    ) {
        this.repoId = vars.repositoryId;
        this.prId = vars.pullRequestId;
    }

    public run = async(): Promise<void> => {
        let resultMessage = "One or more conditions were not met";

        const result = await validateAll(this.client, this.inputs, this.repoId, this.prId);

        if (result.conditionMet) {
            const commentHash = await this.commentator.createComment(this.repoId, this.prId, result.context);
            resultMessage = `Conditions successfully met. Comment hash: ${commentHash}`;
        }

        setResult(TaskResult.Succeeded, resultMessage);
    };
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    try {
        const inputs = new Inputs();
        const vars = new Variables();
        const client = await createGitClient(inputs, vars);
        const runner = new TaskRunner(client, inputs, vars);
        await runner.run();
    } catch (err: any) {
        console.error(err, err.stack);
        setResult(TaskResult.Failed, err.message);
    }
})();
