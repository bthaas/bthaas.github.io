export interface GatewaySceneLayout {
  readonly cameraFovDegrees: number
  readonly cameraY: number
  readonly cameraZ: number
  readonly modelY: number
  readonly panelHalfHeight: number
  readonly panelRadius: number
  readonly pointerPitchRadians: number
  readonly reflectorCenterY: number
  readonly reflectorHalfHeight: number
  readonly reflectorRadius: number
}

export const GATEWAY_SCENE_LAYOUT = {
  cameraFovDegrees: 38,
  cameraY: 0.42,
  cameraZ: 6.2,
  modelY: 0.85,
  panelHalfHeight: 0.75,
  panelRadius: 2.42,
  pointerPitchRadians: 0.018,
  reflectorCenterY: -1.22,
  reflectorHalfHeight: 0.36,
  reflectorRadius: 2.48,
} as const satisfies GatewaySceneLayout

function projectVerticalPosition(
  layout: GatewaySceneLayout,
  localY: number,
  localZ: number,
  pitch: number,
): number {
  const cosine = Math.cos(pitch)
  const sine = Math.sin(pitch)
  const worldY = layout.modelY + localY * cosine - localZ * sine
  const worldZ = localY * sine + localZ * cosine
  const halfFov = layout.cameraFovDegrees * Math.PI / 360

  return (worldY - layout.cameraY)
    / ((layout.cameraZ - worldZ) * Math.tan(halfFov))
}

export function getGatewayVerticalNdcBounds(layout: GatewaySceneLayout) {
  const pitches = [-layout.pointerPitchRadians, layout.pointerPitchRadians]
  const panelDepths = [-layout.panelRadius, layout.panelRadius]
  const reflectorDepths = [-layout.reflectorRadius, layout.reflectorRadius]
  const top = Math.max(...pitches.flatMap((pitch) => panelDepths.map((depth) => (
    projectVerticalPosition(layout, layout.panelHalfHeight, depth, pitch)
  ))))
  const reflectorBottom = layout.reflectorCenterY - layout.reflectorHalfHeight
  const bottom = Math.min(...pitches.flatMap((pitch) => reflectorDepths.map((depth) => (
    projectVerticalPosition(layout, reflectorBottom, depth, pitch)
  ))))

  return {
    bottom,
    bottomClearance: bottom + 1,
    top,
    topClearance: 1 - top,
  }
}
