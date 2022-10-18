# osrs-tracker-server

A REST API server, built with Express, Prisma, and Nodejs, for Oldschool Runescape trackers

## Endpoints

`/:username` - retrieves a player hiscore and their previous snapshots.

```jsonc
{
  "user": {
    "id": "634a5edd108d07adcf95d8ac",
    "username": "testuser",
    "accountType": "normal",
    "firstImport": "2022-10-15T07:18:53.000Z",
    "lastChange": "2022-10-15T07:18:53.000Z",
    "lastFetch": "2022-10-15T08:03:42.784Z",
    "combatLevel": 100,
    "hiscore": {
      "skills": {
        "overall": { "rank": 332887, "level": 1883, "xp": 72134391, "ehp": 0 },
        "attack": { "rank": 428058, "level": 91, "xp": 5923125, "ehp": 0 },
        "defence": { "rank": 506751, "level": 86, "xp": 3742268, "ehp": 0 }
        // NOTE: Omitted the full response
      },
      "bosses": {
        "abyssalSire": { "rank": 43432, "score": 322, "ehb": 0 }
        // NOTE: Omitted the full response
      }
    },
    "snapshots": [
      {
        "importDate": "2022-10-15T07:18:53.000Z",
        "hiscore": {
          // ...
        }
      }
    ]
  }
}
```

`/:username/updatetype` - try to update a players game mode, returns user without snapshots.
