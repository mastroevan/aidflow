import nextEnv from "@next/env";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const region = process.env.AWS_REGION || "us-east-1";
const modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error(
    "Missing AWS credentials. Add them to your Next.js env files, then run `npm run test:bedrock`."
  );
}

const client = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ...(process.env.AWS_SESSION_TOKEN
      ? { sessionToken: process.env.AWS_SESSION_TOKEN }
      : {}),
  },
});

async function test() {

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: "user",
        content: [{ text: "Say HELLO" }]
      }
    ]
  });

  const response = await client.send(command);

  console.log(
    response.output?.message?.content?.[0]
  );
}

test().catch((error) => {
  console.error("Bedrock test failed:", error);
  process.exit(1);
});
