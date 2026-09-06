import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import stylistic from "@stylistic/eslint-plugin";
import tseslint, { parser } from "typescript-eslint";

export default defineConfig([
    {
        ignores: ["node_modules/**", "bin/**", ".task/**", "coverage/**"]
    },
    {
        files: ["**/*.ts"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked
        ],
        plugins: {
            "@stylistic": stylistic
        },
        languageOptions: {
            parser,
            parserOptions: {
                projectService: true,
                sourceType: "module",
                ecmaVersion: "latest"
            }
        },
        rules: {
            "@stylistic/indent": ["error", 4],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/space-before-function-paren": ["error", "never"],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "args": "all",
                    "argsIgnorePattern": "^_+$",
                    "caughtErrors": "all",
                    "caughtErrorsIgnorePattern": "^_+$",
                    "destructuredArrayIgnorePattern": "^_+$",
                    "varsIgnorePattern": "^_+$",
                    "ignoreRestSiblings": true
                }
            ],
            "@typescript-eslint/no-unsafe-member-access": ["error", { "allowOptionalChaining": true }]
        }
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            // Allows asserts like: expect(result).to.be.true;
            "@typescript-eslint/no-unused-expressions": "off"
        }
    }
]);
