sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "workflowuimodule/model/models",
  ],
  function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend(
      "workflowuimodule.Component",
      {
        metadata: {
          manifest: "json",
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);

          // call the backend OData Serviec
          var oModel = this.getModel().sServiceUrl;
          jQuery.ajax({
            url: oModel + "Materials",
            method: "GET",
            contentType: "application/json",
            success: function (data, textStatus, jqXHR) {
              console.log(data)
              this.getModel("LocalModel").setProperty("/Materials", data.value);

            }.bind(this),
            error: function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
              sap.m.MessageToast(errorThrown);
              // reject(errorThrown);
              // MessageBox.error("Error uploading file." + error);
            }
          });

          // enable routing
          this.getRouter().initialize();

          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          this.setTaskModels();

          this.getInboxAPI().addAction(
            {
              action: "APPROVE",
              label: "Approve",
              type: "accept", // (Optional property) Define for positive appearance
            },
            function () {
              this.completeTask(true, "approve");
            },
            this
          );
          this.getInboxAPI().addAction(
            {
              action: "SENDBACK",
              label: "Send Back",
              type: "Emphasized"
            },
            function () {
              this.completeTask1(false, "reject")
            },
            this
          )
          this.getInboxAPI().addAction(
            {
              action: "REJECT",
              label: "Reject",
              type: "reject", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false, "reject");
            },
            this
          );

          // this.getInboxAPI().addAction(
          //   {
          //     action: "previousApprover",
          //     label: "Send Back to Previous Approver",
          //     // type: "", // (Optional property) Define for negative appearance
          //   },
          //   function () {
          //     this.sendBackToApprover();
          //   },
          //   this
          // );
          // this.getInboxAPI().addAction(
          //   {
          //     action: "VIEW",
          //     label: "View MDN Item",
          //     // type: "", // (Optional property) Define for negative appearance
          //   },
          //   function () {
          //     this.completeTask(false);
          //   },
          //   this
          // );
          // this.getInboxAPI().addAction(
          //   {
          //     action: "VIEWATT",
          //     label: "View Attachment",
          //     // type: "", // (Optional property) Define for negative appearance
          //   },
          //   function () {
          //     this.completeTask(false);
          //   },
          //   this
          // );
          // this.getInboxAPI().addAction(
          //   {
          //     action: "APPROVE",
          //     label: "Special Approval",
          //     // type: "", // (Optional property) Define for negative appearance
          //   },
          //   function () {
          //     this.completeTask(false);
          //   },
          //   this
          // );
        },

        updateODataService: function() {
          var that = this;
          var oModel = this.getModel();
          var sServiceUrl = oModel.sServiceUrl;  // Get the service URL from the model
      
          // Construct the full URL for the entity to be updated
          var sUrl = sServiceUrl + "/MDN('1000001')";
      
          // Prepare the data to be sent
          var oData = {
              status: "Send Back"
          };
      
          // Make the AJAX call
          jQuery.ajax({
              url: sUrl,
              method: "PATCH",  // or "PUT" if your service requires it
              data: JSON.stringify(oData),
              contentType: "application/json",
              headers: {
                  "X-CSRF-Token": that._fetchToken()  // Assuming you have a _fetchToken method
              },
              success: function(data, textStatus, jqXHR) {
                  sap.m.MessageToast.show("Update successful");
              },
              error: function(jqXHR, textStatus, errorThrown) {
                  sap.m.MessageToast.show("Update failed: " + errorThrown);
              }
          });
        },
        setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        // hard coded to send back to the previous approver
        _getTaskInstances: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            "ab395864-1e7e-11f0-a354-eeee0a9b720c"
          )
        },

        _getWorkflowRuntimeBaseURL: function () {
          var appId = this.getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);

          return appModulePath + "/bpmworkflowruntime/v1";
        },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        completeTask: function (approvalStatus, status) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          this._patchTaskInstance(status);
          this._refreshTaskList();
          // this.updateMDNDetails();
        },
        completeTask1: function (approvalStatus, status) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          this._patchTaskInstance(status);
          this._refreshTaskList();
          this.updateODataService();
        },
        sendBackToPreviousApprover: function () {
          var that = this;
          var workflowInstanceId = this.getTaskInstanceID().split('_')[0]; // Assuming task instance ID is in format "workflowInstanceId_taskInstanceId"

          // Get workflow instance details
          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/workflow-instances",
            method: "GET",
            async: false,
            success: function (data) {
              var previousApprover = that.getPreviousApproverFromHistory(data);
              if (previousApprover) {
                that.sendBackToApprover(previousApprover);
              } else {
                sap.m.MessageBox.error("Cannot determine previous approver.");
              }
            },
            error: function (jqXHR, textStatus, errorThrown) {
              sap.m.MessageBox.error("Error retrieving workflow instance: " + errorThrown);
            }
          });
        },
        getPreviousApproverFromHistory: function(workflowInstance) {
          var currentTaskId = this.getTaskInstanceID();
          var events = workflowInstance.executionLog;
          var currentTaskIndex = events.findIndex(event => event.id === currentTaskId);
          
          if (currentTaskIndex > 0) {
            for (var i = currentTaskIndex - 1; i >= 0; i--) {
              if (events[i].subject && events[i].subject.includes("Task Completed")) {
                return events[i].user;
              }
            }
          }
          
          return null;
        },
        sendBackToApprover: function() {
          // var oContext = this.getModel("context").getData();
          
          // // Update the context
          // oContext.previousApprover = approverEmail;
          // oContext.status = "SENT_BACK";
        
          // // Update the context model
          // this.getModel("context").setData(oContext);
        
          // Patch the task instance
          this._patchTaskInstances("READY");
        
          // Refresh the task list
          this._refreshTaskList();
        
          sap.m.MessageToast.show("Task sent back to previous approver: " + approverEmail);
        },
        _patchTaskInstance: function (status) {
          var data = {
            // status: status === "SENT_BACK" ? "IN_PROGRESS" : "COMPLETED",
            // status: "SUSPENDED", 
            status: "COMPLETED",
            decision: status,
            context: this.getModel("context").getData(),
            recipientUsers: "scidagichadi@gmail.com"
          };

          jQuery.ajax({
            url: this._getTaskInstancesBaseURL(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
          });
        },

        // added to send back by admin
        _patchTaskInstances: function (status) {
          var data = {
            // status: status === "SENT_BACK" ? "IN_PROGRESS" : "COMPLETED",
            // status: "SUSPENDED", 
            status: "COMPLETED",
            decision: "approve",
            context: this.getModel("context").getData()
          };

          jQuery.ajax({
            url: this._getTaskInstances(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
          });
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        },
        // getMaterialDetails: function () {

        // }
      }
    );
  }
);
