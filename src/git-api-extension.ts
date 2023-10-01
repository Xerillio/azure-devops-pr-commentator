import { type IGitApi } from "azure-devops-node-api/GitApi";
import * as GitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { type IVariables } from "./variables";

export class GitApiExtension {
    private static readonly apiVersionParam = "api-version=7.0";
    private static readonly pageSizeParam = "$top=100";
    private static readonly continuationTokenHeaderKey = "x-ms-continuationtoken";

    constructor(
        public readonly apiClient: IGitApi,
        private readonly vars: IVariables
    ) {}

    public readonly getAllPullRequestCommits = async(): Promise<GitInterfaces.GitCommitRef[]> => {
        const url = `${this.baseRepositoryUrl}/pullRequests/${this.vars.pullRequestId}/commits`;
        return await this.page(url, GitInterfaces.TypeInfo.GitCommitRef);
    };

    private readonly page = async<T>(url: string, responseTypeMetadata: any, continuationToken?: string): Promise<T[]> => {
        const queryParams = [GitApiExtension.pageSizeParam, GitApiExtension.apiVersionParam];
        if (continuationToken !== undefined) {
            queryParams.push(`continuationToken=${continuationToken}`);
        }

        const response = await this.apiClient.rest.get(`${url}?${queryParams.join("&")}`);
        const result = this.apiClient.formatResponse(response.result, responseTypeMetadata, true) as T[];
        const nextContinuationToken = this.getContinuationToken(response.headers);

        return nextContinuationToken !== undefined
            ? result.concat(await this.page(url, responseTypeMetadata, nextContinuationToken))
            : result;
    };

    private readonly getContinuationToken = (headers: any): string | undefined => {
        const hasToken = Object.getOwnPropertyNames(headers)
            .includes(GitApiExtension.continuationTokenHeaderKey) &&
            typeof headers[GitApiExtension.continuationTokenHeaderKey] === "string";
        return hasToken ? headers[GitApiExtension.continuationTokenHeaderKey] : undefined;
    };

    private get baseRepositoryUrl(): string {
        return `${this.vars.collectionUri}/${this.vars.projectName}/_apis/git/repositories/${this.vars.repositoryId}`;
    }
}

export interface IGitApiExtension {
    readonly apiClient: IGitApi
    getAllPullRequestCommits: () => Promise<GitInterfaces.GitCommitRef[]>
}
