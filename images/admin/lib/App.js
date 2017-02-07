'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const CargoApp = require('cargo-lib/CargoApp');

class App extends CargoApp {

  /** @inheritdoc */
  *onStart() {
    this.serveReact();
  }

}

module.exports = App;
