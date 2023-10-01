import { expect } from "chai";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { type CommitExpressionValidator } from "../../src/validators/commit-expression-validator";
import { createStubInputs, createStubResultContext } from "../stub-helper";
import { type IInputs } from "../../src/inputs";
import { instantiate, clear, rewireAll, resetStubs } from "../rewire";
import { type IGitApiExtension } from "../../src/git-api-extension";

describe("CommitExpressionValidator", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApiExtension, inputs: IInputs): Promise<CommitExpressionValidator> =>
        await instantiate(async(): Promise<CommitExpressionValidator> => {
            const constructor = (await import("../../src/validators/commit-expression-validator")).CommitExpressionValidator;
            return new constructor(apiClient, inputs);
        });

    describe("#check()", () => {
        it("should succeed when inputs contain no commitExpr", async() => {
            const stubInputs = createStubInputs({ commitExpr: undefined });
            const stubApiClient = createStubApiExtension();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should succeed when commitExpr does not match any commit messages", async() => {
            const commitExpr = "thismatchesnothing";
            const stubInputs = createStubInputs({ commitExpr });
            const stubApiClient = createStubApiExtension();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check(inputContext);

            const expectedContext = createStubResultContext({
                commits: [
                    { hash: "commit-hash-1", message: "Commit message 1" },
                    { hash: "commit-hash-2", message: "Commit message 2" },
                    { hash: "commit-hash-bug", message: "BUG fixing commits must start with the word bug" }
                ]
            });
            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(expectedContext);
        });

        it("should succeed when commitExpr only matches some commit messages", async() => {
            const commitExpr = "BUG fixing commits must start with the word bug";
            const stubInputs = createStubInputs({ commitExpr });
            const stubApiClient = createStubApiExtension();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check(inputContext);

            const expectedContext = createStubResultContext({
                commits: [
                    { hash: "commit-hash-1", message: "Commit message 1" },
                    { hash: "commit-hash-2", message: "Commit message 2" }
                ]
            });
            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(expectedContext);
        });

        it("should fail when commitExpr matches all commit messages", async() => {
            const commitExpr = "[Cc]ommit";
            const stubInputs = createStubInputs({ commitExpr });
            const stubApiClient = createStubApiExtension();
            const inputContext = createStubResultContext();
            delete inputContext.commits;
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check(inputContext);

            const expectedContext = createStubResultContext();
            delete expectedContext.commits;
            expect(result.conditionMet).is.false;
            expect(result.context).to.deep.equal(expectedContext);
        });

        it("should match commit messages using regular expressions", async() => {
            //                                  "e 2" | "BUG fixing"
            const commitExpr = "\\w\\s\\b[02-9]{1}\\b$|^\\w+ fixing";
            const stubInputs = createStubInputs({ commitExpr });
            const stubApiClient = createStubApiExtension();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs);

            const result = await sut.check(inputContext);

            const expectedContext = createStubResultContext({
                commits: [
                    { hash: "commit-hash-1", message: "Commit message 1" }
                ]
            });
            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(expectedContext);
        });
    });
});

function createStubApiExtension(): StubbedInstance<IGitApiExtension> {
    const stubGitApi = stubInterface<IGitApiExtension>();
    stubGitApi.getAllPullRequestCommits
        .resolves([
            { commitId: "commit-hash-1", comment: "Commit message 1" },
            { commitId: "commit-hash-2", comment: "Commit message 2" },
            { commitId: "commit-hash-bug", comment: "BUG fixing commits must start with the word bug" }
        ]);
    return stubGitApi;
}
