/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';
import '@babel/polyfill';

export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in succesfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    console.log('HERE IS THE RESPONSE: ', res.data.status);
    if (res.data.status == 'success') {
      location.reload(true);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error logging out, please try again');
  }
};
