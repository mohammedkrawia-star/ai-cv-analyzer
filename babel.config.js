module.exports = function (api) {
  api.cache(true);
  return {
    // NOTE: babel-preset-expo in SDK 54 automatically registers the
    // react-native-reanimated and react-native-worklets plugins, so they
    // must NOT be listed again here (that causes a "Duplicate plugin"
    // Metro error AND, if preset ordering differs, can break the release
    // build's JSI module initialization).
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins: [],
  };
};
