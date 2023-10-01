import { type IInputs } from "../inputs";
import { type IVariables } from "../variables";
import { FileGlobValidator } from "./file-glob-validator";
import { type IValidator } from "./validator";
import { CommitExpressionValidator } from "./commit-expression-validator";
import { type IGitApiExtension } from "../git-api-extension";

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
            new CommitExpressionValidator(client, inputs)
        ];
    };
}

export interface IValidatorFactory {
    createValidators: () => IValidator[]
}
