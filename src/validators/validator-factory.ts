import { type IGitApiExtension } from "../git-api-extension";
import { type IInputs } from "../inputs";
import { type IVariables } from "../variables";
import { CommitExpressionValidator } from "./commit-expression-validator";
import { FileGlobValidator } from "./file-glob-validator";
import { SourceBranchValidator } from "./source-branch-validator";
import { type IValidator } from "../interfaces/validator";

export class ValidatorFactory implements IValidatorFactory {
    constructor(
        private readonly client: IGitApiExtension,
        private readonly inputs: IInputs,
        private readonly variables: IVariables
    ) { }

    public readonly createValidators = (): IValidator[] => {
        const { client, inputs, variables } = this;
        return [
            new FileGlobValidator(client.apiClient, inputs, variables),
            new CommitExpressionValidator(client, inputs),
            new SourceBranchValidator(client.apiClient, inputs, variables)
        ];
    };
}

export interface IValidatorFactory {
    createValidators: () => IValidator[]
}
