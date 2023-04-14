# RoboJani

## What?

I originally made robojani in 2021 after my conscription when I had nothing to do.
It was made due to "commercial" bots losing the ability to play songs from youtube.
I had never really wrote js much before and also used some bot base which meant the quality of the code very low. This resulted in the bot being extremely unreiable. This is technically the third jani as I wrote a second version in python before.

## How to use?

The only thing to get this bot running is create a config.json file with the bot token and secret and running the "setup.js" file to get spotify working. I will propably include the creation of config.json file in the setup and make the setup autorun later. Now the bot should throw an error asking you to run the setup if something is missing.

### config.json

    {
        "bot":
        {
            "Prod_token": "",
            "cmdPrefix": "!"
        },

        "music":
        {
            "volume": 7
        }
    }

Prod_token is the bot token.