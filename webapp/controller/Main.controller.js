sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/core/library"
], function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, coreLibrary) {
    "use strict";

    const { ValueState } = coreLibrary;

    return BaseController.extend("sapui5task2.controller.Main", {
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
        }
    });
});