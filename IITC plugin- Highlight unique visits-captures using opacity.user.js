// ==UserScript==
// @id             iitc-plugin-portal-highlighter-uniques-opacity
// @name           IITC plugin: Highlight unique visits/captures using opacity
// @category       Highlighter
// @version        0.2.2
// @namespace      https://github.com/StigAng/vigilant-system
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    Use stroke and fill opacity to denote player's unique visits and captures. Requires uniques plugin.
// @match          https://intel.ingress.com/*
// @match          https://intel-x.ingress.com/*
// @match          https://*.ingress.com/intel*
// @match          https://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

//PLUGIN START ////////////////////////////////////////////////////////

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
  window.addPortalHighlighter('Uniques (opacity)', window.plugin.portalHighlighterUniquesOpacity.highlighter);
}

//PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
