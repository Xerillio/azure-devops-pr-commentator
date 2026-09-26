import { type IGitApi } from "azure-devops-node-api/GitApi";
import { type GitPullRequestIterationChanges } from "azure-devops-node-api/interfaces/GitInterfaces";
import { expect } from "chai";
import sinon, { stubInterface, type StubbedInstance } from "ts-sinon";
import { type IInputs } from "../../src/inputs";
import { type FileGlobValidator } from "../../src/validators/file-glob-validator";
import { type IVariables } from "../../src/variables";
import { clear, instantiate, resetStubs, rewireAll, setMinimatchStub } from "../rewire";
import { createStubInputs, createStubVariables, getStubMethod } from "../stub-helper";

describe("FileGlobValidator", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApi, inputs: IInputs, variables: IVariables): Promise<FileGlobValidator> =>
        await instantiate(async(): Promise<FileGlobValidator> => {
            const constructor = (await import("../../src/validators/file-glob-validator")).FileGlobValidator;
            return new constructor(apiClient, inputs, variables);
        });

    describe("#check()", () => {
        it("should succeed when inputs contain no fileGlob", async() => {
            const stubInputs = createStubInputs({ fileGlob: undefined });
            const stubApiClient = createStubGitApi();
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context).to.deep.equal({});
        });

        it("should succeed when fileGlob matches one file (default mode 'any:')", async() => {
            const fileGlob = "/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, _: string) => path === fileGlob);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members([fileGlob]);
        });

        it("should succeed with 'any:' when at least one changed file matches the pattern", async() => {
            const fileGlob = "any:/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo/bar.txt"]);
        });

        it("should succeed when fileGlob contains multiple globs on separate lines", async() => {
            const fileGlob = "/foo/bar.txt\n/baz/qux.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo/bar.txt", "/baz/qux.txt"]);
        });

        it("should de-duplicate files when multiple globs match the same path", async() => {
            const fileGlob = "/foo/*.txt\n/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => true); // All globs match all files
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.deep.equal(["/foo/bar.txt"]);
        });

        it("should succeed when fileGlob matches one file on second page of changes", async() => {
            const fileGlob = "/baz/qux.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, _: string) => path === fileGlob);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members([fileGlob]);
            const getPullRequestIterationChanges = getStubMethod(stubApiClient, "getPullRequestIterationChanges");
            sinon.assert.calledTwice(getPullRequestIterationChanges);
        });

        it("should succeed when fileGlob matches multiple files on multiple pages", async() => {
            const fileGlob = "/**/*";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => true);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo/bar.txt", "/foo2/bar2.txt", "/baz/qux.txt"]);
            const getPullRequestIterationChanges = getStubMethod(stubApiClient, "getPullRequestIterationChanges");
            sinon.assert.calledTwice(getPullRequestIterationChanges);
        });

        it("should fail when fileGlob matches no files", async() => {
            const fileGlob = "/match/nothing";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            stubApiClient.getPullRequestIterationChanges
                .onSecondCall().resolves(pageTwoIterationChanges());
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.false;
            expect(result.context).to.deep.equal({});
            const getPullRequestIterationChanges = getStubMethod(stubApiClient, "getPullRequestIterationChanges");
            sinon.assert.calledTwice(getPullRequestIterationChanges);
        });

        it("should treat a '!pattern' entry as 'any:!pattern'", async() => {
            const fileGlob = "!/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, _: string) => path !== "/foo/bar.txt");
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo2/bar2.txt"]);
        });

        it("should fail with 'all:' when not every changed file matches the pattern", async() => {
            const fileGlob = "all:/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.false;
        });

        it("should succeed with 'all:' when every changed file matches the pattern", async() => {
            const fileGlob = "all:/**/*";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => true);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo/bar.txt", "/foo2/bar2.txt"]);
        });

        it("should succeed with 'none:' when no changed file matches the pattern", async() => {
            const fileGlob = "none:/match/nothing";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => false);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files ?? []).to.have.lengthOf(0);
        });

        it("should fail with 'none:' when a changed file matches the pattern", async() => {
            const fileGlob = "none:/foo/bar.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.false;
        });

        it("should combine mixed 'any:' and 'none:' entries with AND semantics", async() => {
            const fileGlob = "any:/foo/bar.txt\nnone:/foo2/bar2.txt";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.false;
        });

        it("should succeed when mixed 'any:' and 'none:' entries are both satisfied", async() => {
            const fileGlob = "any:/foo/bar.txt\nnone:/match/nothing";
            const stubInputs = createStubInputs({ fileGlob });
            const stubApiClient = createStubGitApi();
            const minimatchStub = sinon.stub<[string, string], boolean>()
                .callsFake((path: string, pattern: string) => path === pattern);
            setMinimatchStub(minimatchStub);
            const sut = await createSut(stubApiClient, stubInputs, createStubVariables());

            const result = await sut.check({});

            expect(result.conditionMet).is.true;
            expect(result.context.files).to.have.members(["/foo/bar.txt"]);
        });
    });
});

function createStubGitApi(): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getPullRequestIterations
        .resolves([{ id: 1 }]);
    stubGitApi.getPullRequestIterationChanges
        .onFirstCall().resolves(pageOneIterationChanges())
        .onSecondCall().resolves({});
    return stubGitApi;
}

const pageOneIterationChanges = (): GitPullRequestIterationChanges => ({
    changeEntries: [
        {
            changeId: 1,
            item: {
                path: "/foo/bar.txt"
            }
        },
        {
            changeId: 2,
            item: {
                path: "/foo2/bar2.txt"
            }
        }
    ],
    nextSkip: 1,
    nextTop: 1
});

const pageTwoIterationChanges = (): GitPullRequestIterationChanges => ({
    changeEntries: [
        {
            changeId: 3,
            item: {
                path: "/baz/qux.txt"
            }
        }
    ]
});
