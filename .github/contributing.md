# How to contribute

It's great to see you found your way to this page. If you feel like giving a hand fixing a bug or adding a new feature, your help will be most appreciated.

## How do I get started?

If you want to fix a bug or implement a feature request that already have an open issue, feel free to add a comment to the issue letting us know you want to grab it. If you found a bug or want to suggest a new feature, go right ahead and create a new issue.

### Setting up your local environment

To get started working on this extension, there are a few prerequisites:

* You must have Node.js version 16 or higher installed
* You have forked and cloned the repository as [outlined here](https://docs.github.com/en/get-started/quickstart/contributing-to-projects)
* You have an Azure DevOps project you can use to test your changes. You can create a personal project for free at Microsoft's website.

Once you've got a clone of the repository you want to open a terminal from the root folder of the repository and run `npm ci`.

That's it! Although, you can find a few extra tips below to ease your development experience.

---

## Testing your changes

Whether you are fixing a bug or implementing a new feature, tests are required to keep the quality high.

This project uses [Mocha](https://mochajs.org/) to run tests and all tests are run as part of the pre-commit hook using [husky](https://typicode.github.io/husky/#/).

You can get inspiration from some of the existing tests in the `/tests` folder. For new test files please use the naming convention `<test-target>.test.ts`, where `<test-target>` is the name of the file you're testing.

### Test tools

For stubbing dependencies when writing tests, we use [sinon.js](https://sinonjs.org/). To mock node modules, such as `azure-pipelines-task-lib` we use [rewiremock](https://github.com/theKashey/rewiremock) - see an example in [`/tests/rewire.ts`](../tests/rewire.ts).

Assertions are mainly written using [Chai](https://www.chaijs.com/) and preferably in the [BDD style](https://www.chaijs.com/api/bdd/).

## Pull request guidelines

When committing your changes, please try to keep each commit small and only containing a single feature or bugfix.

Commit messages should start with a short summary of the changes. Try to keep it **below 60 characters**. Additional details can be added following an empty line after the summary. The more detailed the easier it is to understand what you changed and why. See this example:

```txt
Unique comments are only created once

* When created, comments are saved with a hash in the `thread.properties`
  based on the conditions specified in the inputs.
* When rerunning the task a new comment is only created if one doesn't
  already exist with this hash.
```

## Coding style and conventions

The extension is written in TypeScript. To help following a set of conventions we use [ESLint](https://eslint.org/) based on the [`standard-with-typescript`](https://github.com/standard/eslint-config-standard-with-typescript) configuration with some minor changes. See more [in the configuration](../.eslintrc.json).

The pre-commit hook installed with [husky](https://typicode.github.io/husky/#/) will help you fix errors not following the conventions when you commit your code. Run `npm run lint` to manually check your code for errors and `npm run lint-fix` to automatically fix some of it. If you use VSCode as your development environment, installing the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) is recommended and will help you highlight and fix the issues directly in the editor.

## Good to knows

Now, there are a few bits and pieces that are good to know once you start coding. Below is a list of some of the most relevant things:

* [`launch.json`](../.vscode/launch.json): If you use VSCode, there's already some preconfigured launch settings so you can run and debug the task locally as well as debug tests. You might want to change the environment variables to match your own DevOps project and create a [Personal Access Token](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate) and add it to your machine's environment variables with the name `AzureDevOps_PAT`. Consider the `launch.json` a template for you. For more info on how to debug, check [Debugging in VS Code](https://code.visualstudio.com/Docs/editor/debugging).
* NPM scripts. In the [`package.json`](../package.json) file you'll find a few scripts to help make your development workflow easier. You can run these with `npm run <script-name>`:

  | Script name           | Description |
  | --------------------- | ----------- |
  | `test`                | Runs all Mocha tests. |
  | `coverage`            | Runs all tests and outputs a test coverage report. You can run `coverage-html` for a more detailed report, which you'll find in the generated `/coverage` folder. |
  | `lint` and `lint-fix` | Runs ESLint and reports linting issues found in your code and optionally fixes some of them automatically. `lint` is automatically run when you try to commit your code. |
  | `build-dev`           | When you have a version of your changes that you think is ready, this command will create an extension package (a VSIX file) which you can [publish and install](https://learn.microsoft.com/en-us/azure/devops/extend/develop/add-build-task?view=azure-devops#5-publish-your-extension) in your own DevOps project to test it. Extension and task version numbers are automatically bumped to ensure your latest package is used when publishing - even if you didn't make any code changes. You can also update [`task.json`](../task.json) if you e.g. want to make changes to the inputs. |

## Is anything missing?

To make it as easy as possible to contribute we want to keep these guidelines up-to-date. If you have been following the guidelines here and found that it's missing some details let us know by creating an issue. A pull request with your suggested changes will also be appreciated.

Thank you for taking your time to read this.
