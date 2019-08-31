import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user, countParticipants } = data;

    await Mail.sendMail({
      to: `${meetup.organizer.name} <${meetup.organizer.email}>`,
      subject: 'Nova inscrição realizada',
      template: 'subscription',
      context: {
        organizer: meetup.organizer.name,
        user: user.name,
        meetup: meetup.title,
        total: countParticipants,
      },
    });
  }
}

export default new SubscriptionMail();
