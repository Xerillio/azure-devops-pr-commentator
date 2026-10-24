import type { IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { COMMIT_HASH_LENGTH, MAX_COMMIT_MESSAGE_LENGTH } from "./constants";
import type { IInputs } from "./inputs";
import { Resources } from "./resources";
import type { IAutoCommentThread} from "./type-guards";
import { isAutoCommentThread } from "./type-guards";
import type { IResultContext } from "./interfaces/validator";

export class Commentator implements ICommentator {
    constructor(
        private readonly inputs: IInputs,
        private readonly client: IGitApi
    ) {}

    public readonly createComment = async(repositoryId: string, prId: number, context: IResultContext): Promise<string> => {
        const commentHash = this.inputs.hashedConditions;

        const prThreads = await this.client.getThreads(repositoryId, prId);
        const matchingThreads = prThreads.filter(isAutoCommentThread)
            .filter(thread => thread.isDeleted !== true && thread.properties.hash.$value === commentHash);

        const wasExistingThreadHandled =
            await this.handleReopeningThread(repositoryId, prId, context, commentHash, matchingThreads);

        if (!wasExistingThreadHandled) {
            await this.createNewThread(commentHash, repositoryId, prId, context);
        }

        return commentHash;
    };

    public readonly resolveComment = async(repositoryId: string, prId: number): Promise<boolean> => {
        const commentHash = this.inputs.hashedConditions;

        const prThreads = await this.client.getThreads(repositoryId, prId);
        const matchingThreads = prThreads.filter(isAutoCommentThread)
            .filter(thread => thread.isDeleted !== true && thread.properties.hash.$value === commentHash);

        if (matchingThreads.length === 0) {
            console.log(`There was no existing comment with the hash: ${commentHash}`);
            return false;
        }

        const resolvingResults = await Promise.all(
            matchingThreads.map(thread => this.tryResolveThread(repositoryId, prId, thread, commentHash))
        );

        return resolvingResults.some(Boolean);
    };

    /**
     * Attempts to reopening an existing thread matching the new result context. Returns true, if a
     * thread was reopened or it was in a status not allowing automatic reopening (e.g. WontFix).
     * Otherwise, it returns false, indicating a new thread should be created.
     */
    private readonly handleReopeningThread = async(
        repositoryId: string,
        prId: number,
        context: IResultContext,
        commentHash: string,
        matchingThreads: IAutoCommentThread[]
    ): Promise<boolean> => {
        const newThreadContext = this.createThreadContext(context);
        const sameContextThreads = matchingThreads.filter(thread => this.isSameThreadContext(thread, newThreadContext));
        const differentContextThreads = matchingThreads.filter(thread => !this.isSameThreadContext(thread, newThreadContext));

        await Promise.all(
            differentContextThreads.map(thread => this.tryResolveThread(repositoryId, prId, thread, commentHash))
        );

        const hasActiveThread = sameContextThreads.some(thread => this.isThreadOpen(thread));
        if (hasActiveThread) {
            console.log(`An open comment already exists with the hash: ${commentHash}`);
            return true;
        }

        const reopeningResults = await Promise.all(
            sameContextThreads.map(thread => this.tryReopenThread(repositoryId, prId, thread, commentHash))
        );
        if (reopeningResults.some(Boolean)) {
            return true;
        }

        if (sameContextThreads.length !== 0) {
            console.log(`A comment with the hash: ${commentHash} already exists in a non-reopenable state.`);
            return true;
        }

        return false;
    };

    private readonly tryResolveThread = async(
        repositoryId: string,
        prId: number,
        thread: GitInterfaces.GitPullRequestCommentThread,
        commentHash: string
    ): Promise<boolean> => {
        if (thread.id === undefined) {
            return false;
        }

        if (!this.isThreadOpen(thread)) {
            return false;
        }

        await this.updateThreadStatus(repositoryId, prId, thread.id, GitInterfaces.CommentThreadStatus.Fixed);
        console.log(`Resolved comment with the hash: ${commentHash}`);
        return true;
    };

    private readonly tryReopenThread = async(
        repositoryId: string,
        prId: number,
        thread: GitInterfaces.GitPullRequestCommentThread,
        commentHash: string
    ): Promise<boolean> => {
        if (thread.id === undefined) {
            return false;
        }

        if (thread.status !== GitInterfaces.CommentThreadStatus.Fixed) {
            return false;
        }

        await this.updateThreadStatus(repositoryId, prId, thread.id, GitInterfaces.CommentThreadStatus.Active);
        console.log(`Reopened comment with the hash: ${commentHash}`);
        return true;
    };

    private readonly updateThreadStatus = async(
        repositoryId: string,
        prId: number,
        threadId: number,
        status: GitInterfaces.CommentThreadStatus
    ): Promise<void> => {
        const updatedThread: GitInterfaces.GitPullRequestCommentThread = {
            id: threadId,
            status
        };

        await this.client.updateThread(updatedThread, repositoryId, prId, threadId);
    };

    private readonly isThreadOpen = (thread: GitInterfaces.GitPullRequestCommentThread): boolean => {
        const threadStatus = thread.status ?? GitInterfaces.CommentThreadStatus.Unknown;
        return threadStatus === GitInterfaces.CommentThreadStatus.Active ||
            threadStatus === GitInterfaces.CommentThreadStatus.Pending;
    };

    private readonly isSameThreadContext = (
        thread: GitInterfaces.GitPullRequestCommentThread,
        newThreadContext: GitInterfaces.CommentThreadContext | undefined
    ): boolean => {
        return thread.threadContext?.filePath === newThreadContext?.filePath;
    };

    private readonly createNewThread = async(
        commentHash: string,
        repositoryId: string,
        prId: number,
        context: IResultContext
    ): Promise<void> => {
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

        await this.client.createThread(thread, repositoryId, prId);
        console.log(`New comment created with the hash: ${commentHash}`);
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
        const itemsToDisplay = items.slice(0, 10)
            .map(item => `* ${mapper(item)}`);

        if (items.length > itemsToDisplay.length) {
            itemsToDisplay.push("* And more...");
        }

        return itemsToDisplay.join("\n");
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
    resolveComment: (repositoryId: string, prId: number) => Promise<boolean>
}
