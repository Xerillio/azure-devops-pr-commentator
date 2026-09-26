export interface IValidator {
    /**
     * Validates a specific condition usually identified by one of the task inputs.
     * @param resultContext The context in which all previously run validators found a match.
     * The {@link IValidator} may use this to narrow the scope to match, when relevant.
     * @returns An {@link IValidationResult} indicating if the condition in this validator was
     * met as well as the updated context for the match.
     */
    check: (resultContext: IResultContext) => Promise<IValidationResult>;
}

export interface IValidationResult {
    /** True, if the validated condition was met, otherwise false. */
    conditionMet: boolean
    /** Additional context for the condition that was validated, such as files that matched the condition. */
    context: IResultContext
}

export interface IResultContext {
    /** A list of file paths that matched the condition of the {@link IValidationResult}. */
    files?: string[]
    /** A list of commits that matched the condition of the {@link IValidationResult}. */
    commits?: ICommitContext[]
}

export interface ICommitContext {
    /** The hash of the commit. Also known as the ID of the commit. */
    hash: string
    /** The message/comment of the commit */
    message: string
}
