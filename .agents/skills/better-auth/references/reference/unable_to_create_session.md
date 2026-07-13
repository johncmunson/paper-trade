# unable_to_create_session

The session could not be created during authentication.



What is it? [#what-is-it]

This error occurs when Better Auth fails to create a session after a successful authentication step. A session is required to keep the user logged in, so failure to create one results in this error.

Common Causes [#common-causes]

* Database write failure when creating the session record.
* Session store misconfiguration.
* Connection issues or timeouts with the database.
* Invalid or missing session-related fields.
* Errors in custom hooks or adapters affecting session creation.

How to resolve [#how-to-resolve]

Verify database and session storage [#verify-database-and-session-storage]

* Ensure your database or session store is properly configured and reachable.
* Check for connection errors or timeouts.

Check schema and migrations [#check-schema-and-migrations]

* Confirm that session-related tables/collections exist and are up to date.

Review configuration [#review-configuration]

* Verify your Better Auth configuration for session handling.

Inspect logs [#inspect-logs]

* Look for errors during session creation in server logs.

