import { instantiate, rewireAll, rewiremock, testVariables } from "./rewire";
import { expect } from "chai";
import { type Variables } from "../src/variables";

const systemCollectionUriVariable = "SYSTEM_COLLECTIONURI";
const systemAccessTokenVariable = "SYSTEM_ACCESSTOKEN";
const buildRepositoryIdVariable = "BUILD_REPOSITORY_ID";
const pullRequestIdVariable = "SYSTEM_PULLREQUEST_PULLREQUESTID";

describe("Variables", () => {
    before(rewireAll);
    after(rewiremock.clear);

    const createSut = async(): Promise<Variables> => await instantiate(
        async() => (await import("../src/variables")).Variables
    );

    beforeEach(() => {
        testVariables.clear();

        testVariables.set(systemCollectionUriVariable, "https://test.collection/uri");
        testVariables.set(systemAccessTokenVariable, "testAccessToken");
        testVariables.set(buildRepositoryIdVariable, "test-repository-uuid");
        testVariables.set(pullRequestIdVariable, "7357");
    });

    describe("#collectionUri", () => {
        it("should return https://test.collection/uri", async() => {
            const sut = await createSut();
            expect(sut.collectionUri).to.equal("https://test.collection/uri");
        });

        it("should throw when it has no value", async() => {
            testVariables.delete(systemCollectionUriVariable);
            const sut = await createSut();

            expect(() => sut.collectionUri).to.throw();
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

            expect(() => sut.accessToken).to.throw();
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

            expect(() => sut.repositoryId).to.throw();
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

            expect(() => sut.pullRequestId).to.throw();
        });
    });
});
