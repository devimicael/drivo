import type { Options } from '@node-rs/argon2';

/** Mesmo custo Argon2id no cadastro e na alteração de senha. */
export const ARGON2_OPTIONS: Options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};
