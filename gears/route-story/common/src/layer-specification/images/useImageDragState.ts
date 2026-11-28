import { useEffect } from "react";
import { distinctUntilChanged, map } from "rxjs";
import { draggingImage$ } from "./images-layers";

// A stable callback keeps the current drag attached to the same platform resource.
export const useImageDragState = (
    apply: (imageId: number) => (() => void) | void,
    interaction?: NonNullable<typeof draggingImage$.value>["interaction"],
) => {
    useEffect(() => {
        let cleanup: (() => void) | void;
        const subscription = draggingImage$
            .pipe(
                map((image) => image && (!interaction || image.interaction === interaction) ? image.id : null),
                distinctUntilChanged(),
            )
            .subscribe((imageId) => {
                cleanup?.();
                cleanup = imageId === null ? undefined : apply(imageId);
            });

        return () => {
            subscription.unsubscribe();
            cleanup?.();
        };
    }, [apply, interaction]);
};
