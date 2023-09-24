import { expect } from "chai";
import { hasId, isAutoCommentThread, isDefined } from "../src/type-guards";

describe("type-guards", () => {
    describe("#hasId()", () => {
        it("should return true if object has an 'id' number property", () => {
            const result = hasId({ id: 7357 });

            expect(result).to.be.true;
        });

        it("should return false if object has an undefined 'id' property", () => {
            const result = hasId({ id: undefined, foo: 1234 });

            expect(result).to.be.false;
        });

        it("should return false if object has no 'id' property", () => {
            const result = hasId({ });

            expect(result).to.be.false;
        });
    });

    describe("#isAutoCommentThread()", () => {
        it("should return true if object has properties.hash", () => {
            const result = isAutoCommentThread({ properties: { hash: { $value: "foo" } } });

            expect(result).to.be.true;
        });

        it("should return false if object ha no properties", () => {
            const result = isAutoCommentThread({ });

            expect(result).to.be.false;
        });

        it("should return false if object has properties without hash", () => {
            const result = isAutoCommentThread({ properties: { notHash: {} } });

            expect(result).to.be.false;
        });
    });

    describe("#isDefined()", () => {
        it("should return true if the input has any value", () => {
            expect(isDefined(1)).to.be.true;
            expect(isDefined(0)).to.be.true;
            expect(isDefined(true)).to.be.true;
            expect(isDefined(false)).to.be.true;
            expect(isDefined("")).to.be.true;
            expect(isDefined({})).to.be.true;
        });

        it("should return false if the input is null or undefined", () => {
            expect(isDefined(null)).to.be.false;
            expect(isDefined(undefined)).to.be.false;
            expect(isDefined()).to.be.false;
        });
    });
});
