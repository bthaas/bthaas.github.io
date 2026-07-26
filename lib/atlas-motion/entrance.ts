interface FluidCursorEligibility {
  readonly finePointer: boolean
  readonly hover: boolean
  readonly reducedMotion: boolean
  readonly webgl: boolean
}

export function getFluidCursorEligibility({
  finePointer,
  hover,
  reducedMotion,
  webgl,
}: FluidCursorEligibility): boolean {
  return finePointer && hover && !reducedMotion && webgl
}
