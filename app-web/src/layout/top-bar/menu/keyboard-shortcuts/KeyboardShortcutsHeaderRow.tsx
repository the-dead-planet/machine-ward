import { FC } from "react";
import { useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { Text } from "@web-ui";

export const KeyboardShortcutsHeaderRow: FC = () => {
    const { namespace, translationKey } = useWebMachineWard();
    const translate = useTranslate();
    const columns = [
        translationKey.Label,
        translationKey.ShortcutKeys,
        translationKey.Description,
        translationKey.Status,
    ];

    return (
        <tr>
            {columns.map((column) => (
                <th key={column} scope="col">
                    <Text usage="caption" color="primary" uppercase>
                        {translate({ n: namespace, t: column })}
                    </Text>
                </th>
            ))}
        </tr>
    );
};
