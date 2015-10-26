/* ***** BEGIN LICENSE BLOCK *****
 * 3e Calendar
 * Copyright © 2012 - 2013  Zonio s.r.o.
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
Components.utils.import('resource://modules/logger.jsm');
Components.utils.import('resource://modules/request.jsm');
Components.utils.import('resource://modules/object.jsm');

function calEeeFreeBusyProvider() {
  var freeBusyProvider = this;
  var JSON_TO_MOZ_TYPES = {
    'busy':
      Components.interfaces.calIFreeBusyInterval.BUSY,
    'tentative':
      Components.interfaces.calIFreeBusyInterval.BUSY_TENTATIVE,
  };
  var MOZ_TO_JSON_TYPES = {};
  var logger;

  function observe(subject, topic, data) {
    switch (topic) {
    case 'profile-after-change':
      logger.info('Registration - initializing');
      register();
      break;
    }
  }
  cal3eObject.exportMethod(this, observe);

  function register() {
    if (register.registered) {
      return;
    }

    register.registered = true;
    cal.getFreeBusyService().addProvider(freeBusyProvider);

    logger.info('Registration - done');
  }

  function getFreeBusyIntervals(calId, start, end, busyTypes, listener) {
    var clientListener = function calEee_getFreeBusy_onResult(result) {
      if (result.isError) {
        logger.warn('Cannot retrieve free/busy for "' + attendee + '".'  +
                    result.errorMessage);
        return;
      }

      logger.info('Free/busy received');

      var intervalsToReturn = [];

      try {
        intervalsToReturn = deserialize(calId, result.data);
      } catch (e) {
        logger.error('Invalid free/busy for "' + attendee + '". ' + e);
      }

      logger.info('Free/busy parsed');
      logger.debug(intervalsToReturn.length + ' free/busy intervals parsed');
      intervalsToReturn.forEach(function(interval, idx) {
        logger.debug('Interval #' + idx + ': ' +
                     interval.calId +
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

    Request.getFreebusy(attendee, start, end, clientListener)

    logger.info('Retriving free/busy for "' + attendee + '".');
  }
  cal3eObject.exportMethod(this, getFreeBusyIntervals);

  function parseAttendeeEmail(calId) {
    var parts = calId.split(':', 2);

    return parts[0].toLowerCase() === 'mailto' ? parts[1] : null;
  }

  function deserialize(calId, json) {
    var intervals = [];

    var p = JSON.parse(json);

    JSON.parse(json).forEach(function(interval) {
      intervals.push(new cal.FreeBusyInterval(
        calId,
        JSON_TO_MOZ_TYPES[interval['type']],
        cal.fromRFC3339(interval['start']),
        cal.fromRFC3339(interval['end'])
      ))
    });

    return intervals;
  }

  function buildFreeBusyInterval(calId, value) {
    return new cal.FreeBusyInterval(
      calId,
      JSON_TO_MOZ_TYPES[value['type']],
      cal.fromRFC3339(value['start']),
      cal.fromRFC3339(value['end'])
    );
  }

  function init() {
    for (let icalType in JSON_TO_MOZ_TYPES) {
      if (!JSON_TO_MOZ_TYPES.hasOwnProperty(icalType)) {
        continue;
      }
      MOZ_TO_JSON_TYPES[JSON_TO_MOZ_TYPES[icalType]] = icalType;
    }

    logger = cal3eLogger.create('extensions.zonio.freebusy.log');
  }

  init();
}

const NSGetFactory = cal3eObject.asXpcom(calEeeFreeBusyProvider, {
  classID: Components.ID('{2378ee03-7b47-4ae5-9f11-4c41d2ac0b50}'),
  contractID: '@zonio.net/freebusy/provider;1',
  classDescription: 'Zonio freebusy provider',
  interfaces: [Components.interfaces.calEeeIFreeBusyProvider,
               Components.interfaces.calIFreeBusyProvider,
               Components.interfaces.nsIObserver],
  flags: Components.interfaces.nsIClassInfo.SINGLETON
});
