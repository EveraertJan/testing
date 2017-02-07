'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { Children, PropTypes } from 'react'
import { connect } from 'react-redux'

import accessors from './users/accessors'

/**
 * Show/hide elements depending on whether the user is authorized for certain activities.
 * The `Auth` element takes one attribute: `can`, which has as value one or more space-separated
 * activity labels. The `Auth` element takes one or two child components.
 * When the user is authorized to perform all the activities given in the `can` attribute, then the
 * first child component is rendered, else the optional second component is rendered.
 *
 * ### Examples:
 *
 * The following renders `<p>I <emph>can</emph> view users</p>`
 * or `<p>I <emph>cannot</emph> view users</p>` depending on the user's rights.
 *
 * @example
 * <p>I <Auth can="duxis/view_users"><emph>can</emph><emph>cannot</emph></Auth> view users</p>
 *
 * @param {Object} props
 * @property {boolean} props.authorized - True when the user is authorized for the activities
 *           specified in the `can` attribute.
 * @property {Object|Array} props.children - One or two components. When the user is authorized to
 *           perform all the activities given in the `can` attribute, then the first child component
 *           is rendered, else the optional second component is rendered.
 * @returns {*}
 * @constructor
 */
function Auth(props) {
  const { authorized, children, ...childProps } = props;  // eslint-disable-line no-unused-vars
  if (authorized && Children.count(children) > 0) {
    if (Children.count(children) === 1) {
      if (React.isValidElement(children)) {
        return Children.only(children);
      }
      else {
        // Wrap string child in span element:
        return React.createElement('span', null, children);
      }
    }
    return Children.toArray(children)[0];
  }
  else if (Children.count(children) > 1) {
    return Children.toArray(children)[1];
  }
  return null;
}

Auth.propTypes = {
  authorized: PropTypes.bool.isRequired,
  can: PropTypes.string.isRequired,
  children: PropTypes.any  // eslint-disable-line react/forbid-prop-types
};

const mapStateToProps = (state, { can }) => ({
  authorized: accessors.can(state, ...can.split(' '))
});

export default connect(mapStateToProps)(Auth);
