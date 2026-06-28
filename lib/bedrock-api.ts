import { getTokenProvider } from "@aws/bedrock-token-generator";

type BedrockContentBlock = {
  text?: string;
};

type BedrockMessage = {
  role: "user" | "assistant";
  content: BedrockContentBlock[];
};

type BedrockConverseRequest = {
  system?: BedrockContentBlock[];
  messages: BedrockMessage[];
  inferenceConfig?: {
    maxTokens?: number;
    temperature?: number;
  };
};

export type BedrockConverseResponse = {
  output?: {
    message?: {
      content?: BedrockContentBlock[];
    };
  };
};

let provideShortTermToken: (() => Promise<string>) | null = null;

export function getBedrockRegion() {
  return process.env.AWS_REGION || "us-east-1";
}

export function getBedrockModelId() {
  return process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
}

async function getBedrockBearerToken() {
  const configuredToken = process.env.AWS_BEARER_TOKEN_BEDROCK?.trim();

  if (configuredToken) {
    return configuredToken;
  }

  provideShortTermToken ??= getTokenProvider({
    region: getBedrockRegion(),
    ...(process.env.AWS_PROFILE ? { profile: process.env.AWS_PROFILE } : {}),
  });

  return provideShortTermToken();
}

export async function converseWithBedrock(
  payload: BedrockConverseRequest,
  modelId = getBedrockModelId()
): Promise<BedrockConverseResponse> {
  const region = getBedrockRegion();
  const token = await getBedrockBearerToken();
  const response = await fetch(
    `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(
      modelId
    )}/converse`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Bedrock Converse failed with ${response.status}: ${errorText}`
    );
  }

  return (await response.json()) as BedrockConverseResponse;
}
