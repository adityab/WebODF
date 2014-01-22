/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global core, runtime, gui*/

runtime.loadClass("core.EventNotifier");

/**
 * @constructor
 */
gui.SessionConstraints = function SessionConstraints() {
    "use strict";

    var constraints = {},
        constraintNotifier = new core.EventNotifier();

    /**
     * @param {!string} constraint
     * @param {!boolean} enabled
     * @return {undefined}
     */
    this.registerConstraint = function (constraint, enabled) {
        if (!constraints[constraint]) {
            constraints[constraint] = enabled;
        }
        constraintNotifier.register(constraint);
    };

    /**
     * Subscribe to a constraint's state.
     * @param {!string} constraint
     * @param {!Function} callback the only argument of this
     * callback is a boolean, indicating the new state of the
     * constraint.
     */
    this.subscribe = function (constraint, callback) {
        constraintNotifier.subscribe(constraint, callback);
    };

    /**
     * Unsubscribe a callback from a constraint's
     * state.
     * @param constraint
     * @param callback
     */
    this.unsubscribe = function (constraint, callback) {
        constraintNotifier.unsubscribe(constraint, callback);
    };

    /**
     * Set the enabled/disabled state of a constraint
     * @param constraint
     * @param enabled true if enabled, false if disabled
     */
    this.setState = function (constraint, enabled) {
        if (constraints.hasOwnProperty(constraint) && constraints[constraint] !== enabled) {
            constraints[constraint] = enabled;
            constraintNotifier.emit(constraint, enabled);
        }
    };

    /**
     * Returns the enabled/disabled state of a constraint
     * @param constraint
     * @returns {boolean}
     */
    this.getState = function (constraint) {
        runtime.assert(constraints.hasOwnProperty(constraint) === true, "No such constraint");
        return constraints[constraint];
    };
};