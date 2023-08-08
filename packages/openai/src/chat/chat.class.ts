import { Utils, Errors } from "@vai/openai";
import {
  ChatCompletionFunctions,
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from "openai";
import { inspect } from "node:util";
import { LoggerInstance } from "vlogger";
import { OpenAIChatConfig, VAIChatMessage } from "@vai/store";

type UsableFunction = ChatCompletionFunctions & {
  fn: (...args: any[]) => any;
};

export class OpenAIChat {
  private readonly config: OpenAIChatConfig;
  private openai: OpenAIApi;
  private messages: ChatCompletionRequestMessage[];
  public readonly functions: ChatCompletionFunctions[] = [];
  private callableFunctions: { [key: string]: (...args: any[]) => any } = {};
  private logger: LoggerInstance;

  public constructor(cfg: OpenAIChatConfig) {
    this.config = cfg;
    this.openai = new OpenAIApi(new Configuration(this.config.openAIConfig));
    this.messages = [
      { role: "system", content: this.config.chatConfig.prompt },
    ];

    this.logger = new LoggerInstance("AIChat");

    delete this.config.chatConfig.prompt;
  }

  public async chat(
    message?: ChatCompletionRequestMessage,
  ): Promise<ChatCompletionRequestMessage> {
    if (message) this.messages.push(message);

    const response = await this.openai.createChatCompletion({
      ...this.config.chatConfig,
      functions: this.functions,
      messages: this.messages,
    });

    this.logger.debug(`Response: ${inspect(response, true, 4)}`);
    const newMsg = response.data.choices[0].message;

    if (newMsg === undefined) {
      throw new Errors.NoMessageResponseError();
    }

    this.messages.push(newMsg);

    if (newMsg.function_call !== undefined) {
      const fn = this.callableFunctions[newMsg.function_call.name ?? ""];
      const args = JSON.parse(newMsg.function_call.arguments ?? "");

      this.logger.info(
        `Calling function ${newMsg.function_call.name}(${Object.values(args)
          .map((arg) => `${JSON.stringify(arg)}`)
          .join(",")})`,
      );

      let fnRes;
      try {
        fnRes = await fn.apply(this, Object.values(args));
      } catch (error: any) {
        this.logger.error(
          JSON.stringify(error?.response?.data.error ?? error, undefined, 2),
        );
        this.logger.error(error.stack);
      }

      this.logger.debug(`Function result: ${JSON.stringify(fnRes)}`);

      this.messages.push({
        role: "function",
        name: newMsg.function_call.name,
        content: fnRes,
      });
      return await this.chat();
    }

    return newMsg;
  }

  public addFunctions(functions: UsableFunction[]) {
    for (const { name, description, parameters, fn } of functions) {
      this.functions.push({
        name,
        description,
        parameters,
      });
      this.callableFunctions[name] = fn;
    }

    return this;
  }

  public addMessages(messages: VAIChatMessage[]) {
    // TODO: Add a check to make sure the messages are valid
    // TODO: Update in mongo when new messages are added

    this.messages.push(
      ...messages.map((msg) => {
        return { ...msg, time: undefined };
      }),
    );

    return this;
  }

  /**
   * Insert a fake function call into the message history.
   * @param name The name of the function
   * @param args The args that assisant uses for the function
   * @param result The result the function should return
   */
  public insertFakeFunction(name: string, args: string[], result: string) {
    this.messages.push(
      {
        role: "assistant",
        function_call: {
          name,
          arguments: JSON.stringify(args),
        },
      },
      {
        role: "function",
        name,
        content: result,
      },
    );

    return this;
  }

  /**
   * Read functions from a file and add them to the assistant.
   * @param file The file to load functions from
   */
  public async addFunctionsFromFile(file: string) {
    const functions = await Utils.getFunctions(file);
    this.addFunctions(functions as UsableFunction[]);

    return this;
  }

  /**
   * Add a system message to the message history.
   * @param message The message to add
   */
  public addSystemMessage(message: string) {
    this.messages.push({ role: "system", content: message });

    return this;
  }
}
