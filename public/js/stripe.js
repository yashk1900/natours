import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  console.log('IN BOOKTOUR FUNCTION');
  const stripe = Stripe(
    'pk_test_51IbjpASJdcVVzwCum26nHh8HJslNT37RhW6QOM3jJnCbmNyiT84D1v0zFpz1rqmNRaEhf7ORIAwmFfhUWEA6UoP200izSJdq99'
  );

  try {
    //1)GET CHECKOUT SESSION FROM END POINT OF API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    //2)CREATE CHECKOUT FORM + CHARGE CREDIT CARD
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
