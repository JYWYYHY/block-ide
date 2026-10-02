import { registerCoreBlocks } from './core';
import { registerMathBlocks } from './math';
import { registerStringBlocks } from './string';
import { registerArrayBlocks } from './array';
import { registerFunctionBlocks } from './function';
import { registerMultilineField } from './field-multiline';
import { registerIoBlocks } from './io';
import { registerObjectBlocks } from './object';
import { registerDatetimeBlocks } from './datetime';

export function registerAllBlocks() {
  registerMultilineField();
  registerCoreBlocks();
  registerMathBlocks();
  registerStringBlocks();
  registerArrayBlocks();
  registerFunctionBlocks();
  registerIoBlocks();
  registerObjectBlocks();
  registerDatetimeBlocks();
}