# The Implementation

## Main Dashboard Content
 Starting from the two cards at the top, assuming the database has a table for urgent updates, daily agendas and calendar events, the user creates events with the add button that sends a POST method request to the required table in the database, the loaders retrieve the data from the database and the data becomes available for the UI to update. This includes the metric placeholders at the bottom of the page

 ## The AI assistant
  The AI agent will be a LLM wrapper, that uses the business operations and documentation for context, it will also have access to database operations kind of how cursor works. The AI would have a separate API function that brings data through the loaders to be accessed by the UI


## Database Code structure
 The database code will have CRUD operations for each of the segments in the dashboard main area. The database distributes data through the loaders

### AI feature
 The AI also has will be able to access the database for operations so it will have some level of permission and access based on the token of the user involved. It has methods as well to communicate with the given LLM core and that will be implemented in the loaders.


## Data Flow
 For every feature impleneted, data moves from the database to the loaders in the app via HTTP methods. From the loaders, the page lazy loads based of the information being accessed at the time




