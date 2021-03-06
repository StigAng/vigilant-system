// ==UserScript==
// @id             iitc-plugin-highlight-portals-fully-deployed
// @name           IITC plugin: highlight portals fully deployed
// @category       Highlighter
// @version        0.1.2.20170331.0915
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @downloadURL    http://charlieoscardeltaecho.com/iitc_plugins/iitc-plugin-portal-highlighter-fully-deployed.user.js
// @description    Remove Portals that arent' fully deployed.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'iitc';
plugin_info.pluginId = 'portal-highlighter-fully-deployed';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalsFullyDeployed = function() {};

window.plugin.portalsFullyDeployed.highlight = function(data) {

    var res_count = data.portal.options.data.resCount;

    if( res_count < 8) {
      var fill_opacity = 0;
      var color = '';
      var params = {fillColor: color, fillOpacity: fill_opacity, stroke: false};
      data.portal.setStyle(params);
    }
};

var setup =  function() {
  window.addPortalHighlighter('Portals Fully Deployed', window.plugin.portalsFullyDeployed.highlight);
};

// PLUGIN END //////////////////////////////////////////////////////////


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


