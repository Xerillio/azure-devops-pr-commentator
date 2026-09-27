import type { IValidationResult } from "../interfaces/validator";
import type { IValidatorFactory } from "./validator-factory";

/**
 * Validates all conditions specified in the task inputs.
 * @param client Azure DevOps client to access the git API.
 * @param inputs Inputs for the current task.
 * @param repositoryId The ID of the repository which the {@link prId} belongs to.
 * @param prId The ID of the pull request to validate.
 * @returns An {@link IValidationResult} indicating if all conditions for creating a comment were met.
 */
export async function validateAll(factory: IValidatorFactory): Promise<IValidationResult> {
    const validators = factory.createValidators();

    let result: IValidationResult = {
        context: {},
        conditionMet: false
    };

    for (const validator of validators) {
        result = await validator.check(result.context);
        if (!result.conditionMet) break;
    }

    return result;
}
