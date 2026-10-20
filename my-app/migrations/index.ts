import * as migration_20261014_172117_initial from './20261014_172117_initial';
import * as migration_20261020_111405_rate_limits from './20261020_111405_rate_limits';

export const migrations = [
  {
    up: migration_20261014_172117_initial.up,
    down: migration_20261014_172117_initial.down,
    name: '20261014_172117_initial',
  },
  {
    up: migration_20261020_111405_rate_limits.up,
    down: migration_20261020_111405_rate_limits.down,
    name: '20261020_111405_rate_limits'
  },
];
