import { type IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type Inputs } from "./inputs";
import { isAutoCommentThread } from "./type-guards";

export class Commentator {
    constructor(
        private readonly inputs: Inputs,
        private readonly client: IGitApi
    ) {}

    public readonly createComment = async(repositoryId: string, prId: number): Promise<string> => {
        const commentHash = this.inputs.hashedConditions;

        const prThreads = await this.client.getThreads(repositoryId, prId);
        const existingThread = prThreads.filter(isAutoCommentThread)
            .find(thread => thread.properties.hash.$value === commentHash);

        if (existingThread === undefined) {
            await this.createNewThread(commentHash, repositoryId, prId);
            console.log(`New comment created with the hash: ${commentHash}`);
        } else {
            console.log(`A comment already exists with the hash: ${commentHash}`);
        }

        return commentHash;
    };

    private readonly createNewThread = async(
        commentHash: string,
        repositoryId: string,
        prId: number
    ): Promise<GitInterfaces.GitPullRequestCommentThread> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            properties: {
                hash: commentHash
            },
            comments: [{
                content: this.inputs.comment,
                commentType: GitInterfaces.CommentType.Text
            }],
            status: GitInterfaces.CommentThreadStatus.Active
        };

        return await this.client.createThread(thread, repositoryId, prId);
    };
}
