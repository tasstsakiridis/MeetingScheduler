import { LightningElement, wire, track } from 'lwc';
import { getListUi } from 'lightning/uiListApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import CREATE_EVENTS_LABEL from '@salesforce/label/c.Create_Events';

const lvColumns = [{label:'Name', fieldName:'Name'}];


export default class MeetingSchedulerListView extends LightningElement {
    @track currentListView;
    @track currentListViewId;
    @track error;
    @track accounts;
    @track listViewColumns;
    @track listViewData;
    @track isLoading = true;

    listViews;
    selectedAccounts = [];

    labels = {
        createEvents : { label: CREATE_EVENTS_LABEL }
    };

    @wire(getListUi, { objectApiName: ACCOUNT_OBJECT, pageSize: 1000 })
    wiredListViews({ error, data }) {
        if (data) {
            console.log('data', data.lists);
            console.log('# of listviews: ', data.count);
            console.log('next page url', data.nextPageUrl);
            var lists = [{label:'',value:''}];
            for(var i = 0; i < data.lists.length; i++) {
                lists.push({label:data.lists[i].label, value: data.lists[i].id});
            }
            console.log('lists', lists);
            this.listViews = lists;
            this.currentListView = null;
            this.error = undefined;
        } else if (error) {
            this.listViews = undefined;
            this.error = error;
        }
        this.isLoading = false;
    }

    @wire(getListUi, { listViewId: '$currentListViewId' })
    getListViewData({ error, data }) {
        console.log('[getlistdata] data', data);
        this.isLoading = true;

        if (data) {
            console.log('[getlistdata] records', data.records);
            console.log('[getlistdata] count', data.records.count);
            console.log('[getlistdata] records.records', data.records.records);

            if (data.records.count > 0) {
                var columns = [];
                for(var i = 0; i < data.info.displayColumns.length; i++) {
                    columns.push({'label':data.info.displayColumns[i].label, 'fieldName':data.info.displayColumns[i].fieldApiName});
                }

                this.listViewColumns = columns;
                console.log('columns', columns);

                var rows = [];
                var row;
                for(let i = 0; i < data.records.records.length; i++) {
                    row = { 'id': data.records.records[i].id };
                    for(let j = 0; j < columns.length; j++) {
                        for(let f in data.records.records[i].fields) {
                            if (f == columns[j].fieldName) {
                                console.log('f', f);
                                console.log(columns[j].fieldName, data.records.records[i].fields[f].value);
                                row[columns[j].fieldName] = data.records.records[i].fields[f].value;
                            }
                        }
                        //row[columns[j].fieldName] = data.records.records[i].fields[columns[j].fieldName].value;
                    }
                    rows.push(row);       
                }

                this.accounts = rows;
                console.log('accounts', this.accounts);
            }
            this.error = undefined;
        } else if (error) {
            this.listViewData = undefined;
            this.accounts = undefined;
            this.listViewColumns = undefined;
            this.error = error;
        }

        this.isLoading = false;
    }

    get currentListViewName() {
        return this.currentListView != undefined ? this.currentListView.label : '';
    }

    handleListViewChange(event) {
        try {
            this.isLoading = true;
            console.log('event', event.target.value);
            this.currentListViewId = event.target.value;
            console.log('currentlistviewid', this.currentListViewId);
            console.log('this.listviews', this.listViews);
            for(var i = 0; i < this.listViews.length; i++) {
                if (this.listViews[i].value == this.currentListViewId) {
                    this.currentListView = this.listViews[i];
                    break;
                }
            }
        }catch(ex) {
            this.isLoading = false;
            console.log('[handleListViewChange] ex', ex);
        }
    }

    handleRowSelection(event) {
        this.selectedAccounts = event.detail.selectedRows;
    }

    handleCreateEventsClick(event) {
        event.preventDefault();
        console.log('create events button clicked');
        console.log('selectedAccounts', this.selectedAccounts);
        const cEvents = new CustomEvent('createevents', { detail : { selectedAccounts : this.selectedAccounts, isCreatingEvents: true }});
        console.log('cEvents', cEvents);
        this.dispatchEvent(cEvents);
    }

    handleCalendarClick(event) {
        event.preventDefault();
        console.log('calendar button clicked');
        const cEvents = new CustomEvent('createevents', { detail : { selectedAccounts : [], isCreatingEvents: true }});
        console.log('cEvents', cEvents);
        this.dispatchEvent(cEvents);
    }
}