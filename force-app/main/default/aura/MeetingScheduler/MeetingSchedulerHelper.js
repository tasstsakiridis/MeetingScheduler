({
    getListViews : function(component) {
        var action = component.get("c.getListViews");
        action.setParams({
            "objectName" : component.get("v.objectName")
        });
        action.setCallback(this, function(response) {
            var callState = response.getState();
            if (callState === "SUCCESS") {
                let listViews = response.getReturnValue();
                console.log('[MeetingScheduler.helper.getListViews] listviews', listViews);
                component.set("v.listViews", listViews);
                component.set("v.currentListViewName", listViews[0].developerName);
                component.set("v.showListView", true);

            } else if (callState === "INCOMPLETE") {
                console.log("[MeetingScheduler.helper.getListViews] callback returned incomplete.");                    
            } else if (callState === "ERROR") {
                var errors = response.getError();
                console.log("[MeetingScheduler.helper.getListViews] callback returned in error.", errors);                    
            }

        });
        $A.enqueueAction(action);
    }
})
