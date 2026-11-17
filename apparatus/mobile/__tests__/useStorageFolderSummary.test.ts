import { act, renderHook } from "@testing-library/react-native";
import { StorageEntry, StorageFolderSummary, StorageListing } from "../src/storage-debug/model";
import { readStorageDebugFolder } from "../src/storage-debug/storage-files";
import { useStorageFolderSummary } from "../src/storage-debug/useStorageFolderSummary";

jest.mock("../src/storage-debug/storage-files", () => ({
    readStorageDebugFolder: jest.fn(),
}));

beforeEach(() => jest.resetAllMocks());

const emptySummary: StorageFolderSummary = {
    status: "ready",
    files: 0,
    folders: 0,
    totalBytes: 0,
    imageFiles: 0,
    imageBytes: 0,
    asyncStorageFiles: 0,
    asyncStorageBytes: 0,
};

test("counts nested files, image bytes, and AsyncStorage databases including companion files", async () => {
    const entry = (path: string, size: number, isDirectory = false): StorageEntry => ({
        name: path.split("/").at(-1)!,
        path,
        size,
        isDirectory,
    });
    const listings: Record<string, StorageListing> = {
        "/app": {
            exists: true,
            entries: [
                entry("/app/photo.jpg", 1024),
                entry("/app/route.gpx", 2048),
                entry("/app/images", 4096, true),
                entry("/app/databases", 4096, true),
            ],
        },
        "/app/images": {
            exists: true,
            entries: [
                entry("/app/images/nested.jpg", 1024),
            ],
        },
        "/app/databases": {
            exists: true,
            entries: [
                entry("/app/databases/async-storage", 4096, true),
            ],
        },
        "/app/databases/async-storage": {
            exists: true,
            entries: [
                entry("/app/databases/async-storage/nav-gauge.sqlite", 4096),
                entry("/app/databases/async-storage/nav-gauge.sqlite-wal", 1024),
            ],
        },
    };
    jest.mocked(readStorageDebugFolder).mockImplementation(
        async (_root, path) => listings[path],
    );
    const { result, unmount } = await renderHook(() =>
        useStorageFolderSummary("/app"),
    );
    expect(result.current).toEqual({
        status: "ready",
        files: 5,
        folders: 3,
        totalBytes: 9216,
        imageFiles: 2,
        imageBytes: 2048,
        asyncStorageFiles: 2,
        asyncStorageBytes: 5120,
    });
    expect(readStorageDebugFolder).toHaveBeenCalledTimes(4);
    expect(readStorageDebugFolder).toHaveBeenCalledWith("/app", "/app");
    await unmount();
});

test("distinguishes missing and unreadable folders from empty folders", async () => {
    jest.mocked(readStorageDebugFolder)
        .mockResolvedValueOnce({ exists: false, entries: [] })
        .mockRejectedValueOnce(new Error("Permission denied"))
        .mockResolvedValueOnce({ exists: true, entries: [] });
    const { result, rerender, unmount } = await renderHook<StorageFolderSummary, { revision: number }>(
        ({ revision }) => useStorageFolderSummary("/app", revision),
        { initialProps: { revision: 0 } },
    );
    expect(result.current).toEqual({ status: "missing" });
    await rerender({ revision: 1 });
    expect(result.current).toEqual({ status: "unavailable" });
    await rerender({ revision: 2 });
    expect(result.current).toEqual(emptySummary);
    await unmount();
});

test("keeps pending counts in loading state and ignores stale results after refresh", async () => {
    let finishOldRead: (listing: StorageListing) => void = () => {};
    jest.mocked(readStorageDebugFolder)
        .mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finishOldRead = resolve;
                }),
        )
        .mockResolvedValueOnce({ exists: true, entries: [] });
    const { result, rerender, unmount } = await renderHook<StorageFolderSummary, { revision: number }>(
        ({ revision }) => useStorageFolderSummary("/app", revision),
        { initialProps: { revision: 0 } },
    );
    expect(result.current).toEqual({ status: "loading" });
    await rerender({ revision: 1 });
    await act(() => finishOldRead({ exists: false, entries: [] }));
    expect(result.current).toEqual(emptySummary);
    await unmount();
});
