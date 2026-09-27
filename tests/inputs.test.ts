import { rewireAll, instantiate, testInputs, clear } from "./rewire";
import { expect } from "chai";
import type { Inputs } from "../src/inputs";

const patInput = "PAT";
const commentInput = "comment";
const fileGlobInput = "fileGlob";
const commitExprInput = "commitExpr";
const targetBranchInput = "targetBranch";
const sourceBranchInput = "sourceBranch";
const autoResolveInput = "autoResolve";

const conditionalInputs = [
    fileGlobInput,
    commitExprInput,
    targetBranchInput,
    sourceBranchInput
];

describe("Inputs", () => {
    before(rewireAll);
    after(clear);

    const createSut = async(): Promise<Inputs> => await instantiate(
        async() => new (await import("../src/inputs")).Inputs()
    );

    beforeEach(() => {
        testInputs.clear();

        testInputs.set(patInput, "test PAT");
        testInputs.set(commentInput, "test comment");
        testInputs.set(fileGlobInput, "test glob");
        testInputs.set(commitExprInput, "test commit message");
        testInputs.set(targetBranchInput, "test target branch name");
        testInputs.set(sourceBranchInput, "test source branch name");
        testInputs.set(autoResolveInput, true);
    });

    it("should return the specified task inputs", async() => {
        const sut = await createSut();

        expect(sut.pat).to.equal("test PAT");
        expect(sut.comment).to.equal("test comment");
        expect(sut.fileGlob).to.equal("test glob");
        expect(sut.commitExpr).to.equal("test commit message");
        expect(sut.targetBranch).to.equal("test target branch name");
        expect(sut.sourceBranch).to.equal("test source branch name");
        expect(sut.autoResolve).to.equal(true);
    });

    describe("#hashedConditions", () => {
        it("should be unique when conditional inputs change", async() => {
            const sut = await createSut();

            for (const input of conditionalInputs) {
                testInputs.clear();
                testInputs.set(input, `${input} - value 1`);
                const hash1 = sut.hashedConditions;

                testInputs.set(input, `${input} - value 2`);
                const hash2 = sut.hashedConditions;

                expect(hash1).to.not.equal(hash2);
            }
        });

        it("should stay unchanged when non-conditional inputs change", async() => {
            const sut = await createSut();

            const firstHash = sut.hashedConditions;
            const hashes: string[] = [firstHash];

            // PAT
            testInputs.set(patInput, "test PAT changed");
            hashes.push(sut.hashedConditions);

            // comment
            testInputs.set(commentInput, "test comment changed");
            hashes.push(sut.hashedConditions);

            // autoResolve
            const oldAutoResolveValue = testInputs.get(autoResolveInput) as boolean;
            testInputs.set(autoResolveInput, !oldAutoResolveValue);
            hashes.push(sut.hashedConditions);

            const arrayWithAllIdenticalHashes = new Array(hashes.length).fill(hashes[0]);
            expect(hashes).to.deep.equal(arrayWithAllIdenticalHashes);
        });
    });
});
