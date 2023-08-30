import { type IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IInputs } from "./inputs";
import { isAutoCommentThread } from "./type-guards";
import { type IResultContext } from "./validators/validator";

export class Commentator implements ICommentator {
    constructor(
        private readonly inputs: IInputs,
        private readonly client: IGitApi
    ) {}

    public readonly createComment = async(repositoryId: string, prId: number, context?: IResultContext): Promise<string> => {
        const commentHash = this.inputs.hashedConditions;

        const prThreads = await this.client.getThreads(repositoryId, prId);
        const existingThread = prThreads.filter(isAutoCommentThread)
            .find(thread => thread.isDeleted !== true && thread.properties.hash.$value === commentHash);

        if (existingThread === undefined) {
            await this.createNewThread(commentHash, repositoryId, prId, context);
            console.log(`New comment created with the hash: ${commentHash}`);
        } else {
            console.log(`A comment already exists with the hash: ${commentHash}`);
        }

        return commentHash;
    };

    private readonly createNewThread = async(
        commentHash: string,
        repositoryId: string,
        prId: number,
        context?: IResultContext
    ): Promise<GitInterfaces.GitPullRequestCommentThread> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            properties: {
                hash: commentHash
            },
            comments: [{
                content: this.inputs.comment,
                commentType: GitInterfaces.CommentType.Text
            }],
            status: GitInterfaces.CommentThreadStatus.Active,
            threadContext: this.getThreadContext(context)
        };

        return await this.client.createThread(thread, repositoryId, prId);
    };

    private readonly getThreadContext = (context?: IResultContext): GitInterfaces.CommentThreadContext | undefined => {
        if (context?.files === undefined || context.files.length !== 1) {
            return undefined;
        }

        return { filePath: context.files[0] };
    };
}

export interface ICommentator {
    createComment: (repositoryId: string, prId: number, context?: IResultContext) => Promise<string>
}
