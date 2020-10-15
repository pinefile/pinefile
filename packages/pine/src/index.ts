import yargs from 'yargs';
import { flattenArray } from './utils';
import { findFile } from './file';
import help from './help';
import * as logger from './log';

type PackageType = {
  pine: {
    [key: string]: any;
  };
};

const _before = {};
const _after = {};
let _module: any = {};

/**
 * Load custom package.json config.
 *
 * @param {object} pkg
 */
const loadPkgConf = (pkg?: PackageType): void => {
  if (!pkg) return;
  const pine =
    typeof pkg.pine === 'object' && !Array.isArray(pkg.pine) ? pkg.pine : {};
  const req = ((Array.isArray(pine.require)
    ? pine.require
    : [pine.require]) as Array<string>).filter((r) => r);
  req.map((r) => require(findFile(r)));
};

/**
 * Register task that should be runned before a task.
 *
 * Example
 *   before('build', 'compile', 'write')
 *   before('build', ['compile', 'write'])
 */
export const before = (...args: any[]): void => {
  const before = args[0];
  const after = Array.prototype.slice.call(args, 1);

  if (!_before[before]) {
    _before[before] = [];
  }

  _before[before] = _before[before].concat(flattenArray(after));
  _before[before] = [...Array.from(new Set(_before[before]))];
};

/**
 * Register task that should be runned after a task.
 *
 * Example
 *   after('build', 'publish', 'log')
 *   after('build', ['publish', 'log'])
 */
export const after = (...args: any[]): void => {
  const after = args[0];
  const before = Array.prototype.slice.call(args, 1);

  if (!_after[after]) {
    _after[after] = [];
  }

  _after[after] = _after[after].concat(flattenArray(before));
  _after[after] = [...Array.from(new Set(_after[after]))];
};

/**
 * Execute task.
 *
 * @param {string} name
 * @param {object} args
 */
const execute = async (name: string, args: any): Promise<void> => {
  if (_before[name]) {
    _before[name].forEach((name: string) => execute(name, args));
  }

  if (_module[name]) {
    const startTime = Date.now();
    logger.log(`Starting ${log.color.cyan(`'${name}'`)}`);
    await _module[name](args);
    const time = Date.now() - startTime;
    logger.log(
      `Finished ${log.color.cyan(`'${name}'`)} after ${log.color.magenta(
        time + 'ms'
      )}`
    );
  }

  if (_after[name]) {
    _after[name].forEach((name: string) => execute(name, args));
  }
};

/**
 * Run tasks or show help.
 *
 * @param {array} argv
 */
export const run = (argv: Array<any>): void => {
  const args = yargs.options({
    help: { type: 'boolean', default: false },
    file: { type: 'string', default: '' },
  }).parse(argv);
  const name = args._.shift();

  if (args.help) {
    help();
    return;
  }

  const _file = findFile(args.file);

  try {
    // eslint-disable-next-line
    const pkg = require(findFile('package.json'));
    loadPkgConf(pkg);
  } catch (err) {}

  try {
    // eslint-disable-next-line
    _module = require(_file);
  } catch (err) {
    logger.error(err);
    return;
  }

  if (!_module) {
    logger.error('Pinefile not found');
    return;
  }

  if (!name) {
    logger.error('No task provided');
    return;
  }

  if (!_module[name]) {
    logger.error(`Task ${log.color.cyan(`'${name}'`)} not found`);
    return;
  }

  execute(name, args);
};

export * from './plugins/file';
export * from './plugins/shell';
export const log = logger;