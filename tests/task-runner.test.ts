import { expect } from "chai";
import sinon, { stubInterface } from "ts-sinon";
import { createStubCommentator, createStubInputs, createStubValidator, createStubVariables } from "./stub-helper";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { clear, instantiate, rewire } from "./rewire";
import { type TaskRunner } from "../src/task-runner";
import { type ICommentator } from "../src/commentator";

describe("TaskRunner", () => {
    beforeEach(() => {
        clear();

        rewire(new Map<string, any>([
            ["./validators/validator", createStubValidator()]
        ]));
    });
    after(clear);

    const createSut = async(commentator: ICommentator): Promise<TaskRunner> =>
        await instantiate(async(): Promise<TaskRunner> => {
            const constructor = (await import("../src/task-runner")).TaskRunner;
            return new constructor(stubInterface<IGitApi>(), commentator, createStubInputs(), createStubVariables());
        });

    describe("#run()", () => {
        it("should succeed when conditions are met", async() => {
            const sut = await createSut(createStubCommentator());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^Conditions successfully met/);
        });

        it("should succeed when conditions are not met", async() => {
            const validatorStub = createStubValidator(sinon.stub().returns({ conditionMet: false }));
            rewire(new Map([
                ["./validators/validator", validatorStub]
            ]));

            const sut = await createSut(createStubCommentator());

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.match(/^One or more conditions were not met/);
        });

        it("should include comment hash in result message", async() => {
            const commentatorStub = createStubCommentator({
                createComment: sinon.stub().returns(Promise.resolve("some-comment-hash"))
            });

            const sut = await createSut(commentatorStub);

            const result = await sut.run();

            expect(result.succeeded).to.be.true;
            expect(result.message).to.contain("some-comment-hash");
        });
    });
});
