import { LightningElement, api, track } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';

import FULL_CALENDAR from '@salesforce/resourceUrl/fullCalendar431';

import currentUserId from '@salesforce/user/Id';

import getEventsForUser from '@salesforce/apex/MeetingScheduler_Controller.getEventsForUser';

export default class MeetingSchedulerEvents extends LightningElement {
    @api selectedAccounts;

    @api 
    hasMoreAccounts;

    @track 
    calendarDivSize = 8;

    @track 
    summaryTitle = '';

    calendar;
    calendarInitialised = false;    
    calendarEvents = [];
    error;
    eventsLoaded = false;

    constructor() {
        super();
        this.template.addEventListener('addevent', this.addEvent.bind(this));
        this.addEventListener('fceventclick', this.handleEventClick.bind(this));    
    }

    renderedCallback() {
        if (this.calendarInitialised) {
            return;
        }

        let numberOfAccounts = this.selectedAccounts == null ?  0 : this.selectedAccounts.length;
        if (numberOfAccounts > 0) {
            this.summaryTitle = this.selectedAccounts.length + ' accounts selected';
        } else {
            this.summaryTitle = 'No accounts selected';
        }
        this.hasMoreAccounts = this.selectedAccounts && numberOfAccounts > 0;        
        console.log('[meetingSchedulerEvents.renderredCallback] hasMoreAccounts', this.hasMoreAccounts);
        //this.calendarDivSize = this.hasMoreAccounts ? 8 : 12;
        this.calendarInitialised = true;
        Promise.all([
            loadStyle(this, FULL_CALENDAR + '/fullCalendar/packages/core/main.css'),
            loadScript(this, FULL_CALENDAR + '/fullCalendar/packages/core/main.js'),
        ]).then(() => {
            Promise.all([
                loadStyle(this, FULL_CALENDAR + '/fullCalendar/packages/daygrid/main.css'),
                loadScript(this, FULL_CALENDAR + '/fullCalendar/packages/daygrid/main.js'),            
            ]).then(() => {
                Promise.all([
                    loadStyle(this, FULL_CALENDAR + '/fullCalendar/packages/timegrid/main.css'),
                    loadScript(this, FULL_CALENDAR + '/fullCalendar/packages/timegrid/main.js'),
                ]).then(() => {
                    loadScript(this, FULL_CALENDAR + '/fullCalendar/packages/interaction/main.js').then(() => {
                        this.initialiseCalendar();
                        this.loadCalendar();
                    });
                });
            });
        }).catch(error => {
            console.log('error: ', error);
        });
    }

    initialiseCalendar() {
        //defaultView: 'timeGridWeek',
        const el = this.template.querySelector('.fullcalendar');
        this.calendar = new FullCalendar.Calendar(el, {
            plugins: ['dayGrid','timeGrid','interaction'],
            eventClick: info => {
                const selectedEvent = new CustomEvent('fceventclick', { detail : info });
                console.log('[eventClick] info', info);
                this.dispatchEvent(selectedEvent);
            },
            dateClick: info => {
                console.log('date click', info);
            },
            eventMouseEnter: info => {
                console.log('eventMouseEnter', info);
            },
            events: [
                {id:'1',resourceId:'a',start:'2019-12-16T09:00:00',end:'2019-12-16T09:30:00',title:'event1'}
            ]
        });
        this.calendar.render();
        this.calendarInitialised = true;
        if (!this.eventsLoaded && this.calendarEvents && this.calendarEvents.length > 0) {
            this.loadCalendarEvents();
        }
    }
    
    loadCalendar() {
        getEventsForUser({userId: currentUserId})
        .then(result => {
            this.calendarEvents = result;
            console.log('[getEvents] result', result);

            console.log('[getEvents] calendar', this.calendar);
            if (this.calendar && this.calendarInitialised) {
                this.loadCalendarEvents();
            }
        })
        .catch(error => {
            //this.error = error;
            console.log('[getEvents]  error', error);
        });

    }
    loadCalendarEvents() {
        let cal = this.calendar;
        console.log('[loadCalendarEvents] cal', this.calendar);
        this.calendarEvents.forEach((item) => {
            var theEvent = {
                id : item.Id,
                start : item.StartDateTime,
                end : item.EndDateTime,
                title : item.SubjectOriginal__c
            };
            cal.addEvent(theEvent);
        });    
        this.eventsLoaded = true;

    }
    
    handleListViewClick(event) {
        console.log('[handleListViewClick]');
        event.preventDefault();
        const cEvents = new CustomEvent('createevents', { detail : { selectedAccounts : [], isCreatingEvents: false }});
        this.dispatchEvent(cEvents);                                        
    }

    reloadHandler() {
    }
    addEvent(event) {
        console.log('[meetingSchedulerEvents] event.detail', event.detail);
        const theEvent = JSON.parse(event.detail);
        this.calendar.addEvent(theEvent);
        this.hasMoreAccounts = theEvent.hasMoreAccounts;
        if (!this.hasMoreAccounts) {
            this.calendarDivSize = 12;
        }
    }

    captureClick(event) {
        console.log('[captureclick] event', event);
    }
    handleEventClick(event) {
        let info = event.detail;
        console.log('[handleEventClick] info', info);
    }
    handleScroll(event) {
        console.log('[handleScroll] event', event);
        event.stopImmediatePropogation();
    }
}