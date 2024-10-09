import OpenAI from "openai";
import {WebCategorizer} from "../web-categorizer";
import {WebCategoryType, WebCategoryProviderType, WebCategoryResponse} from "@safekids-ai/web-category-types";
import * as Logger from 'abstract-logging';

class OpenAIWebCategorizer extends WebCategorizer {
  api: OpenAI

  constructor(apiKey: string, model: string, logger?: Logger) {
    super(apiKey, model, logger)
    this.api = new OpenAI({apiKey: apiKey});
  }

  public getProviderName() : WebCategoryProviderType {
    return WebCategoryProviderType.OPENAI;
  }

  async categorize(websiteText: string, url?: string): Promise<WebCategoryResponse> {
    try {
      const response = await this.api.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You will help categorize website content according to the following categories:",
          },
          {
            role: "user",
            content: this.getInstructCategoryDescriptions(),
          },
          {
            role: "user",
            content: `Categorize the following website text and URL, and return multiple categories if applicable: "${websiteText}"${url ? ` and URL: "${url}"` : ''}`,
          },
        ],
      });

      const categoriesFromResponse = response.choices[0].message?.content
        .split(",")
        .map(category => category.trim());

      const matchedCategories = this.getCategories().filter(cat =>
        categoriesFromResponse?.includes(cat.description)
      );

      return {
        types: matchedCategories,
        probability: 1
      } as WebCategoryResponse;

    } catch (error) {
      throw new Error(`Unable to categorize title ${websiteText} due to ${error}`)
    }
  }
}

export {OpenAIWebCategorizer}
