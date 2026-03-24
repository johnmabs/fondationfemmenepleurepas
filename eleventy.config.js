import path from "node:path";
import * as sass from "sass";
import rssPlugin from "@11ty/eleventy-plugin-rss";
import { RenderPlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import htmlmin from "html-minifier-next";
import postcss from "postcss";
import cssnano from "cssnano";

const isProduction = process.env.NODE_ENV === "production";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("dist");

  // Set directories to pass through to the dist folder
  /*  eleventyConfig.addPassthroughCopy("src/images"); */
  eleventyConfig.addPassthroughCopy("src/fonts");

  // Plugins
  eleventyConfig.addPlugin(rssPlugin);
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin);

  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    useLayouts: false,
    compile: async function (inputContent, inputPath) {
      let parsed = path.parse(inputPath);
      // Don’t compile file names that start with an underscore
      if (parsed.name.startsWith("_")) {
        return;
      }

      const compiled = sass.compileString(inputContent, {
        loadPaths: [parsed.dir || ".", this.config.dir.includes],
        silenceDeprecations: ["import", "global-builtin", "slash-div"],
      });

      let result = compiled.css;
      if (isProduction) {
        const minified = await postcss([cssnano]).process(compiled.css, {
          from: undefined,
        });
        result = minified.content;
      }

      // Map dependencies for incremental builds
      this.addDependencies(inputPath, compiled.loadedUrls);

      return async (data) => {
        return result;
      };
    },
  });

  eleventyConfig.addTemplateFormats("scss");

  if (isProduction) {
    eleventyConfig.addTransform("htmlmin", function (content) {
      if ((this.page.outputPath || "").endsWith(".html")) {
        return htmlmin.minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
        });
      }
      return content;
    });
  }
}

export const config = {
  markdownTemplateEngine: "njk",
  htmlTemplateEngine: "njk",
};
