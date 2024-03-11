export type SafePromise<ErrorType, SuccessResult> =
  | [ErrorType]
  | [null, SuccessResult];

export default async function safePromise<SuccessResult, ErrorType = Error>(
  promise: Promise<SuccessResult> | SuccessResult
): Promise<SafePromise<ErrorType, SuccessResult>> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as ErrorType];
  }
}
