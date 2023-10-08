# Azure DevOps Pull Request Commentator

Improve your code review process by automating comments to avoid common mistakes or remind the developer of possible dependencies outside the pull request.

## Setting up the task

Install the extension in your collection and create a pipeline. Add the `PrCommentator` task to the YAML file and configure the inputs as you see fit:

```yml
- task: PrCommentator@0
  inputs:
   comment: 'Files in /foo/ should only be auto-generated. Did you update /foo-generator.json first?'
   fileGlob: '/foo/**/*'
```

This will generate a comment like the following:

![Automated comment](images/automated-comment.jpg)

A more detailed description of the task and inputs can be found in the [Marketplace Overview](marketplace-overview.md).

## Contributing

This project is open source and [contributions are welcome](.github/contributing.md).

## License

[MIT License](LICENSE.md)
