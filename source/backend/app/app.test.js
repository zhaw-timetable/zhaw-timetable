import request from 'supertest';
import fetch from 'node-fetch';
import { format } from 'date-fns';

import { version } from '../package.json';
import app from './app';

beforeEach(() => {
  fetch.resetMocks();
});

it('App should be exported correctly', () => {
  expect(app).toBeDefined();
});

const STUDENT_NAME = 'somestud';
const LECTURER_NAME = 'lect';
const STARTDATE = new Date();

//TODO: adapt tests to new api organization

xit('POST to /api/timetable/username/ should respond correctly', async () => {
  fetch.once(JSON.stringify({ status: 'ok' }));
  const response = await request(app)
    .post('/api/timetable/username')
    .send({
      userName: STUDENT_NAME,
      startDate: STARTDATE
    });
  expect(response.body.status).toBe('ok');
  expect(fetch).toHaveBeenCalled();
});

xit('POST to /api/timetable/username/ should call /students/ endpoint for student', async () => {
  fetch.once(JSON.stringify({ status: 'ok' }));
  const response = await request(app)
    .post('/api/timetable/username')
    .send({
      userName: STUDENT_NAME,
      startDate: STARTDATE
    });
  expect(response.body.status).toBe('ok');
  expect(fetch).toHaveBeenCalled();
  expect(fetch.mock.calls[0][0]).toContain('/students/');
  expect(fetch.mock.calls[0][0]).toContain(STUDENT_NAME);
  expect(fetch.mock.calls[0][0]).toContain(format(STARTDATE, 'YYYY-MM-DD'));
});

xit('POST to /api/timetable/username/ should call /lecturers/ endpoint for lecturer', async () => {
  fetch.once(JSON.stringify({ status: 'ok' }));
  const response = await request(app)
    .post('/api/timetable/username')
    .send({
      userName: LECTURER_NAME,
      startDate: STARTDATE
    });
  expect(response.body.status).toBe('ok');
  expect(fetch).toHaveBeenCalled();
  expect(fetch.mock.calls[0][0]).toContain('/lecturers/');
  expect(fetch.mock.calls[0][0]).toContain(LECTURER_NAME);
  expect(fetch.mock.calls[0][0]).toContain(format(STARTDATE, 'YYYY-MM-DD'));
});
