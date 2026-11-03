/** An error with a stable code that is safe to show to clients. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ErrorBody = { error: { code: string; message: string } };

export function errorBody(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}
