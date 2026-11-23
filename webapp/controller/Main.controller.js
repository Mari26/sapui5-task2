sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat"
], function (BaseController, JSONModel, Filter, FilterOperator, FilterType, MessageToast, coreLibrary, formatter, MessageBox, DateFormat) {
    "use strict";

    const { ValueState } = coreLibrary;

    const aProductInputIds = [
        "inpProductId",
        "inpProductName",
        "inpProductDesc",
        "inpProductRelDate",
        "inpProductDiscDate",
        "inpProductRating",
        "inpProductPrice"
    ];

    const aValidTabKeys = ["json", "odataV2", "odataV4"];

    return BaseController.extend("sapui5task2.controller.Main", {
        formatter: formatter,
        onInit() {
            const oData = {
                Books: [
                    { ID: "B1001", Name: "Eloquent JavaScript", Author: "Marijn", Genre: "Programming", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 15, editMode: false },
                    { ID: "B1002", Name: "Thinking, Fast and Slow", Author: "Daniel", Genre: "Psychology", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 8, editMode: false },
                    { ID: "B1003", Name: "Mathematical Analysis", Author: "Rudin", Genre: "Mathematics", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 22, editMode: false },
                    { ID: "B1004", Name: "Topology", Author: "James Munkres", Genre: "Philosophy", ReleaseDate: new Date("1988-01-01T00:00:00"), AvailableQuantity: 5, editMode: false },
                    { ID: "B1005", Name: "Silo: Wool", Author: "Hugh Howey", Genre: "Sci-Fi", ReleaseDate: new Date("2011-07-25T00:00:00"), AvailableQuantity: 30, editMode: false }
                ],
                NewBook: this._getEmptyBook(),
                Validation: this._getInitialValidationState()
            };

            const oModel = new JSONModel(oData);
            this.setModel(oModel);
            this._updateGenres();
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("RouteTab").attachPatternMatched(this._onRouteMatched, this);
        },

        // Helper method to generate an empty book template
        _getEmptyBook() {
            return {
                ID: "",
                Name: "",
                Author: "",
                Genre: "",
                ReleaseDate: null,
                AvailableQuantity: ""
            };
        },

        // Helper method to reset validation states to 'None'
        _getInitialValidationState() {
            return {
                ID: ValueState.None,
                Name: ValueState.None,
                Author: ValueState.None,
                Genre: ValueState.None,
                ReleaseDate: ValueState.None,
                AvailableQuantity: ValueState.None
            };
        },

        // Helper method to refresh unique genres list in the Select control
        _updateGenres() {
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/Books");
            const sAllGenresText = this.getResourceBundle().getText("allGenres");

            const aGenres = [...new Set(aBooks.map(book => book.Genre).filter(Boolean))].map(genre => {
                return { key: genre, text: genre };
            });
            aGenres.unshift({ key: "", text: sAllGenresText });
            oModel.setProperty("/Genres", aGenres);
        },

        // Open the Add Book dialog when 'Add Record' button is pressed
        async onAddRecord() {
            const oModel = this.getModel();
            // Reset form fields and validation states before opening
            oModel.setProperty("/NewBook", this._getEmptyBook());
            oModel.setProperty("/Validation", this._getInitialValidationState());

            this.oAddBookDialog ??= await this.loadFragment({
                name: "sapui5task2.view.fragments.AddBookDialog"
            });

            this.oAddBookDialog.open();
        },

        // Validate fields and create a new record on 'Add' button click
        onConfirmAddBook() {
            const oModel = this.getModel();
            const oNewBook = oModel.getProperty("/NewBook");
            const oValidation = this._getInitialValidationState();
            let bIsValid = true;

            // Validate text fields (must not be empty or whitespace only)
            ["ID", "Name", "Author", "Genre"].forEach(sField => {
                if (!oNewBook[sField] || !oNewBook[sField].trim()) {
                    oValidation[sField] = ValueState.Error;
                    bIsValid = false;
                }
            });

            // Validate ReleaseDate (must be a valid Date object)
            if (!(oNewBook.ReleaseDate instanceof Date) || isNaN(oNewBook.ReleaseDate.getTime())) {
                oValidation.ReleaseDate = ValueState.Error;
                bIsValid = false;
            }

            // Validate AvailableQuantity (must not be empty and must be >= 0)
            const iQuantity = Number(oNewBook.AvailableQuantity);
            if (oNewBook.AvailableQuantity === "" || isNaN(iQuantity) || iQuantity < 0) {
                oValidation.AvailableQuantity = ValueState.Error;
                bIsValid = false;
            }

            oModel.setProperty("/Validation", oValidation);

            if (!bIsValid) {
                MessageToast.show(this.getResourceBundle().getText("validationErrorMessage"));
                return;
            }

            // Add the validated record to the Books array
            const aBooks = oModel.getProperty("/Books");
            aBooks.push({
                ID: oNewBook.ID.trim(),
                Name: oNewBook.Name.trim(),
                Author: oNewBook.Author.trim(),
                Genre: oNewBook.Genre.trim(),
                ReleaseDate: oNewBook.ReleaseDate,
                AvailableQuantity: iQuantity,
                editMode: false
            });

            oModel.setProperty("/Books", aBooks);
            this._updateGenres();
            this.oAddBookDialog.close();
        },

        // Close the Add Book dialog without saving on 'Cancel' button click
        onCancelAddBook() {
            this.oAddBookDialog.close();
        },

        // Open confirmation dialog when 'Delete Record' button is pressed
        async onDeleteRecord() {
            const oTable = this.byId("booksTable");
            const aSelectedContexts = oTable.getSelectedContexts();

            if (aSelectedContexts.length === 0) {
                return;
            }

            this.oDeleteDialog ??= await this.loadFragment({
                name: "sapui5task2.view.fragments.DeleteConfirmationDialog"
            });

            this.oDeleteDialog.open();
        },

        // Triggered on 'Yes' button click inside the confirmation dialog
        onConfirmDelete() {
            const oTable = this.byId("booksTable");
            const aSelectedContexts = oTable.getSelectedContexts();
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/Books");

            const aIndices = aSelectedContexts.map(oContext => {
                return parseInt(oContext.getPath().split("/").pop(), 10);
            }).sort((a, b) => b - a);

            aIndices.forEach(iIndex => {
                aBooks.splice(iIndex, 1);
            });

            oModel.setProperty("/Books", aBooks);
            this._updateGenres();
            oTable.removeSelections(true);

            this.oDeleteDialog.close();
        },

        // Triggered on 'No' button click inside the confirmation dialog
        onCloseDeleteDialog() {
            this.oDeleteDialog.close();
        },

        onFilter() {
            const sTitleQuery = this.byId("titleInput").getValue();
            const sGenreQuery = this.byId("genreSelect").getSelectedKey();
            const aFilters = [];

            if (sTitleQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sTitleQuery));
            }

            if (sGenreQuery) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, sGenreQuery));
            }

            const oTable = this.byId("booksTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        onEditTitle(oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            this.getModel().setProperty(oContext.getPath() + "/editMode", true);
        },

        onSaveTitle(oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            this.getModel().setProperty(oContext.getPath() + "/editMode", false);
        },

        onDeleteV2Records() {
            const oTable = this.byId("productsV2Table");
            const aSelectedContexts = oTable.getSelectedContexts();
            const oResourceBundle = this.getResourceBundle();

            if (aSelectedContexts.length === 0) {
                MessageBox.warning(oResourceBundle.getText("noSelectionWarning"));
                return;
            }

            const oModel = this.getModel("odataV2");
            const sGroupId = "deleteBatchGroup";

            const aDeferredGroups = oModel.getDeferredGroups();
            if (!aDeferredGroups.includes(sGroupId)) {
                oModel.setDeferredGroups(aDeferredGroups.concat([sGroupId]));
            }

            aSelectedContexts.forEach((oContext) => {
                oModel.remove(oContext.getPath(), {
                    groupId: sGroupId
                });
            });

            oModel.submitChanges({
                groupId: sGroupId,
                success: (oData) => {
                    const bHasError = oData.__batchResponses && oData.__batchResponses.some((oResponse) => {
                        return oResponse.response && oResponse.response.statusCode >= "400";
                    });

                    if (bHasError) {
                        MessageBox.error(oResourceBundle.getText("deleteErrorMessage"));
                    } else {
                        MessageToast.show(oResourceBundle.getText("deleteSuccessMessage", [aSelectedContexts.length]));
                        oTable.removeSelections(true);
                    }
                },
                error: () => {
                    MessageBox.error(oResourceBundle.getText("deleteErrorMessage"));
                }
            });
        },

        async _openProductDialog(oDialogData) {
            this.setModel(new JSONModel(oDialogData), "newProduct");

            this.oAddProductDialog ??= await this.loadFragment({
                name: "sapui5task2.view.fragments.AddProductDialog"
            });

            this._resetProductDialogValueStates();
            this.oAddProductDialog.open();
        },

        onOpenAddDialog() {
            this._openProductDialog({
                isEdit: false,
                sPath: "",
                ID: "",
                Name: "",
                Description: "",
                ReleaseDate: null,
                DiscontinuedDate: null,
                Rating: "",
                Price: ""
            });
        },

        onOpenEditDialog(oEvent) {
            const oSource = oEvent.getSource();
            const oBindingContext = oSource.getBindingContext("odataV2") || oSource.getBindingContext("odataV4");
            const oRowData = oBindingContext.getObject();

            this._oEditContext = oBindingContext;

            this._openProductDialog({
                isEdit: true,
                sPath: oBindingContext.getPath(),
                ID: String(oRowData.ID),
                Name: oRowData.Name,
                Description: oRowData.Description,
                ReleaseDate: oRowData.ReleaseDate ? new Date(oRowData.ReleaseDate) : null,
                DiscontinuedDate: oRowData.DiscontinuedDate ? new Date(oRowData.DiscontinuedDate) : null,
                Rating: String(oRowData.Rating),
                Price: String(oRowData.Price)
            });
        },

        onProductInputLiveChange(oEvent) {
            const oControl = oEvent.getSource();
            const bEmpty = oControl.isA("sap.m.DatePicker")
                ? !oEvent.getParameter("valid") || !oControl.getDateValue()
                : !oControl.getValue().trim();

            if (bEmpty) {
                oControl.setValueState(ValueState.Error);
                oControl.setValueStateText(this.getResourceBundle().getText("fieldRequiredError"));
            } else {
                oControl.setValueState(ValueState.None);
                oControl.setValueStateText("");
            }
        },

        _validateProductDialogInputs() {
            const sErrorText = this.getResourceBundle().getText("fieldRequiredError");
            let bIsValid = true;

            aProductInputIds.forEach((sId) => {
                const oControl = this.byId(sId);
                const bEmpty = oControl.isA("sap.m.DatePicker")
                    ? !oControl.getDateValue()
                    : !oControl.getValue().trim();

                if (bEmpty) {
                    oControl.setValueState(ValueState.Error);
                    oControl.setValueStateText(sErrorText);
                    bIsValid = false;
                } else {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            });

            return bIsValid;
        },

        _resetProductDialogValueStates() {
            aProductInputIds.forEach((sId) => {
                const oControl = this.byId(sId);
                if (oControl) {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            });
        },

        onSaveProduct() {
            if (!this._validateProductDialogInputs()) {
                return;
            }

            const oDialogData = this.getModel("newProduct").getData();
            const sActiveTab = this.byId("idIconTabBar").getSelectedKey();

            if (sActiveTab === "odataV4") {
                if (oDialogData.isEdit) {
                    this._updateV4Product(oDialogData);
                } else {
                    this._createV4Product(oDialogData);
                }
                return;
            }

            const oResourceBundle = this.getResourceBundle();
            const oODataV2Model = this.getModel("odataV2");

            const oPayload = {
                ID: parseInt(oDialogData.ID, 10),
                Name: oDialogData.Name.trim(),
                Description: oDialogData.Description.trim(),
                ReleaseDate: oDialogData.ReleaseDate,
                DiscontinuedDate: oDialogData.DiscontinuedDate,
                Rating: parseInt(oDialogData.Rating, 10),
                Price: parseFloat(oDialogData.Price).toFixed(2)
            };

            if (oDialogData.isEdit) {
                oODataV2Model.update(oDialogData.sPath, oPayload, {
                    success: () => {
                        MessageToast.show(oResourceBundle.getText("updateSuccessMessage"));
                        this.oAddProductDialog.close();
                    },
                    error: () => {
                        MessageBox.error(oResourceBundle.getText("updateErrorMessage"));
                    }
                });
            } else {
                oODataV2Model.create("/Products", oPayload, {
                    success: () => {
                        MessageToast.show(oResourceBundle.getText("createSuccessMessage"));
                        this.oAddProductDialog.close();
                    },
                    error: () => {
                        MessageBox.error(oResourceBundle.getText("createErrorMessage"));
                    }
                });
            }
        },

        _createV4Product(oDialogData) {
            const oResourceBundle = this.getResourceBundle();
            const oListBinding = this.byId("productsV4Table").getBinding("items");

            oListBinding.attachEventOnce("createCompleted", (oEvent) => {
                const bSuccess = oEvent.getParameter("success");
                const oContext = oEvent.getParameter("context");

                if (bSuccess) {
                    MessageToast.show(oResourceBundle.getText("createSuccessMessage"));
                    this.oAddProductDialog.close();
                } else {
                    oContext.delete();
                    MessageBox.error(oResourceBundle.getText("createErrorMessage"));
                }
            });

            oListBinding.create({
                ID: parseInt(oDialogData.ID, 10),
                Name: oDialogData.Name.trim(),
                Description: oDialogData.Description.trim(),
                ReleaseDate: oDialogData.ReleaseDate.toISOString(),
                DiscontinuedDate: oDialogData.DiscontinuedDate.toISOString(),
                Rating: parseInt(oDialogData.Rating, 10),
                Price: parseFloat(oDialogData.Price)
            });
        },
        
        _updateV4Product(oDialogData) {
            const oResourceBundle = this.getResourceBundle();
            const oContext = this._oEditContext;
            const oListBinding = this.byId("productsV4Table").getBinding("items");

            const oUpdatedFields = {
                Name: oDialogData.Name.trim(),
                Description: oDialogData.Description.trim(),
                ReleaseDate: oDialogData.ReleaseDate.toISOString(),
                DiscontinuedDate: oDialogData.DiscontinuedDate.toISOString(),
                Rating: parseInt(oDialogData.Rating, 10),
                Price: parseFloat(oDialogData.Price)
            };

            const aChangedFields = Object.entries(oUpdatedFields).filter(([sKey, vValue]) => {
                const vCurrentValue = oContext.getProperty(sKey);

                if (sKey === "ReleaseDate" || sKey === "DiscontinuedDate") {
                    return !vCurrentValue || new Date(vCurrentValue).toDateString() !== new Date(vValue).toDateString();
                }

                if (sKey === "Rating" || sKey === "Price") {
                    return Number(vCurrentValue) !== vValue;
                }

                return vCurrentValue !== vValue;
            });

            if (aChangedFields.length === 0) {
                this.oAddProductDialog.close();
                return;
            }

            oListBinding.attachEventOnce("patchCompleted", (oEvent) => {
                const bSuccess = oEvent.getParameter("success");

                if (bSuccess) {
                    MessageToast.show(oResourceBundle.getText("updateSuccessMessage"));
                    this.oAddProductDialog.close();
                } else {
                    oListBinding.resetChanges();
                    MessageBox.error(oResourceBundle.getText("updateErrorMessage"));
                }
            });

            aChangedFields.forEach(([sKey, vValue]) => {
                oContext.setProperty(sKey, vValue).catch(() => {
                    // The error is shown in the patchCompleted handler
                });
            });
        },

        onCancelProduct() {
            this._resetProductDialogValueStates();
            this.oAddProductDialog.close();
        },

        onFilterV2Products(oEvent) {
            const sQuery = oEvent.getParameter("value").trim();
            const aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter({
                    path: "Name",
                    operator: FilterOperator.Contains,
                    value1: sQuery,
                    caseSensitive: false
                }));
            }

            const oTable = this.byId("productsV2Table");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters, FilterType.Application);
        },

        onTabSelect(oEvent) {
            const sSelectedTabKey = oEvent.getParameter("key");
            this.getOwnerComponent().getRouter().navTo("RouteTab", {
                tabKey: sSelectedTabKey
            });
        },

        _onRouteMatched(oEvent) {
            const oArguments = oEvent.getParameter("arguments");
            const sTabKey = oArguments && oArguments.tabKey;

            if (aValidTabKeys.includes(sTabKey)) {
                this.byId("idIconTabBar").setSelectedKey(sTabKey);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteTab", {
                    tabKey: aValidTabKeys[0]
                }, true);
            }
        },

        onNavigateToProduct(oEvent) {
            const sProductId = oEvent.getSource().getBindingContext("odataV2").getProperty("ID");
            this.getOwnerComponent().getRouter().navTo("RouteProduct", {
                ProductID: sProductId
            });
        },

        onDeleteV4Products() {
            const oTable = this.byId("productsV4Table");
            const aSelectedItems = oTable.getSelectedItems();
            const oBundle = this.getResourceBundle();

            if (!aSelectedItems.length) {
                MessageBox.warning(oBundle.getText("noSelectionWarning"));
                return;
            }

            const aDeletePromises = aSelectedItems.map((oItem) =>
                oItem.getBindingContext("odataV4").delete("$auto")
            );

            oTable.setBusy(true);

            Promise.all(aDeletePromises)
                .then(() => {
                    MessageToast.show(oBundle.getText("deleteSuccessMessage", [aSelectedItems.length]));
                    oTable.removeSelections(true);
                })
                .catch((oError) => {
                    MessageBox.error(oError.message || oBundle.getText("deleteErrorMessage"));
                })
                .finally(() => {
                    oTable.setBusy(false);
                });
        },

        formatV4Date(sDate) {
            if (!sDate) {
                return "";
            }
            return DateFormat.getDateInstance().format(new Date(sDate));
        }
    });
});