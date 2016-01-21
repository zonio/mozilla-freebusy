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

function onServiceTypeClick(event) {
  var serviceTypeRadiogroup = document
    .getElementById('zoniofreebusy-pref-radiogroup-service');

  document
    .getElementById('zoniofreebusy-pref-textbox-exchange-host')
    .disabled = (serviceTypeRadiogroup['value'] != 'exchange');
};

zoniofreebusyOptionsOnLoad = function zoniofreebusyOption_onLoad() {
  document
    .getElementById('zoniofreebusy-pref-radiogroup-service')
    .addEventListener('click', onServiceTypeClick, false);

  onServiceTypeClick(null);
};
