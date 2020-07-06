public class MeetingScheduler_Controller {
    public class ListViewWrapper {
        @AuraEnabled
        public String label { get; set; }

        @AuraEnabled 
        public String developerName { get; set; }
    }

    @AuraEnabled 
    public static List<ListViewWrapper> getListViews(String objectName) {
        List<ListViewWrapper> listViews = new List<ListViewWrapper>();

        for (ListView lv : [SELECT Id, Name, DeveloperName FROM ListView WHERE sObjectType =:objectName ORDER BY Name]) {
            ListViewWrapper wrapper = new ListViewWrapper();
            wrapper.label = lv.Name;
            wrapper.developerName = lv.DeveloperName;

            listViews.add(wrapper);
        }

        return listViews;
    }

    @AuraEnabled(cacheable=true)
    public static Map<Id, List<Contact>> getContacts(List<String> accounts) {
        Map<Id, List<Contact>> contacts = new Map<Id, List<Contact>>();
        if (accounts == null || accounts.size() == 0) { return contacts; }

        for(String ac : accounts) {
            System.debug('account: ' + ac);
        }
        List<Account> l_accounts = [SELECT Id, (SELECT Id, Name FROM Contacts WHERE Is_Active__c = true ORDER BY Name) FROM Account WHERE Id =:accounts];

        for(Account a : l_accounts) {
            contacts.put(a.Id, a.Contacts);
        }

        return contacts;
    }

    @AuraEnabled(cacheable=true)
    public static List<SimpleListItem> getRecordTypesForEvent() {
        List<SimpleListItem> recordTypes = new List<SimpleListItem>();

		List<Schema.RecordTypeInfo> l = Event.SObjectType.getDescribe().getRecordTypeInfos();
        for(Schema.RecordTypeInfo rti : l) {
            if (rti.isAvailable() && rti.Name != 'Master') {
                recordTypes.add(new SimpleListItem(rti.getRecordTypeId(), rti.getName(), false, '', rti.isDefaultRecordTypeMapping()));
            }
        }
        
        return recordTypes;
    }

    @AuraEnabled(cacheable=true) 
    public static List<SimpleListItem> getPicklistValuesForRecordType(String recordType) {
        System.debug('recordType: ' + recordType);
        List<SimpleListItem> items = new List<SimpleListItem>();

        List<Salesforce_Picklist_Controlling_Values__c> picklistValues = [SELECT Id, Value__c, IsDefault__c FROM Salesforce_Picklist_Controlling_Values__c WHERE Object_Name__c = 'Event' AND Field_Name__c = 'Subject' AND Controller__c = 'RecordType' AND Controller_Value__c =:recordType AND Is_Active__c = true];
        for(Salesforce_Picklist_Controlling_Values__c spcv : picklistValues) {
            items.add(new SimpleListItem(spcv.Value__c, spcv.Value__c, spcv.IsDefault__c, '', spcv.IsDefault__c));
        }

        return items;
    }

    @AuraEnabled 
    public static Event saveEvent(String ev) {
        if (ev == null || ev.length() == 0) { return null; }

        Event theEvent = (Event)JSON.deserialize(ev, Event.class);
        upsert theEvent;

        return theEvent;
    }

    @AuraEnabled(cacheable=true)
    public static List<Event> getEventsForUser(String userId) {
        return [SELECT Id, Subject, ActivityDate, Description, DurationInMinutes, StartDateTime, ActivityDateTime, SubjectOriginal__c, WhoId 
                  FROM Event 
                 WHERE CreatedById =:userId
                   AND ActivityDate = THIS_MONTH];
    }
}
