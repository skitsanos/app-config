import { join } from 'path';
import { existsSync, statSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import jsonata from 'jsonata';
import { merge } from 'merge-anything';

import('merge-anything');
class ApplicationConfiguration {
    constructor() {
        this.config = {};
        this.configStore = '';
    }
    getEnv() {
        return process.env['NODE_ENV'] || 'development';
    }
    load(path) {
        if (!existsSync(path)) {
            throw new Error('Path not found');
        }
        if (!statSync(path).isDirectory()) {
            throw new Error('Config store must be a folder');
        }
        this.configStore = path || 'config';
        const files = readdirSync(path)
            .filter((el) => el.startsWith('default') || el.startsWith('local') || el.startsWith(this.getEnv()))
            .map((el) => {
            const fileName = el.replace(/(\..+$)/gi, '');
            const getWeight = () => {
                if (fileName.toLowerCase() === 'default') {
                    return 1;
                }
                if (fileName.toLowerCase() === 'local') {
                    return 2;
                }
                return 3;
            };
            return {
                fileName: el,
                path: join(path, el),
                weight: getWeight()
            };
        });
        //order of loading
        files.sort(({ weight: sourceWeight }, { weight: tarfgetWeight }) => sourceWeight - tarfgetWeight);
        for (const configFile of files) {
            const { path: configPath } = configFile;
            const raw = readFileSync(configPath, 'utf8');
            if (configPath.toLowerCase().match(/(\.json$)/gi)) {
                try {
                    const doc = JSON.parse(raw);
                    this.update(doc);
                }
                catch (e) {
                    throw new Error(e.message);
                }
            }
            if (configPath.toLowerCase().match(/(\.yaml$)|(\.yml$)/gi)) {
                try {
                    const doc = parse(raw);
                    this.update(doc);
                }
                catch (e) {
                    throw new Error(e.message);
                }
            }
        }
    }
    update(data) {
        this.config = merge(this.config, data);
    }
    /**
     * Stringify the config as a JSON document
     */
    toJson() {
        return JSON.stringify(this.config);
    }
    /**
     * Stringify the config as a YAML document
     */
    toYaml() {
        return stringify(this.config);
    }
    save(format) {
        if (!format) {
            const configPath = join(this.configStore, `${this.getEnv()}.yaml`);
            writeFileSync(configPath, this.toYaml(), 'utf8');
            return;
        }
        if (format.toLowerCase() === 'yaml') {
            this.save();
            return;
        }
        if (format.toLowerCase() === 'json') {
            const configPath = join(this.configStore, `${this.getEnv()}.json`);
            writeFileSync(configPath, this.toJson(), 'utf8');
        }
    }
    query(path) {
        return jsonata(path).evaluate(this.config);
    }
}

export { ApplicationConfiguration as default };
