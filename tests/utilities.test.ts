import { expect } from "chai";
import { throwError } from "../src/utilities";

describe("utilities", () => {
    describe("#throwError()", () => {
        it("should throw an Error with the provided message", () => {
            expect(() => throwError("test message")).to.throw(Error, "test message");
        });
    });
});
