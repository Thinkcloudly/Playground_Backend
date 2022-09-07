// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const SwaggerJSDocWebpackPlugin = require("swagger-jsdoc-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";
const config = {
	entry: "./src/api.ts",
	target: "node",
	output: {
		filename: "api.js",
		path: path.resolve(__dirname, "build"),
	},
	devServer: {
		open: true,
		host: "localhost",
	},
	plugins: [
		new SwaggerJSDocWebpackPlugin({
			definition: {
				openapi: "3.0.0",
				info: {
					title: "ThinkCloudly Playground App",
					version: "1.0.0",
				},
				servers: [{ url: "https://thinkcloudly-playground.netlify.app/.netlify/functions/api" }],
			},
			apis: ["./src/**/*.ts"],
		}),
		// Add your plugins here
		// Learn more about plugins from https://webpack.js.org/configuration/plugins/
	],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: "ts-loader",
				exclude: ["/node_modules/"],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
				type: "asset",
			},

			// Add your rules for custom modules here
			// Learn more about loaders from https://webpack.js.org/loaders/
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
	},
};

module.exports = () => {
	if (isProduction) {
		config.mode = "production";
	} else {
		config.mode = "development";
	}
	return config;
};
