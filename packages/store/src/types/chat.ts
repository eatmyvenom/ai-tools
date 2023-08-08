import { prop } from "@typegoose/typegoose";
import {
  ChatCompletionRequestMessage,
  ConfigurationParameters,
  CreateChatCompletionRequest,
} from "openai";

export interface OpenAIChatConfig {
  openAIConfig: ConfigurationParameters;
  chatConfig: Partial<CreateChatCompletionRequest> & {
    model: string;
    prompt?: string;
  };
  logLevel?: string;
}

export interface VAIChatMessage extends ChatCompletionRequestMessage {
  time: number;
}

export class VAIChat {
  @prop()
  public messages: OpenAIChatConfig[];

  @prop()
  public config: OpenAIChatConfig;
}
