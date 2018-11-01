import { Router } from 'express';
import schedules from './schedules';

export default ({ config, db }) => {
  let v1 = Router();
  v1.use('/schedules', schedules({ config, db }));
  return v1;
};
