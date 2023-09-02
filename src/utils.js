/*
   Copyright 2020 AryToNeX

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
"use strict";

const path = require("path");
const fs = require("fs-extra");
const electron = require("electron");
const https = require("https");
const crypto = require("crypto");
const Config = require("./config.js");
const rootApps = require("./resources/root_applications.json5");

class Utils{

	static getAppName(){
		if(electron.app.name !== "Electron")
			return electron.app.name;
		return path.parse(process.argv[0]).name;
	}

	static getRootAppName(){
		for(let rootAppName in rootApps)
		{for(let possibleCurrentApp of rootApps[rootAppName])
			if(this.getAppName() === possibleCurrentApp) return rootAppName;}
		return this.getAppName();
	}

	static getSavePath(){
		return path.resolve(electron.app.getPath("appData"), "glasscord");
	}

	static getModuleConfig(moduleName, defaultConfig = {}, ensureWrite = false){
		return new Config(
			path.resolve(this.getSavePath(), this.getAppName(), moduleName, "config.json5"),
			defaultConfig,
			ensureWrite
		);
	}

	static getAppConfig(){
		return new Config(
			path.resolve(this.getSavePath(), this.getAppName(), "config.json5"),
			require("./resources/config_app.json5"),
			true
		);
	}

	static getGlobalConfig(){
		if(!this._config) {this._config = new Config(
			path.resolve(this.getSavePath(), "config.json5"),
			require("./resources/config.json5")
		);}
		return this._config;
	}

	static copyBundledConfiguration(){
		const bundledConfigPath = path.resolve(electron.app.getAppPath(), "..", "_glasscord");
		if(fs.existsSync(bundledConfigPath))
			fs.copySync(bundledConfigPath, this.getSavePath(), {overwrite: false});
	}

	static isEmpty(obj) {
		if (obj == null || obj === undefined || obj === "") return true;
		if (typeof(obj) !== "object") return false;
		if (Array.isArray(obj)) return obj.length === 0;
		for (const key in obj) 
			// eslint-disable-next-line no-prototype-builtins
			if (obj.hasOwnProperty(key)) return false;
		
		return true;
	}

	static httpsGet(url, options, callback){
		https.get(url, options, result => {
			if(result.statusCode === 301 || result.statusCode === 302){
				this.httpsGet(result.headers.location, options, callback);
				return;
			}
			let data = Buffer.alloc(0);
			result.on("data", chunk => {data = Buffer.concat([data, chunk]);});
			result.on("end", () => {
				result.data = data;
				callback(result);
			});
		});
	}
	
	static httpsGetPromisify(url, options){
		return new Promise(resolve => {
			this.httpsGet(url, options, resolve);
		});
	}

	static hash(algo, value){
		return crypto.createHash(algo).update(value).digest("hex");
	}

	// https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
	static versionCompare(v1, v2, options) {
		var lexicographical = options && options.lexicographical,
			zeroExtend = options && options.zeroExtend,
			v1parts = v1.split("."),
			v2parts = v2.split(".");

		function isValidPart(x) {
			return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
		}

		if(!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) return undefined;

		if(zeroExtend) {
			while (v1parts.length < v2parts.length) v1parts.push("0");
			while (v2parts.length < v1parts.length) v2parts.push("0");
		}

		if (!lexicographical) {
			v1parts = v1parts.map(Number);
			v2parts = v2parts.map(Number);
		}

		for (var i = 0; i < v1parts.length; ++i) {
			if (v2parts.length === i) return 1;
			if (v1parts[i] === v2parts[i]) continue;
			else if (v1parts[i] > v2parts[i]) return 1;
			else return -1;
		}

		if (v1parts.length !== v2parts.length) return -1;

		return 0;
	}

}

module.exports = Utils;
