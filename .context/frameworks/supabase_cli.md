Supabase CLI Reference

# CLI Reference

Bootstrap a Supabase project from a starter template

supabase bootstrap [template] [flags]

# CLI Reference

Initialize a local project

Initialize configurations for Supabase local development.

A `supabase/config.toml` file is created in your current working directory. This configuration is specific to each local project.

> You may override the directory path by specifying the `SUPABASE_WORKDIR` environment variable or `--workdir` flag.

In addition to `config.toml`, the `supabase` directory may also contain other Supabase objects, such as `migrations`, `functions`, `tests`, etc.

supabase init [flags]

# CLI Reference

Authenticate using an access token

Connect the Supabase CLI to your Supabase account by logging in with your [personal access token](https://supabase.com/dashboard/account/tokens).

Your access token is stored securely in [native credentials storage](https://github.com/zalando/go-keyring#dependencies). If native credentials storage is unavailable, it will be written to a plain text file at `~/.supabase/access-token`.

> If this behavior is not desired, such as in a CI environment, you may skip login by specifying the `SUPABASE_ACCESS_TOKEN` environment variable in other commands.

The Supabase CLI uses the stored token to access Management APIs for projects, functions, secrets, etc.

supabase login [flags]

# CLI Reference

Link to a Supabase project

Link your local development project to a hosted Supabase project.

PostgREST configurations are fetched from the Supabase platform and validated against your local configuration file.

Optionally, database settings can be validated if you provide a password. Your database password is saved in native credentials storage if available.

> If you do not want to be prompted for the database password, such as in a CI environment, you may specify it explicitly via the `SUPABASE_DB_PASSWORD` environment variable.

Some commands like `db dump`, `db push`, and `db pull` require your project to be linked first.

supabase link [flags]

# CLI Reference

Start containers for Supabase local development

Starts the Supabase local development stack.

Requires `supabase/config.toml` to be created in your current working directory by running `supabase init`.

All service containers are started by default. You can exclude those not needed by passing in `-x` flag. To exclude multiple containers, either pass in a comma separated string, such as `-x gotrue,imgproxy`, or specify `-x` flag multiple times.

> It is recommended to have at least 7GB of RAM to start all services.

Health checks are automatically added to verify the started containers. Use `--ignore-health-check` flag to ignore these errors.

supabase start [flags]

# CLI Reference

Stop all local Supabase containers

Stops the Supabase local development stack.

Requires `supabase/config.toml` to be created in your current working directory by running `supabase init`.

All Docker resources are maintained across restarts. Use `--no-backup` flag to reset your local development data between restarts.

Use the `--all` flag to stop all local Supabase projects instances on the machine. Use with caution with `--no-backup` as it will delete all supabase local projects data.

supabase stop [flags]

# CLI Reference

Show status of local Supabase containers

Shows status of the Supabase local development stack.

Requires the local development stack to be started by running `supabase start` or `supabase db start`.

You can export the connection parameters for [initializing supabase-js](https://supabase.com/docs/reference/javascript/initializing) locally by specifying the `-o env` flag. Supported parameters include `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY`.

supabase status [flags]

# CLI Reference

Run tests on local Supabase containers

# CLI Reference

Tests local database with pgTAP

Executes pgTAP tests against the local database.

Requires the local development stack to be started by running `supabase start`.

Runs `pg_prove` in a container with unit test files volume mounted from `supabase/tests` directory. The test file can be suffixed by either `.sql` or `.pg` extension.

Since each test is wrapped in its own transaction, it will be individually rolled back regardless of success or failure.

supabase test db [path] ... [flags]

# CLI Reference

Create a new test file

supabase test new <name> [flags]

# CLI Reference

Run code generation tools

Automatically generates type definitions based on your Postgres database schema.

This command connects to your database (local or remote) and generates typed definitions that match your database tables, views, and stored procedures. By default, it generates TypeScript definitions, but also supports Go and Swift.

Generated types give you type safety and autocompletion when working with your database in code, helping prevent runtime errors and improving developer experience.

The types respect relationships, constraints, and custom types defined in your database schema.

# CLI Reference

Generate keys for preview branch

supabase gen keys [flags]

# CLI Reference

Generate types from Postgres schema

supabase gen types [flags]

# CLI Reference

Manage Postgres databases

# CLI Reference

Pull schema from the remote database

Pulls schema changes from a remote database. A new migration file will be created under `supabase/migrations` directory.

Requires your local project to be linked to a remote database by running `supabase link`. For self-hosted databases, you can pass in the connection parameters using `--db-url` flag.

Optionally, a new row can be inserted into the migration history table to reflect the current state of the remote database.

If no entries exist in the migration history table, `pg_dump` will be used to capture all contents of the remote schemas you have created. Otherwise, this command will only diff schema changes against the remote database, similar to running `db diff --linked`.

supabase db pull [migration name] [flags]

# CLI Reference

Push new migrations to the remote database

Pushes all local migrations to a remote database.

Requires your local project to be linked to a remote database by running `supabase link`. For self-hosted databases, you can pass in the connection parameters using `--db-url` flag.

The first time this command is run, a migration history table will be created under `supabase_migrations.schema_migrations`. After successfully applying a migration, a new row will be inserted into the migration history table with timestamp as its unique id. Subsequent pushes will skip migrations that have already been applied.

If you need to mutate the migration history table, such as deleting existing entries or inserting new entries without actually running the migration, use the `migration repair` command.

Use the `--dry-run` flag to view the list of changes before applying.

supabase db push [flags]

# CLI Reference

Resets the local database to current migrations

Resets the local database to a clean state.

Requires the local development stack to be started by running `supabase start`.

Recreates the local Postgres container and applies all local migrations found in `supabase/migrations` directory. If test data is defined in `supabase/seed.sql`, it will be seeded after the migrations are run. Any other data or schema changes made during local development will be discarded.

When running db reset with `--linked` or `--db-url` flag, a SQL script is executed to identify and drop all user created entities in the remote database. Since Postgres roles are cluster level entities, any custom roles created through the dashboard or `supabase/roles.sql` will not be deleted by remote reset.

supabase db reset [flags]

# CLI Reference

Dumps data or schemas from the remote database

Dumps contents from a remote database.

Requires your local project to be linked to a remote database by running `supabase link`. For self-hosted databases, you can pass in the connection parameters using `--db-url` flag.

Runs `pg_dump` in a container with additional flags to exclude Supabase managed schemas. The ignored schemas include auth, storage, and those created by extensions.

The default dump does not contain any data or custom roles. To dump those contents explicitly, specify either the `--data-only` and `--role-only` flag.

supabase db dump [flags]

# CLI Reference

Diffs the local database for schema changes

Diffs schema changes made to the local or remote database.

Requires the local development stack to be running when diffing against the local database. To diff against a remote or self-hosted database, specify the `--linked` or `--db-url` flag respectively.

Runs [djrobstep/migra](https://github.com/djrobstep/migra) in a container to compare schema differences between the target database and a shadow database. The shadow database is created by applying migrations in local `supabase/migrations` directory in a separate container. Output is written to stdout by default. For convenience, you can also save the schema diff as a new migration file by passing in `-f` flag.

By default, all schemas in the target database are diffed. Use the `--schema public,extensions` flag to restrict diffing to a subset of schemas.

While the diff command is able to capture most schema changes, there are cases where it is known to fail. Currently, this could happen if you schema contains:

- Changes to publication
- Changes to storage buckets
- Views with `security_invoker` attributes

supabase db diff [flags]

# CLI Reference

Checks local database for typing error

Lints local database for schema errors.

Requires the local development stack to be running when linting against the local database. To lint against a remote or self-hosted database, specify the `--linked` or `--db-url` flag respectively.

Runs `plpgsql_check` extension in the local Postgres container to check for errors in all schemas. The default lint level is `warning` and can be raised to error via the `--level` flag.

To lint against specific schemas only, pass in the `--schema` flag.

The `--fail-on` flag can be used to control when the command should exit with a non-zero status code. The possible values are:

- `none` (default): Always exit with a zero status code, regardless of lint results.
- `warning`: Exit with a non-zero status code if any warnings or errors are found.
- `error`: Exit with a non-zero status code only if errors are found.

This flag is particularly useful in CI/CD pipelines where you want to fail the build based on certain lint conditions.

supabase db lint [flags]

# CLI Reference

Starts local Postgres database

supabase db start [flags]

# CLI Reference

Manage database migration scripts

# CLI Reference

Create an empty migration script

Creates a new migration file locally.

A `supabase/migrations` directory will be created if it does not already exists in your current `workdir`. All schema migration files must be created in this directory following the pattern `<timestamp>_<name>.sql`.

Outputs from other commands like `db diff` may be piped to `migration new <name>` via stdin.

supabase migration new <migration name>

# CLI Reference

List local and remote migrations

Lists migration history in both local and remote databases.

Requires your local project to be linked to a remote database by running `supabase link`. For self-hosted databases, you can pass in the connection parameters using `--db-url` flag.

> Note that URL strings must be escaped according to [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986).

Local migrations are stored in `supabase/migrations` directory while remote migrations are tracked in `supabase_migrations.schema_migrations` table. Only the timestamps are compared to identify any differences.

In case of discrepancies between the local and remote migration history, you can resolve them using the `migration repair` command.

supabase migration list [flags]

# CLI Reference

Fetch migration files from history table

supabase migration fetch [flags]

# CLI Reference

Repair the migration history table

Repairs the remote migration history table.

Requires your local project to be linked to a remote database by running `supabase link`.

If your local and remote migration history goes out of sync, you can repair the remote history by marking specific migrations as `--status applied` or `--status reverted`. Marking as `reverted` will delete an existing record from the migration history table while marking as `applied` will insert a new record.

For example, your migration history may look like the table below, with missing entries in either local or remote.

```bash
$ supabase migration list
        LOCAL      │     REMOTE     │     TIME (UTC)
  ─────────────────┼────────────────┼──────────────────────
                   │ 20230103054303 │ 2023-01-03 05:43:03
   20230103054315  │                │ 2023-01-03 05:43:15
```

To reset your migration history to a clean state, first delete your local migration file.

```bash
$ rm supabase/migrations/20230103054315_remote_commit.sql

$ supabase migration list
        LOCAL      │     REMOTE     │     TIME (UTC)
  ─────────────────┼────────────────┼──────────────────────
                   │ 20230103054303 │ 2023-01-03 05:43:03
```

Then mark the remote migration `20230103054303` as reverted.

```bash
$ supabase migration repair 20230103054303 --status reverted
Connecting to remote database...
Repaired migration history: [20220810154537] => reverted
Finished supabase migration repair.

$ supabase migration list
        LOCAL      │     REMOTE     │     TIME (UTC)
  ─────────────────┼────────────────┼──────────────────────
```

Now you can run `db pull` again to dump the remote schema as a local migration file.

```bash
$ supabase db pull
Connecting to remote database...
Schema written to supabase/migrations/20240414044403_remote_schema.sql
Update remote migration history table? [Y/n]
Repaired migration history: [20240414044403] => applied
Finished supabase db pull.

$ supabase migration list
        LOCAL      │     REMOTE     │     TIME (UTC)
  ─────────────────┼────────────────┼──────────────────────
    20240414044403 │ 20240414044403 │ 2024-04-14 04:44:03
```

supabase migration repair [version] ... [flags]

# CLI Reference

Squash migrations to a single file

Squashes local schema migrations to a single migration file.

The squashed migration is equivalent to a schema only dump of the local database after applying existing migration files. This is especially useful when you want to remove repeated modifications of the same schema from your migration history.

However, one limitation is that data manipulation statements, such as insert, update, or delete, are omitted from the squashed migration. You will have to add them back manually in a new migration file. This includes cron jobs, storage buckets, and any encrypted secrets in vault.

By default, the latest `<timestamp>_<name>.sql` file will be updated to contain the squashed migration. You can override the target version using the `--version <timestamp>` flag.

If your `supabase/migrations` directory is empty, running `supabase squash` will do nothing.

supabase migration squash [flags]

# CLI Reference

Apply pending migrations to local database

supabase migration up [flags]

# CLI Reference

Seed a Supabase project from supabase/config.toml

# CLI Reference

Seed buckets declared in [storage.buckets]

supabase seed buckets

# CLI Reference

Tools to inspect your Supabase database

# CLI Reference

Show queries from pg_stat_statements ordered by total times called

This command is much like the `supabase inspect db outliers` command, but ordered by the number of times a statement has been called.

You can use this information to see which queries are called most often, which can potentially be good candidates for optimisation.

```

                        QUERY                      │ TOTAL EXECUTION TIME │ PROPORTION OF TOTAL EXEC TIME │ NUMBER CALLS │  SYNC IO TIME
  ─────────────────────────────────────────────────┼──────────────────────┼───────────────────────────────┼──────────────┼──────────────────
    SELECT * FROM users WHERE id = $1              │ 14:50:11.828939      │ 89.8%                         │  183,389,757 │ 00:00:00.002018
    SELECT * FROM user_events                      │ 01:20:23.466633      │ 1.4%                          │       78,325 │ 00:00:00
    INSERT INTO users (email, name) VALUES ($1, $2)│ 00:40:11.616882      │ 0.8%                          │       54,003 │ 00:00:00.000322

```

supabase inspect db calls

# CLI Reference

Show currently running queries running for longer than 5 minutes

This command displays currently running queries, that have been running for longer than 5 minutes, descending by duration. Very long running queries can be a source of multiple issues, such as preventing DDL statements completing or vacuum being unable to update `relfrozenxid`.

```
  PID  │     DURATION    │                                         QUERY
───────┼─────────────────┼───────────────────────────────────────────────────────────────────────────────────────
 19578 | 02:29:11.200129 | EXPLAIN SELECT  "students".* FROM "students"  WHERE "students"."id" = 1450645 LIMIT 1
 19465 | 02:26:05.542653 | EXPLAIN SELECT  "students".* FROM "students"  WHERE "students"."id" = 1889881 LIMIT 1
 19632 | 02:24:46.962818 | EXPLAIN SELECT  "students".* FROM "students"  WHERE "students"."id" = 1581884 LIMIT 1
```

supabase inspect db long-running-queries

# CLI Reference

Show queries from pg_stat_statements ordered by total execution time

This command displays statements, obtained from `pg_stat_statements`, ordered by the amount of time to execute in aggregate. This includes the statement itself, the total execution time for that statement, the proportion of total execution time for all statements that statement has taken up, the number of times that statement has been called, and the amount of time that statement spent on synchronous I/O (reading/writing from the file system).

Typically, an efficient query will have an appropriate ratio of calls to total execution time, with as little time spent on I/O as possible. Queries that have a high total execution time but low call count should be investigated to improve their performance. Queries that have a high proportion of execution time being spent on synchronous I/O should also be investigated.

```

                 QUERY                   │ EXECUTION TIME   │ PROPORTION OF EXEC TIME │ NUMBER CALLS │ SYNC IO TIME
─────────────────────────────────────────┼──────────────────┼─────────────────────────┼──────────────┼───────────────
 SELECT * FROM archivable_usage_events.. │ 154:39:26.431466 │ 72.2%                   │ 34,211,877   │ 00:00:00
 COPY public.archivable_usage_events (.. │ 50:38:33.198418  │ 23.6%                   │ 13           │ 13:34:21.00108
 COPY public.usage_events (id, reporte.. │ 02:32:16.335233  │ 1.2%                    │ 13           │ 00:34:19.784318
 INSERT INTO usage_events (id, retaine.. │ 01:42:59.436532  │ 0.8%                    │ 12,328,187   │ 00:00:00
 SELECT * FROM usage_events WHERE (alp.. │ 01:18:10.754354  │ 0.6%                    │ 102,114,301  │ 00:00:00
```

supabase inspect db outliers

# CLI Reference

Show queries that are holding locks and the queries that are waiting for them to be released

This command shows you statements that are currently holding locks and blocking, as well as the statement that is being blocked. This can be used in conjunction with `inspect db locks` to determine which statements need to be terminated in order to resolve lock contention.

```
    BLOCKED PID │ BLOCKING STATEMENT           │ BLOCKING DURATION │ BLOCKING PID │ BLOCKED STATEMENT                                                                      │ BLOCKED DURATION
  ──────────────┼──────────────────────────────┼───────────────────┼──────────────┼────────────────────────────────────────────────────────────────────────────────────────┼───────────────────
    253         │ select count(*) from mytable │ 00:00:03.838314   │        13495 │ UPDATE "mytable" SET "updated_at" = '2023─08─03 14:07:04.746688' WHERE "id" = 83719341 │ 00:00:03.821826
```

supabase inspect db blocking

# CLI Reference

Show queries which have taken out an exclusive lock on a relation

This command displays queries that have taken out an exclusive lock on a relation. Exclusive locks typically prevent other operations on that relation from taking place, and can be a cause of "hung" queries that are waiting for a lock to be granted.

If you see a query that is hanging for a very long time or causing blocking issues you may consider killing the query by connecting to the database and running `SELECT pg_cancel_backend(PID);` to cancel the query. If the query still does not stop you can force a hard stop by running `SELECT pg_terminate_backend(PID);`

```
     PID   │ RELNAME │ TRANSACTION ID │ GRANTED │                  QUERY                  │   AGE
  ─────────┼─────────┼────────────────┼─────────┼─────────────────────────────────────────┼───────────
    328112 │ null    │              0 │ t       │ SELECT * FROM logs;                     │ 00:04:20
```

supabase inspect db locks

# CLI Reference

Show information about replication slots on the database

This command shows information about [logical replication slots](https://www.postgresql.org/docs/current/logical-replication.html) that are setup on the database. It shows if the slot is active, the state of the WAL sender process ('startup', 'catchup', 'streaming', 'backup', 'stopping') the replication client address and the replication lag in GB.

This command is useful to check that the amount of replication lag is as low as possible, replication lag can occur due to network latency issues, slow disk I/O, long running transactions or lack of ability for the subscriber to consume WAL fast enough.

```
                       NAME                    │ ACTIVE │ STATE   │ REPLICATION CLIENT ADDRESS │ REPLICATION LAG GB
  ─────────────────────────────────────────────┼────────┼─────────┼────────────────────────────┼─────────────────────
    supabase_realtime_replication_slot         │ t      │ N/A     │ N/A                        │                  0
    datastream                                 │ t      │ catchup │ 24.201.24.106              │                 45
```

supabase inspect db replication-slots

# CLI Reference

Estimates space allocated to a relation that is full of dead tuples

This command displays an estimation of table "bloat" - Due to Postgres' [MVCC](https://www.postgresql.org/docs/current/mvcc.html) when data is updated or deleted new rows are created and old rows are made invisible and marked as "dead tuples". Usually the [autovaccum](https://supabase.com/docs/guides/platform/database-size#vacuum-operations) process will asynchronously clean the dead tuples. Sometimes the autovaccum is unable to work fast enough to reduce or prevent tables from becoming bloated. High bloat can slow down queries, cause excessive IOPS and waste space in your database.

Tables with a high bloat ratio should be investigated to see if there are vacuuming is not quick enough or there are other issues.

```
    TYPE  │ SCHEMA NAME │        OBJECT NAME         │ BLOAT │ WASTE
  ────────┼─────────────┼────────────────────────────┼───────┼─────────────
    table │ public      │ very_bloated_table         │  41.0 │ 700 MB
    table │ public      │ my_table                   │   4.0 │ 76 MB
    table │ public      │ happy_table                │   1.0 │ 1472 kB
    index │ public      │ happy_table::my_nice_index │   0.7 │ 880 kB
```

supabase inspect db bloat

# CLI Reference

Show statistics related to vacuum operations per table

This shows you stats about the vacuum activities for each table. Due to Postgres' [MVCC](https://www.postgresql.org/docs/current/mvcc.html) when data is updated or deleted new rows are created and old rows are made invisible and marked as "dead tuples". Usually the [autovaccum](https://supabase.com/docs/guides/platform/database-size#vacuum-operations) process will aysnchronously clean the dead tuples.

The command lists when the last vacuum and last auto vacuum took place, the row count on the table as well as the count of dead rows and whether autovacuum is expected to run or not. If the number of dead rows is much higher than the row count, or if an autovacuum is expected but has not been performed for some time, this can indicate that autovacuum is not able to keep up and that your vacuum settings need to be tweaked or that you require more compute or disk IOPS to allow autovaccum to complete.

```
        SCHEMA        │              TABLE               │ LAST VACUUM │ LAST AUTO VACUUM │      ROW COUNT       │ DEAD ROW COUNT │ EXPECT AUTOVACUUM?
──────────────────────┼──────────────────────────────────┼─────────────┼──────────────────┼──────────────────────┼────────────────┼─────────────────────
 auth                 │ users                            │             │ 2023-06-26 12:34 │               18,030 │              0 │ no
 public               │ profiles                         │             │ 2023-06-26 23:45 │               13,420 │             28 │ no
 public               │ logs                             │             │ 2023-06-26 01:23 │            1,313,033 │      3,318,228 │ yes
 storage              │ objects                          │             │                  │             No stats │              0 │ no
 storage              │ buckets                          │             │                  │             No stats │              0 │ no
 supabase_migrations  │ schema_migrations                │             │                  │             No stats │              0 │ no

```

supabase inspect db vacuum-stats

# CLI Reference

Generate a CSV output for all inspect commands

supabase inspect report [flags]

# CLI Reference

Manage Supabase organizations

# CLI Reference

Create an organization

Create an organization for the logged-in user.

supabase orgs create

# CLI Reference

List all organizations

List all organizations the logged-in user belongs.

supabase orgs list

# CLI Reference

Manage Supabase projects

Provides tools for creating and managing your Supabase projects.

This command group allows you to list all projects in your organizations, create new projects, delete existing projects, and retrieve API keys. These operations help you manage your Supabase infrastructure programmatically without using the dashboard.

Project management via CLI is especially useful for automation scripts and when you need to provision environments in a repeatable way.

# CLI Reference

Create a project on Supabase

supabase projects create [project name] [flags]

# CLI Reference

List all Supabase projects

List all Supabase projects the logged-in user can access.

supabase projects list

# CLI Reference

List all API keys for a Supabase project

supabase projects api-keys [flags]

# CLI Reference

Delete a Supabase project

supabase projects delete <ref>

# CLI Reference

Manage Supabase project configurations

# CLI Reference

Pushes local config.toml to the linked project

Updates the configurations of a linked Supabase project with the local `supabase/config.toml` file.

This command allows you to manage project configuration as code by defining settings locally and then pushing them to your remote project.

supabase config push

# CLI Reference

Manage Supabase preview branches

# CLI Reference

Create a preview branch

Create a preview branch for the linked project.

supabase branches create [name] [flags]

# CLI Reference

List all preview branches

List all preview branches of the linked project.

supabase branches list

# CLI Reference

Retrieve details of a preview branch

Retrieve details of the specified preview branch.

supabase branches get [branch-id]

# CLI Reference

Update a preview branch

Update a preview branch by its name or ID.

supabase branches update [branch-id] [flags]

# CLI Reference

Delete a preview branch

Delete a preview branch by its name or ID.

supabase branches delete [branch-id]

# CLI Reference

Disable preview branching

Disable preview branching for the linked project.

supabase branches disable

# CLI Reference

Manage Supabase Edge functions

Manage Supabase Edge Functions.

Supabase Edge Functions are server-less functions that run close to your users.

Edge Functions allow you to execute custom server-side code without deploying or scaling a traditional server. They're ideal for handling webhooks, custom API endpoints, data validation, and serving personalized content.

Edge Functions are written in TypeScript and run on Deno compatible edge runtime, which is a secure runtime with no package management needed, fast cold starts, and built-in security.

# CLI Reference

Create a new Function locally

Creates a new Edge Function with boilerplate code in the `supabase/functions` directory.

This command generates a starter TypeScript file with the necessary Deno imports and a basic function structure. The function is created as a new directory with the name you specify, containing an `index.ts` file with the function code.

After creating the function, you can edit it locally and then use `supabase functions serve` to test it before deploying with `supabase functions deploy`.

supabase functions new <Function name>

# CLI Reference

List all Functions in Supabase

List all Functions in the linked Supabase project.

supabase functions list [flags]

# CLI Reference

Download a Function from Supabase

Download the source code for a Function from the linked Supabase project.

supabase functions download <Function name> [flags]

# CLI Reference

Serve all Functions locally

Serve all Functions locally.

`supabase functions serve` command includes additional flags to assist developers in debugging Edge Functions via the v8 inspector protocol, allowing for debugging via Chrome DevTools, VS Code, and IntelliJ IDEA for example. Refer to the [docs guide](/docs/guides/functions/debugging-tools) for setup instructions.

1. `--inspect`

   - Alias of `--inspect-mode brk`.

2. `--inspect-mode [ run | brk | wait ]`

   - Activates the inspector capability.
   - `run` mode simply allows a connection without additional behavior. It is not ideal for short scripts, but it can be useful for long-running scripts where you might occasionally want to set breakpoints.
   - `brk` mode same as `run` mode, but additionally sets a breakpoint at the first line to pause script execution before any code runs.
   - `wait` mode similar to `brk` mode, but instead of setting a breakpoint at the first line, it pauses script execution until an inspector session is connected.

3. `--inspect-main`
   - Can only be used when one of the above two flags is enabled.
   - By default, creating an inspector session for the main worker is not allowed, but this flag allows it.
   - Other behaviors follow the `inspect-mode` flag mentioned above.

Additionally, the following properties can be customized via `supabase/config.toml` under `edge_runtime` section.

1. `inspector_port`
   - The port used to listen to the Inspector session, defaults to 8083.
2. `policy`
   - A value that indicates how the edge-runtime should forward incoming HTTP requests to the worker.
   - `per_worker` allows multiple HTTP requests to be forwarded to a worker that has already been created.
   - `oneshot` will force the worker to process a single HTTP request and then exit. (Debugging purpose, This is especially useful if you want to reflect changes you've made immediately.)

supabase functions serve [flags]

# CLI Reference

Deploy a Function to Supabase

Deploy a Function to the linked Supabase project.

supabase functions deploy [Function name] [flags]

# CLI Reference

Delete a Function from Supabase

Delete a Function from the linked Supabase project. This does NOT remove the Function locally.

supabase functions delete <Function name> [flags]

# CLI Reference

Manage Supabase secrets

Provides tools for managing environment variables and secrets for your Supabase project.

This command group allows you to set, unset, and list secrets that are securely stored and made available to Edge Functions as environment variables.

Secrets management through the CLI is useful for:

- Setting environment-specific configuration
- Managing sensitive credentials securely

Secrets can be set individually or loaded from .env files for convenience.

# CLI Reference

Set a secret(s) on Supabase

Set a secret(s) to the linked Supabase project.

supabase secrets set <NAME=VALUE> ... [flags]

# CLI Reference

List all secrets on Supabase

List all secrets in the linked project.

supabase secrets list

# CLI Reference

Unset a secret(s) on Supabase

Unset a secret(s) from the linked Supabase project.

supabase secrets unset [NAME] ...

# CLI Reference

Manage Supabase Storage objects

# CLI Reference

List objects by path prefix

supabase storage ls [path] [flags]

# CLI Reference

Copy objects from src to dst path

supabase storage cp <src> <dst> [flags]

# CLI Reference

Move objects from src to dst path

supabase storage mv <src> <dst> [flags]

# CLI Reference

Remove objects by file path

supabase storage rm <file> ... [flags]

# CLI Reference

Manage encryption keys of Supabase projects

# CLI Reference

Get the root encryption key of a Supabase project

supabase encryption get-root-key

# CLI Reference

Update root encryption key of a Supabase project

supabase encryption update-root-key

# CLI Reference

Manage Single Sign-On (SSO) authentication for projects

# CLI Reference

Add a new SSO identity provider

Add and configure a new connection to a SSO identity provider to your Supabase project.

supabase sso add [flags]

# CLI Reference

List all SSO identity providers for a project

List all connections to a SSO identity provider to your Supabase project.

supabase sso list

# CLI Reference

Show information about an SSO identity provider

Provides the information about an established connection to an identity provider. You can use --metadata to obtain the raw SAML 2.0 Metadata XML document stored in your project's configuration.

supabase sso show <provider-id> [flags]

# CLI Reference

Returns the SAML SSO settings required for the identity provider

Returns all of the important SSO information necessary for your project to be registered with a SAML 2.0 compatible identity provider.

supabase sso info

# CLI Reference

Update information about an SSO identity provider

Update the configuration settings of a already added SSO identity provider.

supabase sso update <provider-id> [flags]

# CLI Reference

Remove an existing SSO identity provider

Remove a connection to an already added SSO identity provider. Removing the provider will prevent existing users from logging in. Please treat this command with care.

supabase sso remove <provider-id>

# CLI Reference

Manage custom domain names for Supabase projects

Manage custom domain names for Supabase projects.

Use of custom domains and vanity subdomains is mutually exclusive.

# CLI Reference

Activate the custom hostname for a project

Activates the custom hostname configuration for a project.

This reconfigures your Supabase project to respond to requests on your custom hostname.

After the custom hostname is activated, your project's third-party auth providers will no longer function on the Supabase-provisioned subdomain. Please refer to [Prepare to activate your domain](/docs/guides/platform/custom-domains#prepare-to-activate-your-domain) section in our documentation to learn more about the steps you need to follow.

supabase domains activate

# CLI Reference

Create a custom hostname

Create a custom hostname for your Supabase project.

Expects your custom hostname to have a CNAME record to your Supabase project's subdomain.

supabase domains create [flags]

# CLI Reference

Get the current custom hostname config

Retrieve the custom hostname config for your project, as stored in the Supabase platform.

supabase domains get

# CLI Reference

Re-verify the custom hostname config for your project

supabase domains reverify

# CLI Reference

Deletes the custom hostname config for your project

supabase domains delete

# CLI Reference

Manage vanity subdomains for Supabase projects

Manage vanity subdomains for Supabase projects.

Usage of vanity subdomains and custom domains is mutually exclusive.

# CLI Reference

Activate a vanity subdomain

Activate a vanity subdomain for your Supabase project.

This reconfigures your Supabase project to respond to requests on your vanity subdomain.
After the vanity subdomain is activated, your project's auth services will no longer function on the {project-ref}.{supabase-domain} hostname.

supabase vanity-subdomains activate [flags]

# CLI Reference

Get the current vanity subdomain

supabase vanity-subdomains get

# CLI Reference

Checks if a desired subdomain is available for use

supabase vanity-subdomains check-availability [flags]

# CLI Reference

Deletes a project's vanity subdomain

Deletes the vanity subdomain for a project, and reverts to using the project ref for routing.

supabase vanity-subdomains delete

# CLI Reference

Manage network bans

Network bans are IPs that get temporarily blocked if their traffic pattern looks abusive (e.g. multiple failed auth attempts).

The subcommands help you view the current bans, and unblock IPs if desired.

# CLI Reference

Get the current network bans

supabase network-bans get

# CLI Reference

Remove a network ban

supabase network-bans remove [flags]

# CLI Reference

Manage network restrictions

# CLI Reference

Get the current network restrictions

supabase network-restrictions get

# CLI Reference

Update network restrictions

supabase network-restrictions update [flags]

# CLI Reference

Manage SSL enforcement configuration

# CLI Reference

Get the current SSL enforcement configuration

supabase ssl-enforcement get

# CLI Reference

Update SSL enforcement configuration

supabase ssl-enforcement update [flags]

# CLI Reference

Manage Postgres database config

# CLI Reference

Get the current Postgres database config overrides

supabase postgres-config get

# CLI Reference

Update Postgres database config

Overriding the default Postgres config could result in unstable database behavior.
Custom configuration also overrides the optimizations generated based on the compute add-ons in use.

supabase postgres-config update [flags]

# CLI Reference

Delete specific Postgres database config overrides

Delete specific config overrides, reverting them to their default values.

supabase postgres-config delete [flags]

# CLI Reference

Manage Supabase SQL snippets

# CLI Reference

List all SQL snippets

List all SQL snippets of the linked project.

supabase snippets list

# CLI Reference

Download contents of a SQL snippet

Download contents of the specified SQL snippet.

supabase snippets download <snippet-id>

# CLI Reference

Show versions of all Supabase services

supabase services

# CLI Reference

Generate the autocompletion script for the specified shell

Generate the autocompletion script for supabase for the specified shell.
See each sub-command's help for details on how to use the generated script.

# CLI Reference

Generate the autocompletion script for zsh

Generate the autocompletion script for the zsh shell.

If shell completion is not already enabled in your environment you will need
to enable it. You can execute the following once:

    echo "autoload -U compinit; compinit" >> ~/.zshrc

To load completions in your current shell session:

    source <(supabase completion zsh)

To load completions for every new session, execute once:

#### Linux:

    supabase completion zsh > "${fpath[1]}/_supabase"

#### macOS:

    supabase completion zsh > $(brew --prefix)/share/zsh/site-functions/_supabase

You will need to start a new shell for this setup to take effect.

supabase completion zsh [flags]

# CLI Reference

Generate the autocompletion script for powershell

Generate the autocompletion script for powershell.

To load completions in your current shell session:

    supabase completion powershell | Out-String | Invoke-Expression

To load completions for every new session, add the output of the above command
to your powershell profile.

supabase completion powershell [flags]

# CLI Reference

Generate the autocompletion script for fish

Generate the autocompletion script for the fish shell.

To load completions in your current shell session:

    supabase completion fish | source

To load completions for every new session, execute once:

    supabase completion fish > ~/.config/fish/completions/supabase.fish

You will need to start a new shell for this setup to take effect.

supabase completion fish [flags]

# CLI Reference

Generate the autocompletion script for bash

Generate the autocompletion script for the bash shell.

This script depends on the 'bash-completion' package.
If it is not installed already, you can install it via your OS's package manager.

To load completions in your current shell session:

    source <(supabase completion bash)

To load completions for every new session, execute once:

#### Linux:

    supabase completion bash > /etc/bash_completion.d/supabase

#### macOS:

    supabase completion bash > $(brew --prefix)/etc/bash_completion.d/supabase

You will need to start a new shell for this setup to take effect.

supabase completion bash
