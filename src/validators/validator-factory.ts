import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type IInputs } from "../inputs";
import { isDefined } from "../type-guards";
import { type IVariables } from "../variables";
import { FileGlobValidator } from "./file-glob-validator";
import { type IValidator } from "./validator";

export class ValidatorFactory implements IValidatorFactory {
    constructor(
        private readonly client: IGitApi,
        private readonly inputs: IInputs,
        private readonly variables: IVariables
    ) { }

    public readonly createValidators = (): IValidator[] => {
        return Object.getOwnPropertyNames(this.inputs)
            .map(prop => {
                const inputProperty = prop as keyof IInputs;
                return isDefined(this.inputs[inputProperty])
                    ? this.createValidator(inputProperty)
                    : undefined;
            })
            .filter(isDefined);
    };

    private readonly createValidator = (key: keyof IInputs): IValidator | undefined => {
        switch (key) {
            case "fileGlob":
                return new FileGlobValidator(this.client, this.inputs, this.variables);
            default:
                return undefined;
        }
    };
}

export interface IValidatorFactory {
    createValidators: () => IValidator[]
}
