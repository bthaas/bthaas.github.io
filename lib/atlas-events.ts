export const ATLAS_ROUTE_CHANGE_EVENT = 'atlas:route-change'
export const ATLAS_GATEWAY_SELECTION_EVENT = 'atlas:gateway-selection'

export type AtlasDestinationName = 'experience' | 'projects' | 'skills' | 'contact'

export interface AtlasGatewaySelectionDetail {
  readonly route: AtlasDestinationName
}
