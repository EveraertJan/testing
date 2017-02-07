'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { PropTypes } from 'react'

export default function ErrorModal({ body }) {
  return (
    <div>
      <p>{body}</p>
    </div>
  )
}

ErrorModal.propTypes = {
  body: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired
};
