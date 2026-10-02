import * as Blockly from 'blockly/core';
import { dbGet, dbSet } from './db';

// 存储键。以后要多文件时，会变成 `workspace:${fileId}` 之类
export const WORKSPACE_KEY = 'workspace:current';

// 防抖时间：用户停手 800ms 后写入，避免频繁 IO
const DEBOUNCE_MS = 800;

/**
 * 挂上自动保存：任何"非 UI"的积木变化都会被记录，防抖后写入 IndexedDB。
 * 必须在初始化完成后调用（否则加载过程本身会触发一遍无意义的保存）。
 */
export function attachAutosave(ws: Blockly.WorkspaceSvg): void {
  let timer: number | null = null;

  const flush = () => {
    const state = Blockly.serialization.workspaces.save(ws);
    dbSet(WORKSPACE_KEY, state).catch((e) => {
      console.error('[autosave] 保存失败:', e);
    });
  };

  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // isUiEvent 是"选中积木""打开工具箱"这类不影响数据的操作，忽略掉
    if (e.isUiEvent) return;

    if (timer !== null) clearTimeout(timer);
    timer = window.setTimeout(flush, DEBOUNCE_MS);
  });

  // 关闭页面前尽最后一次努力（异步不保证一定成功，但比什么都不做好）
  window.addEventListener('beforeunload', () => {
    if (timer !== null) {
      clearTimeout(timer);
      flush();
    }
  });
}

/**
 * 尝试从 IndexedDB 恢复工作区。
 * 返回 true 表示成功恢复，false 表示没有存档（首次打开或已被清空）。
 */
export async function loadSavedWorkspace(
  ws: Blockly.WorkspaceSvg,
): Promise<boolean> {
  const state = await dbGet<object>(WORKSPACE_KEY);
  if (!state) return false;
  try {
    Blockly.serialization.workspaces.load(state, ws);
    return true;
  } catch (e) {
    console.error('[autosave] 恢复失败，将忽略旧存档:', e);
    return false;
  }
}