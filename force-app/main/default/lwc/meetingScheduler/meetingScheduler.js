import { LightningElement, api, track } from 'lwc';

export default class MeetingScheduler extends LightningElement {
    @api 
    selectedAccounts = [];

    @track 
    isCreatingEvents = false;

    constructor() {
        super();
        this.template.addEventListener('createevents', this.handleCreateEvents.bind(this));        
    }
    
    handleCreateEvents(event) {
        try {
        console.log('[meetingScheduler] handleCreateEvents');
        this.selectedAccounts = event.detail.selectedAccounts;
        this.isCreatingEvents = event.detail.isCreatingEvents;
        this.hasMoreAccounts = this.selectedAccounts.length > 0;
        console.log('[meetingScheduler] selectedAccounts', this.selectedAccounts);
        console.log('[meetingScheduler] isCreatingEvents', this.isCreatingEvents);
        console.log('[meetingScheduler] hasMoreAccounts', this.hasMoreAccounts);
        } catch(ex) {
            console.log('[meetingScheduler] exception', ex);
        }
    }
}