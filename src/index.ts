import { setResult, TaskResult } from "azure-pipelines-task-lib/task";
import { createGitClient } from "./azure-helpers";
import { Inputs } from "./inputs";
import { Variables } from "./variables";
import { TaskRunner } from "./task-runner";
import { Commentator } from "./commentator";
import { ValidatorFactory } from "./validators/validator-factory";
import { GitApiExtension } from "./git-api-extension";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    try {
        const inputs = new Inputs();
        const vars = new Variables();
        const client = await createGitClient(inputs, vars);
        const clientExtension = new GitApiExtension(client, vars);
        const valFactory = new ValidatorFactory(clientExtension, inputs, vars);
        const commentator = new Commentator(inputs, client);
        const runner = new TaskRunner(commentator, valFactory, vars);
        const result = await runner.run();
        setResult(result.succeeded ? TaskResult.Succeeded : TaskResult.Failed, result.message);
    } catch (err: unknown) {
        console.error(err, err instanceof Error ? err.stack : undefined);
        setResult(TaskResult.Failed, err instanceof Error ? err.message : String(err));
    }
})();
