import * as acorn from 'acorn';
import type { Node } from 'acorn';

/**
 * 把 JS 代码解析成 Blockly 积木块的 JSON 结构。
 */

export interface BlockJson {
  type: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  next?: { block: BlockJson };
}

export interface WorkspaceJson {
  blocks: {
    languageVersion: 0;
    blocks: BlockJson[];
  };
}

export function parseJsToBlocks(code: string): {
  json: WorkspaceJson;
  warnings: string[];
} {
  const warnings: string[] = [];
  let program: acorn.Program;

  try {
    program = acorn.parse(code, {
      ecmaVersion: 2022,
      sourceType: 'module',
      allowReturnOutsideFunction: true,
    });
  } catch (e) {
    warnings.push('代码整体无法解析，已作为原生 JS 块保留');
    return {
      json: wrapAllInRaw(code),
      warnings,
    };
  }

  const blocks: BlockJson[] = [];
  for (const stmt of program.body) {
    const b = translateStatement(stmt, code, warnings);
    if (b) blocks.push(b);
  }

  for (let i = 0; i < blocks.length - 1; i++) {
    blocks[i].next = { block: blocks[i + 1] };
  }

  return {
    json: {
      blocks: {
        languageVersion: 0,
        blocks: blocks.length ? [blocks[0]] : [],
      },
    },
    warnings,
  };
}

// ============================================================
// 语句翻译
// ============================================================

function translateStatement(
  node: Node,
  source: string,
  warnings: string[],
): BlockJson | null {
  switch (node.type) {
    case 'VariableDeclaration': {
      const decl = node as acorn.VariableDeclaration;
      if (decl.declarations.length !== 1) {
        return rawBlock(source, node, warnings, '多个变量同时声明');
      }
      const d = decl.declarations[0];
      if (d.id.type !== 'Identifier') {
        return rawBlock(source, node, warnings, '解构声明');
      }
      return {
        type: 'js_let',
        fields: { NAME: (d.id as acorn.Identifier).name },
        inputs: {
          VALUE: {
            block: translateExpression(d.init as Node | null, source, warnings),
          },
        },
      };
    }

    case 'ExpressionStatement': {
      const expr = (node as acorn.ExpressionStatement).expression;
      return translateExpressionStatement(expr, source, warnings);
    }

    case 'IfStatement': {
      const st = node as acorn.IfStatement;
      const cond = translateExpression(st.test, source, warnings);
      const doBlock = translateBlockBody(st.consequent, source, warnings);

      if (st.alternate) {
        const elseBlock = translateBlockBody(st.alternate, source, warnings);
        return {
          type: 'js_if_else',
          inputs: {
            COND: { block: cond },
            DO: { block: doBlock ?? undefined },
            ELSE: { block: elseBlock ?? undefined },
          },
        };
      }
      return {
        type: 'js_if',
        inputs: {
          COND: { block: cond },
          DO: { block: doBlock ?? undefined },
        },
      };
    }

    case 'ForStatement': {
      const f = node as acorn.ForStatement;
      if (
        f.init?.type === 'VariableDeclaration' &&
        f.test?.type === 'BinaryExpression' &&
        f.update?.type === 'UpdateExpression'
      ) {
        const decl = f.init.declarations[0];
        if (decl.id.type === 'Identifier') {
          const varName = (decl.id as acorn.Identifier).name;
          const from = translateExpression(decl.init as Node, source, warnings);
          const to = translateExpression(
            (f.test as acorn.BinaryExpression).right,
            source,
            warnings,
          );
          const body = translateBlockBody(f.body, source, warnings);
          return {
            type: 'js_for',
            fields: { VAR: varName },
            inputs: {
              FROM: { block: from },
              TO: { block: to },
              DO: { block: body ?? undefined },
            },
          };
        }
      }
      return rawBlock(source, node, warnings, '复杂 for 循环');
    }

    case 'WhileStatement': {
      const w = node as acorn.WhileStatement;
      return {
        type: 'js_while',
        inputs: {
          COND: { block: translateExpression(w.test, source, warnings) },
          DO: { block: translateBlockBody(w.body, source, warnings) ?? undefined },
        },
      };
    }

    case 'ReturnStatement': {
      const r = node as acorn.ReturnStatement;
      return {
        type: 'js_return',
        inputs: {
          VAL: {
            block: r.argument
              ? translateExpression(r.argument, source, warnings)
              : emptyValue(),
          },
        },
      };
    }

    case 'FunctionDeclaration': {
      const fn = node as acorn.FunctionDeclaration;
      if (!fn.id) return rawBlock(source, node, warnings, '匿名函数');
      const params = fn.params
        .map((p) => (p.type === 'Identifier' ? p.name : null))
        .filter(Boolean)
        .join(', ');
      const body = translateBlockBody(fn.body, source, warnings);
      return {
        type: 'js_func_def',
        fields: { NAME: fn.id.name, PARAMS: params },
        inputs: { DO: { block: body ?? undefined } },
      };
    }

    default:
      return rawBlock(source, node, warnings, node.type);
  }
}

function translateExpressionStatement(
  expr: Node,
  source: string,
  warnings: string[],
): BlockJson | null {
  if (
    expr.type === 'CallExpression' &&
    (expr as acorn.CallExpression).callee.type === 'MemberExpression'
  ) {
    const call = expr as acorn.CallExpression;
    const callee = call.callee as acorn.MemberExpression;
    if (
      callee.object.type === 'Identifier' &&
      (callee.object as acorn.Identifier).name === 'console' &&
      callee.property.type === 'Identifier' &&
      (callee.property as acorn.Identifier).name === 'log'
    ) {
      const arg = call.arguments[0];
      return {
        type: 'js_log',
        inputs: {
          VAL: {
            block: arg ? translateExpression(arg, source, warnings) : emptyValue(),
          },
        },
      };
    }
  }

  if (expr.type === 'AssignmentExpression') {
    const a = expr as acorn.AssignmentExpression;
    if (a.operator === '=' && a.left.type === 'Identifier') {
      return {
        type: 'js_set',
        fields: { NAME: (a.left as acorn.Identifier).name },
        inputs: {
          VALUE: { block: translateExpression(a.right, source, warnings) },
        },
      };
    }
  }

  if (expr.type === 'CallExpression') {
    const call = expr as acorn.CallExpression;
    if (call.callee.type === 'Identifier') {
      return {
        type: 'js_func_call',
        fields: { NAME: (call.callee as acorn.Identifier).name },
        inputs: {
          A1: call.arguments[0]
            ? { block: translateExpression(call.arguments[0], source, warnings) }
            : undefined,
          A2: call.arguments[1]
            ? { block: translateExpression(call.arguments[1], source, warnings) }
            : undefined,
          A3: call.arguments[2]
            ? { block: translateExpression(call.arguments[2], source, warnings) }
            : undefined,
        },
      };
    }
  }

  return rawBlock(source, expr, warnings, expr.type);
}

// ============================================================
// 表达式翻译（关键：这里用 rawBlockExpr 而非 rawBlock）
// ============================================================

function translateExpression(
  node: Node | null | undefined,
  source: string,
  warnings: string[],
): BlockJson {
  if (!node) return emptyValue();

  switch (node.type) {
    case 'Literal': {
      const lit = node as acorn.Literal;
      if (typeof lit.value === 'number') {
        return { type: 'js_number', fields: { VAL: lit.value } };
      }
      if (typeof lit.value === 'string') {
        return { type: 'js_text', fields: { VAL: lit.value } };
      }
      if (typeof lit.value === 'boolean') {
        return { type: 'js_boolean', fields: { VAL: String(lit.value) } };
      }
      return rawBlockExpr(source, node, warnings, '未知字面量');
    }

    case 'Identifier': {
      const id = node as acorn.Identifier;
      if (id.name === 'true' || id.name === 'false') {
        return { type: 'js_boolean', fields: { VAL: id.name } };
      }
      if (id.name === 'undefined' || id.name === 'null') {
        return rawBlockExpr(source, node, warnings, 'undefined/null');
      }
      return { type: 'js_get', fields: { NAME: id.name } };
    }

    case 'BinaryExpression': {
      const b = node as acorn.BinaryExpression;
      const OP_MAP: Record<string, string> = {
        '+': '+', '-': '-', '*': '*', '/': '/', '%': '%',
        '===': '===', '!==': '!==',
        '<': '<', '>': '>', '<=': '<=', '>=': '>=',
        '==': '===', '!=': '!==',
        '&&': '&&', '||': '||',
      };
      const op = OP_MAP[b.operator];
      if (!op) return rawBlockExpr(source, node, warnings, '运算符 ' + b.operator);

      if (b.operator === '&&' || b.operator === '||') {
        return {
          type: 'js_logic',
          fields: { OP: op },
          inputs: {
            A: { block: translateExpression(b.left, source, warnings) },
            B: { block: translateExpression(b.right, source, warnings) },
          },
        };
      }
      if (['<', '>', '<=', '>=', '===', '!==', '==', '!='].includes(b.operator)) {
        return {
          type: 'js_compare',
          fields: { OP: op },
          inputs: {
            A: { block: translateExpression(b.left, source, warnings) },
            B: { block: translateExpression(b.right, source, warnings) },
          },
        };
      }
      return {
        type: 'js_math',
        fields: { OP: op },
        inputs: {
          A: { block: translateExpression(b.left, source, warnings) },
          B: { block: translateExpression(b.right, source, warnings) },
        },
      };
    }

    case 'UnaryExpression': {
      const u = node as acorn.UnaryExpression;
      if (u.operator === '!') {
        return {
          type: 'js_not',
          inputs: {
            VAL: { block: translateExpression(u.argument, source, warnings) },
          },
        };
      }
      return rawBlockExpr(source, node, warnings, '一元运算 ' + u.operator);
    }

    case 'CallExpression': {
      const call = node as acorn.CallExpression;
      if (call.callee.type === 'Identifier') {
        const name = (call.callee as acorn.Identifier).name;
        if (name === 'prompt' && call.arguments[0]?.type === 'Literal') {
          return {
            type: 'js_prompt',
            fields: {
              MSG: String((call.arguments[0] as acorn.Literal).value),
              TYPE: 'string',
            },
          };
        }
        return {
          type: 'js_func_call_value',
          fields: { NAME: name },
          inputs: {
            A1: call.arguments[0]
              ? { block: translateExpression(call.arguments[0], source, warnings) }
              : undefined,
            A2: call.arguments[1]
              ? { block: translateExpression(call.arguments[1], source, warnings) }
              : undefined,
            A3: call.arguments[2]
              ? { block: translateExpression(call.arguments[2], source, warnings) }
              : undefined,
          },
        };
      }
      return rawBlockExpr(source, node, warnings, '复杂调用');
    }

    default:
      return rawBlockExpr(source, node, warnings, node.type);
  }
}

// ============================================================
// 工具
// ============================================================

function sliceNode(source: string, node: Node): string {
  const anyNode = node as any;
  return source.slice(anyNode.start, anyNode.end);
}

/** 语句位置的原生 JS 块 */
function rawBlock(
  source: string,
  node: Node,
  warnings: string[],
  reason: string,
): BlockJson {
  const code = sliceNode(source, node);
  warnings.push('保留了原生 JS（' + reason + '）：' + truncate(code, 40));
  return { type: 'js_raw', fields: { CODE: code } };
}

/** 表达式位置的原生 JS 块（有 output，能塞进输入槽） */
function rawBlockExpr(
  source: string,
  node: Node,
  warnings: string[],
  reason: string,
): BlockJson {
  const code = sliceNode(source, node);
  warnings.push('保留了 JS 表达式（' + reason + '）：' + truncate(code, 40));
  return { type: 'js_raw_value', fields: { CODE: code } };
}

function wrapAllInRaw(code: string): WorkspaceJson {
  return {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'js_raw', fields: { CODE: code } }],
    },
  };
}

function emptyValue(): BlockJson {
  return { type: 'js_text', fields: { VAL: '' } };
}

function translateBlockBody(
  node: Node,
  source: string,
  warnings: string[],
): BlockJson | null {
  let body: Node[] = [];
  if (node.type === 'BlockStatement') {
    body = (node as acorn.BlockStatement).body;
  } else {
    body = [node];
  }

  const blocks: BlockJson[] = [];
  for (const stmt of body) {
    const b = translateStatement(stmt, source, warnings);
    if (b) blocks.push(b);
  }

  if (blocks.length === 0) return null;
  for (let i = 0; i < blocks.length - 1; i++) {
    blocks[i].next = { block: blocks[i + 1] };
  }
  return blocks[0];
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}