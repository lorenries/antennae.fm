module.exports = {
  webpack(config, options) {
    /**
     * Optimize and load .svg files as react components with `svgr`
     */
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        //To disable reactification of svg files when referenced by css
        test: /\.\w+(?<!(s?c|sa)ss)$/i,
      },
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            // This option lets us pass a `title` prop to our SVG components, which
            // creates a title element in the SVG as opposed to a `title` attribute
            titleProp: true,
          },
        },
      ],
    });

    return config;
  },
};
