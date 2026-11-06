sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, coreLibrary, formatter, MessageBox) {
    "use strict";

    const { ValueState } = coreLibrary;

    const aV2InputIds = [
        "inpV2Id",
        "inpV2Name",
        "inpV2Desc",
        "inpV2RelDate",
        "inpV2DiscDate",
        "inpV2Rating",
        "inpV2Price"
    ];

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

        async _openV2Dialog(oDialogData) {
            this.setModel(new JSONModel(oDialogData), "newProductV2");

            this.oAddV2Dialog ??= await this.loadFragment({
                name: "sapui5task2.view.fragments.AddProductV2"
            });

            this._resetV2DialogValueStates();
            this.oAddV2Dialog.open();
        },

        onOpenAddV2Dialog() {
            this._openV2Dialog({
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

        onOpenEditV2Dialog(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext("odataV2");
            const oRowData = oBindingContext.getObject();

            this._openV2Dialog({
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

        onV2InputLiveChange(oEvent) {
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

        _validateV2DialogInputs() {
            const sErrorText = this.getResourceBundle().getText("fieldRequiredError");
            let bIsValid = true;

            aV2InputIds.forEach((sId) => {
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

        _resetV2DialogValueStates() {
            aV2InputIds.forEach((sId) => {
                const oControl = this.byId(sId);
                if (oControl) {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            });
        },

        onSaveV2Product() {
            if (!this._validateV2DialogInputs()) {
                return;
            }

            const oResourceBundle = this.getResourceBundle();
            const oDialogData = this.getModel("newProductV2").getData();
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
                        this.oAddV2Dialog.close();
                    },
                    error: () => {
                        MessageBox.error(oResourceBundle.getText("updateErrorMessage"));
                    }
                });
            } else {
                oODataV2Model.create("/Products", oPayload, {
                    success: () => {
                        MessageToast.show(oResourceBundle.getText("createSuccessMessage"));
                        this.oAddV2Dialog.close();
                    },
                    error: () => {
                        MessageBox.error(oResourceBundle.getText("createErrorMessage"));
                    }
                });
            }
        },

        onCancelV2Product() {
            this._resetV2DialogValueStates();
            this.oAddV2Dialog.close();
        }
    });
});