/**
 * Copyright (C) 2012-2014 KO GmbH <copyright@kogmbh.com>
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
/*global define,require,document */

goog.provide("wodo.widgets.FontPicker");

goog.require("wodo.EditorSession");
goog.require("goog.ui.Select");
goog.require("goog.ui.Option");
goog.require("goog.ui.FlatMenuButtonRenderer");
goog.require("goog.events");
goog.require("goog.events.EventTarget");

wodo.widgets.FontPicker = function () {
    goog.events.EventTarget.call(this);

    var self = this;

    this.documentFonts = [];

    function populateFonts() {
        var i,
            name,
            family,
            editorSession = self.editorSession,
            editorFonts = editorSession.availableFonts,
            documentFonts = editorSession.getDeclaredFonts(),
            widget = self.widget;

        self.documentFonts = documentFonts;

        for (i = 0; i < widget.getItemCount(); i += 1) {
            widget.removeItemAt(0);
        }

        // First populate the fonts used in the document
        for (i = 0; i < documentFonts.length; i += 1) {
            name = documentFonts[i].name;
            family = documentFonts[i].family || name;
            widget.addItem(new goog.ui.Option(
                goog.dom.htmlToDocumentFragment('<span style="font-family: ' + family + ';">' + name + '</span>'),
                name
            ));
        }
        if (editorFonts.length) {
            // Then add a separator
            widget.addItem(new goog.ui.Separator());
        }
        // Lastly populate the fonts provided by the editor
        for (i = 0; i < editorFonts.length; i += 1) {
            widget.addItem((
                goog.dom.htmlToDocumentFragment('<span style="font-family: ' + editorFonts[i] + ';">' + editorFonts[i] + '</span>'),
                editorFonts[i]
            ));
        }
    }
    this.populateFonts = populateFonts;
};

goog.inherits(wodo.widgets.FontPicker, goog.events.EventTarget);

wodo.widgets.FontPicker.prototype.render = function (parentElement) {
    this.widget.render(parentElement);
};

wodo.widgets.FontPicker.prototype.createDom = function () {
    var self = this,
        widget;

    widget = new goog.ui.Select(null, null, goog.ui.FlatMenuButtonRenderer.getInstance());
    widget.createDom();

    goog.events.listen(widget, goog.ui.Component.EventType.CHANGE, function () {
        self.dispatchEvent(new goog.events.Event(wodo.widgets.FontPicker.EventType.CHANGE, {
            value: self.getValue()
        }));
    });

    self.widget = widget;
};

wodo.widgets.FontPicker.prototype.setEditorSession = function (session) {
    this.editorSession = session;
    if (this.editorSession) {
        this.populateFonts();
    }
    this.widget.setEnabled(Boolean(this.editorSession));
};

wodo.widgets.FontPicker.prototype.getValue = function () {
    return this.widget.getValue();
};

wodo.widgets.FontPicker.prototype.setValue = function (value) {
    this.widget.setValue(value);
};

wodo.widgets.FontPicker.prototype.getFamily = function (name) {
    var documentFonts = this.documentFonts,
        i;

    for (i = 0; i < documentFonts.length; i += 1) {
        if ((documentFonts[i].name === name) && documentFonts[i].family) {
            return documentFonts[i].family;
        }
    }
    return name;
};

wodo.widgets.FontPicker.EventType = {
    CHANGE: "change"
};
