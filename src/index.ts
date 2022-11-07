import {join as pathJoin} from 'path';
import {existsSync, readdirSync, readFileSync, statSync, writeFileSync} from 'fs';
import {parse as parseYaml, stringify as stringifyYaml} from 'yaml';
import('merge-anything');
import jsonata from 'jsonata';
import {merge} from 'merge-anything';

interface IPathDetails
{
    fileName: string,
    path: string,
    weight: number
}

class ApplicationConfiguration
{
    config: Record<string, any>;
    private configStore: string;

    constructor()
    {
        this.config = {};
        this.configStore = '';
    }

    getEnv()
    {
        return process.env['NODE_ENV'] || 'development';
    }

    load(path: string)
    {
        if (!existsSync(path))
        {
            throw new Error('Path not found');
        }

        if (!statSync(path).isDirectory())
        {
            throw new Error('Config store must be a folder');
        }

        this.configStore = path || 'config';

        const files = readdirSync(path)
            .filter((el: string) => el.startsWith('default') || el.startsWith('local') || el.startsWith(this.getEnv()))
            .map((el: string) =>
            {
                const fileName = el.replace(/(\..+$)/gi, '');

                const getWeight = (): number =>
                {
                    if (fileName.toLowerCase() === 'default')
                    {
                        return 1;
                    }

                    if (fileName.toLowerCase() === 'local')
                    {
                        return 2;
                    }

                    return 3;
                };
                return {
                    fileName: el,
                    path: pathJoin(path, el),
                    weight: getWeight()
                };
            });

        //order of loading
        files.sort(({weight: sourceWeight}: IPathDetails, {weight: tarfgetWeight}: IPathDetails) => sourceWeight - tarfgetWeight);

        for (const configFile of files)
        {
            const {path: configPath} = configFile;

            const raw = readFileSync(configPath, 'utf8');
            if (configPath.toLowerCase().match(/(\.json$)/gi))
            {
                try
                {
                    const doc = JSON.parse(raw);
                    this.update(doc);
                }
                catch (e: any)
                {
                    throw new Error(e.message);
                }
            }

            if (configPath.toLowerCase().match(/(\.yaml$)|(\.yml$)/gi))
            {
                try
                {
                    const doc = parseYaml(raw);
                    this.update(doc);
                }
                catch (e: any)
                {
                    throw new Error(e.message);
                }
            }

        }
    }

    update<T>(data: Partial<T>)
    {
        this.config = merge(this.config, data);
    }

    /**
     * Stringify the config as a JSON document
     */
    toJson()
    {
        return JSON.stringify(this.config);
    }

    /**
     * Stringify the config as a YAML document
     */
    toYaml()
    {
        return stringifyYaml(this.config);
    }

    save(format?: string)
    {
        if (!format)
        {
            const configPath = pathJoin(this.configStore, `${this.getEnv()}.yaml`);
            writeFileSync(configPath, this.toYaml(), 'utf8');
            return;
        }

        if (format.toLowerCase() === 'yaml')
        {
            this.save();
            return;
        }

        if (format.toLowerCase() === 'json')
        {
            const configPath = pathJoin(this.configStore, `${this.getEnv()}.json`);
            writeFileSync(configPath, this.toJson(), 'utf8');
        }
    }

    query(path: string)
    {
        return jsonata(path).evaluate(this.config);
    }
}

export default ApplicationConfiguration;