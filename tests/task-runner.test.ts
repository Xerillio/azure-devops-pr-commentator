import { expect } from "chai";
import sinon, { type StubbedInstance, stubInterface } from "ts-sinon";
import { createStubCommentator, createStubVariables } from "./stub-helper";
import { instantiate } from "./rewire";
import { type TaskRunner } from "../src/task-runner";
import { type ICommentator } from "../src/commentator";
import { type IValidatorFactory } from "../src/validators/validator-factory";

describe("TaskRunner", () => {
    const createSut = async(commentator: ICommentator, validatorFactory: IValidatorFactory): Promise<TaskRunner> =>
        await instantiate(async(): Promise<TaskRunner> => {
            const constructor = (await import("../src/task-runner")).TaskRunner;
            return new constructor(commentator, validatorFactory, createStubVariables());
        });

    describe("#run()", () => {
        it("should succeed when conditions are met", async() => {
            const sut = await createSut(createStubCommentator(), createStubValidatorFactory());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^Conditions successfully met/);
        });

        it("should succeed when conditions are not met", async() => {
            const sut = await createSut(createStubCommentator(), createStubValidatorFactory(false));

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^One or more conditions were not met/);
        });

        it("should include comment hash in result message", async() => {
            const commentatorStub = createStubCommentator({
                createComment: sinon.stub().returns(Promise.resolve("some-comment-hash"))
            });

            const sut = await createSut(commentatorStub, createStubValidatorFactory());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.contain("some-comment-hash");
        });
    });
});

function createStubValidatorFactory(isSuccess: boolean = true): StubbedInstance<IValidatorFactory> {
    const stubFactory = stubInterface<IValidatorFactory>();

    stubFactory.createValidators
        .returns([{
            check: sinon.stub().resolves({ conditionMet: isSuccess, context: {} })
        }]);

    return stubFactory;
}
