/* Read-only Firebase Realtime Database client. This config's apiKey is not a
   secret - Firebase web apps are meant to ship it publicly; access is
   enforced by the database's security rules (read: true, write: false),
   which force every write through the mentor-authenticated Netlify functions
   instead (see netlify/functions/live-state-set.js). */
(function () {
  const firebaseConfig = {
    apiKey: 'AIzaSyCblyIIPXxerIUYadPCnXicM65ysWzHfzo',
    authDomain: 'econvocation-626be.firebaseapp.com',
    databaseURL: 'https://econvocation-626be-default-rtdb.firebaseio.com',
    projectId: 'econvocation-626be',
    storageBucket: 'econvocation-626be.firebasestorage.app',
    messagingSenderId: '146403437958',
    appId: '1:146403437958:web:530666bd6d15b43c439007',
  };
  firebase.initializeApp(firebaseConfig);
  window.LiveStateRTDB = firebase.database();
})();
