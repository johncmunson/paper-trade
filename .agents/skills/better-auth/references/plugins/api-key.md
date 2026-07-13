# API Key

API Key plugin for Better Auth.



The API Key plugin allows you to create and manage API keys for your application. It provides a way to authenticate and authorize API requests by verifying API keys.

Features [#features]

* Create, manage, and verify API keys
* [Built-in rate limiting](/docs/plugins/api-key/advanced#rate-limiting)
* [Custom expiration times, remaining count, and refill systems](/docs/plugins/api-key/advanced#remaining-refill-and-expiration)
* [Metadata for API keys](/docs/plugins/api-key/advanced#metadata)
* Custom prefix
* [Sessions from API keys](/docs/plugins/api-key/advanced#sessions-from-api-keys)
* [Secondary storage support](/docs/plugins/api-key/advanced#storage-modes) for high-performance API key lookups
* [Multiple configurations](/docs/plugins/api-key/advanced#multiple-configurations) for different API key types
* [Organization-owned API keys](/docs/plugins/api-key/advanced#organization-owned-api-keys) in addition to user-owned keys

Installation [#installation]

<Steps>
  <Step>
    Install the plugin [#install-the-plugin]

    <CodeBlockTabs defaultValue="npm" groupId="persist-install" persist>
      <CodeBlockTabsList>
        <CodeBlockTabsTrigger value="npm">
          npm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="pnpm">
          pnpm
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="yarn">
          yarn
        </CodeBlockTabsTrigger>

        <CodeBlockTabsTrigger value="bun">
          bun
        </CodeBlockTabsTrigger>
      </CodeBlockTabsList>

      <CodeBlockTab value="npm">
        ```bash
        npm install @better-auth/api-key
        ```
      </CodeBlockTab>

      <CodeBlockTab value="pnpm">
        ```bash
        pnpm add @better-auth/api-key
        ```
      </CodeBlockTab>

      <CodeBlockTab value="yarn">
        ```bash
        yarn add @better-auth/api-key
        ```
      </CodeBlockTab>

      <CodeBlockTab value="bun">
        ```bash
        bun add @better-auth/api-key
        ```
      </CodeBlockTab>
    </CodeBlockTabs>
  </Step>

  <Step>
    Add Plugin to the server [#add-plugin-to-the-server]

    ```ts title="auth.ts"
    import { betterAuth } from "better-auth"
    import { apiKey } from "@better-auth/api-key" // [!code highlight]

    export const auth = betterAuth({
        plugins: [
            apiKey() // [!code highlight]
        ]
    })
    ```
  </Step>

  <Step>
    Migrate the database [#migrate-the-database]

    Run the migration or generate the schema to add the necessary fields and tables to the database.

    <Tabs items={["migrate", "generate"]}>
      <Tab value="migrate">
        <CodeBlockTabs defaultValue="npm" groupId="persist-install" persist>
          <CodeBlockTabsList>
            <CodeBlockTabsTrigger value="npm">
              npm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="pnpm">
              pnpm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="yarn">
              yarn
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="bun">
              bun
            </CodeBlockTabsTrigger>
          </CodeBlockTabsList>

          <CodeBlockTab value="npm">
            ```bash
            npx auth migrate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="pnpm">
            ```bash
            pnpm dlx auth migrate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="yarn">
            ```bash
            yarn dlx auth migrate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="bun">
            ```bash
            bun x auth migrate
            ```
          </CodeBlockTab>
        </CodeBlockTabs>
      </Tab>

      <Tab value="generate">
        <CodeBlockTabs defaultValue="npm" groupId="persist-install" persist>
          <CodeBlockTabsList>
            <CodeBlockTabsTrigger value="npm">
              npm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="pnpm">
              pnpm
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="yarn">
              yarn
            </CodeBlockTabsTrigger>

            <CodeBlockTabsTrigger value="bun">
              bun
            </CodeBlockTabsTrigger>
          </CodeBlockTabsList>

          <CodeBlockTab value="npm">
            ```bash
            npx auth generate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="pnpm">
            ```bash
            pnpm dlx auth generate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="yarn">
            ```bash
            yarn dlx auth generate
            ```
          </CodeBlockTab>

          <CodeBlockTab value="bun">
            ```bash
            bun x auth generate
            ```
          </CodeBlockTab>
        </CodeBlockTabs>
      </Tab>
    </Tabs>

    See the [Schema](/docs/plugins/api-key/reference#schema) section to add the fields manually.
  </Step>

  <Step>
    Add the client plugin [#add-the-client-plugin]

    ```ts title="auth-client.ts"
    import { createAuthClient } from "better-auth/client"
    import { apiKeyClient } from "@better-auth/api-key/client"  // [!code highlight]

    export const authClient = createAuthClient({
        plugins: [
            apiKeyClient() // [!code highlight]
        ]
    })
    ```
  </Step>
</Steps>

Usage [#usage]

You can view the [API Key plugin options](/docs/plugins/api-key/reference#api-key-plugin-options).

Create an API key [#create-an-api-key]


### Client Side

```ts
const { data, error } = await authClient.apiKey.create({
    configId, // optional
    name: project-api-key, // optional
    expiresIn, // optional
    userId: user-id, // optional
    organizationId: org-id, // optional
    prefix: project-api-key, // optional
    remaining, // optional
    metadata, // optional
});
```

### Server Side

```ts
const data = await auth.api.createApiKey({
    body: {
        configId, // optional
        name: project-api-key, // optional
        expiresIn, // optional
        userId: user-id, // optional
        organizationId: org-id, // optional
        prefix: project-api-key, // optional
        remaining, // optional
        metadata, // optional
    }
});
```

### Type Definition

```ts
type createApiKey = {
      /**
       * The configuration ID to use. If not provided, the default configuration is used.
       */
      configId?: string
      /**
       * Name of the Api Key.
       */
      name?: string = 'project-api-key'
      /**
       * Expiration time of the Api Key in seconds.
       */
      expiresIn?: number = 60 * 60 * 24 * 7
      /**
       * User Id of the user that the Api Key belongs to. server-only.
       * Required for user-owned keys when not using session headers.
       * @serverOnly
       */
      userId?: string = "user-id"
      /**
       * Organization Id that the Api Key belongs to. 
       * Required for organization-owned keys (when config has `references: "organization"`).
       */
      organizationId?: string = "org-id"
      /**
       * Prefix of the Api Key.
       */
      prefix?: string = 'project-api-key'
      /**
       * Remaining number of requests. server-only.
       * @serverOnly
       */
      remaining?: number = 100
      /**
       * Metadata of the Api Key.
       */
      metadata?: any | null = { someKey: 'someValue' 
}
```


<Callout>
  API keys can be owned by either a user or an organization, depending on the configuration's 

  `references`

   setting.
</Callout>

Result [#result]

It'll return the `ApiKey` object which includes the `key` value for you to use.
Otherwise if it throws, it will throw an `APIError`.

***

Verify an API key [#verify-an-api-key]


### Client Side

```ts
const { data, error } = await authClient.apiKey.verify({
    configId, // optional
    key: your_api_key_here,
    permissions, // optional
});
```

### Server Side

```ts
const data = await auth.api.verifyApiKey({
    body: {
        configId, // optional
        key: your_api_key_here,
        permissions, // optional
    }
});
```

### Type Definition

```ts
type verifyApiKey = {
      /**
       * Configuration ID to scope verification to. When omitted, the key is validated against its own configuration.
       */
      configId?: string
      /**
       * The key to verify.
       */
      key: string = "your_api_key_here"
      /**
       * The permissions to verify. Optional.
       */
      permissions?: Record<string, string[]>
  
}
```


Result [#result-1]

```ts
type Result = {
  valid: boolean;
  error: { message: string; code: string } | null;
  key: Omit<ApiKey, "key"> | null;
};
```

***

Get an API key [#get-an-api-key]


### Client Side

```ts
const { data, error } = await authClient.apiKey.get({
    configId, // optional
    id: some-api-key-id,
});
```

### Server Side

```ts
const data = await auth.api.getApiKey({
    query: {
        configId, // optional
        id: some-api-key-id,
    },
    // This endpoint requires session cookies.
    headers: await headers()
});
```

### Type Definition

```ts
type getApiKey = {
      /**
       * The configuration ID to use for the API key lookup. If not provided, the default configuration is used.
       */
      configId?: string
      /**
       * The id of the Api Key.
       */
      id: string = "some-api-key-id"
  
}
```


Result [#result-2]

You'll receive everything about the API key details, except for the `key` value itself.
If it fails, it will throw an `APIError`.

```ts
type Result = Omit<ApiKey, "key">;
```

***

Update an API key [#update-an-api-key]


### Client Side

```ts
const { data, error } = await authClient.apiKey.update({
    configId, // optional
    keyId: some-api-key-id,
    userId: some-user-id, // optional
    name: some-api-key-name, // optional
    enabled, // optional
    remaining, // optional
    refillAmount, // optional
    refillInterval, // optional
    metadata, // optional
});
```

### Server Side

```ts
const data = await auth.api.updateApiKey({
    body: {
        configId, // optional
        keyId: some-api-key-id,
        userId: some-user-id, // optional
        name: some-api-key-name, // optional
        enabled, // optional
        remaining, // optional
        refillAmount, // optional
        refillInterval, // optional
        metadata, // optional
    }
});
```

### Type Definition

```ts
type updateApiKey = {
      /**
       * The configuration ID to use for the API key lookup. If not provided, the default configuration is used.
       */
      configId?: string
      /**
       * The id of the Api Key to update.
       */
      keyId: string = "some-api-key-id"
      /**
       * The id of the user which the api key belongs to. server-only.
       * @serverOnly
       */
      userId?: string = "some-user-id"
      /**
       * The name of the key.
       */
      name?: string = "some-api-key-name"
      /**
       * Whether the Api Key is enabled or not. server-only.
       * @serverOnly
       */
      enabled?: boolean = true
      /**
       * The number of remaining requests. server-only.
       * @serverOnly
       */
      remaining?: number = 100
      /**
       * The refill amount. server-only.
       * @serverOnly
       */
      refillAmount?: number = 100
      /**
       * The refill interval in milliseconds. server-only.
       * @serverOnly
       */
      refillInterval?: number = 1000
      /**
       * The metadata of the Api Key. server-only.
       * @serverOnly
       */
      metadata?: any | null = { "key": "value" 
}
```


Result [#result-3]

If fails, throws `APIError`.
Otherwise, you'll receive the API Key details, except for the `key` value itself.

***

Delete an API Key [#delete-an-api-key]


### Client Side

```ts
const { data, error } = await authClient.apiKey.delete({
    configId, // optional
    keyId: some-api-key-id,
});
```

### Server Side

```ts
const data = await auth.api.deleteApiKey({
    body: {
        configId, // optional
        keyId: some-api-key-id,
    },
    // This endpoint requires session cookies.
    headers: await headers()
});
```

### Type Definition

```ts
type deleteApiKey = {
      /**
       * The configuration ID to use for the API key lookup. If not provided, the default configuration is used.
       */
      configId?: string
      /**
       * The id of the Api Key to delete.
       */
      keyId: string = "some-api-key-id"
  
}
```


Result [#result-4]

If fails, throws `APIError`.
Otherwise, you'll receive:

```ts
type Result = {
  success: boolean;
};
```

***

List API keys [#list-api-keys]


### Client Side

```ts
const { data, error } = await authClient.apiKey.list({
    configId, // optional
    organizationId, // optional
    limit, // optional
    offset, // optional
    sortBy, // optional
    sortDirection, // optional
});
```

### Server Side

```ts
const data = await auth.api.listApiKeys({
    query: {
        configId, // optional
        organizationId, // optional
        limit, // optional
        offset, // optional
        sortBy, // optional
        sortDirection, // optional
    },
    // This endpoint requires session cookies.
    headers: await headers()
});
```

### Type Definition

```ts
type listApiKeys = {
      /**
       * Filter by configuration ID. If not provided, returns keys from all configurations.
       */
      configId?: string
      /**
       * Organization ID to list keys for. If provided, returns organization-owned keys.
       * If not provided, returns user-owned keys for the current session user.
       */
      organizationId?: string
      /**
       * The number of API keys to return.
       */
      limit?: number
      /**
       * The offset to start from (for pagination).
       */
      offset?: number
      /**
       * The field to sort by (e.g., "createdAt", "name", "expiresAt").
       */
      sortBy?: string
      /**
       * The direction to sort by.
       */
      sortDirection?: "asc" | "desc"
  
}
```


Result [#result-5]

If fails, throws `APIError`.
Otherwise, you'll receive a paginated response:

```ts
type Result = {
  apiKeys: Omit<ApiKey, "key">[];
  total: number;
  limit?: number;
  offset?: number;
};
```

Pagination Examples [#pagination-examples]

```ts
// Get first 10 API keys for the current user
const result = await authClient.apiKey.list({
  query: { limit: 10 }
});

// Get second page (10 items per page)
const page2 = await authClient.apiKey.list({
  query: { limit: 10, offset: 10 }
});

// Sort by creation date (newest first)
const sorted = await authClient.apiKey.list({
  query: { sortBy: "createdAt", sortDirection: "desc" }
});

// Combined pagination and sorting
const combined = await authClient.apiKey.list({
  query: { 
    limit: 20, 
    offset: 0, 
    sortBy: "name", 
    sortDirection: "asc" 
  }
});

// List organization-owned keys
const orgKeys = await authClient.apiKey.list({
  query: { organizationId: "org_123" }
});

// List organization keys with specific config
const orgPublicKeys = await authClient.apiKey.list({
  query: { 
    organizationId: "org_123",
    configId: "public" 
  }
});
```

***

Delete all expired API keys [#delete-all-expired-api-keys]

This function will delete all API keys that have an expired expiration date.


### Client Side

```ts
const { data, error } = await authClient.apiKey.deleteAllExpiredApiKeys({});
```

### Server Side

```ts
const data = await auth.api.deleteAllExpiredApiKeys({});
```

### Type Definition

```ts
type deleteAllExpiredApiKeys = {
  
}
```


<Callout>
  We automatically delete expired API keys every time any apiKey plugin
  endpoints were called, however they are rate-limited to a 10 second cool down
  each call to prevent multiple calls to the database.
</Callout>

Next Steps [#next-steps]

<Cards>
  <Card href="/docs/plugins/api-key/advanced" title="Advanced Features">
    Sessions, multiple configurations, organization keys, storage, rate limiting, and more.
  </Card>

  <Card href="/docs/plugins/api-key/reference" title="Reference">
    Plugin options, permissions, and schema.
  </Card>
</Cards>

