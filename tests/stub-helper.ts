import sinon from "ts-sinon";
import { type ICommentator } from "../src/commentator";
import { type IInputs } from "../src/inputs";
import { type IVariables } from "../src/variables";
import { type validateAll } from "../src/validators/validator";

export const createStubInputs = (override?: Partial<IInputs>): IInputs => Object.assign({
    comment: "test comment",
    fileGlob: "test glob",
    hashedConditions: "test hash"
}, override);

export const createStubVariables = (override?: Partial<IVariables>): IVariables => Object.assign({
    collectionUri: "https://collection-url.com/example",
    accessToken: "access-token",
    repositoryId: "123",
    pullRequestId: 456
}, override);

export const createStubCommentator = (override?: Partial<ICommentator>): ICommentator => Object.assign({
    createComment: sinon.stub().returns(Promise.resolve(""))
}, override);

export const createStubValidator = (override?: typeof validateAll): { validateAll: typeof validateAll } => Object.assign({
    validateAll: sinon.stub().returns({ conditionMet: true })
}, override);
