import { setResult, TaskResult } from "azure-pipelines-task-lib/task";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { minimatch } from "minimatch";
import { createGitClient } from "./azure-helpers";
import { hasId } from "./type-guards";
import { Inputs } from "./inputs";
import { Variables } from "./variables";

class TaskRunner {
    private readonly repoId: string;
    private readonly prId: number;

    constructor(
        private readonly client: IGitApi,
        private readonly inputs: Inputs,
        vars: Variables
    ) {
        this.repoId = vars.repositoryId;
        this.prId = vars.pullRequestId;
    }

    public run = async(): Promise<void> => {
        try {
            let resultMessage = "No comment added";

            const matchingChange = await this.getFirstMatchingChange();
            if (matchingChange !== undefined) {
                await this.createThread();
                resultMessage = "One comment was added";
            }

            setResult(TaskResult.Succeeded, resultMessage);
        } catch (err: any) {
            console.error(err, err.stack);
            setResult(TaskResult.Failed, err.message);
        }
    };

    private readonly getLastIterationId = async(): Promise<number> => {
        const iterations = await this.client.getPullRequestIterations(this.repoId, this.prId);
        return iterations
            .filter(hasId)
            .sort((i1, i2) => i1.id - i2.id)
            .slice(-1)[0].id;
    };

    private readonly getFirstMatchingChange = async(): Promise<GitInterfaces.GitPullRequestChange | undefined> => {
        const lastIterationId = await this.getLastIterationId();
        let changes: GitInterfaces.GitPullRequestIterationChanges;
        let matchingChange: GitInterfaces.GitPullRequestChange | undefined;
        do {
            changes = await this.client.getPullRequestIterationChanges(this.repoId, this.prId, lastIterationId);
            matchingChange = changes.changeEntries?.find(
                entry => minimatch(entry.item?.path ?? "", this.inputs.fileGlob));
        } while (matchingChange === undefined && changes.nextTop !== undefined && changes.nextTop > 0);
        return matchingChange;
    };

    private readonly createThread = async(): Promise<void> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            comments: [{
                content: this.inputs.comment,
                commentType: GitInterfaces.CommentType.System
            }],
            status: GitInterfaces.CommentThreadStatus.Active
        };

        await this.client.createThread(thread, this.repoId, this.prId);
    };
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function() {
    const inputs = new Inputs();
    const vars = new Variables();
    const client = await createGitClient(inputs, vars);
    const runner = new TaskRunner(client, inputs, vars);
    await runner.run();
})();
