// ==UserScript==
// @id             iitc-plugin-link-show-age
// @name           IITC plugin: Show the age of links on the map
// @category       Tweaks
// @version        0.0.13
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://www.renevlugt.nl/iitc-plugins/linkage.meta.js
// @downloadURL    https://www.renevlugt.nl/iitc-plugins/linkage.user.js
// @description    Show the age of links on the map by changing opacity to min 0.5
// @author         Vashiru
// @include        *://*.ingress.com/intel*
// @include        *://*.ingress.com/mission/*
// @include        *://intel.ingress.com/*
// @match          *://*.ingress.com/intel*
// @match          *://*.ingress.com/mission/*
// @match          *://intel.ingress.com/*
// @grant          none
// ==/UserScript==

/* globals GM_info, L, map, addHook, $ */

/*eslint linebreak-style: [2, "unix"]*/
/*eslint object-curly-spacing: [2, "never"]*/

/*eslint space-after-keywords: 0*/

/*eslint indent: ["error", 4] */
/*eslint keyword-spacing: ["error", { "after": false }] */
/*eslint space-infix-ops: 0 */

function wrapper(plugin_info) {
    'use strict';

    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
    //(leaving them in place might break the 'About IITC' page or break update checks)
    plugin_info.buildName = 'link-show-age';
    plugin_info.dateTimeVersion = '20151203.74206.1';
    plugin_info.pluginId = 'link-show-age';
    //END PLUGIN AUTHORS NOTE

    // PLUGIN START ////////////////////////////////////////////////////////

    // use own namespace for plugin
    window.plugin.linkShowAge = function() {};
    var self = window.plugin.linkShowAge;
    self.addLinkAge = function() {
        if(self.disabled) return;

        for(var link in window.links) {
            var linkData = window.links[link];
            var age = new Date() - linkData.options.timestamp;
            var age_h = age / 3600 / 1E3;
            var opacity,
                width;
            if(age_h >= 5) {
                opacity = 0.5;
                width = 2;
            } else{
                opacity = 1 - age_h * 0.1;
                width = 6 - age_h * 0.5;
            }

            linkData.setStyle({opacity: opacity, weight: width, clickable: true});
        }
    };

    self.removeLinkAge = function() {
        for(var link in window.links) {
            window.links[link].setStyle({opacity: 1, weight: 2, clickable: true});
        }
    };

    self.createLayer = function() {
        self.linkLayer = new L.FeatureGroup();
        self.linkLayerGuids = {};
        window.addLayerGroup('Link age', self.linkLayer, true);

        map.on('layeradd', function(obj) {
            if(obj.layer === self.linkLayer) {
                self.disabled = false;
                self.addLinkAge();
            }
        });
        map.on('layerremove', function(obj) {
            if(obj.layer === self.linkLayer) {
                self.removeLinkAge();
                self.disabled = true;
                self.linkLayer.clearLayers();
            }
        });

        // ensure 'disabled' flag is initialised
        if(!map.hasLayer(self.linkLayer)) {
            self.disabled = true;
        }
    };

    self.requestChatDataForLinkCreation = function(linkGuid) {
        var link = window.links[linkGuid];
        var minLatE6;
        var maxLatE6;
        var minLngE6;
        var maxLngE6;

        var latlngs=link.getLatLngs();

        if(latlngs[0].lat < latlngs[1].lat) {
            minLatE6 = latlngs[0].lat*1E6;
            maxLatE6 = latlngs[1].lat*1E6;
        } else{
            minLatE6 = latlngs[1].lat*1E6;
            maxLatE6 = latlngs[0].lat*1E6;
        }

        if(latlngs[0].lng < latlngs[1].lng) {
            minLngE6 = latlngs[0].lng*1E6;
            maxLngE6 = latlngs[1].lng*1E6;
        } else{
            minLngE6 = latlngs[1].lng*1E6;
            maxLngE6 = latlngs[0].lng*1E6;
        }

        var created=link.options.timestamp;

        var d = {
            minLatE6: Math.round(minLatE6),
            minLngE6: Math.round(minLngE6),
            maxLatE6: Math.round(maxLatE6),
            maxLngE6: Math.round(maxLngE6),
            minTimestampMs: created-10000,
            maxTimestampMs: created+10000,

            tab: 'all'
        };

        window.postAjax(
            'getPlexts',
            d,
            function(data, textStatus, jqXHR) { self.handleChatData(data, link); },
            function() { console.log('Show Link Age: Custom Chat Request Failed'); }  // eslint-disable-line no-console
        );
    };

    self.handleChatData = function(data, link) {

        //console.log(JSON.stringify(data.result));

        var linkChatIdx,
            chatrow;

        var latlngs=link.getLatLngs();

        var linkPortal1lat = latlngs[0].lat  * 1E6;
        var linkPortal1lng = latlngs[0].lng * 1E6;

        var linkPortal2lat = latlngs[1].lat * 1E6;
        var linkPortal2lng = latlngs[1].lng * 1E6;


        for(var chatidx=0;chatidx<data.result.length;chatidx++) {
            chatrow=data.result[chatidx];
            if(chatrow[2].plext.markup[1][1].plain==' linked ') {
                var portal1lat = chatrow[2]['plext']['markup'][2][1]['latE6'];
                var portal1lng = chatrow[2]['plext']['markup'][2][1]['lngE6'];

                var portal2lat = chatrow[2]['plext']['markup'][4][1]['latE6'];
                var portal2lng = chatrow[2]['plext']['markup'][4][1]['lngE6'];


                if((portal1lat == linkPortal1lat && portal1lng == linkPortal1lng) || (portal1lat == linkPortal2lat && portal1lng == linkPortal2lng)) {
                    if((portal2lat == linkPortal1lat && portal2lng == linkPortal1lng) || (portal2lat == linkPortal2lat && portal2lng == linkPortal2lng)) {
                        linkChatIdx = chatidx;
                    }
                }
            }
        }

        if(linkChatIdx != null) {
            chatrow=data.result[linkChatIdx];
            var agentname = chatrow[2]['plext']['markup'][0][1]['plain']; //Agentname
            var linkedFromPortal = chatrow[2]['plext']['markup'][2][1]['name']; // Linked from Portalname
            var linkedToPortal = chatrow[2]['plext']['markup'][4][1]['name']; // Linked to Portalname

            $('.byAgent').removeAttr('onClick');
            $('.byAgent').text(agentname);
            $('.byAgent').addClass('nickname');
            $('.fromPortal').text(linkedFromPortal);
            $('.toPortal').text(linkedToPortal);

            link.agentName = agentname;
            link.portal1 = linkedFromPortal;
            link.portal2 = linkedToPortal;

        } else{
            $('.byAgent').removeClass('enl');
            $('.byAgent').removeClass('res');
            $('.byAgent').text('Could not retrieve data');
            $('.byAgent').css('color','#F00');
        }
    };

    self.getDistanceFromLatLngInKm = function(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = self.deg2rad(lat2 - lat1); // self.deg2rad below
        var dLon = self.deg2rad(lon2 - lon1);
        var a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(self.deg2rad(lat1)) * Math.cos(self.deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    };

    self.deg2rad = function(deg) {
        return deg * (Math.PI / 180);
    };

    // Generates the text info of the links
    self.shareLink = function( event, linkGuid, callback) {
        var link = window.links[linkGuid];
        var dateOrigin = new Date(link.options.timestamp);

        var latlngs=link.getLatLngs();

        var linkPortal1lat = latlngs[0].lat;
        var linkPortal1lng = latlngs[0].lng;
        var linkPortal2lat = latlngs[1].lat;
        var linkPortal2lng = latlngs[1].lng;

        var linkTeam = link.options.data.team;

        var team = '';
        if(linkTeam == 'E')
            team = 'Enl';
        else
            team = 'Res';

        var distance = self.getDistanceFromLatLngInKm(linkPortal1lat, linkPortal1lng, linkPortal2lat, linkPortal2lng).toFixed(3) + ' km.';

        var agentName = '';
        var mdAgentName = '';
        if(link.agentName) {
            agentName = ' by ' + link.agentName;
            mdAgentName = ' by *' + link.agentName + '*';
        }

        var text = team + ' Link thrown' + agentName + ' on ' + dateOrigin.toLocaleString() + ' \r\n' +
            'From: ' + link.portal1 + ' https://www.ingress.com/intel?ll='+linkPortal1lat+','+linkPortal1lng+'&z=17&pll='+linkPortal1lat+','+linkPortal1lng+'  \r\n' +
            'To: ' + link.portal2 + ' https://www.ingress.com/intel?ll='+linkPortal2lat+','+linkPortal2lng+'&z=17&pll='+linkPortal2lat+','+linkPortal2lng+'  \r\n' +
            'Length: ' + distance;


        // Inject first a link to google maps until disablePreview works, this way Telegram doesn't generate preview link the first time
        var markdownText = '*' + team + ' Link* thrown' + mdAgentName + ' on ' + dateOrigin.toLocaleString() + '  \r\n' +
            'From[:](https://www.google.com/maps/place/' + linkPortal1lat+','+linkPortal1lng + ') ' +
            '[' + link.portal1 + '](https://www.ingress.com/intel?ll='+linkPortal1lat+','+linkPortal1lng+'&z=17&pll='+linkPortal1lat+','+linkPortal1lng+')  \r\n' +
            'To: [' + link.portal2 + '](https://www.ingress.com/intel?ll='+linkPortal2lat+','+linkPortal2lng+'&z=17&pll='+linkPortal2lat+','+linkPortal2lng+')  \r\n' +
            'Length: ' + distance;

        if(!callback) {
            // To use share dropdown
            window.plugin.baseUtils.shareText(text, 'Link data', event, {
                markdownText: markdownText,
                disablePreview : true
            });
        } else{
            // Direct call to each share method
            callback(text, 'Link data', {
                markdownText: markdownText,
                disablePreview : true
            });
        }

    };

    // Create the popup data only when it's requested
    self.createPopupData = function( ev, link) {
        var dateOrigin = new Date(link.options.timestamp);
        var age = new Date() - link.options.timestamp;
        var linkGuid = link.options.guid;
        var days = Math.floor(age / (1000 * 60 * 60 * 24));
        age -=  days * (1000 * 60 * 60 * 24);

        var hours = Math.floor(age / (1000 * 60 * 60));
        age -= hours * (1000 * 60 * 60);

        var mins = Math.floor(age / (1000 * 60));
        age -= mins * (1000 * 60);

        var seconds = Math.floor(age / 1000);
        age -= seconds * 1000;

        var latlngs = link.getLatLngs();

        var linkPortal1lat = latlngs[0].lat;
        var linkPortal1lng = latlngs[0].lng;

        var linkPortal2lat = latlngs[1].lat;
        var linkPortal2lng = latlngs[1].lng;

        var linkTeam = link.options.data.team;

        var teamClass = null;
        if(linkTeam == 'E') {
            teamClass = 'enl';
        } else{
            teamClass = 'res';
        }

        link.portal1 = getPortalTitleByLatLng( latlngs[0] );
        link.portal2 = getPortalTitleByLatLng( latlngs[1] );

        var agent = '<a onclick="window.plugin.linkShowAge.requestChatDataForLinkCreation(\''+linkGuid+'\');return false;" class="byAgent '+teamClass+'">Click to retrieve</a>';

        if(link.agentName)
            agent = '<a class="nickname ' + teamClass + '">' + link.agentName + '</a>';

        if(days > 30)
            agent = '<span>Link too old</span>';

        var popup = $('<div>')
            .addClass('baseutils-popup');

        popup.append('Age: ' + days + ' days, ' + hours + ' hours, ' + mins + ' minutes, ' + seconds + ' seconds' + '<br>' +
                    'Date: ' + dateOrigin.toLocaleString()+'<br>'+
                    'Thrown by: ' + agent);

        createPortalNode(popup, 'From', latlngs[0], link.portal1, 'fromPortal ' + teamClass);
        createPortalNode(popup, 'To', latlngs[1], link.portal2, 'toPortal ' + teamClass);

        var $fragment = $('<br><span>Length: ' + self.getDistanceFromLatLngInKm(linkPortal1lat, linkPortal1lng, linkPortal2lat, linkPortal2lng).toFixed(3) + ' km</span>');
        popup.append($fragment);

        if(window.plugin.baseUtils) {
            var $share = $('<br><span>Share: </span>');
            /*
            // To use share dropdown
            var $a = $('<a>');
            $a.append( window.plugin.baseUtils.getIcon() );
            $a.click( function( e ) {
                self.shareLink( e, linkGuid, null );
            });
            $share.append($a);
            */
            // buttons for each share option. it's too big
            window.plugin.baseUtils.shareOptions.forEach( function( option ) {
                var $a = $('<a>');
                $a.append(option.icon);
                $a.append(option.shortTitle || option.title);
                $a.on('click', function(e) {
                    self.shareLink( e, linkGuid, option.callback );
                });

                $share.append($a);
                $share.append(' ');
            });

            popup.append( $share );
        }

        ev.popup.setContent( popup[0] );
    };

    function createPortalNode(popup, text, latlng, name, teamClass) {
        var $fragment = $('<br><span>' + text + ': </span>');
        var $a = $('<a>');
        $a.attr('href', '/intel?ll=' + latlng.lat + ',' + latlng.lat + '&z=17&pll=' + latlng.lat + ',' + latlng.lat);
        $a.addClass(teamClass);
        $a.append( name );
        $a.click( function( e ) {
            e.preventDefault();

            window.selectPortalByLatLng(latlng.lat, latlng.lng);
            if(name == 'Portal not loaded') {
                name = getPortalTitleByLatLng(latlng);
                $a.text( name );

                // if still not loaded right now, add event to wait for portal loaded details.
                if(name == 'Portal not loaded') {
                    var onPortalDetailsUpdated = function() {
                        name = getPortalTitleByLatLng(latlng);
                        if(name == 'Portal not loaded')
                            return;

                        $a.text( name );
                        window.removeHook('portalDetailsUpdated', onPortalDetailsUpdated);
                    };

                    window.addHook('portalDetailsUpdated', onPortalDetailsUpdated);
                }

            }
        });
        $fragment.append($a);
        popup.append($fragment);
    }

    function getPortalTitleByLatLng(latlng) {
        var guid = window.findPortalGuidByPositionE6( 1E6 * latlng.lat, 1E6 * latlng.lng);
        if(!guid)
            return 'Portal not loaded';
        var portal = window.portals[ guid ];
        if(!portal || !portal.options.data.title)
            return 'Portal not loaded';
        return portal.options.data.title;
    }

    var setup = function() {
        self.createLayer();
        addHook('mapDataRefreshEnd', self.addLinkAge);
        addHook('linkAdded', function(data) {
            var link = data.link;

            link.setStyle({clickable: true});

            link.bindPopup('placeholder');

            link.on('popupopen', function(ev) {
                self.createPopupData(ev, link);
            });

        });

        // function (data, link, callback) =? chat request
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
if(typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = {version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description};
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
