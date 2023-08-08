import axios, { AxiosInstance } from "axios";
import { LoggerInstance } from "vlogger";
import type { BingSearchResponse } from "./search.js";

export interface ErrorResult {
  error: string;
}

export class SearchInstance {
  private axios: AxiosInstance;
  private logger = new LoggerInstance("BingAPI");

  public constructor(config: { apiKey: string }) {
    this.axios = axios.create({
      baseURL: "https://api.bing.microsoft.com/v7.0/",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey,
      },
    });

    this.logger.verbose("Search API ready");
  }

  public async search(
    query: string,
  ): Promise<BingSearchResponse | ErrorResult> {
    try {
      const searchURL = "search?q=" + encodeURIComponent(query);
      this.logger.verbose(`URL: ${searchURL}`);

      const searchResponse = await this.axios.get<BingSearchResponse>(
        searchURL,
      );

      return searchResponse.data;
    } catch (error: any | Error) {
      return {
        error:
          "Error: " + error?.response?.data?.error?.message ?? "Unknown error",
      };
    }
  }

  public async searchCompact(
    query: string,
  ): Promise<
    | Pick<BingSearchResponse, "_type" | "queryContext" | "webPages" | "news">
    | ErrorResult
  > {
    const response = (await this.search(query)) as BingSearchResponse;
    return {
      _type: response._type,
      queryContext: response.queryContext,
      webPages: response.webPages,
      news: response.news,
    };
  }
}
