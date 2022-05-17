# Ecto Changeset errors

When you use [Elixir](https://elixir-lang.org/)'s [Ecto](https://github.com/elixir-ecto/ecto)'s [changesets](https://hexdocs.pm/ecto/Ecto.Changeset.html) for data validation and return invalid changesets from a JSON API in the default Phoenix-plus-gettext format, the errors object can look like this:

```javascript
{
  name: ["invalid!"],
  nested: { user_id: ["not an int"] },
  nestedList: [{ something: ["is wrong"] }, { very: [{ nested: ["list"] }] }],
}
```

...which is a little cumbersome to work with in JS or TS, because they don't have Elixir's pattern matching capabilities.

This little package parses such an errors object and normalizes the errors into key-value pairs:

```javascript
// normalized errors
[
  ["name", "invalid!"],
  ["nested.user_id", "not an int"],
  ["nestedList.0.something", "is wrong"],
  ["nestedList.1.very.0.nested", "list"],
];
```

which you can then match on to handle the errors. There's also an `onUnexpectedErrors` callback for errors that you did not foresee.

## Installation

```bash
npm i -s @weareyipyip/ecto-changeset-errors
```

## Usage

```javascript
import {
  processErrors,
  matchKeyValueEqual,
} from "@weareyipyip/ecto-changeset-errors";

function handleUnexpectedError([k, v]) {
  alert(`Something went wrong: ${k}: ${v}`);
}

callMyPhoenixAPI
  .then(successHandler)
  .catch((responseBody) =>
    processErrors(
      responseBody.errors,
      [
        matchKeyValueEqual("email", "must be unique", () =>
          emailField.showError("Account already exists.")
        ),
      ],
      handleUnexpectedError
    )
  );
```

This package has no additional dependencies (except dev dependencies).
