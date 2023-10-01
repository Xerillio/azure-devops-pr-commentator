import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon, { type StubbedInstance, stubInterface } from "ts-sinon";
import { createStubVariables } from "./stub-helper";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { clear, instantiate, resetStubs, rewireAll } from "./rewire";
import { type IVariables } from "../src/variables";
import { type GitApiExtension } from "../src/git-api-extension";
import { type GitCommitRef } from "azure-devops-node-api/interfaces/GitInterfaces";

chaiUse(chaiAsPromised);

describe("GitApiExtension", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(apiClient: IGitApi, variables: IVariables): Promise<GitApiExtension> =>
        await instantiate(async(): Promise<GitApiExtension> => {
            const constructor = (await import("../src/git-api-extension")).GitApiExtension;
            return new constructor(apiClient, variables);
        });

    describe("#getAllPullRequestCommits()", () => {
        it("should page through all pull request commits", async() => {
            const stubGitApi = createStubGitApi();
            const sut = await createSut(stubGitApi, createStubVariables());

            const result = await sut.getAllPullRequestCommits();

            expect(result).to.have.lengthOf(3);
            expect(result.map(c => c.commitId)).to.deep.equal([
                "21da3e34536fb9605d6e5bcc4bc7f309528ff770",
                "27ceea94de677aa7ad4dac47411cb8ec3d11a98a",
                "807d0a2ed79b2a44c44261e36bc588a39ec7de1e"
            ]);
        });

        it("should call the Azure DevOps API on the collection URL given in the variables", async() => {
            const subRestGet = createStubRestGet();
            const stubGitApi = createStubGitApi(subRestGet);
            const sut = await createSut(stubGitApi, createStubVariables());

            const result = await sut.getAllPullRequestCommits();

            expect(result).to.have.lengthOf(3);
            sinon.assert.alwaysCalledWith(subRestGet,
                sinon.match("https://collection-url.com/example/some-project/_apis/git/repositories/123/pullRequests/456/commits"));
        });
    });
});

function createStubGitApi(stubRestGet?: sinon.SinonStub): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.rest = {
        get: stubRestGet ?? createStubRestGet()
    } as any;
    stubGitApi.formatResponse
        .withArgs("commits page 1", sinon.match.any, sinon.match.any)
        .returns(pageOneCommits())
        .withArgs("commits page 2", sinon.match.any, sinon.match.any)
        .returns(pageTwoCommits());
    return stubGitApi;
}

function createStubRestGet(): sinon.SinonStub {
    return sinon.stub()
        .onFirstCall().resolves({
            result: "commits page 1",
            headers: {
                "x-ms-continuationtoken": "page-1-continuation-token"
            }
        })
        .onSecondCall().resolves({
            result: "commits page 2",
            headers: {}
        });
}

const pageOneCommits = (): GitCommitRef[] => [
    {
        commitId: "21da3e34536fb9605d6e5bcc4bc7f309528ff770",
        author: {
            name: "Test Author 1",
            email: "testauthor1@mail.com",
            date: new Date("2001-01-01T01:01:01Z")
        },
        committer: {
            name: "Test Committer 1",
            email: "testcommitter1@mail.com",
            date: new Date("2001-01-02T01:01:01Z")
        },
        comment: "Test commit 1",
        url: "https://collection-url.com/example/some-project/_apis/git/repositories/123/commits/21da3e34536fb9605d6e5bcc4bc7f309528ff770"
    },
    {
        commitId: "27ceea94de677aa7ad4dac47411cb8ec3d11a98a",
        author: {
            name: "Test Author 2",
            email: "testauthor2@mail.com",
            date: new Date("2002-02-02T02:02:02Z")
        },
        committer: {
            name: "Test Committer 2",
            email: "testcommitter2@mail.com",
            date: new Date("2002-02-03T02:02:02Z")
        },
        comment: "Test commit 2",
        url: "https://collection-url.com/example/some-project/_apis/git/repositories/123/commits/27ceea94de677aa7ad4dac47411cb8ec3d11a98a"
    }
];

const pageTwoCommits = (): GitCommitRef[] => [
    {
        commitId: "807d0a2ed79b2a44c44261e36bc588a39ec7de1e",
        author: {
            name: "Test Author 3",
            email: "testauthor3@mail.com",
            date: new Date("2003-03-03T03:03:03Z")
        },
        committer: {
            name: "Test Committer 3",
            email: "testcommitter3@mail.com",
            date: new Date("2003-03-04T03:03:03Z")
        },
        comment: "Test commit 3",
        url: "https://collection-url.com/example/some-project/_apis/git/repositories/123/commits/807d0a2ed79b2a44c44261e36bc588a39ec7de1e"
    }
];
