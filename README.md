# app-config

Lightweight Application Configuration Utility with support of JSON and YAML configs

## Loading order

1. default.[json|yaml]
2. local.[json|yaml]
3. _{env}_.[json|yaml]

ApplicationConfiguration configuration, after loading _default_ and _local_ configs, will check `NODE_ENV` and load config related to that environment. If there is no `NODE_ENV` provided, it will assume that it is `development`.

### Reading configuration 
```ts
import {join as pathJoin} from 'path';
import ApplicationConfiguration from '@skitsanos/app-config';

const config = new ApplicationConfiguration();
config.load(pathJoin(__dirname, '../config'));

console.log(config.toYaml());
```

### Saving configuration

```ts
config.save();
```

By default configuration format for saving is YAML, so the line below will convert your configuration into YAML formatted string and store it into `{env}.yaml` file within the configuration folder.

If you want to save your config in JSON format, it can be done in the following way:

```ts
config.save('json');
```

### Helper methods

- `toJson()` - returns JSON formatted string,
- `toYaml()` - returns YAML formatted string,
- `getEnv()` - checks `NODE_ENV` for the environment and returns `development` if the environment was not set
- `get()` - returns the current configuration object.