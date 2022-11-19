// ==UserScript==
// @id             iitc-plugin-portal-highlighter-uniques-opacity
// @name           IITC plugin: Highlight unique visits/captures using opacity
// @category       Highlighter
// @version        0.2.2
// @namespace      https://github.com/StigAng/vigilant-system
// @downloadURL    https://github.com/StigAng/vigilant-system/raw/main/IITC-plugin-Highlight-uniques.user.js.user.js
// @description    Used Highlighter to show Unique captures and visits
// @match          https://intel.ingress.com/*
// @match          https://intel-x.ingress.com/*
// @match          https://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

//use own namespace for plugin
window.plugin.portalHighlighterUniquesOpacity = function () {};

window.plugin.portalHighlighterUniquesOpacity.highlighter = {
  highlight: function(data) {
    var portalData = data.portal.options.ent[2]
    var uniqueInfo = null;

    if (portalData[18]) {
      uniqueInfo = {
        captured: ((portalData[18] & 0b10) !== 0),
        visited: ((portalData[18] & 0b11) !== 0)
      };
    }

    var style = {};

    if(uniqueInfo) {
      if(uniqueInfo.captured) {
        // captured (and, implied, visited too) - hide
        style.fillOpacity = 0;
        style.opacity = 0.25;

      } else if(uniqueInfo.visited) {
        style.fillOpacity = 0.2;
        style.opacity = 1;
      }
    } else {
      // no visit data at all
      style.fillOpacity = 0.8;
      style.opacity = 1;
    }

    data.portal.setStyle(style);
  }
}


var setup = function() {
  window.addPortalHighlighter('Uniques (opacity)', window.plugin.portalHighlighterUniquesOpacity.highlight);
}

//PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
