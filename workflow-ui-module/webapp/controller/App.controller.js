sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("workflowuimodule.controller.App", {
      onInit() {
        // this.oModel = this.getOwnerComponent().getModel();
        // this.getMaterialDetails();
      },
      // getMaterialDetails: function () {
      //   this.oModel.read("/Materials", {
      //     success: function (oData) {
      //       console.log(oData)
      //     }.bind(this),
      //     error: function (error) {
      //       console.log(error)
      //     }
      //   },
      //   )
      // }
    });
  }
);
