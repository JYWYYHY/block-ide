import { registerCoreBlocks } from './core';
import { registerMathBlocks } from './math';
import { registerStringBlocks } from './string';
import { registerArrayBlocks } from './array';
import { registerFunctionBlocks } from './function';
import { registerMultilineField } from './field-multiline';

export function registerAllBlocks() {
  registerMultilineField();
  registerCoreBlocks();
  registerMathBlocks();
  registerStringBlocks();
  registerArrayBlocks();
  registerFunctionBlocks();
}