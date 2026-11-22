import { FC, useState } from "react";
import { TextInput } from "../forms/text-input";
import { Text } from "../design-system/typography";

interface Props {
    label: string;
    value: unknown;
    onChange: (value: unknown) => void;
}

export const StoryObjectControl: FC<Props> = ({ label, value, onChange }) => {
    const serialized = JSON.stringify(value) ?? "null";
    const [previous, setPrevious] = useState(serialized);
    const [draft, setDraft] = useState(serialized);
    const [invalid, setInvalid] = useState(false);
    if (previous !== serialized) {
        setPrevious(serialized);
        setDraft(serialized);
        setInvalid(false);
    }

    return (
        <>
            <TextInput
                label={label}
                value={draft}
                onChange={(text) => {
                    setDraft(text);
                    let parsed: unknown;
                    try {
                        parsed = JSON.parse(text);
                    } catch {
                        setInvalid(true);
                        return;
                    }
                    setInvalid(false);
                    onChange(parsed);
                }}
            />
            {invalid ? <Text>Enter valid JSON.</Text> : null}
        </>
    );
};
