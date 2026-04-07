# ezsuperpowers — Design Spec
Date: 2026-04-06

## Problem

Superpowers là một Claude plugin mạnh nhưng hướng đến developer. Nondev (người không biết thuật ngữ kỹ thuật) khi dùng Claude để brainstorm sản phẩm sẽ nhận được response kỹ thuật khó hiểu. ezsuperpowers giải quyết bằng cách inject thêm một lớp "nondev explanation" vào mọi brainstorming response — không thay thế superpowers, chỉ bổ sung.

## Target User

Nondev: người không biết thuật ngữ kỹ thuật, muốn dùng Claude để brainstorm sản phẩm. Cài VS Code extension là bước duy nhất cần làm.

## Architecture

**Approach: Patch layer — không fork superpowers.**

```
[User cài VS Code extension]
        ↓
[plugin-bridge copy claude-plugin/ → ~/.claude/plugins/cache/ezsuperpowers/]
        ↓
[Session start → hooks/session-start inject nondev instruction vào additionalContext]
        ↓
[Claude: mọi brainstorming response có 2 phần]
        ↓
[Superpowers (nếu cài) vẫn chạy bình thường, hai plugin coexist]
```

## Nondev Layer Format

Mỗi brainstorming response gồm 2 phần trong cùng 1 message:

```
**[Phân tích]**
— nội dung kỹ thuật như bình thường

**[Để bạn hình dung]**
— cause-and-effect dùng ngôn ngữ UX/product
— ví dụ: "click Login → hiện panel → sai password → đỏ ngay tại chỗ"
— không dùng thuật ngữ kỹ thuật, tối đa 3-4 câu
```

## Extension Structure

```
ezsuperpowers/
├── claude-plugin/
│   ├── .claude-plugin/plugin.json   # name, version
│   └── hooks/
│       ├── hooks.json               # khai báo SessionStart hook
│       └── session-start            # bash script inject instruction
├── src/
│   ├── extension.ts                 # activate plugin-bridge only
│   └── modules/plugin-bridge.ts    # copy claude-plugin/ → ~/.claude/plugins/
├── media/icon.png
├── package.json
└── esbuild.js
```

Không có UI. Extension làm đúng 1 việc: install plugin vào Claude khi VS Code activate.

## Distribution

- Publish lên Open VSX marketplace
- User cài extension → tự động inject vào Claude
- Không cần CLI, không cần config

## Out of Scope

- Không override bất kỳ skill nào của superpowers
- Không có sidebar, tree view, webview
- Không require superpowers phải cài sẵn
