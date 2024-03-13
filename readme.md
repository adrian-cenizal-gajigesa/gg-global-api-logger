A package library that injects to HTTP client and logs all the external calls into a database.

Parameters
- Database provider. i.e for Postgres 'pg'
- SQL URL. This contains the url and credentials of the database connection
- Service Name, to indicate which service logs from on the table `gg_be_external_calls`
- Ignored URLs, if any url match provided strings will be ignored on logging

httpLogger('pg', SQL_URL, 'SERVICE-NAME', ['google.com'])


Sample Usage
```
import httpLogger from '@gajigesa/gg-global-api-logger';

...

httpLogger('pg', process.env.PSQL_URL || '', 'gg-core', ['gajigesa-infra.com'])

```

Publishing the package
- yarn config set NPM_CONFIG_TOKEN YOUR-GITHUB-TOKEN
- yarn publish
