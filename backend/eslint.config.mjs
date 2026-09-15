import js from '@eslint/js';

export default [
  // ESLint recommended rules as base
  js.configs.recommended,

  // ── Main source files ─────────────────────────────────────
  {
    files: ['src/**/*.js'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals (replaces env: { node: true })
        require:       'readonly',
        module:        'readonly',
        exports:       'readonly',
        __dirname:     'readonly',
        __filename:    'readonly',
        process:       'readonly',
        console:       'readonly',
        Buffer:        'readonly',
        setTimeout:    'readonly',
        clearTimeout:  'readonly',
        setInterval:   'readonly',
        clearInterval: 'readonly',
        URL:           'readonly',
        URLSearchParams: 'readonly',
      },
    },

    rules: {
      // ── Code quality ───────────────────────────────────────
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // error not warn — unused vars are bugs waiting to happen
      // ^_ pattern: prefix with _ to explicitly mark as intentionally unused
      // example: (req, _res, next) => {} — _res is intentionally ignored

      'prefer-const':    'error',
      // Forces: const x = 1  not  let x = 1  when x is never reassigned
      // Makes intent clear, prevents accidental mutation

      'no-var':          'error',
      // No var anywhere — only const and let
      // var has function scope and hoisting which causes subtle bugs

      'eqeqeq':          ['error', 'always'],
      // Forces === instead of ==
      // == has implicit type coercion: '' == false is true (a bug)
      // === never coerces: '' === false is false (correct)

      // ── Security ───────────────────────────────────────────
      'no-eval':         'error',
      // eval() executes arbitrary strings as code
      // If any user input reaches eval() → remote code execution
      // No legitimate use case in your backend

      'no-implied-eval': 'error',
      // setTimeout('code as string') is eval() in disguise
      // setTimeout(fn) is correct — setTimeout('fn()') is not

      // ── Console usage ──────────────────────────────────────
      'no-console':      'warn',
      // warn not off — you use Winston for logging
      // A console.log left in production code is a signal something
      // was debugged and not cleaned up
      // warn lets it pass CI but flags it for cleanup
    },
  },

  // ── Test files ────────────────────────────────────────────
  {
    files: ['src/__tests__/**/*.js', '**/*.test.js', '**/*.spec.js'],

    languageOptions: {
      globals: {
        // Jest globals (replaces env: { jest: true })
        describe:   'readonly',
        it:         'readonly',
        test:       'readonly',
        expect:     'readonly',
        beforeEach: 'readonly',
        afterEach:  'readonly',
        beforeAll:  'readonly',
        afterAll:   'readonly',
        jest:       'readonly',
      },
    },

    rules: {
      // Relax some rules in tests — common patterns
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // warn not error in tests — test setup often has unused vars
    },
  },

  // ── Ignored paths ─────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'data/**',
      'logs/**',
    ],
  },
];
