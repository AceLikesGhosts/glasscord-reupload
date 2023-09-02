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

const electron = require("electron");
const fs = require("fs");
const glasstron = require("glasstron");
const path = require("path");
const Main = require("./main.js");

/*
 * The BrowserWindow override class
 */
class BrowserWindow extends electron.BrowserWindow {
	constructor(options) {
		if (process.platform !== "win32") options.transparent = true;
		options.backgroundColor = "#00000000";

		let _contextIsolation = false;
		if (typeof options.webPreferences.contextIsolation !== "undefined")
			_contextIsolation = options.webPreferences.contextIsolation;

		let _preload = null;
		if (typeof options.webPreferences.preload !== "undefined")
			_preload = options.webPreferences.preload;
		options.webPreferences.preload = path.join(__dirname, "preload.js");

		Object.assign(options, Main.getInstance().appConfig.windowProps);

		// We do not call super to get an actual BrowserWindow from electron and not mess with native casts (broke GTK modals)
		const window = new glasstron.BrowserWindow(options);

		window.webContents._glasscord_preload = _preload;
		window.webContents._glasscord_contextIsolation = _contextIsolation;

		window.webContents.on("did-start-loading", () => {
			window.webContents.executeJavaScript(fs.readFileSync(path.resolve(__dirname, "mainworld.js"), "utf8"));
		});

		window.on("close", () => {
			Main.getInstance()._emitWindowClose(window);
		});

		Main.getInstance()._emitWindowInit(window);

		return window;
	}
}

/*
 * Preload querying is handled by this piece of code
 */
electron.ipcMain.on("_glasscord_preload", function waitForPreload(e) {
	if (typeof e.sender._glasscord_preload !== "undefined")
		e.returnValue = e.sender._glasscord_preload;
	else
		setTimeout(waitForPreload, 50, e);
});

/*
 * Context isolation handling
 */
electron.ipcMain.on("_glasscord_contextIsolation", function waitForCtxIsolation(e) {
	if (typeof e.sender._glasscord_contextIsolation !== "undefined")
		e.returnValue = e.sender._glasscord_contextIsolation;
	else
		setTimeout(waitForCtxIsolation, 50, e);
});

module.exports = BrowserWindow;
