/**
 * File System Access API 的薄封装。
 * 只支持 Chrome / Edge。调用方负责检查兼容性。
 */

export interface WorkspaceFile {
  name: string;
  handle: FileSystemFileHandle;
}

let rootHandle: FileSystemDirectoryHandle | null = null;

export function isSupported(): boolean {
  return typeof (window as any).showDirectoryPicker === 'function';
}

export function getRoot(): FileSystemDirectoryHandle | null {
  return rootHandle;
}

export function getRootName(): string | null {
  return rootHandle?.name ?? null;
}

/** 让用户选一个文件夹作为工作区 */
export async function openFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await (window as any).showDirectoryPicker();
  rootHandle = handle;
  return handle;
}

/** 列出文件夹下的文件（不递归，只一层） */
export async function listFiles(): Promise<WorkspaceFile[]> {
  if (!rootHandle) return [];
  const out: WorkspaceFile[] = [];
  for await (const [name, entry] of (rootHandle as any).entries()) {
    if (entry.kind === 'file' && isTextFile(name)) {
      out.push({ name, handle: entry as FileSystemFileHandle });
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** 读一个文件的文本内容 */
export async function readFile(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/** 写文本到文件（就地覆盖） */
export async function writeFile(
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> {
  const writable = await (handle as any).createWritable();
  await writable.write(text);
  await writable.close();
}

/** 在工作区新建一个文件，返回它的 handle */
export async function createFile(name: string): Promise<FileSystemFileHandle> {
  if (!rootHandle) throw new Error('还没有打开文件夹');
  return rootHandle.getFileHandle(name, { create: true });
}

/** 删除工作区里的一个文件 */
export async function deleteFile(name: string): Promise<void> {
  if (!rootHandle) throw new Error('还没有打开文件夹');
  await rootHandle.removeEntry(name);
}

function isTextFile(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith('.js') ||
    lower.endsWith('.json') ||
    lower.endsWith('.html') ||
    lower.endsWith('.css')
  );
}