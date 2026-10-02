import * as Blockly from 'blockly/core';

export function createVariablePanel(
  ws: Blockly.WorkspaceSvg,
  listEl: HTMLElement,
  addBtn: HTMLButtonElement,
): void {
  const manual: string[] = [];

  const scanCanvas = (): string[] => {
    const names = new Set<string>();
    for (const b of ws.getAllBlocks(false)) {
      if (isVarBlock(b.type)) {
        const f = b.getField('NAME');
        if (f) {
          const v = String(f.getValue() || '').trim();
          if (v) names.add(v);
        }
      }
    }
    return Array.from(names);
  };

  const render = () => {
    listEl.innerHTML = '';
    const names = new Set<string>(scanCanvas());
    manual.forEach((n) => names.add(n));
    const arr = Array.from(names).sort();

    if (arr.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 10px; color:#666; font-size:12px;';
      empty.textContent = '（还没有变量）';
      listEl.appendChild(empty);
      return;
    }

    for (const name of arr) {
      const row = document.createElement('div');
      row.className = 'var-item';
      row.title = '点击插入"变量 ' + name + '"';

      const label = document.createElement('span');
      label.className = 'var-name';
      label.textContent = name;

      const rename = document.createElement('button');
      rename.className = 'var-edit';
      rename.textContent = '✎';
      rename.title = '全局重命名（画布上所有同名的一起改）';
      rename.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = prompt('把画布上所有"' + name + '"改成：', name);
        if (input === null) return;
        const next = input.trim();
        if (!next || next === name) return;
        renameEverywhere(ws, name, next);
        const i = manual.indexOf(name);
        if (i >= 0) manual[i] = next;
        render();
      });

      const remove = document.createElement('button');
      remove.className = 'var-edit';
      remove.textContent = '✕';
      remove.title = '删除画布上所有使用该变量的积木块';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        const count = countUses(ws, name);
        if (count > 0) {
          if (!confirm(
            '画布上有 ' + count + ' 处使用「' + name + '」。\n' +
            '全部删除吗？（可用 Ctrl+Z 撤销）'
          )) return;
          deleteEverywhere(ws, name);
        }
        const i = manual.indexOf(name);
        if (i >= 0) manual.splice(i, 1);
        render();
      });

      row.appendChild(label);
      row.appendChild(rename);
      row.appendChild(remove);
      // 点击已有变量 = 引用它（js_get）
      row.addEventListener('click', () => insertBlock(ws, 'js_get', name));
      listEl.appendChild(row);
    }
  };

  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    if (e.isUiEvent) return;
    render();
  });

  addBtn.addEventListener('click', () => {
    const name = prompt('新变量名字：', '');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!manual.includes(trimmed)) {
      manual.push(trimmed);
    }
    // 新建 = 创建变量（js_let），不是引用它
    insertBlock(ws, 'js_let', trimmed);
    render();
  });

  render();
}

// ============================================================
// 内部工具
// ============================================================

function isVarBlock(type: string): boolean {
  return type === 'js_let' || type === 'js_set' || type === 'js_get';
}

function countUses(ws: Blockly.WorkspaceSvg, name: string): number {
  let n = 0;
  for (const b of ws.getAllBlocks(false)) {
    if (!isVarBlock(b.type)) continue;
    const f = b.getField('NAME');
    if (f && String(f.getValue() || '') === name) n++;
  }
  return n;
}

function renameEverywhere(ws: Blockly.WorkspaceSvg, from: string, to: string): void {
  Blockly.Events.setGroup(true);
  try {
    for (const b of ws.getAllBlocks(false)) {
      if (!isVarBlock(b.type)) continue;
      const f = b.getField('NAME');
      if (!f) continue;
      if (String(f.getValue() || '') === from) f.setValue(to);
    }
  } finally {
    Blockly.Events.setGroup(false);
  }
}

function deleteEverywhere(ws: Blockly.WorkspaceSvg, name: string): void {
  Blockly.Events.setGroup(true);
  try {
    const toDelete: Blockly.Block[] = [];
    for (const b of ws.getAllBlocks(false)) {
      if (!isVarBlock(b.type)) continue;
      const f = b.getField('NAME');
      if (f && String(f.getValue() || '') === name) toDelete.push(b);
    }
    for (const b of toDelete) {
      b.dispose(true);
    }
  } finally {
    Blockly.Events.setGroup(false);
  }
}

/**
 * 在画布可视区域的**正中央**插入一个积木块。
 *
 * 如果正中央已经被占了，就向右下 30px 阶梯式试探，
 * 找到一个空位再放。画布本身不会移动。
 */
function insertBlock(ws: Blockly.WorkspaceSvg, type: string, name: string) {
  const block = ws.newBlock(type);
  block.initSvg();

  const field = block.getField('NAME');
  if (field) field.setValue(name);

  block.render();

  const metrics = ws.getMetrics();
  const size = block.getHeightWidth();
  const baseX = metrics.viewLeft + (metrics.viewWidth - size.width) / 2;
  const baseY = metrics.viewTop + (metrics.viewHeight - size.height) / 2;

  const { x, y } = findFreeSpot(ws, baseX, baseY);
  block.moveBy(x, y);

  block.select();
  // 不调用 ws.centerOnBlock，画布保持不动
}

/**
 * 从 (baseX, baseY) 开始，向右下 30px 阶梯式试探，
 * 找到第一个没有被顶层积木块占用的位置。
 *
 * 判定"被占用"的方式：把位置取整到 30px 网格，
 * 看有没有顶层积木块落在同一个格子。
 * 最多试 20 次，实在找不到就落回原位 + 20 格偏移。
 */
function findFreeSpot(
  ws: Blockly.WorkspaceSvg,
  baseX: number,
  baseY: number,
): { x: number; y: number } {
  const OFFSET = 30;
  const MAX_TRIES = 20;

  const occupied = new Set<string>();
  for (const b of ws.getTopBlocks(false)) {
    const xy = b.getRelativeToSurfaceXY();
    const gx = Math.round(xy.x / OFFSET);
    const gy = Math.round(xy.y / OFFSET);
    occupied.add(gx + ',' + gy);
  }

  for (let i = 0; i < MAX_TRIES; i++) {
    const x = baseX + i * OFFSET;
    const y = baseY + i * OFFSET;
    const gx = Math.round(x / OFFSET);
    const gy = Math.round(y / OFFSET);
    if (!occupied.has(gx + ',' + gy)) {
      return { x, y };
    }
  }

  return { x: baseX + MAX_TRIES * OFFSET, y: baseY + MAX_TRIES * OFFSET };
}