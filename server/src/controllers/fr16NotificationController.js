// Compatibility shim only.
// Some local branches accidentally changed notificationRoutes.js to require
// ../controllers/fr16NotificationController. The main implementation uses normal
// project naming: notificationController and notificationPreferenceController.
// Keeping this tiny re-export prevents MODULE_NOT_FOUND without changing routes.

module.exports = {
  ...require('./notificationController'),
  ...require('./notificationPreferenceController')
};
