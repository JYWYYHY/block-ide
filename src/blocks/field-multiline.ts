import * as Blockly from 'blockly/core';
import { FieldMultilineInput } from '@blockly/field-multilineinput';

export function registerMultilineField() {
  Blockly.fieldRegistry.register('field_multilineinput', FieldMultilineInput);
}