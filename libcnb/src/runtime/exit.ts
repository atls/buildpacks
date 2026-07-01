/* eslint-disable n/no-process-exit */
export class Exit {
  static ErrorStatusCode = 1

  static FailStatusCode = 100

  static PassStatusCode = 0

  static pass() {
    process.exit(Exit.PassStatusCode)
  }

  static fail() {
    process.exit(Exit.FailStatusCode)
  }

  static error(error: unknown) {
    console.error(error) // eslint-disable-line
    process.exit(Exit.ErrorStatusCode)
  }
}
