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

const Glasstron = require("glasstron");
const Module = require("../module.js");

module.exports = class Linux extends Module{
	static isCore = true;
	static platform = ["linux"];
	cssProps = ["--glasscord-linux-blur", "--glasscord-gnome-sigma", "--glasscord-blur-corner-radius"];
	
	// eslint-disable-next-line class-methods-use-this
	async update(win, cssProp, value){
		switch(cssProp){
			case "--glasscord-linux-blur":
				value = (typeof value === "string" && value.toLowerCase() === "true");
				await win.setBlur(value);
				break;
			case "--glasscord-gnome-sigma":
				if(typeof win.blurGnomeSigma === "undefined") break;
				win.blurGnomeSigma = parseInt(value);
				break;
			case "--glasscord-blur-corner-radius":
				if(typeof win.blurCornerRadius === "undefined") break;
				win.blurCornerRadius = parseInt(value);
				break;
		}
	}
	
	// eslint-disable-next-line class-methods-use-this
	_getXWindowManager(){
		return Glasstron.getPlatform()._getXWindowManager();
	}
};
