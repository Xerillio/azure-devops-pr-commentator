import { setResult, TaskResult } from "azure-pipelines-task-lib/task";
import { createGitClient } from "./azure-helpers";
import { Inputs } from "./inputs";
import { Variables } from "./variables";
import { TaskRunner } from "./task-runner";
import { Commentator } from "./commentator";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    try {
        const inputs = new Inputs();
        const vars = new Variables();
        const client = await createGitClient(inputs, vars);
        const commentator = new Commentator(inputs, client);
        const runner = new TaskRunner(client, commentator, inputs, vars);
        const result = await runner.run();
        setResult(result.succeeded ? TaskResult.Succeeded : TaskResult.Failed, result.message);
    } catch (err: any) {
        console.error(err, err.stack);
        setResult(TaskResult.Failed, err.message);
    }
})();
