# Roadmap

## v1

Client libraries provide an API to submit log events. These log events are submitted as JSON objects that are intentionally minimally structured. These log event objects are submitted to the Mupets server. 


### Log function
#### Parameters:
- log type
- client type
- immediate: yes/no

### Configuration
- buffer/submit interval

### ESM
- ESM-instruction are sent to the client by way of push notifications:
  - Als de app actief is, dan:
    - Als een sheet reeds actief is, dan wordt de ESM instructie op een stack geplaatst.
    -  wordt de sheet getoond, tenzij een sheet
  - Als de app niet actief is, dan wordt de sheet niet getoond.
  - Bij meerdere ESM instructies, worden ze FIFO 
  - 

```json
{
  "success": "true",
  "esm": {
    "label": <string>,
    "token": <string>
    "url": "http://sheets.fogg.dev/test-01/web/index.html",
    "timestamp": <number>
    "ttl": <number>
  }
}
```




## v2

### Configuration

Initialize the client library with a URL of the `mupets.config` file.

#### Mupets.config

```json
{
  "immediate": {
    
  },
  "logTypes": [
    {
      "type": <string>,
      "immediate": <boolean>,    // 
      "ttl": <number>,           // time-to-live in seconds [default: 0 = no ttl]
      retain: <boolean>        // persist after submission [default: false]
    }
  ]
}
```


