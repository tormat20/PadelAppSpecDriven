 would like to create a whole new feature. I want to do this in a couple of steps not to do everyhing at once.

The core idea is that, right now im only creating events with the full number of players in.
However there should be a possiblity to create events in advance, without knowing how many players will attend.

So if we are pllaning for an upcoming event, it should be possible to just create a timeslot for the event to take place without knowhing how many players, or which courts there should be. 

So basically what i want is a way to create an event with a given event mode and name for a specific date and time.
All events that are placed here must later be able to be up for view, since no players are in the,

For this we will need two things (of what i understand and can visualize so far), a way of creating events slots, and a way of viewing these eventslots. 

My far vision is that we will have a calender view, where we can view a whole week, or the whole day, or soemthing similar, we can drag and drop event slots here, which will create an empty event without any players, meaning we can plan for how our event calander would look. 

The prior signup process has been manual, meaning somone would have to know exactly how many players that will be playing, and typing their name into the event. This is tideus. So what i would want is a way of having these player-empty event slots. and from there -> click into a specific event -> instead of pressing ad player, we should have a function called add player-image. Let me specify, this means that we could have our computer, take a screenshot of the players who will be attending from another app ( i dont have access to their APIs, and im not allowed to scrape) , so we will take an image of the players attending, have some sort of funcitonality which inteprets this image -> converts into players, and matches them to our db. If they priorly exist, we just add them and we know who they are, and if they are neww we create a new player, which we add the the event.

So the purpose are two things. Getting a great overview over which event, and we can plan and do our work in advance, And also facilitate the way we add players to an event by intrudcing this screenshot-interpeter.

Do you have any suggestions with how this cuold be done? what would be some of the best pracites for these type of functionalitteS? do you need any clarifycation ? 