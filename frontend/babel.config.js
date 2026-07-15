module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // App does not use Reanimated/worklets; skip those Babel plugins.
          reanimated: false,
          worklets: false,
        },
      ],
    ],
  };
};
