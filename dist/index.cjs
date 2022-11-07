'use strict';

var path = require('path');
var fs = require('fs');
var yaml = require('yaml');
var jsonata = require('jsonata');
var mergeAnything = require('merge-anything');

import('merge-anything');
class ApplicationConfiguration {
    constructor() {
        this.config = {};
        this.configStore = '';
    }
    getEnv() {
        return process.env['NODE_ENV'] || 'development';
    }
    load(path$1) {
        if (!fs.existsSync(path$1)) {
            throw new Error('Path not found');
        }
        if (!fs.statSync(path$1).isDirectory()) {
            throw new Error('Config store must be a folder');
        }
        this.configStore = path$1 || 'config';
        const files = fs.readdirSync(path$1)
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
                path: path.join(path$1, el),
                weight: getWeight()
            };
        });
        //order of loading
        files.sort(({ weight: sourceWeight }, { weight: tarfgetWeight }) => sourceWeight - tarfgetWeight);
        for (const configFile of files) {
            const { path: configPath } = configFile;
            const raw = fs.readFileSync(configPath, 'utf8');
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
                    const doc = yaml.parse(raw);
                    this.update(doc);
                }
                catch (e) {
                    throw new Error(e.message);
                }
            }
        }
    }
    update(data) {
        this.config = mergeAnything.merge(this.config, data);
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
        return yaml.stringify(this.config);
    }
    save(format) {
        if (!format) {
            const configPath = path.join(this.configStore, `${this.getEnv()}.yaml`);
            fs.writeFileSync(configPath, this.toYaml(), 'utf8');
            return;
        }
        if (format.toLowerCase() === 'yaml') {
            this.save();
            return;
        }
        if (format.toLowerCase() === 'json') {
            const configPath = path.join(this.configStore, `${this.getEnv()}.json`);
            fs.writeFileSync(configPath, this.toJson(), 'utf8');
        }
    }
    query(path) {
        return jsonata(path).evaluate(this.config);
    }
}

module.exports = ApplicationConfiguration;
