import pluginTypescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'freeyubin',
                file: 'dist/freeyubin.mjs',
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins: [
            pluginTypescript(),
        ]
    },
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'freeyubin',
                file: 'dist/freeyubin.cjs',
                format: 'cjs',
                sourcemap: true,
            },
        ],
        plugins: [
            pluginTypescript(),
        ]
    },
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'freeyubin',
                file: 'dist/freeyubin.js',
                format: 'iife',
                sourcemap: true,
            },
        ],
        plugins: [
            pluginTypescript(),
        ]
    },
    {
        input: 'lib/index.d.ts',
        output: [
            {
                file: 'dist/freeyubin.d.ts',
                format: 'es',
            },
        ],
        plugins: [
            dts(),
        ]
    },
]