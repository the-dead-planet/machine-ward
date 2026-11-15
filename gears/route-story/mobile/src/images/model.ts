import { ImageFeature } from "@the-dead-planet/nav-gauge-gears-route-story-common";

export interface MapImageHitTarget {
    feature: ImageFeature;
    point: [number, number];
    routePoint: [number, number];
}

export interface ImageGroupPagerDimensions {
    width: number;
    height: number;
}
