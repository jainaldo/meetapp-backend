import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async store(req, res) {
    const meetup_id = req.params.id;

    const meetup = await Meetup.findByPk(meetup_id, {
      include: [
        { model: User, as: 'organizer', attributes: ['name', 'email'] },
      ],
    });

    const user = await User.findByPk(req.userId);

    /**
     * não pode se inscrever em meetup que organiza
     */

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    /**
     *O usuário não pode se inscrever em meetups que já aconteceram.
     */

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }
    /**
     *
     O usuário não pode se inscrever no mesmo meetup duas vezes.
     O usuário não pode se inscrever em dois meetups que acontecem no mesmo horário.
     */

    const checkSubscription = await Subscription.findOne({
      where: { user_id: user.id },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkSubscription) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    /**
     * envie um e-mail ao organizador contendo os dados relacionados ao usuário inscrito.
     */

    const subscription = await Subscription.create({
      meetup_id: meetup.id,
      user_id: user.id,
    });

    const countParticipants = await Subscription.count({
      where: { meetup_id: meetup.id },
    });

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
      countParticipants,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
