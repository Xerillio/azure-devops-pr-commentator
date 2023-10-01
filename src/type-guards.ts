import type * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";

export function isDefined<T>(obj?: T): obj is T {
    return obj !== undefined && obj !== null;
}

export function hasId<T extends { id?: number }>(obj: T): obj is T & IHasId<number> {
    return obj.id !== undefined;
}

export interface IHasId<TId> {
    id: TId
}

export function isAutoCommentThread(obj: GitInterfaces.GitPullRequestCommentThread): obj is IAutoCommentThread {
    return obj.properties?.hash !== undefined;
}

export interface IAutoCommentThread extends GitInterfaces.GitPullRequestCommentThread {
    properties: IAutoCommentThreadProperties
}

export interface IAutoCommentThreadProperties {
    [key: string]: any
    hash: IAutoCommentThreadPropertiesHash
}

export interface IAutoCommentThreadPropertiesHash {
    $value: string
}

export function isWellFormedCommit<T extends { commitId?: string, comment?: string }>(obj: T): obj is T & IWellFormedCommit {
    return obj.commitId !== undefined &&
        obj.comment !== undefined;
}

export interface IWellFormedCommit {
    commitId: string
    comment: string
}
