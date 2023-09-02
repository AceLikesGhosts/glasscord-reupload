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

const Module = require("../module.js");
const path = require("path");
const fs = require("fs");
const Main = require("../main.js");
const electron = require("electron");

module.exports = class CSSLoader extends Module {
	static defaultOn = true;
	static defaultConfig = {cssPath: ""};
	static ensureConfigFile = true;

	onLoad(){
		this.injectionMap = {};
		
		if(!this.config.cssPath) this.config.cssPath = "";
		
		if(this.config.cssPath.length !== 0 && !path.isAbsolute(this.config.cssPath))
			this.config.cssPath = path.resolve(this.getStoragePath(), this.config.cssPath);
		
		for(let win of electron.BrowserWindow.getAllWindows())
			this.windowInit(win);

		if(this.config.cssPath.length !== 0)
			this.watcher = this._cssWatch();
		else
			this.logGlobal("No CSS file specified!", "log");
	}

	onUnload(){
		delete this.watcher;
		
		for(let webContentsID in this.injectionMap){
			let webContents = electron.webContents.fromId(parseInt(webContentsID));
			Main._executeInRenderer(webContents, this._unload);
			webContents.removeListener("dom-ready", this.injectionMap[webContentsID]);
			
			// remove from map
			delete this.injectionMap[webContentsID];
		}
	}

	windowInit(win){
		if(typeof this.injectionMap[win.webContents.id] !== "undefined") return;
		const _this = this;
		this.injectionMap[win.webContents.id] = async () => {await _this._cssRead(win.webContents);};

		// check if already ready and update accordingly
		Main._executeInRenderer(win.webContents, this._getReadyState).then(async ready => {
			if(ready)
				await this._cssRead(win.webContents);
			win.webContents.on("dom-ready", this.injectionMap[win.webContents.id]);
		});
	}
	
	windowClose(win){
		// remove from map
		delete this.injectionMap[win.webContents.id];
	}

	async _cssRead(webContents){
		if(this.config.cssPath.length === 0) return;
		const css = await fs.promises.readFile(this.config.cssPath, {encoding: "utf8"});
		this.logGlobal("CSS file read, now sending to renderer", "log");
		Main._executeInRenderer(webContents, this._load, css);
	}
	
	_cssWatch(){
		return fs.watch(
			this.config.cssPath,
			{encoding: "utf8"},
			async (eventType) => {
				if(eventType === "change"){
					const css = await fs.promises.readFile(this.config.cssPath, {encoding: "utf8"});
					for(let webContentsID in this.injectionMap){
						let webContents = electron.webContents.fromId(parseInt(webContentsID));
						Main._executeInRenderer(webContents, this._load, css);
					}
				}
			}
		);
	}

	// Renderer functions
	/* eslint-disable no-undef */
	/* eslint-disable class-methods-use-this */
	_load(css){
		if(typeof css === "undefined" || (typeof css === "string" && css.length === 0)) return;

		if(typeof window._glasscord_customCss === "undefined"){
			window._glasscord_customCss = document.createElement("style");
			window._glasscord_customCss.id = "glasscord-custom-css";
			document.head.appendChild(window._glasscord_customCss);
		}

		window._glasscord_customCss.innerHTML = css;
		console.log("%c[Glasscord] %cCustom stylesheet loaded!", "color:#ff00ff;font-weight:bold", "color:inherit;font-weight:normal;");
	}
	
	_unload(){
		if(window._glasscord_customCss){
			document.head.removeChild(window._glasscord_customCss);
			delete window._glasscord_customCss;
		}
	}

	_getReadyState(){
		return document.readyState === "complete" || document.readyState === "interactive";
	}

};
