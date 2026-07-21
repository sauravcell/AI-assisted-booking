import { HumanMessage } from "@langchain/core/messages";
import { GroqProvider } from "./groq.provider";

export async function testGroqProvider() {
  const provider = new GroqProvider();

  const response = await provider.invoke([
    new HumanMessage("Say hello in one sentence."),
  ]);

  console.log(response.content);
}
