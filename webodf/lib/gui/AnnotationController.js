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

/*global runtime, core, gui, odf, ops, Node*/

runtime.loadClass("core.EventNotifier");
runtime.loadClass("core.PositionFilter");
runtime.loadClass("ops.Session");
runtime.loadClass("gui.SessionConstraints");
runtime.loadClass("ops.OpAddAnnotation");
runtime.loadClass("ops.OpRemoveAnnotation");
runtime.loadClass("gui.SelectionMover");
runtime.loadClass("gui.KeyboardHandler");

/**
 * @constructor
 * @param {!ops.Session} session
 * @param {!gui.SessionConstraints} sessionConstraints
 * @param {!string} inputMemberId
 */
gui.AnnotationController = function AnnotationController(session, sessionConstraints, keyHandler, inputMemberId) {
    "use strict";

    var self = this,
        odtDocument = session.getOdtDocument(),
        isAnnotatable = false,
        eventNotifier = new core.EventNotifier([gui.AnnotationController.annotatableChanged]),
        officens = odf.Namespaces.officens;

    sessionConstraints.registerConstraint("edit.annotations.allowNonAuthorDelete", true);

    /**
     * @param {?Node} node  Node to start searching with
     * @param {!Node} container  Root container to stop searching at.
     * @return {!boolean}
     */
    function isWithinAnnotation(node, container) {
        while (node && node !== container) {
            if (node.namespaceURI === officens && node.localName === 'annotation') {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    /**
     * @return {undefined}
     */
    function updatedCachedValues() {
        var cursor = odtDocument.getCursor(inputMemberId),
            cursorNode = cursor && cursor.getNode(),
            newIsAnnotatable = false;
        if (cursorNode) {
            newIsAnnotatable = !isWithinAnnotation(cursorNode, odtDocument.getRootNode());
        }

        if (newIsAnnotatable !== isAnnotatable) {
            isAnnotatable = newIsAnnotatable;
            eventNotifier.emit(gui.AnnotationController.annotatableChanged, isAnnotatable);
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @return {undefined}
     */
    function onCursorAdded(cursor) {
        if (cursor.getMemberId() === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * @param {!string} memberId
     * @return {undefined}
     */
    function onCursorRemoved(memberId) {
        if (memberId === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * @param {!ops.OdtCursor} cursor
     * @return {undefined}
     */
    function onCursorMoved(cursor) {
        if (cursor.getMemberId() === inputMemberId) {
            updatedCachedValues();
        }
    }

    /**
     * Gets the creator of an annotation.
     * @param {!Node} annotationElement
     * @return {string}
     */
    function getCreator(annotationElement) {
        var creatorElement = annotationElement.getElementsByTagNameNS(odf.Namespaces.dcns, "creator")[0];
        return creatorElement.textContent;
    }

    /**
     * @return {!boolean}
     */
    this.isAnnotatable = function () {
        return isAnnotatable;
    };

    /**
     * Adds an annotation to the document based on the current selection
     * @return {undefined}
     */
    function addAnnotation () {
        var op = new ops.OpAddAnnotation(),
            selection = odtDocument.getCursorSelection(inputMemberId),
            length = selection.length,
            position = selection.position;

        if (!isAnnotatable) {
            return;
        }

        position = length >= 0 ? position : position + length;
        length = Math.abs(length);

        op.init({
            memberid: inputMemberId,
            position: position,
            length: length,
            name: inputMemberId + Date.now()
        });
        session.enqueue([op]);
    }
    this.addAnnotation = addAnnotation;

    /**
     * @param {!Node} annotationNode
     * @return {undefined}
     */
    function removeAnnotation(annotationNode) {
        var startStep, endStep, op, moveCursor,
            currentUserName = odtDocument.getMember(inputMemberId).getProperties().fullName;

        if (sessionConstraints.getState("edit.annotations.allowNonAuthorDelete") === false) {
            if (currentUserName !== getCreator(annotationNode)) {
                return;
            }
        }

        // (annotationNode, 0) will report as the step just before the first step in the annotation node
        // Add 1 to this to actually get *within* the annotation
        startStep = odtDocument.convertDomPointToCursorStep(annotationNode, 0) + 1;
        // Will report the last walkable step within the annotation
        endStep = odtDocument.convertDomPointToCursorStep(annotationNode, annotationNode.childNodes.length);

        op = new ops.OpRemoveAnnotation();
        op.init({
            memberid: inputMemberId,
            position: startStep,
            length: endStep - startStep
        });
        moveCursor = new ops.OpMoveCursor();
        moveCursor.init({
            memberid: inputMemberId,
            position: startStep > 0 ? startStep - 1 : startStep, // Last position just before the annotation starts
            length: 0
        });
        session.enqueue([op, moveCursor]);
    }
    this.removeAnnotation = removeAnnotation;

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.subscribe = function (eventid, cb) {
        eventNotifier.subscribe(eventid, cb);
    };

    /**
     * @param {!string} eventid
     * @param {!Function} cb
     * @return {undefined}
     */
    this.unsubscribe = function (eventid, cb) {
        eventNotifier.unsubscribe(eventid, cb);
    };

    /**
     * Bind keyboard shortcuts
     * @return {undefined}
     */
    this.bindKeys = function () {
        if (keyHandler.isMacOS) {
            keyHandler.down.bind(keyHandler.keyCode.C, keyHandler.modifier.MetaShift, self.addAnnotation);
        } else {
            keyHandler.down.bind(keyHandler.keyCode.C, keyHandler.modifier.CtrlAlt, self.addAnnotation);
        }
    };

    /**
     * Unbind keyboard shortcuts
     * @return {undefined}
     */
    this.unbindKeys = function () {
        if (keyHandler.isMacOS) {
            keyHandler.down.unbind(keyHandler.keyCode.C, keyHandler.modifier.MetaShift);
        } else {
            keyHandler.down.unbind(keyHandler.keyCode.C, keyHandler.modifier.CtrlAlt);
        }
    };

    /**
     * @param {!function(!Object=)} callback, passing an error object in case of error
     * @return {undefined}
     */
    this.destroy = function(callback) {
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorAdded, onCursorAdded);
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorRemoved, onCursorRemoved);
        odtDocument.unsubscribe(ops.OdtDocument.signalCursorMoved, onCursorMoved);
        callback();
    };

    function init() {
        odtDocument.subscribe(ops.OdtDocument.signalCursorAdded, onCursorAdded);
        odtDocument.subscribe(ops.OdtDocument.signalCursorRemoved, onCursorRemoved);
        odtDocument.subscribe(ops.OdtDocument.signalCursorMoved, onCursorMoved);
        updatedCachedValues();
    }

    init();
};

/**@const*/gui.AnnotationController.annotatableChanged = "annotatable/changed";

(function () {
    "use strict";
    return gui.AnnotationController;
}());

