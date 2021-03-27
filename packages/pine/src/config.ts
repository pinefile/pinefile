import path from 'path';
import dotenv from 'dotenv';
import { isObject } from '@pinefile/utils';
import { ConfigType, ConfigFunctionType } from './types';

let config: ConfigType = {
  dotenv: [],
  env: {},
  options: {},
  path: '',
};

const loadDotenv = (config: ConfigType) => {
  if (!Array.isArray(config.dotenv)) {
    return;
  }

  if (!config.path && config.dotenv.length) {
    throw new Error("Config path shouldn't be empty");
  }

  config.dotenv.forEach((file, i) => {
    dotenv.config({
      path: `${path.join(config.path, file)}`,
    });
    delete config.dotenv[i];
  });
};

const setEnvironment = (config: ConfigType) => {
  if (!isObject(config.env)) {
    return;
  }

  for (const key in config.env) {
    // use the same conditional to set env var as dotenv does
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key.toUpperCase()] = config.env[key];
    }
  }
};

export const getConfig = (): ConfigType => {
  return config;
};

export const configure = (
  newConfig: Partial<ConfigType> | ConfigFunctionType
): ConfigType => {
  if (typeof newConfig === 'function') {
    newConfig = newConfig(config);
  }

  config = {
    ...config,
    ...(isObject(newConfig) ? newConfig : {}),
  };

  loadDotenv(config);
  setEnvironment(config);

  return config;
};
