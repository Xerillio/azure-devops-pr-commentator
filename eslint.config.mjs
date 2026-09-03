import { fileURLToPath } from 'node:url';
import love from 'eslint-config-love';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
  {
    ignores: ['node_modules/**', 'bin/**', '.task/**']
  },
  {
    ...love,
    files: ['**/*.ts'],
    languageOptions: {
      ...love.languageOptions,
      parserOptions: {
        ...(love.languageOptions?.parserOptions ?? {}),
        projectService: true,
        tsconfigRootDir,
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    rules: {
      ...(love.rules ?? {}),
      '@typescript-eslint/no-import-type-side-effects': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@eslint-community/eslint-comments/require-description': 'off',
      'no-console': 'off',
      'no-negated-condition': 'off',
      'no-await-in-loop': 'off',
      'require-unicode-regexp': 'off',
      'prefer-named-capture-group': 'off',
      'max-nested-callbacks': 'off',
      'radix': 'off',
      'arrow-body-style': 'off',
      "prefer-template": 'off'
    }
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/require-await': 'off'
    }
  }
];
