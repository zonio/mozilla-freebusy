/* ***** BEGIN LICENSE BLOCK *****
 * 3e Calendar
 * Copyright © 2013  Zonio s.r.o.
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

Components.utils.import('resource://gre/modules/Services.jsm');

function getFreebusy(attendee, start, end, listener) {
  listener(
    { data: "[{ \"start\": \"2015-10-26T12:00:00Z\", " +
            "     \"end\": \"2015-10-26T14:00:00Z\", " +
            "    \"type\": \"busy\" }," +
            " { \"start\": \"2015-10-26T15:00:00Z\", " +
            "     \"end\": \"2015-10-26T16:00:00Z\", " +
            "    \"type\": \"tentative\" }]",
      isError: false,
      errorMessage: null }
  );
}

var zonioRequest = {
  getFreebusy: getFreebusy
};

EXPORTED_SYMBOLS = [
  'zonioRequest'
];
