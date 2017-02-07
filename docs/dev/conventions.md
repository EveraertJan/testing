# Duxis Conventions

## Secrets

Secrets such as passwords or service tokens should not be configured by means of environment variables. Not only do we want to avoid that these secrets potentially leak to 3-rd party services included in Soyl deployments, we also want to provide a uniform configuration management framework suitable for the kind of dynamic orchestration we envision. Pending the availability of this framework, all service configurations, including secrets, should be provided by means of the configuration files loaded by the `cargo-lib.config` framework, where secrets are provided in the host-specific `local.yml` file. See the [Cargo Containers](cargo-containers.md) documentation for more details.



## ES6

We implement [Cargo Containers](../../images/cargo-base/README.md) using the ES6 syntax understood by [Node.js][] version 6 as we want to use the latest syntax but don't want to have to use Babel or another transpiler. The following list provides more details.

- We use `let` or `const` instead of `var`.

- We use proper classes declared with the `class` statement instead of the historical prototype-based declarations. We obviously use `class X extends Y {}` to implement inheritance instead of a historical `extend` contraption.

- We still use `require` instead of the ES6's `import/export` syntax as this is not yet understood by Node.js.


## Promises

We implement asynchronous functionality primarily as promises.

When a promise rejects, it should always pass an `Error` object argument object.

> TODO: This convention is not fully respected in the current implementation of the Cargo services in Soyl.

We use the native `Promise` class provided in [Node.js][] instead of libraries such as [Bluebird](http://bluebirdjs.com/) to minimize the number dependencies.


## Arrow functions

We use arrow-functions when inlining functions in `Promise` constructor calls, `Promise.then` and `Promise.catch` calls, and most other cases where functions are declared inline, such that the value of `this` inside the function bodies equals the value for `this` in the outer context and we thus do not need to use contraptions such as `const self = this;` to be able to refer to the `this` in the outer context by way of `self` inside the function bodies.
  
```js
return new Promise((resolve, reject) => {
  // body
});

promise
  .then(result => {
    // body
  })
  .catch(error => {
    // body
  });
```

Notable exceptions are handlers passed to `d3.selection` and `d3.transition` methods such as `each`, for which _d3_ binds `this` to the DOM-element.

Another exception is unit tests, since passing arrow functions to [Mocha](http://mochajs.org) is discouraged.



## Syntax conventions

### Indentation

We indent Javascript code with 2-space units.

### Blocks

```js
if (condition) {
  // then body
}
else if (condition) {
  // else if body
}
else {
  // else body
}

function foo {
  // body
}

class {
  constructor() {
    // body
  }
  foo() {
    // body
  }
}
```

#### Acceptable exceptions:

Single-line class getters and setters:

```js
class {
  get foo() { return this._foo; }
  set foo(value) { this._foo = value; }
}
```

Other single-line blocks:

```js
if (condition) { doSomething(); }
```

### Operators

Binary operators are always surrounded by single spaces. Unary not.

```js
const a = b + c;
const d = !e;
```

### Arrays

```js
[a, b, c, d]
```


## Documentation

We document Javascript code using [JSDoc](http://usejsdoc.org).



## Software Versioning

We follow [Vincent Driessen's git branching model](http://nvie.com/posts/a-successful-git-branching-model/), as shown in the folowing diagram.

![Vincent Driessen's git branching model](../diagrams/Git-branching-model.pdf)




----
__[[ Back ](../../README.md)]__


[Docker Compose]: https://www.docker.com/products/docker-compose
[Node.js]: https://nodejs.org