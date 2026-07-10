const admin = require('firebase-admin');

// Server-side only (Admin SDK) - bypasses Realtime Database rules entirely, so
// the DB rules can safely deny all client writes (see public/assets/firebase-client.js)
// while every write here still goes through requireMentor() in the calling function.
let app;
function getApp() {
  if (!app) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return app;
}

function liveStateRef(batchId) {
  return getApp().database().ref('liveState/' + batchId);
}

async function getLiveState(batchId) {
  const snap = await liveStateRef(batchId).once('value');
  return snap.val();
}

async function setLiveState(batchId, patch) {
  await liveStateRef(batchId).update(patch);
  return getLiveState(batchId);
}

// Sets musicStartedAt only if it isn't already set, atomically - avoids a
// race if the mentor's bootstrap call and another read overlap.
async function stampMusicStartIfAbsent(batchId) {
  const result = await liveStateRef(batchId).child('musicStartedAt').transaction((cur) => (
    cur === null || cur === undefined ? Date.now() : cur
  ));
  return result.snapshot.val();
}

module.exports = { getLiveState, setLiveState, stampMusicStartIfAbsent, liveStateRef };
