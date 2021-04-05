import yargs, { Arguments as YArguments, Options as YOptions } from 'yargs';
import { isObject } from '@pinefile/utils';
import { findDirname } from './file';
import { getConfig } from './config';

export type ArgumentsType = {
  [key in keyof YArguments<any>]: YArguments<any>[key];
};

const defaultOptions: OptionsType = {
  help: {
    type: 'boolean',
    default: false,
    desc: 'Print help and available tasks',
  },
  file: {
    type: 'string',
    default: '',
    desc: 'Path to Pipefile or pipefile.js',
  },
  noDotenv: {
    type: 'boolean',
    default: false,
    desc: 'Disabling auto load of .env',
  },
  noColor: {
    type: 'boolean',
    default: false,
    desc: 'Disabling of color',
  },
  logLevel: {
    type: 'boolean',
    default: 'info',
    desc: 'Set log level: info | warn | error | silent.',
  },
  require: {
    type: 'array',
    default: [],
    desc: 'Packages to preload before Pinefile is loaded',
  },
};

export type OptionsType = {
  [key: string]: YOptions;
};

export const options = (): OptionsType => {
  const conf = getConfig();
  return {
    ...defaultOptions,
    ...(isObject(conf.options) ? conf.options : {}),
  };
};

export const parse = (argv: any[], opts?: OptionsType): ArgumentsType => {
  return yargs
    .parserConfiguration({
      // https://github.com/yargs/yargs/issues/1011
      'boolean-negation': false,
    })
    .help(false)
    .options(opts ? opts : options())
    .pkgConf('pine', findDirname('package.json'))
    .parse(argv);
};
