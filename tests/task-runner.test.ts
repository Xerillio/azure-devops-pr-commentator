import { expect } from "chai";
import sinon, { type StubbedInstance, stubInterface } from "ts-sinon";
import { createStubCommentator, createStubInputs, createStubVariables, getStubMethod } from "./stub-helper";
import { instantiate } from "./rewire";
import type { TaskRunner } from "../src/task-runner";
import type { ICommentator } from "../src/commentator";
import type { IValidatorFactory } from "../src/validators/validator-factory";
import type { IInputs } from "../src/inputs";

describe("TaskRunner", () => {
    const createSut = async(commentator: ICommentator, validatorFactory: IValidatorFactory, inputs: IInputs): Promise<TaskRunner> =>
        await instantiate(async(): Promise<TaskRunner> => {
            const constructor = (await import("../src/task-runner")).TaskRunner;
            return new constructor(commentator, validatorFactory, createStubVariables(), inputs);
        });

    describe("#run()", () => {
        it("should succeed when conditions are met", async() => {
            const sut = await createSut(createStubCommentator(), createStubValidatorFactory(), createStubInputs());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^Conditions successfully met/);
        });

        it("should succeed when conditions are not met", async() => {
            const commentatorStub = createStubCommentator();
            const sut = await createSut(commentatorStub, createStubValidatorFactory(false), createStubInputs());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^One or more conditions were not met/);
            sinon.assert.notCalled(getStubMethod(commentatorStub, "resolveComment") as sinon.SinonStub);
        });

        it("should resolve a previous comment when conditions are not met and auto-resolve is enabled", async() => {
            const commentatorStub = createStubCommentator({
                resolveComment: sinon.stub().returns(Promise.resolve(true))
            });

            const sut = await createSut(
                commentatorStub,
                createStubValidatorFactory(false),
                createStubInputs({ autoResolve: true }));
            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.equal("Conditions no longer met. Previous comment resolved.");
            sinon.assert.calledOnce(getStubMethod(commentatorStub, "resolveComment") as sinon.SinonStub);
        });

        it("should not resolve a previous comment when auto-resolve is undefined", async() => {
            const commentatorStub = createStubCommentator({
                resolveComment: sinon.stub().returns(Promise.resolve(true))
            });

            const sut = await createSut(
                commentatorStub,
                createStubValidatorFactory(false),
                createStubInputs({ autoResolve: undefined }));
            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            sinon.assert.notCalled(getStubMethod(commentatorStub, "resolveComment") as sinon.SinonStub);
        });

        it("should include comment hash in result message", async() => {
            const commentatorStub = createStubCommentator({
                createComment: sinon.stub().returns(Promise.resolve("some-comment-hash"))
            });

            const sut = await createSut(commentatorStub, createStubValidatorFactory(), createStubInputs());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.contain("some-comment-hash");
        });
    });
});

function createStubValidatorFactory(isSuccess = true): StubbedInstance<IValidatorFactory> {
    const stubFactory = stubInterface<IValidatorFactory>();

    stubFactory.createValidators
        .returns([{
            check: sinon.stub().resolves({ conditionMet: isSuccess, context: {} })
        }]);

    return stubFactory;
}
