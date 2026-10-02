import { registerCoreBlocks } from './core';
import { registerMathBlocks } from './math';
import { registerStringBlocks } from './string';
import { registerArrayBlocks } from './array';
import { registerFunctionBlocks } from './function';

export function registerAllBlocks() {
  registerCoreBlocks();
  registerMathBlocks();
  registerStringBlocks();
  registerArrayBlocks();
  registerFunctionBlocks();
}