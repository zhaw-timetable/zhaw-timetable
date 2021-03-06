import {
  format,
  startOfWeek,
  subWeeks,
  addWeeks,
  getDay,
  getHours,
  getMinutes
} from 'date-fns';

const GET = 'GET';
const POST = 'POST';
const HEADERS = { 'Content-Type': 'application/json' };
let address = 'http://localhost:4000';
if (process.env.NODE_ENV === 'production') address = 'https://zhawo.ml';
const apiUrl = `${address}/api/v1`;

/**@namespace ZhawoAdapter*/

/**
 * Function that make Api call to get Mensa Info for specified mensa
 * @param {string} facilityId
 * @param {Date} date
 *
 * @memberof ZhawoAdapter
 */
export function getMensaResource(facilityId, date) {
  return new Promise(async (resolve, reject) => {
    const dateString = format(new Date(date), 'YYYY-MM-DD');
    const url = `${apiUrl}/mensa/menus/${facilityId}?startDate=${dateString}`;
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    const response = await fetch(url, config).catch(err =>
      handleError(err, url)
    );
    const menuPlan = await response.json().catch(err => {
      handleError(err, url);
    });
    menuPlan && menuPlan[0] ? resolve(menuPlan[0]) : reject();
  });
}

/**
 * Function that make api call to get all mensa facilities.
 *
 * @memberof ZhawoAdapter
 */
export function getAllMensas() {
  return new Promise(async (resolve, reject) => {
    const url = `${apiUrl}/mensa`;
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    const response = await fetch(url, config).catch(err =>
      handleError(err, url)
    );
    const mensas = await response.json().catch(err => {
      handleError(err, url);
    });
    // Return only useful mensas, filter with slice
    mensas ? resolve(mensas.slice(2, mensas.length)) : reject();
  });
}

/**
 * Function that gets week schedule for specified user
 * to improve loading time it also loads weeks around specified start date
 * @param {string} route
 * @param {string} name
 * @param {Date} startDate
 * @param {number} rangeAroundDate
 *
 * @memberof ZhawoAdapter
 */
export function getScheduleResource(route, name, startDate, rangeAroundDate) {
  return new Promise(async (resolve, reject) => {
    let schedule;
    const loopStartDate = subWeeks(
      startOfWeek(startDate, { weekStartsOn: 1 }),
      rangeAroundDate
    );
    for (let i = 0; i < rangeAroundDate * 2 + 1; i++) {
      let loadDate = addWeeks(loopStartDate, i);
      let loadDateString = format(loadDate, 'YYYY-MM-DD');
      const url = `${apiUrl}/schedules/${route}/${name}?startDate=${loadDateString}`;
      const method = GET;
      const headers = HEADERS;
      const config = { method, headers };
      const response = await fetch(url, config).catch(err =>
        handleError(err, url)
      );
      const scheduleChunk = await response
        .json()
        .catch(err => handleError(err, url));
      if (scheduleChunk && !scheduleChunk.status) {
        schedule ? null : (schedule = scheduleChunk);
        schedule && schedule.days && scheduleChunk.days
          ? (schedule.days = [...schedule.days, ...scheduleChunk.days])
          : null;
      }
    }
    if (schedule) {
      schedule = convertSchedule(schedule);
      schedule = resolveOverlaps(schedule);
      resolve(schedule);
    } else {
      resolve({ weeks: {} });
    }
  });
}

/**
 * Function to make rendering of multiple events in the same slot possible, also helps with coordinating which schedules to fetch from the api and allows for nice event indicators in Week Navigation and Month
 *
 * Receives schedule for exactly one week
 * @param {*} schedule
 *
 * @memberof ZhawoAdapter
 */
export function convertSchedule(schedule) {
  // Initialize converted schedule with weeks as empty object
  const superiorSchedule = { weeks: {} };
  // Weeks will be added by the shortened date of the weeks Monday
  const weekKey = format(schedule.days[0].date, 'YYYY-MM-DD');
  // Add the currently received week with its identifier/key
  superiorSchedule.weeks[weekKey] = {};
  // Loop through all days of the received week
  schedule.days.forEach(day => {
    // Except if it's a useless Sunday
    if (!(getDay(day.date) == 0)) {
      // Days within a week will again be identified by their shortened date
      const dayKey = format(day.date, 'YYYY-MM-DD');
      // Events will be added to slots dynamically, to make that easier, initialize array
      day.slots.forEach(slot => {
        slot.events = [];
        slot.longestEvent = 0;
      });
      // Loop through events and find the correct slot in the array
      day.events.forEach(event => {
        // Returns index of slot when hours and minutes of events slot match
        const index = day.slots.findIndex(slot => {
          return (
            getHours(slot.startTime) === getHours(event.slots[0].startTime) &&
            getMinutes(slot.startTime) === getMinutes(event.slots[0].startTime)
          );
        });
        // Expand events by the current event in the loop
        day.slots[index].events = [...day.slots[index].events, event];
        if (event.slots.length > day.slots[index].longestEvent)
          day.slots[index].longestEvent = event.slots.length;
      });
      // Initialize day with dayKey
      superiorSchedule.weeks[weekKey][dayKey] = {};
      // Add reference to day.slots in superiorSchedule
      superiorSchedule.weeks[weekKey][dayKey].slots = day.slots;
    }
  });
  return superiorSchedule;
}

/**
 * Function that rebuilds schedule to resolve resolveOverlaps
 * returns new schedule
 * @param {*} schedule
 *
 * @memberof ZhawoAdapter
 */
export function resolveOverlaps(schedule) {
  let newSchedule = schedule;
  // Go through the week in the schedule
  Object.values(newSchedule.weeks).forEach(week => {
    // Go through all days in the schedule
    Object.values(week).forEach(day => {
      let { slots } = day;
      // Go through all slots of the day (events are saved in the slot)
      for (let i = 0; i < slots.length; i++) {
        // Go through all events of the slot
        let slot = slots[i];
        let { events } = slot;
        slot.eventBucket = [];
        for (let j = 0; j < events.length; j++) {
          let event = events[j];
          if (event.sortedIntoBucket) break;
          event.sortedIntoBucket = true;
          event.offSetFromBucketStart = 0;
          slot.eventBucket = [...slot.eventBucket, event];
          for (let k = 0; k < event.slots.length; k++) {
            let nextSlot = slots[i + k];
            let { events } = nextSlot;
            for (let x = 0; x < events.length; x++) {
              let event = events[x];
              if (event.sortedIntoBucket) break;
              event.sortedIntoBucket = true;
              event.offSetFromBucketStart = k;
              slot.eventBucket = [...slot.eventBucket, event];
            }
          }
        }
      }
    });
  });
  return newSchedule;
}

/**
 * Function makes api call to get all possible user names.
 *
 * @memberof ZhawoAdapter
 */
export function getPossibleNames() {
  return new Promise(async (resolve, reject) => {
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    const routes = ['students', 'lecturers', 'classes', 'courses', 'rooms'];
    let possibleNames = {};
    for (let route of routes) {
      const url = `${apiUrl}/schedules/${route}/`;
      const response = await fetch(url, config).catch(err =>
        handleError(err, url)
      );
      let possibleNamesChunk = await response
        .json()
        .catch(err => handleError(err, url));
      if (possibleNamesChunk && !possibleNamesChunk.status) {
        // clean up received data, don't know why CampusInfo sends different
        // formats for each route..
        switch (route) {
          // these get sent as arrays
          case 'students':
          case 'classes':
          case 'rooms':
            possibleNamesChunk[route] = possibleNamesChunk[route].map(
              value => ({ label: value, type: route })
            );
            break;
          // these as objects with some properties, only need shortName
          case 'lecturers':
            possibleNamesChunk[route] = possibleNamesChunk[route].map(
              value => ({ label: value.shortName, type: route })
            );
            break;
          // these as objects with a DIFFERENT name for the relevant property..
          case 'courses':
            possibleNamesChunk[route] = possibleNamesChunk[route].map(
              value => ({ label: value.name, type: route })
            );
            break;
          default:
            break;
        }
        possibleNames = { ...possibleNames, ...possibleNamesChunk };
      }
    }
    possibleNames ? resolve(possibleNames) : reject({ status: 404 });
  });
}

/**
 * Async Function that makes an api call to get all the Free rooms for the current day.
 * returns array containing all the time slots and the free rooms in said time slot.
 *
 * @memberof ZhawoAdapter
 */
export function getFreeRoomsJson() {
  return new Promise(async (resolve, reject) => {
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    let freeRooms;

    const url = `${apiUrl}/roomsearch`;
    const response = await fetch(url, config).catch(err =>
      handleError(err, url)
    );
    let freeRoomsChunk = await response
      .json()
      .catch(err => handleError(err, url));
    if (freeRoomsChunk && !freeRoomsChunk.status) {
      freeRooms = { ...freeRooms, ...freeRoomsChunk };
    }

    freeRooms ? resolve(convertFreeRooms(freeRooms)) : reject({ status: 404 });
  });
}

/**
 * Function that converts freeRooms Object to an array.
 * @param {*} freeRooms
 *
 * @memberof ZhawoAdapter
 */
export function convertFreeRooms(freeRooms) {
  let array = Object.keys(freeRooms).map(index => {
    return freeRooms[index];
  });
  return array;
}

/**
 * Function that makes api call to get vszhaw feed
 */
export function getVszhawFeed() {
  return new Promise(async (resolve, reject) => {
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    let feed;

    const url = `${apiUrl}/vszhaw/`;
    const response = await fetch(url, config).catch(err =>
      handleError(err, url)
    );
    let feedTemp = await response.json().catch(err => handleError(err, url));
    if (!feedTemp.status) {
      feed = feedTemp;
    }
    feed ? resolve(feed) : reject({ status: 404 });
  });
}

/**
 * Function that makes api call to get next vszhaw event.
 *
 * @memberof ZhawoAdapter
 */
export function getVszhawEvents() {
  return new Promise(async (resolve, reject) => {
    const method = GET;
    const headers = HEADERS;
    const config = { method, headers };
    const url = `${apiUrl}/vszhaw/events/`;
    const response = await fetch(url, config).catch(err =>
      handleError(err, url)
    );
    let vszhawEvents = await response
      .json()
      .catch(err => handleError(err, url));
    vszhawEvents ? resolve(vszhawEvents) : reject({ status: 404 });
  });
}

/**
 * Function used output errors of api calls
 * @param {*} err
 * @param {string} url
 *
 * @memberof ZhawoAdapter
 */
export function handleError(err, url) {
  console.log(`Fetch to ${url} failed with error`, err);
}
