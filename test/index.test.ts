// @ts-nocheck
import { processErrors, matchKeyValueEqual } from "../src/index";

describe("processErrors", () => {
  it("works with empty errorObject", () => {
    let result = processErrors({}, [], () => {});
    expect(result).toEqual([]);
  });

  it("normalizes nested errors", () => {
    let result = processErrors(
      {
        name: ["invalid!"],
        nested: { user_id: ["not an int"] },
        nestedList: [
          { something: ["is wrong"] },
          { very: [{ nested: ["list"] }] },
        ],
      },
      [],
      () => {}
    );

    expect(result).toEqual([
      ["name", "invalid!"],
      ["nested.user_id", "not an int"],
      ["nestedList.0.something", "is wrong"],
      ["nestedList.1.very.0.nested", "list"],
    ]);
  });

  it("calls onMatch on match", () => {
    let matches = [];

    processErrors(
      {
        name: ["invalid!"],
      },
      [
        {
          test: ([k]) => k === "name" && "boom",
          onMatch: (e, testResult) => matches.push(testResult),
        },
      ],
      () => {}
    );

    expect(matches).toEqual(["boom"]);
  });

  it("calls onUnexpectedError for other errors", () => {
    let unExpectedErrors = [];

    processErrors(
      {
        name: ["invalid!", "other problem!"],
      },
      [
        {
          test: ([k, v]) => k === "name" && v === "invalid!",
          onMatch: () => {},
        },
      ],
      (normalizedError) => unExpectedErrors.push(normalizedError)
    );

    expect(unExpectedErrors).toEqual([["name", "other problem!"]]);
  });
});

describe("matchKeyValueEqual", () => {
  it("matches on exact equality", () => {
    let matches = [];

    processErrors(
      {
        name: ["invalid!"],
        other: ["0"],
      },
      [
        matchKeyValueEqual("name", "invalid!", () => matches.push(1)),
        matchKeyValueEqual("other", 0, () => matches.push(2)),
      ],
      () => {}
    );

    expect(matches).toEqual([1]);
  });
});
