import type { ICrmRepository, CrmRepositoryConfig } from "./interface";
import { DrizzleCrmRepository } from "./drizzle";
import { ExternalCrmRepository } from "./external";
import { TwentyCrmRepository } from "./twenty";

// Re-export types and implementations
export type { ICrmRepository, CrmRepositoryConfig } from "./interface";
export { DrizzleCrmRepository } from "./drizzle";
export { ExternalCrmRepository } from "./external";
export { TwentyCrmRepository } from "./twenty";
export * from "./errors";

/**
 * Load repository configuration from environment variables
 */
function loadConfig(): CrmRepositoryConfig {
  const provider = (process.env.CRM_PROVIDER || "drizzle") as
    | "drizzle"
    | "twenty"
    | "external";

  if (provider === "twenty") {
    const baseUrl = process.env.TWENTY_API_URL;
    const apiKey = process.env.TWENTY_API_TOKEN;

    if (!baseUrl) {
      throw new Error(
        "Twenty CRM configuration incomplete. Required: TWENTY_API_URL"
      );
    }

    return {
      provider: "twenty",
      external: {
        type: "twenty",
        baseUrl,
        apiKey,
      },
    };
  }

  if (provider === "external") {
    const type = process.env.CRM_EXTERNAL_TYPE;
    const baseUrl = process.env.CRM_EXTERNAL_BASE_URL;
    const apiKey = process.env.CRM_EXTERNAL_API_KEY;

    if (!type || !baseUrl) {
      throw new Error(
        "External CRM configuration incomplete. Required: CRM_EXTERNAL_TYPE, CRM_EXTERNAL_BASE_URL"
      );
    }

    return {
      provider: "external",
      external: {
        type,
        baseUrl,
        apiKey,
      },
    };
  }

  return { provider: "drizzle" };
}

/**
 * Create a CRM repository instance based on configuration
 */
export function createCrmRepository(
  config?: CrmRepositoryConfig
): ICrmRepository {
  const resolvedConfig = config || loadConfig();

  switch (resolvedConfig.provider) {
    case "drizzle":
      return new DrizzleCrmRepository();

    case "twenty":
      if (!resolvedConfig.external) {
        throw new Error("Twenty CRM configuration is required");
      }
      return new TwentyCrmRepository(resolvedConfig.external);

    case "external":
      return new ExternalCrmRepository(resolvedConfig.external);

    default:
      throw new Error(`Unknown CRM provider: ${resolvedConfig.provider}`);
  }
}

/**
 * Default repository instance - created lazily on first access
 * Uses environment variables for configuration
 */
let _defaultInstance: ICrmRepository | null = null;

export function getCrmRepository(): ICrmRepository {
  if (!_defaultInstance) {
    _defaultInstance = createCrmRepository();
  }
  return _defaultInstance;
}

/**
 * Default export for backward compatibility.
 * Existing code using `crmRepository.someMethod()` will continue to work.
 */
export const crmRepository: ICrmRepository = new Proxy({} as ICrmRepository, {
  get(_target, prop) {
    const instance = getCrmRepository();
    const value = instance[prop as keyof ICrmRepository];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
