import { getVariable } from "azure-pipelines-task-lib";

export class Variables implements IVariables {
    public get collectionUri(): string {
        return Variables.getRequiredVariable("SYSTEM_COLLECTIONURI");
    }

    public get accessToken(): string {
        return Variables.getRequiredVariable("SYSTEM_ACCESSTOKEN",
            "No valid authentication type found");
    }

    public get repositoryId(): string {
        return Variables.getRequiredVariable("BUILD_REPOSITORY_ID");
    }

    public get pullRequestId(): number {
        return parseInt(Variables.getRequiredVariable("SYSTEM_PULLREQUEST_PULLREQUESTID"));
    }

    private static getRequiredVariable(variable: string, errorMsg?: string): string {
        const value = getVariable(variable);
        if (value === undefined) {
            const msg = errorMsg ?? `Environment variable '${variable}' is required but no value was found`;
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
}
