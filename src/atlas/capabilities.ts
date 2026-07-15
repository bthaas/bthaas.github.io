export function hasFinePointer(): boolean {
  return window.matchMedia?.('(pointer: fine)').matches ?? false
}
