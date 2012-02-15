/*
 * Copyright 2012 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false */

define(function (require, exports, module) {
    'use strict';

    /**
     * @private
     * builds the keyDescriptor string from the given parts
     */
    function _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key) {
        if (!key) {
            console.log("KeyMap _buildKeyDescriptor() - No key provided!");
            return "";
        }
        key = key.trim().toUpperCase();
        if (key.length === 0) {
            console.log("KeyMap _buildKeyDescriptor() - Empty key passed in!");
            return "";
        }
        
        var keyDescriptor = [];
        if (hasCtrl) {
            keyDescriptor.push("Ctrl");
        }
        if (hasAlt) {
            keyDescriptor.push("Alt");
        }
        if (hasShift) {
            keyDescriptor.push("Shift");
        }
        keyDescriptor.push(key);
        
        return keyDescriptor.join("-");
    }
    
    /**
     * @private
     * normalizes the incoming key descriptor so the modifier keys are always specified in the correct order
     * @param {string} The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     */
    function _normalizeKeyDescriptorString(origDescriptor) {
        var hasCtrl = false,
            hasAlt = false,
            hasShift = false,
            key = "";
        
        function _isModifier(left, right, previouslyFound) {
            if (!left || !right) {
                return false;
            }
            left = left.trim().toLowerCase();
            right = right.trim().toLowerCase();
            var matched = (left.length > 0 && left === right);
            if (matched && previouslyFound) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Modifier defined twice: " + origDescriptor);
            }
            return matched;
        }
        
        origDescriptor.split("-").forEach(function parseDescriptor(ele, i, arr) {
            if (_isModifier("ctrl", ele, hasCtrl)) {
                hasCtrl = true;
            } else if (_isModifier("cmd", ele, hasCtrl)) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Cmd getting mapped to Ctrl from: " + origDescriptor);
                hasCtrl = true;
            } else if (_isModifier("alt", ele, hasAlt)) {
                hasAlt = true;
            } else if (_isModifier("opt", ele, hasAlt)) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Opt getting mapped to Alt from: " + origDescriptor);
                hasAlt = true;
            } else if (_isModifier("shift", ele, hasShift)) {
                hasShift = true;
            } else if (key.length > 0) {
                console.log("KeyMap _normalizeKeyDescriptorString() - Multiple keys defined. Using key: " + key + " from: " + origDescriptor);
            } else {
                key = ele.trim();
            }
        });
        
        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    /**
     * @private
     * normalizes the incoming map so all the key descriptors are specified the correct way
     * @param {map} The string for a key descriptor, can be in any order, the result will be Ctrl-Alt-Shift-<Key>
     */
    function _normalizeMap(map) {
        var finalMap = {};
        Object.keys(map).forEach(function normalizeKey(ele, i, arr) {
            var val = map[ele];
            var normalizedKey = _normalizeKeyDescriptorString(ele);
            if (normalizedKey.length === 0) {
                console.log("KeyMap _normalizeMap() - Rejecting malformed key: " + ele + " (value: " + val + ")");
            } else if (!val) {
                console.log("KeyMap _normalizeMap() - Rejecting key for falsy value: " + ele + " (value: " + val + ")");
            } else if (finalMap[normalizedKey]) {
                console.log("KeyMap _normalizeMap() - Rejecting key because it was defined twice: " + ele + " (value: " + val + ")");
            } else {
                if (normalizedKey !== ele) {
                    console.log("KeyMap _normalizeMap() - Corrected a malformed key: " + ele + " (value: " + val + ")");
                }
                finalMap[normalizedKey] = val;
            }
        });
        return finalMap;
    }
    
    /** class Keymap
     *
     * A keymap specifies how keys are mapped to commands. This currently just holds the map, but in future
     * it will likely be extended to include other metadata about the keymap.
     *
     * Keys are described by strings of the form "[modifier-modifier-...-]key", where modifier is one of
     * Ctrl, Alt, or Shift. If multiple modifiers are specified, they will get normalized to the form
     * "Ctrl-Alt-Shift-<Key>" so modifiers are always stored and lookedup in that order.
     *    -- Ctrl maps to Cmd on Mac. (This means that you can't specifically bind to the Ctrl key on Mac.)
     *    -- Alt maps to the Option key on Mac.
     *    -- Letters must be uppercase, but do not require Shift by default. To indicate that Shift must be held
     *       down, you must specifically include Shift.
     *
     * @constructor
     * @param {map} map An object mapping key-description strings to command IDs.
     */
    var KeyMap = function (map) {
        if (map === undefined) {
            throw new Error("All parameters to the KeyMap constructor must be specified");
        }
        this.map = _normalizeMap(map);
    };
    
    /**
     * simple creator
     * @param {map} map An object mapping key-description strings to command IDs.
     */
    function create(map) {
        return new KeyMap(map);
    }
    
    /**
     * Takes a keyboard event and translates it into a key in a key map
     */
    function translateKeyboardEvent(event) {
        var hasCtrl = (event.metaKey || event.ctrlKey),
            hasAlt = (event.altKey),
            hasShift = (event.shiftKey),
            key = String.fromCharCode(event.keyCode);
        
        return _buildKeyDescriptor(hasCtrl, hasAlt, hasShift, key);
    }
    
    // Define public API
    exports.create = create;
    exports.translateKeyboardEvent = translateKeyboardEvent;
});
