import { type IInputs } from "../src/inputs";
import { type IVariables } from "../src/variables";

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
