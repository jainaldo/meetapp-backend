import {
  startOfHour,
  parseISO,
  isBefore,
  endOfDay,
  startOfDay,
} from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const where = {};

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }
    const meetups = await Meetup.findAll({
      where,
      order: ['date'],
      limit: 10,
      offset: (page - 1) * 10,
      attributes: [
        'id',
        'title',
        'description',
        'location',
        'date',
        'user_id',
        'file_id',
      ],
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'name'] },
        { model: File, as: 'banner', attributes: ['id', 'path', 'url'] },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const hourStart = startOfHour(parseISO(req.body.date));
    /**
     * verifica se a data do meetup já passou
     */

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create({
      ...req.body,
      user_id: req.userId,
    });
    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    const hourStart = startOfHour(parseISO(req.body.date));
    /**
     * verifica se a data do meetup já passou
     */

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    if (meetup.past) {
      return res.status(401).json({ error: "Can't update past meetup" });
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (meetup.past) {
      return res.status(400).json({ erro: "Can't delete past meetup" });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
