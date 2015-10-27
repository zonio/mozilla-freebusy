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

Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://calendar/modules/calUtils.jsm');
Components.utils.import('resource://calendar/modules/calIteratorUtils.jsm');
Components.utils.import('resource://calendar/modules/calProviderUtils.jsm');
Components.utils.import('resource://freebusymodules/logger.jsm');
Components.utils.import('resource://freebusymodules/request.jsm');
Components.utils.import('resource://freebusymodules/object.jsm');

function zonioFreebusyProvider() {
  var freebusyProvider = this;
  var JSON_TO_MOZ_TYPES = {
    'busy': Components.interfaces.calIFreeBusyInterval.BUSY,
    'tentative': Components.interfaces.calIFreeBusyInterval.BUSY_TENTATIVE,
  };
  var MOZ_TO_JSON_TYPES = {};
  var log;

  function observe(subject, topic, data) {
    switch (topic) {
    case 'profile-after-change':
      log.info('Registration - initializing');
      register();
      break;
    }
  }
  zonioObject.exportMethod(this, observe);

  function register() {
    if (register.registered) {
      return;
    }

    register.registered = true;
    cal.getFreeBusyService().addProvider(freebusyProvider);

    log.info('Registration - done');
  }

  function getFreeBusyIntervals(calId, start, end, busyTypes, listener) {
    var clientListener = function calEee_getFreeBusy_onResult(result) {
      if (result.isError) {
        log.warn('Cannot retrieve free/busy for "' + attendee + '".'  +
                    result.errorMessage);
        return;
      }

      log.info('Free/busy received');

      var intervalsToReturn = [];

      try {
        intervalsToReturn = deserialize(calId, result.data);
      } catch (e) {
        log.error('Invalid free/busy for "' + attendee + '". ' + e);
      }

      log.info('Free/busy parsed');
      log.debug(intervalsToReturn.length + ' free/busy intervals parsed');
      intervalsToReturn.forEach(function(interval, idx) {
        log.debug('Interval #' + idx + ': ' + interval.calId +
                     ' is ' + MOZ_TO_JSON_TYPES[interval.freeBusyType] +
                     ' from ' + cal.toRFC3339(interval.interval.start) +
                     ' to ' + cal.toRFC3339(interval.interval.end));
      });

      listener.onResult(null, intervalsToReturn);
    };

    var attendee = parseAttendeeEmail(calId);
    if (!attendee) {
      listener.onResult(null, null);
      return;
    }

    zonioRequest.getFreebusy(attendee, start, end, clientListener);

    log.info('Retriving free/busy for "' + attendee + '".');
  }
  zonioObject.exportMethod(this, getFreeBusyIntervals);

  function parseAttendeeEmail(calId) {
    var parts = calId.split(':', 2);

    return parts[0].toLowerCase() === 'mailto' ? parts[1] : null;
  }

  function deserialize(calId, json) {
    var intervals = [];

    JSON.parse(json).forEach(function(jsonInterval) {
      intervals.push(new cal.FreeBusyInterval(
        calId,
        JSON_TO_MOZ_TYPES[jsonInterval['type']],
        cal.fromRFC3339(jsonInterval['start']),
        cal.fromRFC3339(jsonInterval['end'])
      ))
    });

    return intervals;
  }

  function init() {
    for (let icalType in JSON_TO_MOZ_TYPES) {
      if (!JSON_TO_MOZ_TYPES.hasOwnProperty(icalType)) {
        continue;
      }
      MOZ_TO_JSON_TYPES[JSON_TO_MOZ_TYPES[icalType]] = icalType;
    }

    log = zonioLogger.create('extensions.zonio.freebusy.log');
  }

  init();
}

const NSGetFactory = zonioObject.asXpcom(zonioFreebusyProvider, {
  classID: Components.ID('{2378ee03-7b47-4ae5-9f11-4c41d2ac0b50}'),
  contractID: '@zonio.net/freebusy/provider;1',
  classDescription: 'Zonio Freebusy Provider',
  interfaces: [Components.interfaces.calIFreeBusyProvider,
               Components.interfaces.nsIObserver],
  flags: Components.interfaces.nsIClassInfo.SINGLETON
});
