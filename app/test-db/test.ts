import { loadEnvConfig } from "@next/env";
import {
  converseWithBedrock,
  getBedrockModelId,
  getBedrockRegion,
} from "../../lib/bedrock-api";

loadEnvConfig(process.cwd());

const region = getBedrockRegion();
const modelId = getBedrockModelId();

async function test() {
  const response = await converseWithBedrock(
    {
      messages: [
        {
          role: "user",
          content: [{ text: "Say HELLO" }],
        },
      ],
    },
    modelId
  );

  console.log({ region, modelId });
  console.log(response.output?.message?.content?.[0]);
}

test().catch((error) => {
  if (
    error instanceof Error &&
    error.message.includes("Could not load credentials")
  ) {
    console.error(
      "Bedrock test failed: set AWS_BEARER_TOKEN_BEDROCK to a short-term Bedrock API key, or sign in with AWS credentials that can generate one."
    );
    process.exit(1);
  }

  console.error("Bedrock test failed:", error);
  process.exit(1);
});
