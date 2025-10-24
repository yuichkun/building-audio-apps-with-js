/// <reference types="vite/client" />

// Declare Vite's special import syntax for workers
declare module '*?worker&url' {
  const url: string
  export default url
}
