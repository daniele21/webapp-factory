declare module 'react' {
  export * from '../../apps/web/node_modules/@types/react/index'
  const React: typeof import('../../apps/web/node_modules/@types/react/index')
  export default React
}

declare module 'react/jsx-runtime' {
  export * from '../../apps/web/node_modules/@types/react/jsx-runtime'
  const jsxRuntime: typeof import('../../apps/web/node_modules/@types/react/jsx-runtime')
  export default jsxRuntime
}
