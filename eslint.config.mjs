import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as mdx from 'eslint-plugin-mdx';
import peculiar from '@yinxulai/eslint-plugin-peculiar';
import importPlugin from 'eslint-plugin-import-x';

/**
 * Clarify Monorepo ESLint 配置
 *
 * - 根目录为 browser/react 项目（apps/docs, apps/www, packages/renderer）
 * - packages/cli 为 Node.js CLI 和内部构建引擎
 */

const browserFiles = [
  'apps/docs/source/**/*.{ts,tsx}',
  'apps/www/source/**/*.{ts,tsx}',
  'packages/renderer/source/**/*.{ts,tsx}',
  'source/**/*.{ts,tsx}',
];

const nodeFiles = [
  'packages/cli/source/**/*.ts',
  'packages/cli/**/*.test.ts',
  'source/**/*.ts',
];

const sharedFiles = [
  'apps/*/source/**/*.{ts,tsx}',
  'packages/*/source/**/*.{ts,tsx}',
  'source/**/*.{ts,tsx}',
];

const configFiles = [
  '**/vite.config.ts',
  '**/tsup.config.ts',
  'eslint.config.mjs',
];

export default tseslint.config(
  // 忽略目录
  {
    ignores: [
      '**/node_modules/**',
      '**/output/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/*.d.ts',
    ],
  },

  // 基础 TypeScript 推荐规则（适用于所有 TypeScript 文件）
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // peculiar 推荐规则（函数定义风格）
  ...peculiar.configs['flat/strict'],

  // MDX 文件基础处理（关闭代码规则）
  {
    files: ['**/*.mdx'],
    ...mdx.flat,
    rules: {
      ...mdx.flat.rules,
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // 共享规则
  {
    files: sharedFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'import-x': importPlugin,
    },
    rules: {
      // 代码质量
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // 代码风格
      'no-console': 'off',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'never'],

      // import 排序：内置库 → 第三方库 → 内部依赖（@clarify-labs/*） → 相对路径
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@clarify-labs/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // Browser / React 项目规则
  {
    files: browserFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Renderer 是可复用组件库，入口和 provider 文件会导出 hooks/types/helpers。
  {
    files: ['packages/renderer/source/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // Node.js 项目规则（CLI）
  {
    files: nodeFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 配置文件特殊处理
  {
    files: configFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
