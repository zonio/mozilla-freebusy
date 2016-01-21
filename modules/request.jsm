/* ***** BEGIN LICENSE BLOCK *****
 * Zonio Freebusy for Lightning
 * Copyright © 2016 Zonio s.r.o.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function ChannelCallbacks(repeatCall, onError) {
  var channelCallbacks = this;
  var badCertListener;

  function getInterface(iid, result) {
    if (!iid.equals(Components.interfaces.nsIBadCertListener2)) {
      throw Components.Exception(
        'Given interface is not supported',
        Components.results.NS_ERROR_NO_INTERFACE
      );
    }

    return badCertListener;
  }

  function isActive() {
    return badCertListener.isActive();
  }

  function init() {
    badCertListener = new BadCertListener(repeatCall, onError);
  }

  channelCallbacks.QueryInterface = XPCOMUtils.generateQI([
    Components.interfaces.nsIInterfaceRequestor
  ]);
  channelCallbacks.getInterface = getInterface;
  channelCallbacks.isActive = isActive;

  init();
}

function BadCertListener(repeatCall, onError) {
  var badCertListener = this;
  var window;
  var active;

  function notifyCertProblem(socketInfo, status, targetSite) {
    if (active) {
      return;
    }

    active = true;
    window.setTimeout(function() {
      showBadCertDialogAndRetryCall({
        'exceptionAdded': false,
        'prefetchCert': true,
        'location': targetSite
      });
    }, 0);
  }

  function showBadCertDialogAndRetryCall(parameters) {
    window.openDialog(
      'chrome://pippki/content/exceptionDialog.xul',
      '',
      'chrome,centerscreen,modal',
      parameters
    );

    active = false;
    if (parameters['exceptionAdded']) {
      repeatCall();
    } else {
      onError(Components.Exception(
        'Server certificate exception not added',
        Components.results.NS_ERROR_FAILURE
      ));
    }
  }

  function isActive() {
    return active;
  }

  function init() {
    window = Services.wm.getMostRecentWindow(null);
    active = false;
  }

  badCertListener.QueryInterface = XPCOMUtils.generateQI([
    Components.interfaces.nsIInterfaceRequestor
  ]);
  badCertListener.notifyCertProblem = notifyCertProblem;
  badCertListener.isActive = isActive;

  init();
}

function getFreebusy(attendee, start, end, listener) {
  function onResponse(event) {
    if (event.target.status == 200) {
      listener(successResult(event.target.responseText));
    } else {
      listener(errorResult(event.target.responseText));
    }
  }

  function onError(event) {
    if (channelCallbacks.isActive()) {
      return;
    }
    listener(errorResult('Transport error'));
  }

  function onCertError(exception) {
    listener(errorResult(exception.message));
  }

  function performRequest() {
    var channelCallbacks = new ChannelCallbacks(performRequest, onCertError);

    var xhr = Components.classes['@mozilla.org/xmlextras/xmlhttprequest;1']
      .createInstance(Components.interfaces.nsIXMLHttpRequest);

    xhr.open('GET', buildUrl(attendee, start, end));
    xhr.addEventListener('load', function(event) {
      if (event.target.status == 200) {
        listener(successResult(event.target.responseText));
      } else {
        listener(errorResult(event.target.responseText));
      }
    }, false);
    xhr.addEventListener('error', function(event) {
      if (channelCallbacks.isActive()) {
        return;
      }

      listener(errorResult('Transport error'));
    }, false);
    xhr.setRequestHeader('User-Agent', 'Mozilla Freebusy Provider');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.channel.notificationCallbacks = channelCallbacks;

    try {
      xhr.send();
    } catch (e) {
      listener(errorResult(e.message));
      return;
    }
  }

  performRequest();
}

function buildUrl(attendee, start, end) {
  var HOSTS = {
    'isfreebusy.info' : 'isfreebusy.info:444',
    'exchange': getPref('exchangeHost')
  };

  var host = HOSTS[getPref('serviceType')];

  return 'https://' + host + '/freebusy/' + encodeURIComponent(attendee) +
         '?start=' + start + '&end=' + end;
}

function successResult(responseText) {
  return buildResult(responseText, null);
}

function errorResult(errorText) {
  return buildResult(null, errorText);
}

function buildResult(responseText, errorText) {
  return { data: responseText,
           isError: (responseText == null),
           errorMessage: errorText };
}

function getPref(key) {
  return Services.prefs.getCharPref('extensions.zonio.freebusy.pref.' + key);
}

var zonioRequest = {
  getFreebusy: getFreebusy
};

EXPORTED_SYMBOLS = [
  'zonioRequest'
];
