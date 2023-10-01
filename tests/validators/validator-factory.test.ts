import { expect } from "chai";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { type IGitApiExtension } from "../../src/git-api-extension";
import { CommitExpressionValidator } from "../../src/validators/commit-expression-validator";
import { FileGlobValidator } from "../../src/validators/file-glob-validator";
import { ValidatorFactory } from "../../src/validators/validator-factory";
import { createStubInputs, createStubVariables } from "../stub-helper";

describe("ValidatorFactory", () => {
    describe("#createValidators()", () => {
        it("should return all validators", async() => {
            const sut = new ValidatorFactory(createStubGitApi(), createStubInputs(), createStubVariables());

            const result = sut.createValidators();

            expect(result).to.not.be.empty;
            const expectedTypes = [FileGlobValidator, CommitExpressionValidator];
            const actualTypes = result.map(obj => obj.constructor);
            expect(actualTypes).to.deep.equal(expectedTypes);
        });
    });
});

function createStubGitApi(): StubbedInstance<IGitApiExtension> {
    return stubInterface<IGitApiExtension>();
}
