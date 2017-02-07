# Experience Sampling

> The current Experience Sampling functionality is an early, rudimentary one.

## Service API

When submitting an activity log message that contains a `type` property with value `es-test-01`, then the response will contain an experience sampling instruction.
When submitting multiple log events, then the experience sampling is triggered when the most recent event has the concerned type set.

The body of the submitted json should look like the following.

```json
{
  "client": "playground",
  "events": [
    {
      "type": "es-test-01",
      "timestamp": "2012-11-04T12:11:15.836Z"
    }
  ]
}
```

The response will then include an `es` property which has an object as value.
This object has an `url` property that has as value url of the experience sampling sheet that should be shown to the user.
This sheet is a html document that shows a question and two buttons (‘yes’ and ‘no’).
The response will thus look like the following.

```json
{
  "success": "true",
  "es": {
    "url": "http://sheets.fogg.dev/test-01/web/index.html"
  }
}
```

The _Mupets Client_ library will load the sheet and display it to the user.
The response by the user is submitted back to the Log-Service.



----
__[[ Back ](../../README.md)]__
