({
    doInit : function(component, event, helper) {
    },

    onListViewChange : function(component, event, helper) {
        component.set('v.showListView', false);

        var listViewName = event.getSource().get("v.value");
        component.set('v.currentListViewName', listViewName);
        component.set("v.showListView", true);
    },

    handleCreateEvents : function(component, event, helper) {
        console.log('handleCreateEvents');
        var selectedAccounts = event.getParam("selectedAccounts");
        var isCreatingEvents = event.getParam("isCreatingEvents");
        component.set("v.selectedAccounts", selectedAccounts);
        component.set("v.isCreatingEvents", isCreatingEvents);
        component.set("v.hasMoreAccounts", selectedAccounts.length > 0);
        console.log('selectedAccounts', selectedAccounts);
    }
})
