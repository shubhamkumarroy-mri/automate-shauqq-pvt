// @ts-check
import stylistic from '@stylistic/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

const includedFolders = ['src', 'features'];

const customizedESLint = stylistic.configs.customize({
  indent: 2,
  quotes: 'single',
  semi: true,
  jsx: true,
  commaDangle: 'never',
  braceStyle: '1tbs'
});

export default tseslint.config(
  {
    ignores: [
      '**/{www,dist,build}/**/*.*',
      'projects/*/!(src)/**/*.*',
      `!(${includedFolders.join(',')})/**/*.*`,
      '!*.{js,ts,mjs,cjs}'
    ]
  },
  {
    name: 'typescript',
    files: ['**/*.{ts,js,tsx,jsx,mjs,cjs,mts}'],
    extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      ...customizedESLint.rules,
      // Disable overly strict rules for MCP server integration
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off'
    }
  },
  {
    name: 'tests',
    ...playwright.configs['flat/recommended'],
    files: ['**/*.test.{ts,js}?(x)', 'e2e/src/**/*.ts'],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-wait-for-selector': 'error'
    }
  }
);
