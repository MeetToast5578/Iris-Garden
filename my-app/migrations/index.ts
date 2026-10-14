import * as migration_20261014_172117_initial from './20261014_172117_initial';

export const migrations = [
  {
    up: migration_20261014_172117_initial.up,
    down: migration_20261014_172117_initial.down,
    name: '20261014_172117_initial'
  },
];
