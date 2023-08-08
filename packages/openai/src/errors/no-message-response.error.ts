export class NoMessageResponseError extends Error {
  public constructor() {
    super("No message was returned from the OpenAI API.");
  }
}
