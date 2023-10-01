import { getVariable } from "azure-pipelines-task-lib";

export class Variables implements IVariables {
    public get collectionUri(): string {
        return Variables.getRequiredVariable("SYSTEM_COLLECTIONURI");
    }

    public get accessToken(): string {
        return Variables.getRequiredVariable("SYSTEM_ACCESSTOKEN");
    }

    public get repositoryId(): string {
        return Variables.getRequiredVariable("BUILD_REPOSITORY_ID");
    }

    public get pullRequestId(): number {
        return parseInt(Variables.getRequiredVariable("SYSTEM_PULLREQUEST_PULLREQUESTID"));
    }

    public get projectName(): string {
        return Variables.getRequiredVariable("SYSTEM_TEAMPROJECT");
    }

    private static getRequiredVariable(variable: string): string {
        const value = getVariable(variable);
        if (value === undefined) {
            const msg = `Environment variable '${variable}' is required but no value was found`;
            throw new Error(msg);
        }
        return value;
    }
}

export interface IVariables {
    readonly collectionUri: string
    readonly accessToken: string
    readonly repositoryId: string
    readonly pullRequestId: number
    readonly projectName: string
}
