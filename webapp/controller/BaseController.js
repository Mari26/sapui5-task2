sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("sapui5task2.controller.BaseController", {
        // accessing the view model by name
        getModel(sName) {
            return this.getView().getModel(sName);
        },

        // setting the view model
        setModel(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        }
    });
});