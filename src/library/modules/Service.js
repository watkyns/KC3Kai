/* Service.js
KC3改 Background Service.

It is always running, from Chrome startup until the browser is closed or explicitly terminated.
This will serve as a central script that lets devtools and content scripts communicate.
Sometimes, the scripts on different parts of the extension cannot communicate with each other, thus this can relay messages and events for them.
Sometimes, specific scripts do not have access to Chrome APIs. Those scripts can then request it to be done by this service.

Ultimately, this script handles data management on aspects that are best centralized such as:
> [Countdown Timers]
To have a consistent timer unaffected by lags on devtools and Chrome tabs
> [Quest Management]
To ensure all components are synced in real-time without relying on localStorage

The above aspects are imported into the background service, and not necessarily on this file.
See Manifest File [manifest.json] under "background" > "scripts"
*/
(function(){
	"use strict";
	
	console.log("KC3改 Background Service loaded");
	
	window.KC3Service = {
		
		/* SET API LINK
		API Link extracted, save and open
		------------------------------------------*/
		"set_api_link" :function(request, sender, callback){
			try {
				// Set api link on internal storage
				localStorage.absoluteswf = request.swfsrc;
				
				// If refreshing API link, close source tabs and re-open game frame
				if(localStorage.extract_api==="true"){
					localStorage.extract_api = false;
					window.open("../pages/game/api.html", "kc3kai_game");
					chrome.tabs.remove([sender.tab.id], function(){});
				}
			}catch(e){ console.error(e); }
		},
		
		
		/* NOTIFY DESKTOP
		Check if tab is a KC3改 frame and tell to override styles or not
		------------------------------------------*/
		"notify_desktop" :function(request, sender, callback){
			try {
				// Clear old notification first
				chrome.notifications.clear("kc3kai_"+request.notifId, function(){
					// Add notification
					chrome.notifications.create("kc3kai_"+request.notifId, request.data);
				});
			}catch(e){ console.error(e); }
		},
		
		/* ACTIVATE GAME
		Try to activate game inside inspected tab
		------------------------------------------*/
		"activate_game" :function(request, sender, response){
			(new TMsg(request.tabId, "gamescreen", "activate_game", {}, response)).execute();
			return true; // dual-async response
		},
		
		/* SCREENSHOT
		Ask the game container to take a screenshot
		------------------------------------------*/
		"screenshot" :function(request, sender, response){
			(new TMsg(
				request.tabId,
				"gamescreen",
				"screenshot",
				{ playerIndex: request.playerIndex }
			)).execute();
		}
		
	};
	
	/* Runtime Message Listener
	https://developer.chrome.com/extensions/messaging#simple
	This script will wait for messages from other parts of the extension
	and execute what they want if applicable
	*/
	chrome.runtime.onMessage.addListener(function(request, sender, callback){
		// Log message contents and sender for debugging
		console.log("Received message", request, "from", sender);
		
		// Check if message is intended for this script
		if( (request.identifier || false) == "kc3_service"){
			
			// Check requested action is supported
			if(typeof window.KC3Service[ request.action ] != "undefined"){
				// Execute and pass callback to function
				window.KC3Service[ request.action ](request, sender, callback);
				return true; // dual-async response
			}else{
				// Unknown action
				response({ success: false });
			}
		
		}
	});
	
	(new TMsg(123, "gamescreen", "activate_game")).execute();
	
})();