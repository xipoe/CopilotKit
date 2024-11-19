import { PreviewProjectStack } from "./demo-project-stack";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
}

export function toCdkStackName(input: string) {
  return input
    .split("-") // Split the string by hyphens
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(""); // Join the words back together
}

export function createAgentProjectStack({
  project,
  description,
  dependencies
}: {
  project: string;
  description: string;
  dependencies: "Remote" | "Local";
}) {
  const cdkStackName = toCdkStackName(project) + "Agent" + dependencies + "Deps";
  const dockerfile = dependencies === "Remote" ? `examples/Dockerfile.agent-remote-deps` : `examples/Dockerfile.agent-local-deps`;

  return new PreviewProjectStack(app, cdkStackName, {
    projectName: project,
    projectDescription: description,
    demoDir: `examples/${project}/agent`,
    overrideDockerfile: dockerfile,
    environmentVariablesFromSecrets: ["OPENAI_API_KEY", "TAVILY_API_KEY"],
    port: "8000",
    includeInPRComment: false,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    imageTag: `${project}-agent-${dependencies === "Remote" ? "remote-deps" : "local-deps"}-${GITHUB_ACTIONS_RUN_ID}`
  });
}

export function createUIProjectStack({
  project,
  description,
  dependencies,
  agentProject
}: {
  project: string;
  description: string;
  dependencies: "Remote" | "Local";
  agentProject: PreviewProjectStack;
}) {
  const cdkStackName = toCdkStackName(project) + "UI" + dependencies + "Deps";
  const dockerfile = dependencies === "Remote" ? `examples/Dockerfile.ui-remote-deps` : `examples/Dockerfile.ui-local-deps`;

  return new PreviewProjectStack(app, cdkStackName, {
    projectName: project,
    projectDescription: `${description} (Dependencies: ${dependencies})`,
    demoDir: `examples/${project}/ui`,
    overrideDockerfile: dockerfile,
    environmentVariablesFromSecrets: ["OPENAI_API_KEY"],
    environmentVariables: {
      REMOTE_ACTION_URL: `${agentProject.fnUrl}/copilotkit`,
    },
    buildSecrets: ["OPENAI_API_KEY"],
    port: "3000",
    includeInPRComment: true,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    imageTag: `${project}-ui-${dependencies === "Remote" ? "remote-deps" : "local-deps"}-${GITHUB_ACTIONS_RUN_ID}`
  });
}