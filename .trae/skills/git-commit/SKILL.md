---
name: git-commit
description: Commit workspace changes following this repo's conventions (Chinese conventional-commit messages, PowerShell-safe flow). Use when the user says commit, 提交 or asks to record current changes. Do not use for push, branch operations or history rewriting.
---

# Git Commit

按本仓库惯例提交当前变更。用户说「commit」「提交」即触发。

## 流程

1. **先看再动**——并行执行三条命令了解全貌：
   - `git status`（不要用 `-uall`，大仓库会卡）
   - `git diff --stat`
   - `git log --oneline -5`（对齐最近提交的措辞风格）
2. **暂存**：用 `git add` 逐个列出文件，**禁止 `git add -A` / `git add .`**——避免误提交 `.env`、凭据等敏感文件。未跟踪的 IDE 产物（如 `.trae-html-share-packages/`）不纳入提交。
3. **写提交信息**（规则见下），用 `scripts/commit.ps1` 提交。
4. **提交后**：`git status` 确认干净，向用户报告：提交哈希、标题、领先 origin/main 的提交数。**绝不主动 push**，除非用户明确要求。

## 提交信息惯例

- 语言：中文；格式：`<type>: <一句话标题>`，标题聚焦「为什么/做了什么」，控制在 50 字内
- type 取值：`feat` / `fix` / `style` / `refactor` / `build` / `chore` / `docs`
- 多项变更时在正文用 `- ` 列表逐条说明，标题概括主线
- 参考真实示例：
  - `feat: 图片抠图长按盖章画布 + 新增 DPR 设备像素比知识页`
  - `refactor: RedeemCountdown 更名为 OffWorkCountdown（下班倒计时），页面文案改为薪满意足`
  - `build: 站酷字体改为 npm 本地自托管（fontsource），移除 CDN link`

## 提交信息惯例之外：无关变更不混入

一次 commit 只装一件事。若工作区同时有多条不相关变更，拆成多次提交，每次只 add 相关文件。

## PowerShell 环境限制（必读）

本机终端本身就是 PowerShell 5，有三条硬限制：

1. **不支持 heredoc**（`<<'EOF'` 会报解析错误）——禁止用 heredoc 传提交信息
2. **不支持 `&&`** 链接命令——用 `;` 分隔
3. **PS 5.1 对无 BOM 文件按 ANSI(GBK) 解码**——含中文的 .ps1 脚本必须避免（见 scripts/commit.ps1 的教训：多字节字符会吞掉换行，把代码挤进注释行，`if ($DryRun)` 静默走错分支）

提交直接在当前会话调用脚本（无需嵌套 `powershell -File`）：

```powershell
& .trae\skills\git-commit\scripts\commit.ps1 -Message "<标题>`n`n- 列表项1`n- 列表项2"
```

脚本把 Message 写入临时文件（UTF-8 无 BOM，避免中文乱码）再 `git commit -F`，用完即删。脚本本身保持 ASCII-only，中文只通过参数传入。

## 敏感文件

提交前检查暂存内容是否含 `.env`、`credentials.*`、密钥等；发现则警告用户并跳过该文件。
