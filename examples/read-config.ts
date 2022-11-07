import {join as pathJoin} from 'path';
import ApplicationConfiguration from '../src';

const appConfig = new ApplicationConfiguration();
appConfig.load(pathJoin(__dirname, 'config'));

console.log(appConfig.toYaml());

console.log(appConfig.query('server.port'));
