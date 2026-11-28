import { FC, useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const styles = StyleSheet.create({
    halo: {
        position: 'absolute',
        top: -6,
        left: -6,
    },
});

interface LampProps {
    color: string;
    size: number;
    opacity: number;
    glowColor?: string;
}

export const Lamp: FC<LampProps> = ({ color, size, opacity, glowColor }) => {
    const id = useId();
    const lampRadius = size / 2;

    if (!glowColor) {
        return <View style={{ width: size, height: size, borderRadius: lampRadius, backgroundColor: color, opacity }} />;
    }

    const glowRadius = lampRadius + 6;
    const haloId = `${id}-halo`;
    const highlightId = `${id}-highlight`;

    return (
        <View style={{ width: size, height: size, opacity }}>
            <Svg width={glowRadius * 2} height={glowRadius * 2} style={styles.halo} pointerEvents="none">
                <Defs>
                    <RadialGradient id={haloId}>
                        <Stop offset={lampRadius / glowRadius} stopColor={glowColor} stopOpacity={0.55} />
                        <Stop offset={1} stopColor={glowColor} stopOpacity={0} />
                    </RadialGradient>
                    <RadialGradient id={highlightId} cx="35%" cy="30%" rx="50%" ry="50%">
                        <Stop offset={0} stopColor="white" stopOpacity={0.4} />
                        <Stop offset={1} stopColor="white" stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Circle cx={glowRadius} cy={glowRadius} r={glowRadius} fill={`url(#${haloId})`} />
                <Circle cx={glowRadius} cy={glowRadius} r={lampRadius} fill={color} />
                <Circle cx={glowRadius} cy={glowRadius} r={lampRadius} fill={`url(#${highlightId})`} />
            </Svg>
        </View>
    );
};
