import { type IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { COMMIT_HASH_LENGTH, MAX_COMMIT_MESSAGE_LENGTH } from "./constants";
import { type IInputs } from "./inputs";
import { Resources } from "./resources";
import { isAutoCommentThread } from "./type-guards";
import { type IResultContext } from "./validators/validator";

export class Commentator implements ICommentator {
    constructor(
        private readonly inputs: IInputs,
        private readonly client: IGitApi
    ) {}

    public readonly createComment = async(repositoryId: string, prId: number, context: IResultContext): Promise<string> => {
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
        context: IResultContext
    ): Promise<GitInterfaces.GitPullRequestCommentThread> => {
        const thread: GitInterfaces.GitPullRequestCommentThread = {
            properties: {
                hash: commentHash
            },
            comments: [{
                content: this.createCommentContent(context),
                commentType: GitInterfaces.CommentType.Text
            }],
            status: GitInterfaces.CommentThreadStatus.Active,
            threadContext: this.createThreadContext(context)
        };

        return await this.client.createThread(thread, repositoryId, prId);
    };

    private readonly createThreadContext = (context: IResultContext): GitInterfaces.CommentThreadContext | undefined => {
        if (context.files?.length !== 1) {
            return undefined;
        }

        return { filePath: context.files[0] };
    };

    private readonly createCommentContent = (context: IResultContext): string => {
        return this.inputs.comment +
            this.createFilesMessageContent(context) +
            this.createCommitsMessageContent(context);
    };

    private readonly createFilesMessageContent = (context: IResultContext): string => {
        if (context.files === undefined || context.files.length === 1) {
            return "";
        }

        const content = this.createUnorderedList(
            context.files,
            file => file);

        return "\n\n" +
            this.createCollapseContent(Resources.commentContentFilesDescription, content);
    };

    private readonly createCommitsMessageContent = (context: IResultContext): string => {
        if (context.commits === undefined || context.commits.length === 0) {
            return "";
        }

        const content = this.createUnorderedList(
            context.commits,
            commit => {
                const commitHash = commit.hash.slice(0, COMMIT_HASH_LENGTH);
                const commitMessage = this.ellipsis(commit.message, MAX_COMMIT_MESSAGE_LENGTH);
                return `\`${commitHash} ${commitMessage}\``;
            });

        return "\n\n" +
            this.createCollapseContent(Resources.commentContentCommitsDescription, content);
    };

    private readonly createUnorderedList = <T>(items: T[], mapper: (item: T) => string): string => {
        return items.slice(0, 10)
            .map(item => `* ${mapper(item)}`)
            .join("\n");
    };

    private readonly createCollapseContent = (summary: string, content: string): string => {
        return "<details>\n" +
            `<summary><i>${summary}</i></summary>\n\n` +
            `${content}\n\n` +
            "</details>";
    };

    private readonly ellipsis = (text: string, maxLength: number): string => {
        const ellipsisChar = "…";
        return text.length > maxLength
            ? text.slice(0, maxLength) + ellipsisChar
            : text;
    };
}

export interface ICommentator {
    createComment: (repositoryId: string, prId: number, context: IResultContext) => Promise<string>
}
