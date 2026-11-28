/**
 * Minimal stand-in for react-native-reanimated in Jest.
 *
 * Reanimated 4.7's own mock initialises the native module and throws under the
 * jest-expo preset, so tests use this instead: animations jump straight to their
 * final value, animated components are the plain React Native ones.
 */
const { useRef } = require('react');
const RN = require('react-native');

/** Anything chained (layout animations, Easing helpers) resolves to a callable that returns itself. */
const chain = () => {
  const fn = function chained() {
    return proxy;
  };
  const proxy = new Proxy(fn, { get: (_t, key) => (key === Symbol.toPrimitive ? () => 0 : proxy), apply: () => proxy });
  return proxy;
};

const interpolate = (x, input, output) => {
  if (!input.length) return 0;
  if (x <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (x <= input[i]) {
      const span = input[i] - input[i - 1] || 1;
      return output[i - 1] + ((x - input[i - 1]) / span) * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
};

const lastArg = (...args) => args[args.length - 1];

const Animated = {
  View: RN.View,
  Text: RN.Text,
  Image: RN.Image,
  ScrollView: RN.ScrollView,
  FlatList: RN.FlatList,
  createAnimatedComponent: (component) => component,
};

const api = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (initial) => useRef({ value: initial }).current,
  useDerivedValue: (fn) => ({ value: fn() }),
  useAnimatedStyle: (fn) => {
    try {
      return fn();
    } catch {
      return {};
    }
  },
  useAnimatedProps: (fn) => fn(),
  useAnimatedRef: () => useRef(null),
  useReducedMotion: () => false,
  withTiming: (value, _config, done) => {
    done?.(true);
    return value;
  },
  withSpring: (value, _config, done) => {
    done?.(true);
    return value;
  },
  withDecay: () => 0,
  withDelay: (_delay, value) => value,
  withSequence: lastArg,
  withRepeat: (value) => value,
  cancelAnimation: () => {},
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  interpolate,
  interpolateColor: (_x, _input, output) => output[0],
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Easing: chain(),
  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
};

module.exports = new Proxy(api, {
  get: (target, key) => (key in target ? target[key] : chain()),
});
