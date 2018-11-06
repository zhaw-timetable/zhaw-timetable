import { Router } from 'express';

import * as api from '../../../adapters/CampusInfoAdapter';

export default ({ config, db }) => {
  let router = Router();

  router.get('/', async (req, res) => {
    const resource = await api
      .getPossibleNames('classes')
      .catch(err => console.error(err));
    res.json(resource);
  });

  router.post('/', async (req, res) => {
    const name = req.body.name;
    const startDate = req.body.startDate;
    const resource = await api.getScheduleResource('classes', name, startDate);
    res.json(resource);
  });

  return router;
};
