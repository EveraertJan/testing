# Duxis _Auth_ Service

> Image directory: `images/auth/`

## Duxis Auth Framework

The Duxis platform provides a framework for the authentication and authorization of users using JWT-tokes, which enable stateless, distributed (and thus scalable) authentication and authorization.


### Authentication of users

The _Soyl-Auth_ service provides an API that allows users to authenticate (sign in) with their username and password.
When the credentials have been verified, the API issues a [JWT-token](https://jwt.io/).
With this token, the client can access protected APIs provided by other  services in the same system.

The main reason for this approach is that APIs provided by different services can be accesses in a secure manner without having to access a central authentication service or database for each such request.
Instead the client signs in once using the API provided by the _Soyl-Auth_ service and is issued a token which it retains until it expires.
These tokens are signed using a secret string specified as the `soyl.auth.jwtSecret` setting in the Cargo configuration.
Each service that serves a secured API can independently verify the token and its payload using this secret.

#### Authentication API

`POST https://api.duxis.com/auth/authenticate { username, password }`

This API authenticates a user.
It is provided by the _Soyl-Auth_ service and exposed by the proxy on `https://api.duxis.com/auth/authenticate`, where `duxis.com` is replaced with the value of the `SOYL_HOST` variable in the `.env` file.

The request body must contain an JSON-encoded object with two properties: `username` and `password`.
The API asserts the identity against the stored credentials.
Passwords are stored as salted hashes in the Redis server provided in the accompanying _Soyl-Auth-Store_ service.
The actual passwords can thus not be recovered, only verified.

When the credentials are verified, the response's body contains a `user` property.
Its value is an JSON-encoded object that contains the following properties:

- `activities {Array.<String>}` – The list of activity labels this user is authorized to perform.
- `isRoot {Boolean}` – True when this user is a superuser.
- `roles {Array.<String>}` – The list of roles assigned to this user.
- `username {String}` – The username.

#### Authentication on Protected APIs

Once a user is authenticated and has received a token, she can access protected APIs and URLs. 
Services can provide protected APIs by using the `CargoApp.serveSecureApi` method (instead of the `CargoApp.serveApi` method used to provide unprotected APIs).

Protected APIs are protected using the _Authentication middleware_ provided as `middleware` in the `cargo-lib/api/jwt` package.
This Koa middleware is derived from the `koa-jwt` package.
It verifies the token provided in the HTTP headers or query string.

HTTP requests for a protected API should normally include an _Authorization_ header with the following content in which `{token}` should be replaced by the token.

```http
Authorization: Bearer {token}
```

Such headers cannot be set for requests dispatched by the browser using `<a href="..">..</a>` or `<img src=".." />`. For such requests you can set the token as the value of the `jwt` query parameter, like in the following example  in which `{token}` should be replaced by the token.

```html
<a href="protected/data.csv?jwt={token}">Protected data</a>
```

#### `ctx.state.user`

When the authentication middleware verified the jwt token it sets the `state.user` object in the Koa context such that it can be accessed in subsequent middleware. This object is the `user` object from the decoded jwt payload and additionally contains the jwt token as `token` property, as shown in the following example.

```javascript
this.state.user: {
  username: 'admin',
  isRoot: false,
  abm: '1h2m',
  iat: 1479638344,
  exp: 1479724744,
  token: 'eyJhbGciOiJIUzI1NiIsI...ZIWjs'
}
```

The included token can be used when the API needs to use another protected API, as shown in the following example. The Cargo app in this example serves a protected API that handles request for `GET /bar/`. The middleware that handles this request itself dispatches a requests to the `foo-service/bar/` resource. This resource is protected as well and therefore the request must have an appropriate authorization header with the user's token. The `request` utility provides the `get` method which, when called with a jwt-token as second argument, dispatches such a `GET` request.

```javascript
const request = require('cargo-lib/api/request');
const CargoApp = require('cargo-lib/CargoApp');

class App extends CargoApp {

  *onStart() {
    this.serveSecureApi((router) => router
      .get('/bar/', 'view_bar', function* () {
        const url = 'http://foo-service/bar/';
        const token = this.state.user.token;
        const response = yield request.get(url, token);
        this.body = { bar: response.data.bar };
      });
    );
  }

}
```

The `iat` and `exp` dates in the `state.user` object can be processed as follows in the subsequent middleware.

```javascript
const issuedAt = new Date(this.state.user.iat);
const expiresAt = new Date(this.state.user.exp);
```

The `abm` property of the `state.user` object is detailed below.


### Activity-based Authorization

While _authentication_ is concerned with establishing the identity of a user, _authorization_ determines whether an authenticated user may or may perform a given activity, which currently translates to whether a user may or may not use specific route paths provides by secured APIs.


When calling `CargoApp.serveSecureApi` method, you need to provide an _initializer_ function.
This function is called with an `AuthRouter` object as sole argument (see `cargo-lib/api/AuthRouter`).
An `AuthRouter` object provides `get`, `post`, `delete`, `patch`, `head` and `options` methods just like the `Router` instance from the [koa-router][] package passed to the _initializer_ function by the `serveApi` method used to specify unsecured APIs.

The following code snippet shows the cannonical way of providing a secure API: A Cargo service provides an `App` class that extends the `CargoApp` base class. In the `onStart` (generator) method, the `serveSecureApi` method is called, passing a function that is called with one argument, an instance of the `AuthRouter` class. The chainable `get`/`post`/etc methods of this object are use to specify the details the of the API.

```javascript
class App extends CargoApp {

  *onStart() {
    this.serveSecureApi((authRouter) => authRouter
      .get(...)
      .post(...)
      .delete(...)
      .patch(...)
      .head(...)
      .options(...));
  }

}
```

#### authRouter.get / put / post / patch / delete / head ⇒ AuthRouter

This `AuthRouter` class provides a set of chainable methods with which the API is specified. These methods take three arguments:

1. The API route path –
   This Express-style path is passed to the corresponding method of the underlying `Router` instance from the [koa-router][] package, which translates it to regular expressions using [path-to-regexp](https://github.com/pillarjs/path-to-regexp).

2. The auth specification –
   This argument can be a string, i.e. the name of the activity the user must be authorized to access.
   Alternatively you can provide an authorization function that returns a boolean or a promise, in which case the authorization middleware will call this function and authorize the user when it returns `true` or resolves.
   This authorization function is called with the underlying Koa Context as the value for the `this` identifier, similar to how the middleware is called.
   You can thus access properties such as the request object (`this.request`), the route path parameters (`this.params`) or the authenticated user object in the state (`this.state.user`).
   Note that you need to use a regular function and not an arrow function if you need to access this context.
   The authorization function is called with one argument, the `can` function, which you can call with one or more activity labels and will return true when the user is authorized for one of these activities.
   You can use this `can` function when you need to combine an activity-based authorization label with an arbitrary assertion.

3. The middleware generator function –
   This middleware is used when the user is authorized.

#### Examples:

Specify a GET route that returns the list of items to users with `view_items` authorization.

```javascript
authRouter.get('/items/', 'view_items', function* () {
  // The middleware generator function...
});
```

The following example specifies an API route path that allows users to update their own details, but not those of other users.

```javascript
authRouter.patch('/users/:user/details',
  function () {
    // The authorization function
    return this.params.user === this.state.user.username;
  },
  function* () {
    // The middleware generator function...
  });
```

The following example specifies an API route path that allows users to update their own details, but not those of other users, except for users with `edit_users` privileges, which can modify the details of any user.

```javascript
authRouter.patch('/users/:user/',
  function (can) {
    // The authorization function
    return can('edit_users') || this.params.user === this.state.user.username;
  },
  function* () {
    // The middleware generator function...
  });
```

The following example delegates the authorization to another API using [Axios](https://github.com/mzabriskie/axios).
The `axios.post` method returns a promise that resolves normally when the POST request responds normally.
The authorization is deferred until this promise resolves, in which case the authorization is granted; or until the promise rejects, in which case the authorization is not granted.

```javascript
authRouter.post('/some/route/',
  function () {
    // The authorization function
    return axios.post('some/auth/service/', this.state.user);
  },
  function* () {
    // The middleware generator function...
    ...
  });
```


### Activities and Roles

Activities can be assigned to roles, while roles can be assigned to users.
By assigning a role to a user, you authorize that user for all activities assigned to that role.
You can assign the same activity to multiple roles and you can assign multiple roles to the same user.

The list of activities a user is authorize to perform is included in the token issued when signing in.
Including a list with the actual names of all authorized activities would result in a gigantic token.
The authorized activities are therefore encoded as a bit-string.
All activities declared by the protected APIs are assigned a unique index, resulting in an activity-index-map.
When there are for instance $k$ activities, then the authorized activities for a given user can be represented as a string of $k$ bits, where each $n$-th bit represents the $n$-th activity.
When a bit is set, i.e. when it has value $1$, then the corresponding activity is authorized.
Such bit-strings can be easily represented as integer numbers and can be easily matched against a bit-string in which the bit corresponsing to some protected activity is set, using the binary _and_ operator.

When starting a server that serves a protected API, the `AuthRouter` instance registers the activities assigned to its routes using the _Sys-Auth-API_ provided by the _Soyl-Auth_ service (see `AuthRouter.registerActivities()` in _Cargo-Lib_ and `App.initSysAuthApi` in the _Soyl-Auth_ service).
This API returns a map with the corresponsing indices, which is used to map specific activities to their corresponding indices when verifying the authorization bit-string of a user.

The maximum integer in Node.js is $2^{53}-1$, which means that in a regular JavaScript number we can represent at most 52 activities.
To avoid this limitation, we use the [big-integer][] package to represent arbitrary amounts of activities as integers of arbitrary length.
The resulting big-nums are represented as strings (using radix 35 to minimize the length of the resulting string) and stored as the `abm` (_Activity Bit-Map_) property in the payload of the JWT-token issued during authentication.


### Management of Users and Roles

User and roles can be managed by way of the _Roles-and-Users-API_ provided by the _Soyl-Auth_ API.

All users and roles data are stored in the Redis server provided in the accompanying _Soyl-Auth-Store_ service.


## Front-End Utilities

The Cargo-Lib provides a framework for building React front-ends.
This framework also includes authentication/authorization-related features.
These features are provided in the `cargo-lib/html/auth` package.

### `auth.authenticate(Component) ⇒ Component`

This function wraps the given React component in a [higher-order component][] that asserts that the user is authenticated before rendering the wrapped component.
When the user is not authenticated, then the user is redirected to the login-page.
You typically use this function to wrap components assigned to routes, as shown in the following example.

```javascript
import auth from 'cargo-lib/html/auth'
...

const routes = {
  path: '/',
  component: AppContainer,
  indexRoute: { component: AboutPage },
  childRoutes: [
    { path: 'about', component: AboutPage },
    { path: 'login', component: LoginPage },
    { path: 'projects', component: auth.authenticate(ProjectsPage) },
    { path: 'projects/:projectId', component: auth.authenticate(ProjectPage) },
    { path: '*', component: NotFound }
  ]
};
```

### `auth.can(state, ...activityLabels) ⇒ Component`

This function takes the current Redux state and one or more activity labels (strings), and returns true when the current user is a superuser or authorized to perform all the given activities.
You can use this function to adapt the interface to the user's rights, like in the following example.

```javascript
import auth from 'cargo-lib/html/auth'
...

class ProjectsPage extends React.Component {

  componentDidMount() {
    if (this.props.canViewProjects) {
      this.props.fetchProjects();
    }
  }

}

export default connect(
  (state) => ({
    canViewProjects: auth.can(state, 'demo/view_data')
  }),
  (dispatch, ownProps) => ({
    fetchProjects: () => dispatch(actions.fetchProjects(ownProps.location))
  })
)(ProjectsPage);
```

### `Auth` Component

This component shows or hides elements depending on whether the user is authorized for certain activities.
The `Auth` Component takes one attribute: `can`, which has as value one or more space-separated activity labels.
The `Auth` element takes one or two child components.
When the user is authorized to perform all the activities given in the `can` attribute, then the first child component is rendered, else the optional second component is rendered.

##### Examples:

The following renders `<p>I <emph>can</emph> view users</p>` or `<p>I <emph>cannot</emph> view users</p>` depending on the user's rights.

```html
<p>I
  <Auth can="duxis/view_users">
    <emph>can</emph>
    <emph>cannot</emph>
  </Auth>
  view users</p>
```

### `LoginPage` Component

React component that provides the login interface.

```javascript
import LoginPage from 'cargo-lib/html/auth/LoginPage'
```



## _Auth_ Service APIs

#### _Sign-In-API_

When the value of the `SOYL_HOST` variable in the `.env` file is `foo.bar`, then this api is exposed on the base-route `api.foo.bar/auth/`.


#### _Sys-Auth-API_

The _sys-auth_ API is served on port 8001, which is only accessible by other services on the _default_ Docker network.
Such services should thus access this API on the base-route `http://soyl-auth:8001/auth/`.


#### _Roles-and-Users-API_

When the value of the `SOYL_HOST` variable in the `.env` file is `foo.bar`, then this api is exposed on the base-route `api.foo.bar/auth/`.


## Loose Ends

- The `AuthManager._resetActivityMap()` method resets the existing activity-index mapping. When doing so, the authorized activity indices contained in existing JWT-tokens are no longer valid. These tokens should thus be invalidated, for instance by using a new JWT-secret.
  
- After changing the activity rights of a user, the authorized activity indices contained in that user's JWT-tokens are no longer valid. This user must re-authenticate to get a new JWT-token with the updated permissions in its payload.



[big-integer]: https://www.npmjs.com/package/big-integer
[Cargo]: ../cargo-base/README.md
[higher-order component]: https://medium.com/@franleplant/react-higher-order-components-in-depth-cf9032ee6c3e#.fue5rpma8
[koa-router]: https://github.com/alexmingoia/koa-router
