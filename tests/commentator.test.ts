import { type IGitApi } from "azure-devops-node-api/GitApi";
import { CommentThreadStatus } from "azure-devops-node-api/interfaces/GitInterfaces";
import { expect } from "chai";
import sinon, { stubInterface, type StubbedInstance } from "ts-sinon";
import { Commentator } from "../src/commentator";
import { Resources } from "../src/resources";
import { type IAutoCommentThread } from "../src/type-guards";
import { type IResultContext } from "../src/validators/validator";
import { createStubInputs } from "./stub-helper";

describe("Commentator", () => {
    describe("#createComment()", () => {
        it("should return the hash ID from the inputs", async() => {
            const sut = new Commentator(createStubInputs(), createStubGitApi());
            const result = await sut.createComment("foo", 7357, {});

            expect(result).to.equal("test hash");
        });

        it("should create new active thread when no threads exist", async() => {
            const stubGitApi = createStubGitApi();

            const sut = new Commentator(createStubInputs(), stubGitApi);
            const result = await sut.createComment("foo", 7357, {});

            sinon.assert.calledOnce(stubGitApi.createThread);
            sinon.assert.calledWith(stubGitApi.createThread,
                sinon.match({
                    properties: sinon.match({ hash: result }),
                    status: CommentThreadStatus.Active,
                    comments: [sinon.match({ content: "test comment" })]
                }),
                "foo",
                7357);
        });

        it("should create new active thread if the inputs hash is unique", async() => {
            const stubGitApi = createStubGitApi();
            stubGitApi.getThreads.returns(
                Promise.resolve<IAutoCommentThread[]>([{
                    id: 999,
                    properties: {
                        hash: {
                            $value: "a different hash" // different from stubbed inputs
                        }
                    },
                    comments: [{ content: "not important" }]
                }])
            );

            const sut = new Commentator(createStubInputs(), stubGitApi);
            const result = await sut.createComment("foo", 7357, {});

            sinon.assert.calledOnce(stubGitApi.createThread);
            sinon.assert.calledWith(stubGitApi.createThread,
                sinon.match({
                    properties: sinon.match({ hash: result }),
                    status: CommentThreadStatus.Active,
                    comments: [sinon.match({ content: "test comment" })]
                }),
                "foo",
                7357);
        });

        it("should be a no-op if a thread with the inputs hash already exist", async() => {
            const stubGitApi = createStubGitApi();
            stubGitApi.getThreads.returns(
                Promise.resolve<IAutoCommentThread[]>([{
                    id: 999,
                    properties: {
                        hash: {
                            $value: "test hash" // same as stubbed inputs
                        }
                    },
                    comments: [{ content: "not important" }]
                }])
            );

            const sut = new Commentator(createStubInputs(), stubGitApi);
            await sut.createComment("foo", 7357, {});

            sinon.assert.notCalled(stubGitApi.createThread);
        });

        describe("creates a comment with content, that", () => {
            it("contains the comment from the inputs", async() => {
                const expectedContent = "expected comment contents";
                const stubInputs = createStubInputs({ comment: expectedContent });
                const stubGitApi = createStubGitApi();

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, {});

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedContent })]
                    }),
                    "foo",
                    7357);
            });

            it("contains no listed files when the validation context only contains a single file", async() => {
                const expectedContent = "expected comment content";
                const stubInputs = createStubInputs({ comment: expectedContent });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = { files: ["/some/file/path/1.txt"] };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedContent })]
                    }),
                    "foo",
                    7357);
            });

            it("contains a list of the files from the validation context", async() => {
                const inputComment = "expected comment content";
                const stubInputs = createStubInputs({ comment: inputComment });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = {
                    files: [
                        "/some/file/path/1.txt",
                        "/some/other/file/path/2.txt"
                    ]
                };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                const expectedComment = formatMultiline(`
                    expected comment content

                    <details>
                    <summary><i>${Resources.commentContentFilesDescription}</i></summary>

                    * /some/file/path/1.txt
                    * /some/other/file/path/2.txt

                    </details>`);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedComment })]
                    }),
                    "foo",
                    7357);
            });

            it("contains a list of at most 10 files from the validation context ", async() => {
                const inputComment = "expected comment content";
                const stubInputs = createStubInputs({ comment: inputComment });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = {
                    files: [
                        "/some/file/path/1.txt",
                        "/some/file/path/2.txt",
                        "/some/file/path/3.txt",
                        "/some/file/path/4.txt",
                        "/some/file/path/5.txt",
                        "/some/file/path/6.txt",
                        "/some/file/path/7.txt",
                        "/some/file/path/8.txt",
                        "/some/file/path/9.txt",
                        "/some/file/path/10.txt",
                        "/some/file/path/11.txt"
                    ]
                };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({
                            content: sinon.match(/^expected comment content.*?\/some\/file\/path\/10.txt\n\* And more...\n\n<\/details>$/s)
                        })]
                    }),
                    "foo",
                    7357);
            });

            it("contains a list of one commit when the validation context contains one commit", async() => {
                const inputComment = "expected comment content";
                const stubInputs = createStubInputs({ comment: inputComment });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = {
                    commits: [
                        { hash: "0123456789abc", message: "Commit message 1" }
                    ]
                };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                const expectedComment = formatMultiline(`
                    expected comment content

                    <details>
                    <summary><i>${Resources.commentContentCommitsDescription}</i></summary>

                    * \`0123456 Commit message 1\`

                    </details>`);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedComment })]
                    }),
                    "foo",
                    7357);
            });

            it("contains a list of the commits from the validation context", async() => {
                const inputComment = "expected comment content";
                const stubInputs = createStubInputs({ comment: inputComment });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = {
                    commits: [
                        { hash: "0123456789abc", message: "Commit message 1" },
                        { hash: "abcdef0123456", message: "Commit message 2" },
                        { hash: "xyz9876543210", message: "A very long commit message exceeding 72 characters and is expected to be truncated" }
                    ]
                };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                const expectedComment = formatMultiline(`
                    expected comment content

                    <details>
                    <summary><i>${Resources.commentContentCommitsDescription}</i></summary>

                    * \`0123456 Commit message 1\`
                    * \`abcdef0 Commit message 2\`
                    * \`xyz9876 A very long commit message exceeding 72 characters and is expected to be…\`

                    </details>`);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({ content: expectedComment })]
                    }),
                    "foo",
                    7357);
            });

            it("contains a list of at most 10 commits from the validation context", async() => {
                const inputComment = "expected comment content";
                const stubInputs = createStubInputs({ comment: inputComment });
                const stubGitApi = createStubGitApi();
                const matchContext: IResultContext = {
                    commits: [
                        { hash: "a0123456789", message: "Commit message 1" },
                        { hash: "b0123456789", message: "Commit message 2" },
                        { hash: "c0123456789", message: "Commit message 3" },
                        { hash: "d0123456789", message: "Commit message 4" },
                        { hash: "e0123456789", message: "Commit message 5" },
                        { hash: "f0123456789", message: "Commit message 6" },
                        { hash: "g0123456789", message: "Commit message 7" },
                        { hash: "h0123456789", message: "Commit message 8" },
                        { hash: "i0123456789", message: "Commit message 9" },
                        { hash: "j0123456789", message: "Commit message 10" },
                        { hash: "k0123456789", message: "Commit message 11" }
                    ]
                };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        comments: [sinon.match({
                            content: sinon.match(/^expected comment content.*?`j012345 Commit message 10`\n\* And more...\n\n<\/details>$/s)
                        })]
                    }),
                    "foo",
                    7357);
            });
        });

        describe("creates a thread, that", () => {
            it("contains a property with the inputs' hash", async() => {
                const expectedHash = "expected hash";
                const stubInputs = createStubInputs({ hashedConditions: expectedHash });
                const stubGitApi = createStubGitApi();

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, {});

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        properties: sinon.match({ hash: expectedHash })
                    }),
                    "foo",
                    7357);
            });

            it("contains a file threadContext when the validation context only contains a single file", async() => {
                const stubInputs = createStubInputs();
                const stubGitApi = createStubGitApi();
                const matchContext = { files: ["some-file.txt"] };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        threadContext: sinon.match({ filePath: "some-file.txt" })
                    }),
                    "foo",
                    7357);
            });

            it("contains no threadContext when the validation context contains multiple files", async() => {
                const stubInputs = createStubInputs();
                const stubGitApi = createStubGitApi();
                const matchContext = { files: ["some-file.txt", "some-other-file.txt"] };

                const sut = new Commentator(stubInputs, stubGitApi);
                await sut.createComment("foo", 7357, matchContext);

                sinon.assert.calledOnce(stubGitApi.createThread);
                sinon.assert.calledWith(stubGitApi.createThread,
                    sinon.match({
                        threadContext: undefined
                    }),
                    "foo",
                    7357);
            });
        });
    });
});

/**
 * Formats a multiline string, by removing the first line if empty and removing
 * indentation. Indentation from all lines is removed while preserving the
 * indentation relative to the first non-whitespace character on the first
 * preserved line.
 * @param text The multiline string to format
 * @returns The formatted string
 */
function formatMultiline(text: string): string {
    const rexRemoveFirstEmptyLine = /^\s*\r?\n/g;
    let result = text.replace(rexRemoveFirstEmptyLine, "");
    const rexFirstLineIndentation = /^(\s+)/g;
    const matches = rexFirstLineIndentation.exec(result);
    const indentation = matches?.[1].length ?? 0;
    if (indentation > 0) {
        const rexIndentation = new RegExp(`^[ \t]{0,${indentation}}`, "gm");
        result = result.replace(rexIndentation, "");
    }
    return result;
}

function createStubGitApi(): StubbedInstance<IGitApi> {
    const stubGitApi = stubInterface<IGitApi>();
    stubGitApi.getThreads.returns(Promise.resolve([]));
    stubGitApi.createThread.returns(Promise.resolve({}));
    return stubGitApi;
}
