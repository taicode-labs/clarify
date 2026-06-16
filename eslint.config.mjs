import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import * as mdx from 'eslint-plugin-mdx';

/**
 * Clarify Monorepo ESLint 配置
 *
 * - 根目录为 browser/react 项目（apps/docs, apps/www, packages/renderer）
 * - packages/vite-plugin 为 node 环境插件
 */

const browserFiles = [
  'apps/docs/source/**/*.{ts,tsx}',
  'apps/www/source/**/*.{ts,tsx}',
  'packages/renderer/source/**/*.{ts,tsx}',
  'source/**/*.{ts,tsx}',
];

const nodeFiles = [
  'packages/vite-plugin/source/**/*.ts',
  'packages/vite-plugin/**/*.test.ts',
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
    rules: {
      // 代码质量
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 代码风格
      'no-console': 'off',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
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

  // Node.js 项目规则（vite-plugin）
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
