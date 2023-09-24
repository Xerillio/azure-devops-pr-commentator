import { type IGitApi } from "azure-devops-node-api/GitApi";
import { expect } from "chai";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { ValidatorFactory } from "../../src/validators/validator-factory";
import { createStubInputs, createStubVariables } from "../stub-helper";
import { FileGlobValidator } from "../../src/validators/file-glob-validator";

describe("ValidatorFactory", () => {
    describe("#createValidators()", () => {
        it("should return all validators", async() => {
            const sut = new ValidatorFactory(createStubGitApi(), createStubInputs(), createStubVariables());

            const result = sut.createValidators();

            expect(result).to.not.be.empty;
            const expectedTypes = [FileGlobValidator];
            const actualTypes = result.map(obj => obj.constructor);
            expect(actualTypes).to.deep.equal(expectedTypes);
        });

        it("should return no validators when there are no conditional inputs", async() => {
            const inputs = createStubInputs({
                fileGlob: undefined,
                commitExpr: undefined,
                sourceBranch: undefined,
                targetBranch: undefined
            });
            const sut = new ValidatorFactory(createStubGitApi(), inputs, createStubVariables());

            const result = sut.createValidators();

            expect(result).to.be.empty;
        });
    });
});

function createStubGitApi(): StubbedInstance<IGitApi> {
    return stubInterface<IGitApi>();
}
