import { StyleSheet, View } from 'react-native';

import LogoSvg from '@/assets/logo/myshepherdline-mark.svg';

type LogoMarkProps = {
  size?: number;
};

export function LogoMark({ size = 96 }: LogoMarkProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.22 }]}>
      <LogoSvg width={size * 0.75} height={size * 0.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
