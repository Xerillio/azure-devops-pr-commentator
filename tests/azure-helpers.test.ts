import { expect, use as chaiUse } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "ts-sinon";
import { createStubInputs, createStubVariables } from "./stub-helper";
import { type IGitApi } from "azure-devops-node-api/GitApi";
import { clear, instantiate, modifyAdoNodeApiStub, resetStubs, rewireAll } from "./rewire";
import { type IInputs } from "../src/inputs";
import { type IVariables } from "../src/variables";

chaiUse(chaiAsPromised);

describe("azure-helpers", () => {
    before(rewireAll);
    after(clear);
    beforeEach(resetStubs);

    const createSut = async(): Promise<((inputs: IInputs, vars: IVariables) => Promise<IGitApi>)> => await instantiate(
        async() => (await import("../src/azure-helpers")).createGitClient
    );

    describe("#createGitClient()", () => {
        it("should use PAT", async() => {
            modifyAdoNodeApiStub({
                getPersonalAccessTokenHandler: sinon.stub().throws(new Error("PAT was used"))
            });

            const sut = await createSut();
            const shouldThrow = sut(createStubInputs({ pat: "throw" }), createStubVariables());

            await expect(shouldThrow).to.be.rejectedWith("PAT was used");
        });

        it("should use bearer/access token", async() => {
            modifyAdoNodeApiStub({
                getBearerHandler: sinon.stub().throws(new Error("Bearer was used"))
            });

            const sut = await createSut();
            const shouldThrow = sut(createStubInputs(), createStubVariables({ accessToken: "throw" }));

            await expect(shouldThrow).to.be.rejectedWith("Bearer was used");
        });

        it("should succeed", async() => {
            const sut = await createSut();
            const shouldResolve = sut(createStubInputs(), createStubVariables());

            await expect(shouldResolve).to.be.fulfilled;
        });
    });
});
