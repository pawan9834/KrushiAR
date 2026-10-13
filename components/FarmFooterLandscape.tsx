import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FarmFooterLandscapeProps {
  height?: number;
}

export default function FarmFooterLandscape({ height = 120 }: FarmFooterLandscapeProps) {
  return (
    <View style={[styles.container, { height }]} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={height}
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        style={styles.svg}
      >
        {/* Sky gradient background base */}
        <Rect x="0" y="0" width="400" height="120" fill="#f0fdf4" fillOpacity="0.4" />

        {/* Distant Hills */}
        <Path
          d="M 0 75 Q 80 40 180 65 Q 280 90 400 50 L 400 120 L 0 120 Z"
          fill="#bbf7d0"
        />

        {/* Mid-ground Rolling Farm Fields */}
        <Path
          d="M 0 85 Q 120 60 230 82 Q 330 100 400 75 L 400 120 L 0 120 Z"
          fill="#86efac"
        />

        {/* Small Farm House on Hill */}
        <G transform="translate(260, 62)">
          {/* House body */}
          <Rect x="0" y="8" width="18" height="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
          {/* Roof */}
          <Path d="M -2 8 L 9 0 L 20 8 Z" fill="#ea580c" />
          {/* Door */}
          <Rect x="7" y="12" width="4" height="8" fill="#78350f" />
          {/* Small Silo / Tree next to house */}
          <Circle cx="24" cy="12" r="5" fill="#15803d" />
          <Circle cx="23" cy="7" r="4" fill="#16a34a" />
        </G>

        {/* Clustered Trees on Hills */}
        <G transform="translate(45, 68)">
          <Circle cx="0" cy="5" r="7" fill="#15803d" />
          <Circle cx="8" cy="3" r="6" fill="#16a34a" />
          <Circle cx="15" cy="6" r="5" fill="#22c55e" />
        </G>
        <G transform="translate(130, 75)">
          <Circle cx="0" cy="4" r="5" fill="#15803d" />
          <Circle cx="6" cy="2" r="6" fill="#16a34a" />
        </G>
        <G transform="translate(340, 70)">
          <Circle cx="0" cy="4" r="7" fill="#16a34a" />
          <Circle cx="9" cy="6" r="6" fill="#15803d" />
        </G>

        {/* Foreground Lush Green Crop Rows */}
        <Path
          d="M 0 98 Q 100 88 200 95 Q 300 102 400 92 L 400 120 L 0 120 Z"
          fill="#16a34a"
        />

        {/* Crop furrow strokes */}
        <Path
          d="M 20 106 Q 80 100 150 107"
          stroke="#15803d"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 180 108 Q 260 103 350 110"
          stroke="#15803d"
          strokeWidth="1.5"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
