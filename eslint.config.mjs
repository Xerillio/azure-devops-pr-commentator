import stylistic from "@stylistic/eslint-plugin";
import love from "eslint-config-love";

export default [
    {
        ignores: ["node_modules/**", "bin/**", ".task/**"]
    },
    {
        ...love,
        files: ["**/*.ts"],
        plugins: {
            ...love.plugins,
            "@stylistic": stylistic
        },
        languageOptions: {
            ...love.languageOptions,
            parserOptions: {
                ...love.languageOptions?.parserOptions,
                sourceType: "module",
                ecmaVersion: "latest"
            }
        },
        rules: {
            ...love.rules,
            "@stylistic/indent": ["error", 4],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/space-before-function-paren": ["error", "never"],
            "@typescript-eslint/no-import-type-side-effects": "off",
            "@typescript-eslint/no-magic-numbers": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-type-assertion": "off",
            "@typescript-eslint/class-methods-use-this": "off",
            "@typescript-eslint/init-declarations": "off",
            "@typescript-eslint/prefer-destructuring": "off",
            "@typescript-eslint/no-unused-private-class-members": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@eslint-community/eslint-comments/require-description": "off",
            "no-console": "off",
            "no-negated-condition": "off",
            "no-await-in-loop": "off",
            "require-unicode-regexp": "off",
            "prefer-named-capture-group": "off",
            "max-nested-callbacks": "off",
            "radix": "off",
            "arrow-body-style": "off",
            "prefer-template": "off"
        }
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-magic-numbers": "off",
            "@typescript-eslint/require-await": "off"
        }
    }
];
