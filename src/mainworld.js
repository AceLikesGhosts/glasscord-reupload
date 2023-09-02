/*
  * Copyright 2020 AryToNeX
  * 
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  * 
  *     http://www.apache.org/licenses/LICENSE-2.0
  * 
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
"use strict";

/* eslint-disable no-undef */

function _watchdog(node){
	GlasscordApi.refresh();
	function callback(mutationsList){
		let shouldUpdate = false;
		for(let mutation of mutationsList){
			if(mutation.target.nodeName.toLowerCase() === "style"){ // text in style has changed!
				shouldUpdate = true;
				break;
			}
			
			if(mutation.addedNodes.length !== 0){ // some nodes were added!
				for(let addedNode of mutation.addedNodes){
					if(addedNode.nodeName.toLowerCase() === "style"){
						shouldUpdate = true;
						break;
					}
				}
			}
			
			if(shouldUpdate) break; // don't spend other time iterating
			
			if(mutation.removedNodes.length !== 0){ // some nodes were removed!
				for(let removedNode of mutation.removedNodes){
					if(removedNode.nodeName.toLowerCase() === "style"){
						shouldUpdate = true;
						break;
					}
				}
			}
		}
		
		if(shouldUpdate) GlasscordApi.refresh();
	}
	const observer = new MutationObserver(callback);
	observer.observe(node, {childList: true, subtree: true});
}

document.body.classList.add("glasscord");
_watchdog(document.head);
