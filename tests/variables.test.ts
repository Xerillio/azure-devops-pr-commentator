import { instantiate, clear, rewireAll, testVariables } from "./rewire";
import { expect } from "chai";
import { type Variables } from "../src/variables";

const systemCollectionUriVariable = "SYSTEM_COLLECTIONURI";
const systemAccessTokenVariable = "SYSTEM_ACCESSTOKEN";
const buildRepositoryIdVariable = "BUILD_REPOSITORY_ID";
const pullRequestIdVariable = "SYSTEM_PULLREQUEST_PULLREQUESTID";
const projectNameVariable = "SYSTEM_TEAMPROJECT";

describe("Variables", () => {
    before(rewireAll);
    after(clear);

    const createSut = async(): Promise<Variables> => await instantiate(
        async() => new (await import("../src/variables")).Variables()
    );

    beforeEach(() => {
        testVariables.clear();

        testVariables.set(systemCollectionUriVariable, "https://test.collection/uri");
        testVariables.set(systemAccessTokenVariable, "testAccessToken");
        testVariables.set(buildRepositoryIdVariable, "test-repository-uuid");
        testVariables.set(pullRequestIdVariable, "7357");
        testVariables.set(projectNameVariable, "test-project-name");
    });

    describe("#collectionUri", () => {
        it("should return https://test.collection/uri", async() => {
            const sut = await createSut();
            expect(sut.collectionUri).to.equal("https://test.collection/uri");
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(systemCollectionUriVariable);
            const sut = await createSut();

            expect(() => sut.collectionUri).to.throw(
                Error,
                "Environment variable 'SYSTEM_COLLECTIONURI' is required but no value was found");
        });
    });

    describe("#accessToken", () => {
        it("should return testAccessToken", async() => {
            const sut = await createSut();
            expect(sut.accessToken).to.equal("testAccessToken");
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(systemAccessTokenVariable);
            const sut = await createSut();

            expect(() => sut.accessToken).to.throw(
                Error,
                "Environment variable 'SYSTEM_ACCESSTOKEN' is required but no value was found");
        });
    });

    describe("#repositoryId", () => {
        it("should return test-repository-uuid", async() => {
            const sut = await createSut();
            expect(sut.repositoryId).to.equal("test-repository-uuid");
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(buildRepositoryIdVariable);
            const sut = await createSut();

            expect(() => sut.repositoryId).to.throw(
                Error,
                "Environment variable 'BUILD_REPOSITORY_ID' is required but no value was found");
        });
    });

    describe("#pullRequestId", () => {
        it("should return 7357", async() => {
            const sut = await createSut();
            expect(sut.pullRequestId).to.equal(7357);
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(pullRequestIdVariable);
            const sut = await createSut();

            expect(() => sut.pullRequestId).to.throw(
                Error,
                "Environment variable 'SYSTEM_PULLREQUEST_PULLREQUESTID' is required but no value was found");
        });
    });

    describe("#projectName", () => {
        it("should return test-project-name", async() => {
            const sut = await createSut();
            expect(sut.projectName).to.equal("test-project-name");
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(projectNameVariable);
            const sut = await createSut();

            expect(() => sut.projectName).to.throw(
                Error,
                "Environment variable 'SYSTEM_TEAMPROJECT' is required but no value was found");
        });
    });
});
