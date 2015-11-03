/* ***** BEGIN LICENSE BLOCK *****
 * Zonio Freebusy
 * Copyright © 2015 Zonio s.r.o.
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

var HOST = 'isfreebusy.info:444';

function getFreebusy(attendee, start, end, listener) {
  function onResponse(event) {
    if (event.target.status == 200) {
      listener(successResult(event.target.responseText));
    } else {
      listener(errorResult(event.target.responseText));
    }
  }

  function onError(event) {
    listener(errorResult('Transport error'));
  }

  var xhr = Components.classes['@mozilla.org/xmlextras/xmlhttprequest;1']
    .createInstance(Components.interfaces.nsIXMLHttpRequest);

  xhr.open('GET', buildUrl(HOST, attendee, start, end));
  xhr.addEventListener('load', onResponse, false);
  xhr.addEventListener('error', onError, false);
  xhr.setRequestHeader('User-Agent', 'Mozilla Freebusy Provider');
  xhr.setRequestHeader('Accept', 'application/json');
  try {
    xhr.send();
  } catch (e) {
    dump("[fb] Exception: " + e);
  }
}

function buildUrl(host, attendee, start, end) {
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

var zonioRequest = {
  getFreebusy: getFreebusy
};

EXPORTED_SYMBOLS = [
  'zonioRequest'
];
