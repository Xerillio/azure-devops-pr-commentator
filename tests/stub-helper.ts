import sinon from "ts-sinon";
import { type ICommentator } from "../src/commentator";
import { type IInputs } from "../src/inputs";
import { type IVariables } from "../src/variables";
import type { IResultContext, validateAll } from "../src/validators/validator";

export const createStubInputs = (override?: Partial<IInputs>): IInputs => ({
    comment: "test comment",
    fileGlob: "test glob",
    commitExpr: "commit expression",
    hashedConditions: "test hash",
    ...override
});

export const createStubVariables = (override?: Partial<IVariables>): IVariables => ({
    collectionUri: "https://collection-url.com/example",
    accessToken: "access-token",
    projectName: "some-project",
    repositoryId: "123",
    pullRequestId: 456,
    ...override
});

export const createStubCommentator = (override?: Partial<ICommentator>): ICommentator => ({
    createComment: sinon.stub().returns(Promise.resolve("")),
    ...override
});

export const createStubValidator = (override?: typeof validateAll): { validateAll: typeof validateAll } => ({
    validateAll: override ?? sinon.stub().returns({ conditionMet: true })
});

/**
 * Returns a stubbed method reference without leaving a bare class method in the test body.
 *
 * `@typescript-eslint/unbound-method` flags standalone method references because they may be
 * invoked without the original `this` binding. Accessing the stub through this helper keeps the
 * assertion on the actual Sinon stub while making the intent explicit in tests.
 */
export const getStubMethod = <T extends object, K extends keyof T>(obj: T, key: K): T[K] => obj[key];

export const createStubResultContext = (override?: IResultContext): IResultContext => ({
    commits: [{ hash: "commit-hash-stub", message: "commit message stub" }],
    files: ["some-file-match.stub"],
    ...override
});
