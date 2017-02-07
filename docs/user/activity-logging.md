# Mupets Activity Logging Service

## Service API

### Request

The service listen for POST requests on the endpoint `api.mupets.tocker.iminds.be/report.json`.

#### Report object

The body of the request message must be a __report__ object, which is a JSON-object that has the following properties:

##### `client`
Identifies the client. The client string should respect the following conventions: 1) The first character is an lower-case alphabetic character; 2) The subsequent characters are alphanumeric characters. This string must not contain any other characters, including periods, commas, underscores, etc.

##### `user`
Identifies the user. The id of dev users must start with `dev.`.

##### `platform`
Identifies the platform. Must be one of: `ios`, `android`, `titanium` or `web`. This property is used to determine which platform-specific ESM sheet URL to provide in ESM instructions.

##### `events`
An array with one or more log event objects.

#### Event object

Each log _event_ object should contain the following two properties:

##### `type`
A string that identifies the classification of the log event.
The log type names should also respect the following conventions:

- Event type names are written in all lower case.
- The first character is an lower-case alphabetic character.
- The subsequent characters are alphanumeric characters or underscores. This string must not contain any other characters, including periods, commas, dashes, etc.

To avoid name collisions, log event type names should be choosen according to naming conventions similar to those for Java package names, i.e.:

- Companies use their reversed Internet domain name to begin their names. For example, `com.foo.event` for an event named `event` from a application by _foo.com_.
- Potential name collisions that occur within a single company need to be handled by convention within that company, perhaps by including the department or project name after the company name, such as `com.foo.bar.event` for the event named `event` in the project named `bar` at _foo.com_.

##### `timestamp`
The timestamp of the event, formatted according to ISO8601, e.g. `2012-11-04T14:51:06.157Z`.

Log event object may contain additional properties. Property names may not start with two underscores.

Example report:

```json
{
	"client": "playground",
	"user": "dev.001",
	"platform": "ios",
	"events": [
		{
			"type": "challengeCommenced",
			"timestamp": "2012-11-04T12:11:15.836Z",
			"challenge": "c1"
		}
		{
			"type": "challengeCompleted",
			"timestamp": "2012-11-04T14:51:06.157Z",
			"challenge": "c2"
		}
	]
}
```

The body's MIME media type should be `Content-Type: application/json` (see [RFC 4627](http://www.ietf.org/rfc/rfc4627.txt)). The character encoding should be `UTF-8`.

The following command sends a valid request to the Mupets test deployment on _tocker.iminds.be_:

```shell
$ curl -H "Content-Type: application/json" -X POST \
  -d '{"client":"test","events":[{"type":"test","timestamp":"2012-13-14T15:16:17.189Z"}]}' \
  http://api.mupets.tocker.iminds.be/report.json
```

### Response

The activity logging service responds with a json object. This object has a `succes` property, which has as value either `"true"` or `"false"`. When it is `"false"`, this the object also has an `error` property, which has as value a string that contains a description of the error.

The response may also contain an _experience sampling_ instruction. See [Experience Sampling](experience-sampling.md) for more details.


## Authentication

Authentication is postponed until deployment on https server.

----
__[[ Back ](../../README.md)]__
