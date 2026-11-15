import { imageLayerIds } from "./images/images-layers";
import { routeLayerIds } from "./route-layers";

export const layerOrder: string[] = [
    ...Object.values(routeLayerIds),
    ...Object.values(imageLayerIds),
];
