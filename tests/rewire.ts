import rewiremock from "rewiremock";
import sinon from "ts-sinon";

export const testInputs = new Map<string, any>();
export const testVariables = new Map<string, any>();
let minimatchStub: { minimatch: sinon.SinonStub<[string, string], boolean> };

const adoNodeApiStubDefaults = {
    getPersonalAccessTokenHandler: sinon.stub().callsFake((_: string) => undefined),
    getBearerHandler: sinon.stub().callsFake((_: string) => undefined),
    WebApi: sinon.stub().callsFake((collectionUri: string, __: any) => ({
        getGitApi: sinon.stub().callsFake(() => undefined)
    }))
};
const adoNodeApiStub = Object.assign({}, adoNodeApiStubDefaults);

export function rewireAll(): void {
    clear();

    rewiremock("azure-pipelines-task-lib")
        .with({
            getInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getInputRequired: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getBoolInput: sinon.stub().callsFake((i: string) => testInputs.get(i)),
            getVariable: sinon.stub().callsFake((v: string) => testVariables.get(v))
        });

    rewiremock("minimatch")
        .with(minimatchStub);

    rewiremock("azure-devops-node-api")
        .with(adoNodeApiStub);
}

export function clear(): void {
    resetStubs();
    rewiremock.clear();
}

export function resetStubs(): void {
    testInputs.clear();
    testVariables.clear();
    minimatchStub = Object.assign(minimatchStub ?? {},
        {
            minimatch: sinon.stub<[string, string], boolean>()
                .callsFake((_: string, __: string) => false)
        });
    modifyAdoNodeApiStub(adoNodeApiStubDefaults);
}

export function setMinimatchStub(stub: sinon.SinonStub<[string, string], boolean>): void {
    minimatchStub.minimatch = stub;
}

export function modifyAdoNodeApiStub(stub: Partial<typeof adoNodeApiStubDefaults>): void {
    Object.assign(adoNodeApiStub, stub);
}

export async function instantiate<T>(construct: () => Promise<T>): Promise<T> {
    rewiremock.enable();
    const tObj = await construct();
    rewiremock.disable();
    return tObj;
}
