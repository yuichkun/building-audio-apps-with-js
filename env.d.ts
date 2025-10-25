/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

// Declare Vite's special import syntax for workers
declare module '*?worker&url' {
  const url: string
  export default url
}
