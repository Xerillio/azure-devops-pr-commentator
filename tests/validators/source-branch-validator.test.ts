import { expect } from "chai";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import { type SourceBranchValidator } from "../../src/validators/source-branch-validator";
import { createStubInputs, createStubResultContext, createStubVariables } from "../stub-helper";
import { type IInputs } from "../../src/inputs";
import { instantiate, clear, rewireAll, resetStubs } from "../rewire";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type IVariables } from "../../src/variables";

describe("SourceBranchValidator", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApi, inputs: IInputs, variables: IVariables): Promise<SourceBranchValidator> =>
        await instantiate(async(): Promise<SourceBranchValidator> => {
            const constructor = (await import("../../src/validators/source-branch-validator")).SourceBranchValidator;
            return new constructor(apiClient, inputs, variables);
        });

    describe("#check()", () => {
        it("should succeed when inputs contain no sourceBranch", async() => {
            const stubInputs = createStubInputs({ sourceBranch: undefined });
            const stubApiClient = createStubGitApi("refs/heads/some-branch");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should succeed when sourceBranch regex does not match the branch name", async() => {
            const stubInputs = createStubInputs({ sourceBranch: "^(feature|bugfix)/\\d+-[\\w\\-_]+$" });
            const stubApiClient = createStubGitApi("refs/heads/1234-new-input-added");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should succeed when pull request sourceRefName is undefined", async() => {
            const stubInputs = createStubInputs({ sourceBranch: "some-expr" });
            const stubApiClient = createStubGitApi();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should fail when sourceBranch regex matches the branch name", async() => {
            const stubInputs = createStubInputs({ sourceBranch: "^(feature|bugfix)/\\d+-[\\w\\-_]+$" });
            const stubApiClient = createStubGitApi("refs/heads/feature/1234-new-input-added");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.false;
            expect(result.context).to.deep.equal(createStubResultContext());
        });
    });
});

function createStubGitApi(sourceRefName?: string): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getPullRequestById
        .resolves({ sourceRefName });
    return stubGitApi;
}
