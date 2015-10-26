/* ***** BEGIN LICENSE BLOCK *****
 * 3e Calendar
 * Copyright © 2011  Zonio s.r.o.
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

/**
 * Takes Mozilla calendar date/time and returns it formatted as ISO
 * 8601 date/time.
 *
 * It preserves date/time's timezone and doesn't try to convert
 * everything to UTC like ISO8601DateUtils JavaScript module.  So,
 * this function is great for debugging.
 *
 * @param {calIDateTime} dateTime
 * @returns {String}
 */
function calDateTimeToIsoDate(dateTime) {
  var isoTzOffset = '';
  if (dateTime.timezoneOffset) {
    isoTzOffset += dateTime.timezoneOffset >= 0 ? '+' : '-';
    isoTzOffset += zeropad(Math.floor(
      Math.abs(dateTime.timezoneOffset) / 3600
    ), 2);
    isoTzOffset += ':';
    isoTzOffset += zeropad(Math.floor(
      (Math.abs(dateTime.timezoneOffset) % 3600) / 60
    ), 2);
  } else {
    isoTzOffset += 'Z';
  }

  return '' +
    zeropad(dateTime.year, 4) + '-' +
    zeropad(dateTime.month + 1, 2) + '-' +
    zeropad(dateTime.day, 2) + 'T' +
    zeropad(dateTime.hour, 2) + ':' +
    zeropad(dateTime.minute, 2) + ':' +
    zeropad(dateTime.second, 2) +
    isoTzOffset;
}

var cal3eUtils = {
  calDateTimeToIsoDate: calDateTimeToIsoDate,
};
EXPORTED_SYMBOLS = [
  'cal3eUtils'
];
