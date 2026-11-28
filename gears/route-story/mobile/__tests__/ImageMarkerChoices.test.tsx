import { fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { ImageMarkerChoices } from "../src/layer-styling/ImageMarkerChoices";

jest.mock("@ui", () => ({
    useTheme: () => ({ resolveAppearance: () => ({ glyphs: "black" }) }),
}));

jest.mock("@mobile-ui", () => ({
    Label: jest.requireActual<typeof import("react-native")>("react-native").Text,
}));

jest.mock("@the-dead-planet/machine-ward-gears-route-story-common", () => jest.requireActual("../../common/src/tinkers/images"));

test("an image marker choice exposes its name and updates the checked radio when pressed", async () => {
    function ShapeChoices() {
        const [shape, setShape] = useState("circle");
        return (
            <ImageMarkerChoices
                label="Shape"
                value={shape}
                options={[
                    { value: "circle", label: "Circle", shape: "circle", diameter: 26 },
                    { value: "square", label: "Square", shape: "square", diameter: 26 },
                    { value: "hexagon", label: "Hexagon", shape: "hexagon", diameter: 26 },
                ]}
                onChange={setShape}
            />
        );
    }

    const screen = await render(<ShapeChoices />);
    expect(screen.getAllByRole("radio", { checked: true })).toEqual([screen.getByRole("radio", { name: "Circle" })]);
    await fireEvent.press(screen.getByRole("radio", { name: "Hexagon" }));
    expect(screen.getAllByRole("radio", { checked: true })).toEqual([screen.getByRole("radio", { name: "Hexagon" })]);
});
