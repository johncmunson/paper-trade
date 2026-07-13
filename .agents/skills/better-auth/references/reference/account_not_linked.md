# account_not_linked

The provider account is not linked to the current user and cannot be linked automatically.



What is it? [#what-is-it]

This error occurs during an OAuth flow when a provider account is not linked to the current or matched user and, under the current configuration, cannot be linked automatically (for example, because the provider is untrusted, account linking is disabled, or implicit linking is turned off), even if a matching user exists.

Common Causes [#common-causes]

* The user previously signed up using a different provider or method.
* Account linking is not enabled or configured.
* The provider email does not match any existing user.
* Linking rules (e.g., trusted providers) prevent automatic linking.

How to resolve [#how-to-resolve]

Enable or configure account linking [#enable-or-configure-account-linking]

* Ensure account linking is enabled in your auth configuration.
* Add providers to `account.accountLinking.trustedProviders` if required.

Verify user identity matching [#verify-user-identity-matching]

* Ensure the provider returns a verified email that matches an existing user.
* Ensure the matching existing user has `emailVerified: true`, especially if the user row was inserted manually.

Prompt user action [#prompt-user-action]

* Ask users to sign in using the originally linked provider or method.

Review configuration consistency [#review-configuration-consistency]

* Ensure environment configs are consistent across deployments.

