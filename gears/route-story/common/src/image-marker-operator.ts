import { BehaviorSubject } from "rxjs";
import type { ImageGroupPagination } from "./layer-specification/images/images-sources";

export class ImageMarkerOperator {
    public readonly selectedImageId$ = new BehaviorSubject<number | null>(null);
    public readonly expandedImageGroupId$ = new BehaviorSubject<number | null>(null);
    public readonly imageGroupOffset$ = new BehaviorSubject(0);

    public shiftImageGroup = (pagination: ImageGroupPagination, direction: number): void => {
        this.imageGroupOffset$.next(
            (((this.imageGroupOffset$.value - direction) % pagination.totalCount) +
                pagination.totalCount) % pagination.totalCount,
        );
    };

    public clearImageMarkerSelection = (): void => {
        this.selectedImageId$.next(null);
        this.expandedImageGroupId$.next(null);
        this.imageGroupOffset$.next(0);
    };

    public toggleImageMarkerGroup = (imageIds: number[]): void => {
        if (!imageIds.length) {
            return;
        }
        if (imageIds.some((id) => id === this.selectedImageId$.value)) {
            this.clearImageMarkerSelection();
            return;
        }
        const imageId = imageIds[0];
        this.imageGroupOffset$.next(0);
        this.selectedImageId$.next(imageId);
        this.expandedImageGroupId$.next(imageId);
    };

    public selectMapImageMarker = (imageId: number, groupSize: number, groupId = imageId): void => {
        if (this.expandedImageGroupId$.value !== groupId || groupSize <= 1) {
            this.imageGroupOffset$.next(0);
        }
        this.selectedImageId$.next(groupSize > 1 || this.selectedImageId$.value !== imageId ? imageId : null);
        this.expandedImageGroupId$.next(groupSize > 1 ? groupId : null);
    };
}
