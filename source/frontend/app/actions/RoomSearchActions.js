import dispatcher from '../dispatcher';

export const getFreeRoomsJson = async () => {
  dispatcher.dispatch({
    type: 'GET_FREEROOMJSON'
  });
};

export const getFreeRoomsByTime = value => {
  dispatcher.dispatch({
    type: 'GET_FREEROOMBYTIME',
    payload: value
  });
};