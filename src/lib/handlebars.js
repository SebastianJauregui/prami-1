const timeago = require("timeago.js");
const timeagoInstance = timeago();
const pool = require("../database");

const helpers = {};

helpers.timeago = savedTimestamp => {
  return timeagoInstance.format(savedTimestamp);
};

helpers.getSemestre = async () => {
  try {
    var semestre = 0;
    const rowsDirector = await pool.query(
      "SELECT semestreActual FROM director"
    );
    if (rowsDirector.length == 1) {
      semestre = rowsDirector[0].semestreActual;
    }
    return semestre;
  } catch (error) {
      console.log(error);
  }
};

module.exports = helpers;
