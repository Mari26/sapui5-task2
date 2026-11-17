sap.ui.define([
    "./BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("sapui5task2.controller.Product", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteProduct").attachPatternMatched(this._onProductMatched, this);
        },

        _onProductMatched(oEvent) {
            const sProductId = oEvent.getParameter("arguments").ProductID;
            const oModel = this.getModel("odataV2");

            oModel.metadataLoaded().then(() => {
                const sObjectPath = oModel.createKey("/Products", {
                    ID: sProductId
                });
                this._bindView(sObjectPath);
            });
        },

        _bindView(sObjectPath) {
            const oView = this.getView();

            oView.bindElement({
                path: sObjectPath,
                model: "odataV2",
                parameters: {
                    expand: "Supplier"
                },
                events: {
                    dataRequested: () => oView.setBusy(true),
                    dataReceived: () => oView.setBusy(false)
                }
            });
        }
    });
});