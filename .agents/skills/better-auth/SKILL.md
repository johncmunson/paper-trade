---
name: better-auth
description: Use when you need to read the Better Auth documentation and understand how to use it.
---

# Better Auth

> The most comprehensive authentication framework for TypeScript

## Table of Contents

### Adapters

- [Drizzle ORM Adapter](references/adapters/drizzle.md): Integrate Better Auth with Drizzle ORM.
- [PostgreSQL](references/adapters/postgresql.md): Integrate Better Auth with PostgreSQL.
- [SQLite](references/adapters/sqlite.md): Integrate Better Auth with SQLite.

### Authentication

- [Email & Password](references/authentication/email-password.md): Implementing email and password authentication with Better Auth.
- [Google](references/authentication/google.md): Google provider setup and usage.

### Basic Usage

- [Basic Usage](references/basic-usage/basic-usage.md): Getting started with Better Auth

### Concepts

- [API](references/concepts/api.md): Learn how to call Better Auth API endpoints on the server, pass body, headers, and query parameters, retrieve response headers, and handle errors.
- [CLI](references/concepts/cli.md): Learn about the Better Auth CLI commands for generating and migrating database schemas, initializing projects, generating secret keys, and gathering diagnostic info.
- [Client](references/concepts/client.md): Learn how to set up the Better Auth client for React, Vue, Svelte, and other frameworks, use hooks, configure fetch options, handle errors, and extend with client plugins.
- [Cookies](references/concepts/cookies.md): Learn how Better Auth uses cookies, including cookie prefixes, custom cookie attributes, cross-subdomain sharing, secure cookies, and handling Safari ITP with proxies.
- [Database](references/concepts/database.md): Learn about database adapters, migrations, secondary storage with Redis, core schema (user, session, account, verification), custom tables, extending schemas, ID generation, database hooks, and plugin schemas.
- [Email](references/concepts/email.md): Learn how to set up email verification, require verified emails for sign-in, auto sign-in after verification, handle post-verification callbacks, and implement password reset emails.
- [Hooks](references/concepts/hooks.md): Learn how to use before and after hooks to customize endpoint behavior, modify requests and responses, handle cookies, throw errors, access auth context, and run background tasks.
- [OAuth](references/concepts/oauth.md): Learn how to configure social OAuth providers, sign in and link accounts, request scopes, pass additional data, refresh access tokens, map profiles, and customize provider options.
- [Plugins](references/concepts/plugins.md): Learn how to use and create Better Auth plugins, including defining endpoints, schemas, hooks, middleware, rate limits, trusted origins, and building client plugins with custom actions and atoms.
- [Rate Limit](references/concepts/rate-limit.md): Learn how to configure rate limiting in Better Auth, including IP address detection, IPv6 support, custom rate limit windows, storage backends, error handling, and per-endpoint rules.
- [Session Management](references/concepts/session-management.md): Learn about session management in Better Auth, including session expiration, freshness, cookie caching strategies, secondary storage, stateless sessions, and customizing session responses.
- [TypeScript](references/concepts/typescript.md): Learn about TypeScript configuration for Better Auth, including strict mode, inferring types for sessions and users, defining additional fields, and inferring additional fields on the client.
- [User & Accounts](references/concepts/users-accounts.md): Learn how to manage users and accounts, including updating user info, changing emails and passwords, deleting users with verification, token encryption, and account linking and unlinking.

### Examples

- [Next.js Example](references/examples/next-js.md): Better Auth Next.js example.

### Guides

- [Create a Database Adapter](references/guides/create-a-db-adapter.md): Learn how to create a custom database adapter for Better-Auth
- [Dynamic Base URL](references/guides/dynamic-base-url.md): Configure Better Auth for preview deployments, multiple domains, and per-request URL resolution.
- [Optimizing for Performance](references/guides/optimizing-for-performance.md): A guide to optimizing your Better Auth application for performance.
- [Create your first plugin](references/guides/your-first-plugin.md): A step-by-step guide to creating your first Better Auth plugin.

### Installation

- [Installation](references/installation/installation.md): Learn how to configure Better Auth in your project.

### Integrations

- [Next.js integration](references/integrations/next.md): Integrate Better Auth with Next.js.

### Introduction

- [Introduction](references/introduction/introduction.md): Introduction to Better Auth.

### Plugins

- [Two-Factor Authentication (2FA)](references/plugins/2fa.md): Enhance your app's security with two-factor authentication.
- [Admin](references/plugins/admin.md): Admin plugin for Better Auth
- [Agent Auth](references/plugins/agent-auth.md): Agent identity, registration, discovery, and capability-based authorization for AI agents.
- [Bearer Token Authentication](references/plugins/bearer.md): Authenticate API requests using Bearer tokens instead of browser cookies
- [Captcha](references/plugins/captcha.md): Captcha plugin
- [Email OTP](references/plugins/email-otp.md): Email OTP plugin for Better Auth.
- [i18n](references/plugins/i18n.md): Internationalization plugin for translating error messages
- [JWT](references/plugins/jwt.md): Authenticate users with JWT tokens in services that can't use the session
- [Last Login Method](references/plugins/last-login-method.md): Track and display the last authentication method used by users
- [Magic link](references/plugins/magic-link.md): Magic link plugin
- [One-Time Token Plugin](references/plugins/one-time-token.md): Generate and verify single-use token
- [Open API](references/plugins/open-api.md): Open API reference for Better Auth.
- [Organization](references/plugins/organization.md): The organization plugin allows you to manage your organization's members and teams.
- [Stripe](references/plugins/stripe.md): Stripe plugin for Better Auth to manage subscriptions and payments.
- [Test Utils](references/plugins/test-utils.md): Testing utilities for integration and E2E testing
- [Username](references/plugins/username.md): Username plugin
- [Advanced Features](references/plugins/advanced.md): Advanced API Key features including sessions, multiple configurations, organization keys, storage modes, and more.
- [API Key](references/plugins/api-key.md): API Key plugin for Better Auth.
- [Reference](references/plugins/reference.md): API Key plugin options, permissions, and schema reference.

### Reference

- [Contributing to BetterAuth](references/reference/contributing.md): A concise guide to contributing to BetterAuth
- [FAQ](references/reference/faq.md): Frequently asked questions about Better Auth.
- [Instrumentation (Experimental)](references/reference/instrumentation.md): Distributed tracing for Better Auth
- [Options](references/reference/options.md): Better Auth configuration options reference.
- [Resources](references/reference/resources.md): A curated collection of resources to help you learn and master Better Auth.
- [Security](references/reference/security.md): Better Auth security features.
- [Telemetry](references/reference/telemetry.md): Better Auth now collects anonymous telemetry data about general usage.
- [account_already_linked_to_different_user](references/reference/account_already_linked_to_different_user.md): The account is already linked to a different user.
- [account_not_linked](references/reference/account_not_linked.md): The provider account is not linked to the current user and cannot be linked automatically.
- [email_doesn't_match](references/reference/email_doesn't_match.md): The email doesn't match the email of the account.
- [email_not_found](references/reference/email_not_found.md): The provider did not return an email address.
- [Errors](references/reference/errors.md): Errors that can occur in Better Auth.
- [internal_server_error](references/reference/internal_server_error.md): An unexpected error occurred during authentication.
- [invalid_callback_request](references/reference/invalid_callback_request.md): The callback request is invalid.
- [invalid_code](references/reference/invalid_code.md): The provided authentication code is invalid or expired.
- [no_callback_url](references/reference/no_callback_url.md): The callback URL was not found in the request.
- [no_code](references/reference/no_code.md): The code was not found in the request.
- [oauth_provider_not_found](references/reference/oauth_provider_not_found.md): The OAuth provider was not found.
- [signup_disabled](references/reference/signup_disabled.md): Signup disabled error
- [state_invalid](references/reference/state_invalid.md): Failed to decrypt or parse the OAuth state during the callback.
- [state_mismatch](references/reference/state_mismatch.md): State verification failed during the OAuth callback. Covers all state-related error codes and their causes.
- [state_not_found](references/reference/state_not_found.md): The state parameter was not found in the request.
- [unable_to_create_session](references/reference/unable_to_create_session.md): The session could not be created during authentication.
- [unable_to_create_user](references/reference/unable_to_create_user.md): The user could not be created during authentication.
- [unable_to_get_user_info](references/reference/unable_to_get_user_info.md): The user info was not found in the request.
- [unable_to_link_account](references/reference/unable_to_link_account.md): The account could not be linked.
- [Unknown error](references/reference/unknown.md): An unknown error occurred.
