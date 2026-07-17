declare module 'bidi-js' {
  export default function bidiFactory(): {
    getEmbeddingLevels(text: string, direction: 'ltr' | 'rtl'): Uint8Array;
    getVisualOrder(text: string, levels: Uint8Array): number[];
  };
}
