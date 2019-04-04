jest.mock('../../../../stores/GlobalStore');
jest.mock('../../../../stores/ScheduleStore');
jest.mock('../../../../adapters/IdbAdapter');
jest.mock('../../../../adapters/ZhawoAdapter');

import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow } from 'enzyme';

configure({ adapter: new Adapter() });

import NavigationWeek from './NavigationWeek';

import scheduleStore from '../../../../stores/ScheduleStore';
import * as scheduleActions from '../../../../actions/ScheduleActions';

beforeEach(() => {
  scheduleStore.displayWeek = [];
});

it('renders without crashing', () => {
  shallow(<NavigationWeek />);
});

it('should call setState with the correct value via refreshNavigation', () => {
  const wrapper = shallow(<NavigationWeek />);
  const instance = wrapper.instance();
  scheduleStore.displayDay = true;
  scheduleStore.displayWeek = false;

  instance.setState = jest.fn();

  instance.refreshNavigation();
  expect(instance.setState).toHaveBeenCalledWith({
    displayDay: scheduleStore.displayDay,
    displayWeek: scheduleStore.displayWeek
  });
});

it('should call scheduleActions.gotoDay with the correct value via handleWeekForwardClick', () => {
  const wrapper = shallow(<NavigationWeek />);
  const instance = wrapper.instance();
  scheduleStore.displayDay = true;
  scheduleStore.displayWeek = false;

  instance.state.displayDay = '2018-12-26T18:24:34.567Z';

  scheduleActions.gotoDay = jest.fn();

  instance.handleWeekForwardClick(null);
  expect(scheduleActions.gotoDay).toHaveBeenCalledWith(
    new Date('2019-01-02T18:24:34.567Z')
  );
});

it('should call scheduleActions.gotoDay with the correct value via handleWeekBackClick', () => {
  const wrapper = shallow(<NavigationWeek />);
  const instance = wrapper.instance();
  scheduleStore.displayDay = true;
  scheduleStore.displayWeek = false;

  instance.state.displayDay = '2018-12-26T18:24:34.567Z';

  scheduleActions.gotoDay = jest.fn();

  instance.handleWeekBackClick(null);
  expect(scheduleActions.gotoDay).toHaveBeenCalledWith(
    new Date('2018-12-19T18:24:34.567Z')
  );
});
