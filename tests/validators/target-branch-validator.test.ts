import { expect } from "chai";
import { stubInterface, type StubbedInstance } from "ts-sinon";
import type { TargetBranchValidator } from "../../src/validators/branch-validator";
import { createStubInputs, createStubResultContext, createStubVariables } from "../stub-helper";
import type { IInputs } from "../../src/inputs";
import { instantiate, clear, rewireAll, resetStubs } from "../rewire";
import type { IGitApi } from "azure-devops-node-api/GitApi";
import type { IVariables } from "../../src/variables";

describe("TargetBranchValidator", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApi, inputs: IInputs, variables: IVariables): Promise<TargetBranchValidator> =>
        await instantiate(async(): Promise<TargetBranchValidator> => {
            const constructor = (await import("../../src/validators/branch-validator")).TargetBranchValidator;
            return new constructor(apiClient, inputs, variables);
        });

    describe("#check()", () => {
        it("should succeed when inputs contain no targetBranch", async() => {
            const stubInputs = createStubInputs({ targetBranch: undefined });
            const stubApiClient = createStubGitApi("refs/heads/main");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should succeed when targetBranch regex does not match the branch name", async() => {
            const stubInputs = createStubInputs({ targetBranch: "^(release|hotfix)/\\d+-[\\w\\-_]+$" });
            const stubApiClient = createStubGitApi("refs/heads/main");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should succeed when pull request targetRefName is undefined", async() => {
            const stubInputs = createStubInputs({ targetBranch: "some-expr" });
            const stubApiClient = createStubGitApi();
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal(createStubResultContext());
        });

        it("should fail when targetBranch regex matches the branch name", async() => {
            const stubInputs = createStubInputs({ targetBranch: "^(main|develop)$" });
            const stubApiClient = createStubGitApi("refs/heads/main");
            const inputContext = createStubResultContext();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check(inputContext);

            expect(result.conditionMet).is.false;
            expect(result.context).to.deep.equal(createStubResultContext());
        });
    });
});

function createStubGitApi(targetRefName?: string): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getPullRequestById
        .resolves({ targetRefName });
    return stubGitApi;
}
