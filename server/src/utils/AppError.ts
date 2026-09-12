export class AppError extends Error {
  status: number;
  errors: unknown;

  constructor(message: string, status = 400, errors: unknown = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
