/**
 * 文件读写工具：纯浏览器 API，不依赖任何库。
 */

/** 触发浏览器下载一个文本文件 */
export function downloadText(
  filename: string,
  text: string,
  mime = 'text/plain;charset=utf-8',
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 弹出文件选择对话框，返回用户选的文件（取消返回 null） */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const f = input.files?.[0] ?? null;
      document.body.removeChild(input);
      resolve(f);
    });
    // 用户取消时有些浏览器不触发 change，用 window.focus 兜底
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
            resolve(null);
          }
        }, 300);
      },
      { once: true },
    );
    input.click();
  });
}

/** 让用户输入一个文件名，默认值可指定 */
export function askFilename(defaultName: string): string | null {
  const name = prompt('文件名：', defaultName);
  if (!name) return null;
  return name.trim() || null;
}