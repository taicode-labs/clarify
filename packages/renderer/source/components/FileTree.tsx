import clsx from 'clsx'
import { File, Folder, FolderOpen } from 'lucide-react'
import { type ComponentPropsWithoutRef, type ReactNode } from 'react'

export type FileTreeProps = ComponentPropsWithoutRef<'div'>

export function FileTree(arg0: FileTreeProps) {
  const { children, className, ...props } = arg0

  return (
    <div
      className={clsx(
        'clarify-file-tree not-prose my-6 overflow-x-auto rounded-(--clarify-theme-tokens-radius-lg) border border-(--clarify-theme-tokens-colors-border) bg-(--clarify-theme-tokens-colors-surface) px-4 py-3 font-mono text-[13px]/6 text-(--clarify-ui-text-soft)',
        className,
      )}
      {...props}
    >
      <ul role="tree" className="m-0 min-w-max list-none p-0">{children}</ul>
    </div>
  )
}

export type FileTreeItemProps = {
  name: ReactNode
  description?: ReactNode
  type?: 'file' | 'folder'
  children?: ReactNode
} & Omit<ComponentPropsWithoutRef<'li'>, 'children'>

export function FileTreeItem(arg0: FileTreeItemProps) {
  const { name, description, type, children, className, ...props } = arg0
  const isFolder = type === 'folder' || children != null
  const FolderIcon = children ? FolderOpen : Folder

  return (
    <li
      role="treeitem"
      aria-expanded={isFolder ? children != null : undefined}
      className={clsx('clarify-file-tree-item m-0 p-0', className)}
      {...props}
    >
      <div className="flex min-h-6 items-center gap-2 whitespace-nowrap">
        {isFolder ? (
          <FolderIcon className="size-4 flex-none text-(--clarify-ui-accent-text)" aria-hidden="true" />
        ) : (
          <File className="size-4 flex-none text-(--clarify-ui-text-faint)" aria-hidden="true" />
        )}
        <span className="font-medium text-(--clarify-theme-tokens-colors-foreground)">{name}</span>
        {description ? <span className="font-sans text-xs text-(--clarify-ui-text-faint)">{description}</span> : null}
      </div>
      {children ? (
        <ul role="group" className="m-0 ml-2.5 list-none border-l border-(--clarify-theme-tokens-colors-border) pl-4">
          {children}
        </ul>
      ) : null}
    </li>
  )
}
