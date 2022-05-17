type normalizedError = [key: string, value: string];
type onMatchCallback = (error: normalizedError, testResult: any) => void;
type onUnexpectedError = (error: normalizedError) => void;
type testCallback = (error: normalizedError) => any;
type expectedError = { test: testCallback; onMatch: onMatchCallback };
type changesetErrorValue = string[] | changesetError | changesetError[];
type changesetError = { [key: string]: changesetErrorValue };

/**
 * Process Ecto changeset errors (as a JS/TS object).
 *
 * Requires the errors object, a list of known errors (objects with a `test` predicate and an `onMatch` callback) and a handler for unexpected errors.
 *
 * Example:
  ```
  processErrors(
    {
      user: ["not authenticated"],
      type: ["must be one of public, private"],
    },
    [
      {
        test: ([k, v]) => k === "user" && v === "not authenticated",
        onMatch: ([_k, _v]) => addError("user not authenticated"),
      },
      {
        test: ([k, v]) => {
          let matches = v.match(/must be one of (.*)/g);
          if (k === "type" && matches.length > 0) return matches;
          else return false;
        },
        onMatch([_k, _v], matches) {
          let allowedTypes = matches[1].split(", ");
          addError(`types may only be ${allowedTypes}`);
        },
      },
    ],
    console.log
  );
  ```
 *
 * Complex example:
  ```
  processErrors(
    {
      name: ["invalid!"],
      nested: { user_id: ["not an int"] },
      nestedList: [{ something: ["is wrong"] }, { very: [{ nested: ["list"] }] }],
    },
    [],
    myErrorArray.push
  );

  // normalized errors
  [
    ["name", "invalid!"],
    ["nested.user_id", "not an int"],
    ["nestedList.0.something", "is wrong"],
    ["nestedList.1.very.0.nested", "list"],
  ];
  ```
 */
function processErrors(
  errorObject: changesetError,
  expectedErrors: expectedError[],
  onUnexpectedError: onUnexpectedError
): normalizedError[] {
  const isUnexpectedError = createUnexpectedErrorMatcher(expectedErrors);

  let normalizedErrors = parseErrorObj(errorObject || {});
  normalizedErrors.filter(isUnexpectedError).forEach(onUnexpectedError);
  return normalizedErrors;
}

/**
 * Match an error when key and value are equal. Convenience helper for `processErrors`.
 *
  ```
  processErrors(obj, [matchKeyValueEqual("user", "not found", console.log)], console.error)
  ```
 */
function matchKeyValueEqual(
  key: string,
  value: string,
  onMatch: onMatchCallback
) {
  let test = ([k, v]: normalizedError) => k === key && v === value;
  return { test, onMatch };
}

/////////////
// Private //
/////////////

function createUnexpectedErrorMatcher(expectedErrors: expectedError[]) {
  return (error: normalizedError) =>
    !matchesExpectedError(error, expectedErrors);
}

function matchesExpectedError(
  error: normalizedError,
  expectedErrors: expectedError[]
) {
  return expectedErrors?.find(({ test, onMatch }) => {
    let testResult = test(error);
    if (testResult) onMatch(error, testResult);
    return testResult;
  });
}

// [key, obj | array-of-objects | array-of-messages]
function parseErrorObjPair([key, arrayOrObj]: [
  string,
  changesetErrorValue
]): any {
  return Array.isArray(arrayOrObj)
    ? parseMsgOrObjArray(arrayOrObj, key)
    : parseErrorObj(arrayOrObj, key);
}

// {key, [error]}
function parseErrorObj(
  changesetError: changesetError,
  parentKey?: string
): normalizedError[] {
  return Object.entries(changesetError).flatMap(([k, v]) =>
    parseErrorObjPair([maybePrefix(parentKey, k), v])
  );
}

// ["message"] OR [{nestedError: [message-or-even-deeper-nested-error]}]
function parseMsgOrObjArray(
  errorArray: string[] | changesetError[],
  parentKey?: string
): any {
  return errorArray.flatMap((stringOrErrorObj, i) =>
    typeof stringOrErrorObj === "string"
      ? [[parentKey, stringOrErrorObj]]
      : parseErrorObjPair([maybePrefix(parentKey, i), stringOrErrorObj])
  );
}

function maybePrefix(prefix: string | undefined, key: string | number) {
  return prefix ? `${prefix}.${key}` : `${key}`;
}

export { processErrors, matchKeyValueEqual };
