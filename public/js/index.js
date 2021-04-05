/*eslint-disable*/
import '@babel/polyfill';
import { login, logout } from './login';
import { signup } from './signup';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM ELEMENTS
const mapbox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form-signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userdataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if (mapbox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  console.log('IN LOGOUT');
  logOutBtn.addEventListener('click', logout);
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //VALUES
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfrim = document.getElementById('passwordConfirm').value;
    signup(name, email, password, passwordConfrim);
  });
}

if (userdataForm) {
  userdataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //VALUES
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn-save--password').textContent = 'UPDATING..';

    //VALUES
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn-save--password').textContent = 'SAVE PASSWORD';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  console.log('bookBtn');
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing..';
    const { tourId } = e.target.dataset;
    console.log(tourId);
    bookTour(tourId);
  });
}
