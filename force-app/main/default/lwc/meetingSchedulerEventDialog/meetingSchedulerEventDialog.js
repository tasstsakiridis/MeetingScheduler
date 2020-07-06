import { LightningElement, api, track, wire } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getContacts from '@salesforce/apex/MeetingScheduler_Controller.getContacts';
import getRecordTypesForEvent from '@salesforce/apex/MeetingScheduler_Controller.getRecordTypesForEvent';
import getPicklistValuesForRecordType from '@salesforce/apex/MeetingScheduler_Controller.getPicklistValuesForRecordType';
import saveEvent from '@salesforce/apex/MeetingScheduler_Controller.saveEvent';

import EVENT_OBJECT from '@salesforce/schema/Event';

import EVENT_ID_FIELD from '@salesforce/schema/Event.Id';
import EVENT_SUBJECT_FIELD from '@salesforce/schema/Event.Subject';
import EVENT_RECORDTYPE_FIELD from '@salesforce/schema/Event.RecordTypeId';
import EVENT_ACTIVITYDATE_FIELD from '@salesforce/schema/Event.ActivityDate';
import EVENT_ACTIVITYDATETIME_FIELD from '@salesforce/schema/Event.ActivityDateTime';
import EVENT_STARTDATETIME_FIELD from '@salesforce/schema/Event.StartDateTime';
import EVENT_ENDDATETIME_FIELD from '@salesforce/schema/Event.EndDateTime';
import EVENT_DURATION_FIELD from '@salesforce/schema/Event.DurationInMinutes';
import EVENT_WHAT_FIELD from '@salesforce/schema/Event.WhatId';
import EVENT_WHO_FIELD from '@salesforce/schema/Event.WhoId';

import TimeZone from '@salesforce/i18n/timeZone';
import Locale from '@salesforce/i18n/locale';

import CANCEL_LABEL from '@salesforce/label/c.Cancel';
import CHANGE_LABEL from '@salesforce/label/c.Change';
import SAVE_AND_NEXT_LABEL from '@salesforce/label/c.SaveAndNext';
import SAVE_LABEL from '@salesforce/label/c.Save';
import SKIP_LABEL from '@salesforce/label/c.Skip';
import RECORD_TYPE_LABEL from '@salesforce/label/c.RecordType';
import EMAIL_CONTACT_LABEL from '@salesforce/label/c.EmailContact';
import DURATION_LABEL from '@salesforce/label/c.Duration';
import YES_LABEL from '@salesforce/label/c.Yes';
import NO_LABEL from '@salesforce/label/c.No';

export default class MeetingSchedulerEventDialog extends LightningElement {
    labels = {
        cancel       : { label: CANCEL_LABEL },
        change       : { label: CHANGE_LABEL },
        contact      : { label: 'Contact', placeholder: 'Select a contact' },
        saveAndNext  : { label: SAVE_AND_NEXT_LABEL },
        save         : { label: SAVE_LABEL },
        skip         : { label: SKIP_LABEL },
        subject      : { label: 'Subject', placeholder: 'Select a subject' },
        recordType   : { label: RECORD_TYPE_LABEL },
        emailContact : { label: EMAIL_CONTACT_LABEL },
        duration     : { label: DURATION_LABEL  },
        yes          : { label: YES_LABEL },
        no           : { label: NO_LABEL }
    };

    @api
    accounts;
    
    @track
    index = 0;

    @track
    currentIndex = 1;

    @track
    createMoreEvents = true;

    @track
    recordType;

    @track 
    contactOptions = [];
    
    @track
    subjectOptions = [];

    @track 
    canChangeRecordType = false;

    @track 
    startDateTime;

    @track 
    endDateTime;

    @track 
    emailContact;

    timeZone = TimeZone;

    recordTypes = [];
    
    wiredContacts;    
    
    selectedSubject;
    selectedContact;

    isInitialised = false;

    get accountIds() {
        var ids = [];
        if (this.accounts && this.accounts.length > 0) {
            for(var i = 0; i < this.accounts.length; i++) {
                console.log('account', this.accounts[i]);
            }
            this.accounts.forEach(function(item) {
                console.log('item', item);
                ids.push(item.id);
            });
            console.log('getaccountIds.accounts', this.accounts);
            console.log('getaccountIds.ids', ids);
        }

        return ids;
    }

    /*
    connectedCallback() {
        if (this.isInitialised) {
            return;
        }

        this.isInitialised = true;
        if (this.accounts && this.accounts.length > 0) {
            console.log('connectedcallback.accounts', this.accounts);
            this.loadContactsForAccount();
        }
    }
    */
    get eventTitle() {
        if (this.accounts && this.accounts.length > 0) {
            return this.accounts[this.index].Name;
        }

        return '';
    }

    get recordTypeLabel() {
        if (this.recordType != null) {
            return this.recordType.label;
        }
        return '';
    }
    
    /*
    @api
    loadContactsForAccount() {
        let accountId = this.acconuts[this.index].Id;
        console.log('loadAccountsForAccount', accountId);
        getContacts({accountId: accountId })
            .then(result => {
                console.log('loadcontactsforaccount.result', result);
                var c = [];
                result.forEach(function(item) {
                    c.push({ label : item.Name, value : item.Id });
                });
                this.contactOptions = c;
            })
            .catch(error => {
                console.log('error', error);
                this.contactOptions = [];
            });
    }
    */

    @wire(getRecordTypesForEvent, {})
    getWiredObjectInfo({ error, data }) {
        if (data) {            
            this.recordTypes = data;
            this.recordType = data[0];
            this.canChangeRecordType = (data != null && data.length > 1);
            data.forEach((rt) => {
                if (rt.isDefault) {
                    this.recordType = rt;
                    return true;
                }
            });
            console.log('objectInfo', data);
            console.log('recoordType', this.recordType);


            if (this.recordType != null)  {
                console.log('[getWiredObjectInfo] record type name', this.recordType.name);
                getPicklistValuesForRecordType({recordType: this.recordType.name})
                    .then(result => {
                        this.subjectOptions = result;
                        console.log('[getPicklistValuesForRecordType] result', result);
                    })
                    .catch(error => {
                        //this.error = error;
                        console.log('[getPicklistValuesForRecordType]  error', error);
                    });
            }
        } else if (error) {
            this.objectInfo = null;
            console.log('[getWiredObjectInfo] exception', error);
        }
    }

    @wire(getContacts, { accounts: '$accountIds'})
    getWiredContacts({ error, data }) {
        console.log('getWiredContacts', data);
        console.log('getWiredContacts.error', error);
        if (data && this.accounts && this.accounts.length > 0) {
            this.wiredContacts = data;
            let accountId = this.accounts[this.index].id;
            var l = data[accountId];
            
            var c = [];
            l.forEach(function(item) {
                console.log('l.item', item);
                c.push({label:item.Name, value: item.Id});
            });
            console.log('c', c);
            this.contactOptions = c;
            
        } else if (error) {
            this.contactOptions = [];
        }
    }
    
    handleCancelClick(event) {

    }
    handleSkipClick(event) {
        if (this.index + 1 < this.accounts.length) {
            this.index++;
            this.currentIndex = this.index + 1;
            this.accountId = this.accounts[this.index].Id;
        }
    }
    
    handleSaveAndNextClick(event) {
        this.createEvent();
    }

    handleRecordTypeChange(event) {
        let selectedValue = event.target.value;
        this.recordType = this.recordTypes.find((item) => {
            return item.id == selectedValue;
        });
        /*
        this.recordTypes.forEach((item) => {
            if (item.id == selectedValue) {
                this.recordType = item;
                return true;
            }
        });
        */
        if (this.recordType != null) {
            getPicklistValuesForRecordType({recordType: this.recordType.name})
                .then(result => {
                    this.subjectOptions = result;
                    console.log('[getPicklistValuesForRecordType] result', result);
                })
                .catch(error => {
                    this.error = error;
                    console.log('[getPicklistValuesForRecordType]  error', error);
                });
        }        
    }

    handleSubjectChange(event) {
        this.selectedSubject = event.detail.value;
    }
    handleContactChange(event) {
        this.selectedContact = event.detail.value;
    }

    handleStartDateChange(event) {
        console.log('[handleStartDateChange] value', event.detail.value);
        console.log('[handleStartDateChange] value', event.target.value);
        this.startDateTime = event.detail.value;
    }
    handleEndDateChange(event) {
        this.endDateTime = event.detail.value;
    }
    handleEmailContactChange(event) {
        console.log('[handleEmailContactChange] value', event.detail.checked);
        console.log('[handleEmailContactChange] value', event.target.checked);
        this.emailContact = event.detail.checked;
    }

    createEvent() {
        try {
        console.log('[createEvent]');
        console.log('[createEvent] timezone', TimeZone);
        console.log('[createEvent] locale', Locale);
        const fields = {};
        if (this.loadedEvent != undefined) {
            fields[EVENT_ID_FIELD.fieldApiName] = this.loadedEvent.Id;
        }

        let edt = new Date(this.endDateTime);
        let sdt = new Date(this.startDateTime);
        console.log('[createEvent] startDateTime', this.startDateTime);
        console.log('[createEvent] endDateTime', this.endDateTime);
        console.log('[createEvent] edt', edt);
        console.log('[createEvent] sdt', sdt);
        let duration = (edt.getTime() - sdt.getTime()) / 1000 / 60;
        console.log('[createEvent] duration', duration);


        fields[EVENT_RECORDTYPE_FIELD.fieldApiName] = this.recordType.Id;
        fields[EVENT_SUBJECT_FIELD.fieldApiName] = this.selectedSubject;
        fields[EVENT_WHAT_FIELD.fieldApiName] = this.accounts[this.index].Id;
        fields[EVENT_WHO_FIELD.fieldApiName] = this.selectedContact;
        fields[EVENT_ACTIVITYDATETIME_FIELD.fieldApiName] = this.startDateTime;
        fields[EVENT_ACTIVITYDATE_FIELD.fieldApiName] = this.startDate;
        fields[EVENT_STARTDATETIME_FIELD.fieldApiName] = this.startDateTime;
        fields[EVENT_ENDDATETIME_FIELD.fieldApiName] = this.endDateTime;
        fields[EVENT_DURATION_FIELD.fieldApiName] = duration;

        let hasMoreAccounts = this.index + 1 < this.accounts.length;

        const recordInput = JSON.stringify(fields);
        saveEvent({ev : recordInput})
            .then(appointment => {
                console.log('[createEvent] appointment', appointment);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Event created',
                        variant: 'success'
                    })
                );
                // dispatch event to add event to calendar
                let theEvent = {
                    id: appointment.Id,
                    start : appointment.StartDateTime,
                    end : appointment.EndDateTime,
                    title : appointment.Subject,
                    hasMoreAccounts : hasMoreAccounts
                };
                const addEvent = new CustomEvent('addevent', {
                    detail: JSON.stringify(theEvent),
                    bubbles: true
                });
                this.dispatchEvent(addEvent);

                this.selectedContact = '';
                this.selectedSubject = '';
                this.startDateTime = null;
                this.startDate = null;
                this.endDateTime = null;

                if (hasMoreAccounts) {
                    this.index++;
                    this.currentIndex = this.index + 1;
                    
                    let accountId = this.accounts[this.index].id;
                    var l = this.wiredContacts[accountId];
                    var c = [];
                    console.log('l', l);
                    l.forEach(function(item) {
                        c.push({label: item.Name, value: item.Id});
                    });
                    console.log('c', c);
                    this.contactOptions = c;
                    if (this.index == this.accounts.length-1) {
                        this.createMoreEvents = false; 
                    }

                }
        
            })
            .catch(error => {
                console.log('[createEvent] error', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating event',
                        message: error.body.message,
                        variant: 'error',
                    })
                );
            });

        }catch(ex) {
            console.log('[createEvent] exception', ex);
        }
    }
}