/*
 * Copyright 2020 AryToNeX
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *	http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

const path = require("path");
const fs = require("original-fs");
const Utils = require("./utils.js");
const pak = require("../package.json");
const options = {headers: {"user-agent": "glasscord"}};

const pkgDetails = path.parse(path.resolve(__dirname, ".."));

module.exports = async () => {
	if(!Utils.getGlobalConfig().config.autoUpdate){
		console.log("Glasscord autoupdate is disabled!");
		return false;
	}
	
	if(pkgDetails.ext === ".asar"){ // Are we inside an asar?
		console.log("You are running a packaged Glasscord installation!"); // Yes.
		
		// Check write access in the directory.
		try{
			fs.accessSync(pkgDetails.dir, fs.constants.R_OK | fs.constants.W_OK); // asar directory
			fs.accessSync(path.resolve(pkgDetails.dir, pkgDetails.base), fs.constants.R_OK | fs.constants.W_OK); // asar itself
		}catch(e){
			console.log("No write access to the installation folder! Glasscord won't auto update!");
			return false;
		}
		
		try{
			// CALL TO THE GITHUB RELEASES API
			let result = await Utils.httpsGetPromisify("https://api.github.com/repos/AryToNeX/Glasscord/releases/latest", options);
			
			// Let's check for HTTP 200
			if(result.statusCode !== 200){
				console.log("Error while querying GitHub API (releases/latest): status code is " + result.statusCode);
				return false;
			}
			
			let data = JSON.parse(result.data);
			
			// If there's no new version, return here.
			if(Utils.versionCompare(pak.version, data.tag_name.substring(1), {zeroExtend: true}) >= 0)
				return false;
				
			console.log("A new Glasscord update was found! Downloading...");
				
			// Let's traverse the assets array to find our object!
			let url;
			for(let asset of data.assets){
				if(asset.name === "glasscord.asar"){
					url = asset.browser_download_url;
					break;
				}
			}
				
			// Let's download it!
			result = await Utils.httpsGetPromisify(url, options);
			// Again, let's check for errors
			if(result.statusCode !== 200){
				console.log("Error while querying GitHub API (releases/download): status code is " + result.statusCode);
				return false;
			}
				
			// We may want to save the data in a file with a .new extension for now.
			await fs.promises.writeFile(path.resolve(pkgDetails.dir, pkgDetails.name + ".new"), result.data);
			// Let's rename files now
			try{
				await fs.promises.rename(
					path.resolve(
						pkgDetails.dir, pkgDetails.base),
					path.resolve(pkgDetails.dir, pkgDetails.name + "-v" + pak.version + ".old"
					)
				); // Our current .asar becomes .old
				await fs.promises.rename(
					path.resolve(
						pkgDetails.dir, pkgDetails.name + ".new"),
					path.resolve(pkgDetails.dir, pkgDetails.base
					)
				); // The .new file becomes our .asar
			}catch(e){
				console.log("Glasscord update failed upon file renaming!");
			}
			// We finished! The next time Discord is opened, it will have the new version up and running, which is enough.
			console.log("Glasscord update downloaded!");
			return true;
		}catch(e){
			console.error("Glasscord update was abnormally interrupted", e);
		}
	}
	return false;
};

